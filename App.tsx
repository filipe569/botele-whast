import React, { useState, useCallback, useEffect } from 'react';
import { ConnectionStatus, LogMessage } from './types';
import Header from './components/Header';
import ConfigForm from './components/ConfigForm';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [telegramGroup, setTelegramGroup] = useState<string>('');
  const [whatsappGroup, setWhatsappGroup] = useState<string>('');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState<string>('');
  const [isForwarding, setIsForwarding] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('status', (data) => {
      if (data.telegram && data.whatsapp) {
        setStatus(ConnectionStatus.CONNECTED);
      } else if (data.telegram || data.whatsapp) {
        setStatus(ConnectionStatus.CONNECTING);
      } else {
        setStatus(ConnectionStatus.DISCONNECTED);
      }
      if (data.tgGroup) setTelegramGroup(data.tgGroup);
      if (data.waGroup) setWhatsappGroup(data.waGroup);
      if (data.isForwarding !== undefined) setIsForwarding(data.isForwarding);
    });

    newSocket.on('log', (data) => {
      setLogs(prev => [{
        id: `log-${Date.now()}-${Math.random()}`,
        user: data.source,
        text: data.message,
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        type: data.type
      }, ...prev.slice(0, 99)]);
    });

    newSocket.on('wa_qr', (qr) => {
      setWaQrCode(qr);
    });

    newSocket.on('need_tg_code', () => {
      setStatus(ConnectionStatus.WAITING_CODE);
    });

    newSocket.on('need_tg_password', () => {
      // For simplicity, we assume no 2FA password in this demo. If needed, we could add another state.
      newSocket.emit('tg_password', '');
    });

    return () => {
      newSocket.close();
    };
  }, [isAuthenticated]);

  const handleConnect = useCallback((apiId: string, apiHash: string, phoneNumber: string, teleGroup: string, whatsGroup: string) => {
    setStatus(ConnectionStatus.CONNECTING);
    setError(null);
    setTelegramGroup(teleGroup);
    setWhatsappGroup(whatsGroup);
    setLogs([]);
    setWaQrCode(null);

    if (socket) {
      socket.emit('start_bridge', {
        apiId,
        apiHash,
        phoneNumber,
        tgGroupId: teleGroup || null,
        waGroupId: whatsGroup || null
      });
    }
  }, [socket]);

  const handleDisconnect = useCallback(() => {
    if (socket) {
      socket.emit('stop_bridge');
    }
    setStatus(ConnectionStatus.DISCONNECTED);
    setTelegramGroup('');
    setWhatsappGroup('');
    setError(null);
    setWaQrCode(null);
  }, [socket]);

  const handlePause = useCallback(() => {
    if (socket) socket.emit('pause_bridge');
  }, [socket]);

  const handleResume = useCallback(() => {
    if (socket) socket.emit('resume_bridge');
  }, [socket]);

  const submitOtp = () => {
    if (socket && otpCode) {
      socket.emit('tg_code', otpCode);
      setStatus(ConnectionStatus.CONNECTING);
    }
  };

  const path = window.location.pathname;
  if (path === '/registro-oculto') {
    return <Register />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={(user) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg-dark text-gray-200 font-sans relative">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-brand-bg-light rounded-2xl shadow-2xl overflow-hidden">
          {status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR ? (
            <ConfigForm onConnect={handleConnect} status={status} error={error} />
          ) : (
            <Dashboard 
              status={status}
              telegramGroup={telegramGroup}
              whatsappGroup={whatsappGroup}
              logs={logs}
              waQrCode={waQrCode}
              onDisconnect={handleDisconnect}
              isForwarding={isForwarding}
              onPause={handlePause}
              onResume={handleResume}
              currentUser={currentUser}
            />
          )}
        </div>
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p><strong>Aviso:</strong> Esta aplicação agora usa seu Número de Telefone (Userbot).</p>
          <p>O Telegram enviará um código SMS/App para você confirmar o login.</p>
        </div>
      </main>

      {/* OTP Modal */}
      {status === ConnectionStatus.WAITING_CODE && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-4">Código do Telegram</h3>
            <p className="text-gray-300 mb-6">
              O Telegram enviou um código de verificação para o seu aplicativo ou SMS. Digite-o abaixo para concluir o login.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Ex: 12345"
              className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg py-3 px-4 text-white text-center text-2xl tracking-widest mb-6 focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram outline-none"
              autoFocus
            />
            <button
              onClick={submitOtp}
              disabled={!otpCode}
              className="w-full bg-brand-telegram hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Confirmar Código
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;