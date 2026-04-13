import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import http from 'http';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewMessage } from 'telegram/events';
import pkg from 'whatsapp-web.js';
const { Client: WAClient, LocalAuth, MessageMedia } = pkg;
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });
  const PORT = 3000;

  let tgClient: TelegramClient | null = null;
  let waClient: any = null;
  let isWaConnected = false;
  let isTgConnected = false;
  
  let targetTgGroupId: string | null = null;
  let targetWaGroupId: string | null = null;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  io.on('connection', (socket) => {
    console.log('Frontend connected');
    
    socket.emit('status', {
      telegram: isTgConnected,
      whatsapp: isWaConnected,
      tgGroup: targetTgGroupId,
      waGroup: targetWaGroupId
    });

    socket.on('start_bridge', async (config) => {
      const { apiId, apiHash, phoneNumber, tgGroupId, waGroupId } = config;
      targetTgGroupId = tgGroupId;
      targetWaGroupId = waGroupId;

      io.emit('log', { source: 'System', message: 'Iniciando conexão com Telegram (Userbot) e WhatsApp...' });

      // Initialize WhatsApp
      try {
        if (waClient) {
          await waClient.destroy();
        }
        
        waClient = new WAClient({
          authStrategy: new LocalAuth(),
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          }
        });

        waClient.on('qr', (qr) => {
          io.emit('wa_qr', qr);
          io.emit('log', { source: 'System', message: 'QR Code do WhatsApp gerado. Por favor, escaneie.' });
        });

        waClient.on('ready', () => {
          isWaConnected = true;
          io.emit('wa_qr', null);
          io.emit('log', { source: 'System', message: 'WhatsApp conectado com sucesso!' });
          io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });
        });

        waClient.on('disconnected', () => {
          isWaConnected = false;
          io.emit('log', { source: 'System', message: 'WhatsApp desconectado.' });
          io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });
        });

        waClient.initialize().catch(err => {
          io.emit('log', { source: 'Error', message: `Erro ao iniciar WhatsApp: ${err.message}` });
        });

      } catch (err: any) {
        io.emit('log', { source: 'Error', message: `Erro no WhatsApp: ${err.message}` });
      }

      // Initialize Telegram
      try {
        if (tgClient) {
          await tgClient.disconnect();
        }

        const stringSession = new StringSession(''); // In memory session for now
        tgClient = new TelegramClient(stringSession, Number(apiId), apiHash, {
          connectionRetries: 5,
        });

        await tgClient.start({
          phoneNumber: async () => phoneNumber,
          password: async () => {
            io.emit('need_tg_password');
            return new Promise((resolve) => {
              socket.once('tg_password', resolve);
            });
          },
          phoneCode: async () => {
            io.emit('need_tg_code');
            return new Promise((resolve) => {
              socket.once('tg_code', resolve);
            });
          },
          onError: (err) => {
            io.emit('log', { source: 'Error', message: `Erro no Telegram: ${err.message}` });
          },
        });

        isTgConnected = true;
        io.emit('log', { source: 'System', message: 'Telegram (Userbot) conectado com sucesso!' });
        io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });

        // Listen for messages
        tgClient.addEventHandler(async (event: any) => {
          try {
            const message = event.message;
            const texto = message.text || message.message || '';
            const temMidia = !!message.media;

            io.emit('log', { source: 'Telegram', message: `📩 Nova mensagem: ${texto ? texto.substring(0, 30) + '...' : '[Sem texto]'} | mídia=${temMidia}` });

            // Regras do usuário
            const regra1 = texto.includes('SERVIDOR - BLAZE') && texto.includes('Filme');
            const regra2 = texto.includes('SERVIDOR - BLAZE') && texto.includes('Série');
            const regra3 = texto.includes('SERVIDOR - BLAZE') && texto.includes('BLAZE');

            if (!texto || !(regra1 || regra2 || regra3)) {
              io.emit('log', { source: 'System', message: '⏭️ Ignorada (não passou nas regras).' });
              return;
            }

            io.emit('log', { source: 'System', message: `⏳ Aguardando 5s antes de enviar...` });
            await new Promise(resolve => setTimeout(resolve, 5000));

            if (isWaConnected && waClient && targetWaGroupId) {
              if (!temMidia) {
                await waClient.sendMessage(targetWaGroupId, texto);
                io.emit('log', { source: 'System', message: '✅ Texto encaminhado para WhatsApp.' });
              } else {
                // Lida com Mídia
                const buffer = await tgClient!.downloadMedia(message);
                if (buffer) {
                  // Descobre mimetype básico
                  let mimetype = 'application/octet-stream';
                  if (message.photo) mimetype = 'image/jpeg';
                  else if (message.video) mimetype = 'video/mp4';
                  else if (message.document && message.document.mimeType) mimetype = message.document.mimeType;

                  const media = new MessageMedia(mimetype, buffer.toString('base64'), 'file');
                  await waClient.sendMessage(targetWaGroupId, media, { caption: texto });
                  io.emit('log', { source: 'System', message: '📷✅ Mídia + legenda encaminhadas para WhatsApp.' });
                } else {
                  io.emit('log', { source: 'Error', message: 'Falha ao baixar mídia do Telegram.' });
                }
              }
            }
          } catch (err: any) {
            io.emit('log', { source: 'Error', message: `Erro ao processar mensagem: ${err.message}` });
          }
        }, new NewMessage({ chats: targetTgGroupId ? [targetTgGroupId] : [] }));

      } catch (err: any) {
        io.emit('log', { source: 'Error', message: `Erro fatal no Telegram: ${err.message}` });
      }
    });

    socket.on('stop_bridge', async () => {
      if (tgClient) {
        await tgClient.disconnect();
        isTgConnected = false;
      }
      if (waClient) {
        await waClient.destroy();
        isWaConnected = false;
      }
      io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });
      io.emit('log', { source: 'System', message: 'Ponte desconectada.' });
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
