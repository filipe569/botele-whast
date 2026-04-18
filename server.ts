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

// Simple mock translation function (in a real app, use Google Translate API or similar)
async function translateText(text: string): Promise<string> {
  // For demonstration, we'll just add a prefix. 
  // To implement real translation, you'd need an API key for a service like Google Translate or DeepL.
  // return `[Traduzido]: ${text}`;
  return text; // Returning original text for now to avoid breaking without an API key
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
  
  let targetTgGroupIds: string[] = [];
  let targetWaGroupIds: string[] = [];
  let activeBroadcastTimeouts: any[] = []; // Changed from NodeJS.Timeout to any[] for simplicity with setInterval

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
      tgGroup: targetTgGroupIds.join(', '),
      waGroup: targetWaGroupIds.join(', '),
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

    socket.on('broadcast_wa', async (data) => {
      const { text, imageBase64, mimeType, delay, filename, sendToAllGroups, loopHours } = data;
      
      const runBroadcast = async () => {
          if (!isWaConnected || !waClient) {
            io.emit('log', { source: 'Error', message: '❌ Disparo cancelado: WhatsApp não conectado.', type: 'text' });
            return;
          }
          
          let groupsToMessage: string[] = [];
          
          if (sendToAllGroups) {
              try {
                  const chats = await waClient.getChats();
                  groupsToMessage = chats.filter((c: any) => c.isGroup).map((c: any) => c.id._serialized);
                  io.emit('log', { source: 'System', message: `🔍 Buscando todos os grupos: ${groupsToMessage.length} encontrados.`, type: 'text' });
              } catch (e: any) {
                  io.emit('log', { source: 'Error', message: `❌ Falha ao obter grupos do WhatsApp: ${e.message}`, type: 'text' });
              }
          } else {
              groupsToMessage = targetWaGroupIds;
          }
          
          if (groupsToMessage.length === 0) {
            io.emit('log', { source: 'Error', message: '❌ Disparo cancelado: Nenhum grupo WhatsApp configurado ou encontrado.', type: 'text' });
            return;
          }

          io.emit('log', { source: 'System', message: `🚀 Iniciando disparo em massa para ${groupsToMessage.length} grupo(s) com intervalo de ${delay}s...`, type: 'text' });

          for (let i = 0; i < groupsToMessage.length; i++) {
            const waGroupId = groupsToMessage[i];
            
            try {
              if (imageBase64) {
                const media = new MessageMedia(mimeType, imageBase64, filename || 'image');
                await waClient.sendMessage(waGroupId, media, { caption: text });
              } else {
                await waClient.sendMessage(waGroupId, text);
              }
              io.emit('log', { source: 'System', message: `✅ Disparo enviado para: ${waGroupId}`, type: 'text' });
            } catch (err: any) {
              io.emit('log', { source: 'Error', message: `❌ Falha ao enviar disparo para ${waGroupId}: ${err.message}`, type: 'text' });
            }

            // Apply delay if this is not the last group
            if (i < groupsToMessage.length - 1 && delay > 0) {
              io.emit('log', { source: 'System', message: `⏳ Aguardando ${delay} segundos para o próximo disparo...`, type: 'text' });
              await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
          }
          io.emit('log', { source: 'System', message: '🎉 Disparo em massa concluído com sucesso!', type: 'text' });
      };

      await runBroadcast();

      if (loopHours && loopHours > 0) {
          const waitMs = loopHours * 60 * 60 * 1000;
          io.emit('log', { source: 'System', message: `🔁 Loop ativado! O disparo será repetido a cada ${loopHours} hora(s).`, type: 'text' });
          
          const intervalId = setInterval(() => {
              if(!isWaConnected) {
                 clearInterval(intervalId);
                 return;
              }
              runBroadcast();
          }, waitMs);
          
          activeBroadcastTimeouts.push(intervalId);
      }
    });

    socket.on('start_bridge', async (bridgeConfig) => {
      const { apiId, apiHash, phoneNumber, tgGroupId, waGroupId } = bridgeConfig;
      
      // Parse multiple groups
      targetTgGroupIds = tgGroupId ? tgGroupId.split(',').map((id: string) => id.trim()).filter(Boolean) : [];
      targetWaGroupIds = waGroupId ? waGroupId.split(',').map((id: string) => id.trim()).filter(Boolean) : [];

      io.emit('log', { source: 'System', message: `Iniciando conexão... Monitorando ${targetTgGroupIds.length} grupos no Telegram e enviando para ${targetWaGroupIds.length} grupos no WhatsApp.`, type: 'text' });

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

            // --- FUNÇÃO 5: Horário de Funcionamento ---
            // Exemplo: Permitir apenas das 08:00 às 18:00
            const currentHour = new Date().getHours();
            // Descomente as linhas abaixo para ativar o filtro de horário
            // if (currentHour < 8 || currentHour >= 18) {
            //   io.emit('log', { source: 'System', message: '🌙 Ignorada (Fora do horário de funcionamento).', type: 'text' });
            //   return;
            // }

            const message = event.message;
            let texto = message.text || message.message || '';
            const temMidia = !!message.media;

            io.emit('log', { source: 'Telegram', message: `📩 Nova mensagem: ${texto ? texto.substring(0, 30) + '...' : '[Sem texto]'}`, type: temMidia ? 'media' : 'text' });

            // --- FUNÇÃO 4: Tradução Automática ---
            // texto = await translateText(texto);

            const textoFinal = texto;

            io.emit('log', { source: 'System', message: `⏳ Aguardando 5s antes de enviar...`, type: 'text' });
            await new Promise(resolve => setTimeout(resolve, 5000));

            if (isWaConnected && waClient && targetWaGroupIds.length > 0) {
              
              // Baixa a mídia uma vez se existir
              let media: any = null;
              if (temMidia) {
                const buffer = await tgClient!.downloadMedia(message);
                if (buffer) {
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
                  media = new MessageMedia(mimetype, buffer.toString('base64'), filename);
                } else {
                  io.emit('log', { source: 'Error', message: 'Falha ao baixar mídia do Telegram.', type: 'text' });
                }
              }

              // Envia para todos os grupos do WhatsApp
              for (const waGroupId of targetWaGroupIds) {
                try {
                  if (!temMidia || !media) {
                    await waClient.sendMessage(waGroupId, textoFinal);
                    io.emit('log', { source: 'System', message: `✅ Texto encaminhado para WA (${waGroupId}).`, type: 'text' });
                  } else {
                    await waClient.sendMessage(waGroupId, media, { caption: textoFinal });
                    io.emit('log', { source: 'System', message: `📷✅ Mídia encaminhada para WA (${waGroupId}).`, type: 'media' });
                  }
                } catch (sendErr: any) {
                  io.emit('log', { source: 'Error', message: `Falha ao enviar para ${waGroupId}: ${sendErr.message}`, type: 'text' });
                }
              }
            }
          } catch (err: any) {
            io.emit('log', { source: 'Error', message: `Erro ao processar mensagem: ${err.message}`, type: 'text' });
          }
        }, new NewMessage({ chats: targetTgGroupIds.length > 0 ? targetTgGroupIds : [] }));

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
