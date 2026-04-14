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

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (!data.users) {
      data.users = [{ username: data.username || 'admin', password: data.password || 'admin' }];
    }
    return data;
  }
  return { users: [{ username: 'admin', password: '123' }], rules: [] };
}

function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' }
  });
  const PORT = 3000;

  let tgClient: TelegramClient | null = null;
  let waClient: any = null;
  let isWaConnected = false;
  let isTgConnected = false;
  let isForwarding = true;
  
  let targetTgGroupId: string | null = null;
  let targetWaGroupId: string | null = null;

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const config = loadConfig();
    const user = config.users?.find((u: any) => u.username === username && u.password === password);
    if (user) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
    }
  });

  app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const config = loadConfig();
    if (!config.users) config.users = [];
    if (config.users.find((u: any) => u.username === username)) {
      return res.status(400).json({ success: false, message: 'Usuário já existe' });
    }
    config.users.push({ username, password });
    saveConfig(config);
    res.json({ success: true });
  });

  app.get('/api/config', (req, res) => {
    const config = loadConfig();
    res.json({ rules: config.rules });
  });

  app.post('/api/config', (req, res) => {
    const { username, password, rules } = req.body;
    const config = loadConfig();
    if (password && username) {
      const user = config.users?.find((u: any) => u.username === username);
      if (user) user.password = password;
    }
    if (rules) config.rules = rules;
    saveConfig(config);
    res.json({ success: true });
  });

  io.on('connection', (socket) => {
    console.log('Frontend connected');
    
    socket.emit('status', {
      telegram: isTgConnected,
      whatsapp: isWaConnected,
      tgGroup: targetTgGroupId,
      waGroup: targetWaGroupId,
      isForwarding
    });

    socket.on('pause_bridge', () => {
      isForwarding = false;
      io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected, isForwarding });
      io.emit('log', { source: 'System', message: '⏸️ Ponte pausada. As mensagens não serão encaminhadas.', type: 'text' });
    });

    socket.on('resume_bridge', () => {
      isForwarding = true;
      io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected, isForwarding });
      io.emit('log', { source: 'System', message: '▶️ Ponte retomada. Encaminhamento ativo.', type: 'text' });
    });

    socket.on('start_bridge', async (bridgeConfig) => {
      const { apiId, apiHash, phoneNumber, tgGroupId, waGroupId } = bridgeConfig;
      targetTgGroupId = tgGroupId;
      targetWaGroupId = waGroupId;

      io.emit('log', { source: 'System', message: 'Iniciando conexão com Telegram (Userbot) e WhatsApp...', type: 'text' });

      // Initialize WhatsApp
      try {
        if (waClient) {
          await waClient.destroy();
        }
        
        waClient = new WAClient({
          authStrategy: new LocalAuth(),
          puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          }
        });

        waClient.on('qr', (qr: string) => {
          io.emit('wa_qr', qr);
          io.emit('log', { source: 'System', message: 'QR Code do WhatsApp gerado. Por favor, escaneie.', type: 'text' });
        });

        waClient.on('ready', () => {
          isWaConnected = true;
          io.emit('wa_qr', null);
          io.emit('log', { source: 'System', message: 'WhatsApp conectado com sucesso!', type: 'text' });
          io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });
        });

        waClient.on('disconnected', () => {
          isWaConnected = false;
          io.emit('log', { source: 'System', message: 'WhatsApp desconectado.', type: 'text' });
          io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });
        });

        waClient.initialize().catch((err: any) => {
          io.emit('log', { source: 'Error', message: `Erro ao iniciar WhatsApp: ${err.message}`, type: 'text' });
        });

      } catch (err: any) {
        io.emit('log', { source: 'Error', message: `Erro no WhatsApp: ${err.message}`, type: 'text' });
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
          onError: (err: any) => {
            io.emit('log', { source: 'Error', message: `Erro no Telegram: ${err.message}`, type: 'text' });
          },
        });

        isTgConnected = true;
        io.emit('log', { source: 'System', message: 'Telegram (Userbot) conectado com sucesso!', type: 'text' });
        io.emit('status', { telegram: isTgConnected, whatsapp: isWaConnected });

        // Listen for messages
        tgClient.addEventHandler(async (event: any) => {
          try {
            if (!isForwarding) return;

            const message = event.message;
            const texto = message.text || message.message || '';
            const temMidia = !!message.media;

            io.emit('log', { source: 'Telegram', message: `📩 Nova mensagem: ${texto ? texto.substring(0, 30) + '...' : '[Sem texto]'}`, type: temMidia ? 'media' : 'text' });

            // Regras do usuário
            const config = loadConfig();
            const rules: string[] = config.rules || [];
            
            let passou = false;
            if (rules.length === 0) {
              passou = true; // Se não tem regras, passa tudo
            } else {
              for (const rule of rules) {
                const parts = rule.split('&&').map(p => p.trim());
                const allPartsMatch = parts.every(p => texto.includes(p));
                if (allPartsMatch) {
                  passou = true;
                  break;
                }
              }
            }

            if (!passou) {
              io.emit('log', { source: 'System', message: '⏭️ Ignorada (não passou nas regras).', type: 'text' });
              return;
            }

            io.emit('log', { source: 'System', message: `⏳ Aguardando 5s antes de enviar...`, type: 'text' });
            await new Promise(resolve => setTimeout(resolve, 5000));

            if (isWaConnected && waClient && targetWaGroupId) {
              if (!temMidia) {
                await waClient.sendMessage(targetWaGroupId, texto);
                io.emit('log', { source: 'System', message: '✅ Texto encaminhado para WhatsApp.', type: 'text' });
              } else {
                // Lida com Mídia
                const buffer = await tgClient!.downloadMedia(message);
                if (buffer) {
                  // Descobre mimetype básico
                  let mimetype = 'application/octet-stream';
                  let filename = 'file';
                  if (message.photo) {
                    mimetype = 'image/jpeg';
                    filename = 'image.jpg';
                  } else if (message.video) {
                    mimetype = 'video/mp4';
                    filename = 'video.mp4';
                  } else if (message.document && message.document.mimeType) {
                    mimetype = message.document.mimeType;
                    filename = message.document.attributes?.find((a: any) => a.fileName)?.fileName || 'document';
                  }

                  const media = new MessageMedia(mimetype, buffer.toString('base64'), filename);
                  await waClient.sendMessage(targetWaGroupId, media, { caption: texto });
                  io.emit('log', { source: 'System', message: '📷✅ Mídia + legenda encaminhadas para WhatsApp.', type: 'media' });
                } else {
                  io.emit('log', { source: 'Error', message: 'Falha ao baixar mídia do Telegram.', type: 'text' });
                }
              }
            }
          } catch (err: any) {
            io.emit('log', { source: 'Error', message: `Erro ao processar mensagem: ${err.message}`, type: 'text' });
          }
        }, new NewMessage({ chats: targetTgGroupId ? [targetTgGroupId] : [] }));

      } catch (err: any) {
        io.emit('log', { source: 'Error', message: `Erro fatal no Telegram: ${err.message}`, type: 'text' });
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
      io.emit('log', { source: 'System', message: 'Ponte desconectada.', type: 'text' });
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
