
import React, { useState } from 'react';
import { ConnectionStatus, LogMessage } from '../types';
import TelegramIcon from './icons/TelegramIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import PowerIcon from './icons/PowerIcon';
import MessageLogItem from './MessageLogItem';
import SettingsPanel from './SettingsPanel';
import { QRCodeSVG } from 'qrcode.react';

interface DashboardProps {
  status: ConnectionStatus;
  telegramGroup: string;
  whatsappGroup: string;
  logs: LogMessage[];
  waQrCode: string | null;
  onDisconnect: () => void;
  isForwarding: boolean;
  onPause: () => void;
  onResume: () => void;
  currentUser: string;
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

const Dashboard: React.FC<DashboardProps> = ({ status, telegramGroup, whatsappGroup, logs, waQrCode, onDisconnect, isForwarding, onPause, onResume, currentUser }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'Telegram' | 'System' | 'Error'>('all');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'media'>('all');

  const getGroupName = (url: string) => {
    try {
      const path = new URL(url).pathname;
      return path.substring(path.lastIndexOf('/') + 1) || url;
    } catch {
      return url || 'Todos os Grupos';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterSource !== 'all' && log.user !== filterSource) return false;
    if (filterType !== 'all' && log.type !== filterType && log.user === 'Telegram') return false;
    return true;
  });

  return (
    <div>
      <div className="p-6 bg-brand-surface/50 border-b border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-2">
              <StatusIndicator status={status} />
              {status === ConnectionStatus.CONNECTED && (
                <span className={`text-sm px-2 py-0.5 rounded ${isForwarding ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                  {isForwarding ? 'Encaminhando' : 'Pausado'}
                </span>
              )}
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
          <div className="flex items-center gap-3 flex-wrap">
            {status === ConnectionStatus.CONNECTED && (
              <button
                onClick={isForwarding ? onPause : onResume}
                className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${isForwarding ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
              >
                {isForwarding ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Pausar
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Retomar
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Configurações
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              <PowerIcon className="w-5 h-5" />
              Desconectar
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-brand-bg-dark border-b border-gray-700 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-gray-400">Filtros:</span>
        <select 
          value={filterSource} 
          onChange={(e) => setFilterSource(e.target.value as any)}
          className="bg-brand-surface border border-gray-600 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2"
        >
          <option value="all">Todas as Origens</option>
          <option value="Telegram">Telegram</option>
          <option value="System">Sistema</option>
          <option value="Error">Erros</option>
        </select>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-brand-surface border border-gray-600 text-white text-sm rounded-lg focus:ring-brand-primary focus:border-brand-primary block p-2"
        >
          <option value="all">Todos os Tipos</option>
          <option value="text">Apenas Texto</option>
          <option value="media">Apenas Mídia</option>
        </select>
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
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma mensagem encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <MessageLogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {showSettings && <SettingsPanel currentUser={currentUser} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default Dashboard;
