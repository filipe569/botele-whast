
import React from 'react';
import { ConnectionStatus, LogMessage } from '../types';
import TelegramIcon from './icons/TelegramIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import PowerIcon from './icons/PowerIcon';
import MessageLogItem from './MessageLogItem';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardProps {
  status: ConnectionStatus;
  telegramGroup: string;
  whatsappGroup: string;
  logs: LogMessage[];
  waQrCode: string | null;
  onDisconnect: () => void;
}

const StatusIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  if (status === ConnectionStatus.CONNECTED) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        Ativa
      </div>
    );
  }
  if (status === ConnectionStatus.CONNECTING) {
    return <div className="text-yellow-400">Conectando...</div>;
  }
  return <div className="text-red-400">Desconectada</div>;
};

const Dashboard: React.FC<DashboardProps> = ({ status, telegramGroup, whatsappGroup, logs, waQrCode, onDisconnect }) => {
  const getGroupName = (url: string) => {
    try {
      const path = new URL(url).pathname;
      return path.substring(path.lastIndexOf('/') + 1) || url;
    } catch {
      return url || 'Todos os Grupos';
    }
  };

  return (
    <div>
      <div className="p-6 bg-brand-surface/50 border-b border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-2">
              <StatusIndicator status={status} />
            </div>
            <div className="flex items-center gap-3 text-gray-300 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 p-2 bg-gray-900/50 rounded-md">
                    <TelegramIcon className="w-5 h-5 text-brand-telegram"/>
                    <span>{getGroupName(telegramGroup)}</span>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-500"/>
                <div className="flex items-center gap-1.5 p-2 bg-gray-900/50 rounded-md">
                    <WhatsAppIcon className="w-5 h-5 text-brand-whatsapp"/>
                    <span>{getGroupName(whatsappGroup)}</span>
                </div>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            <PowerIcon className="w-5 h-5" />
            Desconectar
          </button>
        </div>
      </div>
      
      <div className="p-6 h-96 overflow-y-auto flex flex-col-reverse">
        {waQrCode ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="mb-4 text-white font-bold">Escaneie o QR Code com o WhatsApp</p>
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={waQrCode} size={200} />
            </div>
          </div>
        ) : status === ConnectionStatus.CONNECTING ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Aguardando conexão...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Aguardando a primeira mensagem...
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <MessageLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
