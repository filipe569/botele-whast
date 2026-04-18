
import React, { useState, useRef } from 'react';
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
  onBroadcast?: (text: string, imageBase64: string | null, mimeType: string | null, delay: number, filename: string | null, sendToAllGroups: boolean, loopHours: number) => void;
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

const Dashboard: React.FC<DashboardProps> = ({ status, telegramGroup, whatsappGroup, logs, waQrCode, onDisconnect, isForwarding, onPause, onResume, onBroadcast, currentUser }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'Telegram' | 'System' | 'Error'>('all');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'media'>('all');
  
  // Broadcast Form State
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastDelay, setBroadcastDelay] = useState(5);
  const [broadcastFile, setBroadcastFile] = useState<File | null>(null);
  const [broadcastSendToAll, setBroadcastSendToAll] = useState(false);
  const [broadcastLoopHours, setBroadcastLoopHours] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onBroadcast) return;
    
    if (broadcastFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const base64 = matches[2];
          onBroadcast(broadcastText, base64, mimeType, broadcastDelay, broadcastFile.name, broadcastSendToAll, broadcastLoopHours);
        } else {
          alert('Erro ao ler a imagem.');
        }
      };
      reader.readAsDataURL(broadcastFile);
    } else {
      if (!broadcastText.trim()) return;
      onBroadcast(broadcastText, null, null, broadcastDelay, null, broadcastSendToAll, broadcastLoopHours);
    }
    
    setBroadcastText('');
    setBroadcastFile(null);
    setBroadcastLoopHours(0);
    setShowBroadcast(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
              <>
                <button
                  onClick={() => setShowBroadcast(!showBroadcast)}
                  className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                  Mensagem em Massa
                </button>
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
              </>
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
      
      {showBroadcast && status === ConnectionStatus.CONNECTED && (
        <div className="p-6 bg-brand-bg-dark border-b border-gray-700">
           <h3 className="text-xl font-bold text-white mb-4">📢 Enviar Mensagem em Massa (WhatsApp)</h3>
           <p className="text-gray-400 text-sm mb-4">Envie uma mensagem programada para os grupos do WhatsApp.</p>
           
           <form onSubmit={handleBroadcastSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-300 mb-1">Texto da Mensagem</label>
               <textarea
                 value={broadcastText}
                 onChange={(e) => setBroadcastText(e.target.value)}
                 className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                 rows={3}
                 placeholder="Digite sua mensagem aqui..."
               ></textarea>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Imagem ou Mídia (Opcional)</label>
                 <input
                   type="file"
                   ref={fileInputRef}
                   accept="image/*,video/*"
                   onChange={(e) => setBroadcastFile(e.target.files?.[0] || null)}
                   className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600 cursor-pointer"
                 />
                 {broadcastFile && <p className="text-xs text-brand-primary mt-1">Anexo: {broadcastFile.name}</p>}
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Intervalo entre envios (s)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={broadcastDelay}
                    onChange={(e) => setBroadcastDelay(Number(e.target.value))}
                    className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">Delay entre grupos</p>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-700 pt-4 mt-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="sendToAll"
                    checked={broadcastSendToAll}
                    onChange={(e) => setBroadcastSendToAll(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 text-brand-primary focus:ring-brand-primary bg-brand-surface"
                  />
                  <label htmlFor="sendToAll" className="text-sm font-medium text-gray-300 cursor-pointer">
                    Enviar para <strong>TODOS OS MEUS GRUPOS</strong> do WhatsApp <br/>
                    <span className="text-xs text-gray-500 font-normal">(Ignora a lista da tela inicial)</span>
                  </label>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-300 mb-1">Loop: Repetir a cada X horas</label>
                   <input
                     type="number"
                     min="0"
                     max="720"
                     value={broadcastLoopHours}
                     onChange={(e) => setBroadcastLoopHours(Number(e.target.value))}
                     className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                   />
                   <p className="text-xs text-gray-500 mt-1">Coloque 0 para enviar apenas uma vez.</p>
                </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-2">
               <button
                 type="button"
                 onClick={() => setShowBroadcast(false)}
                 className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
               >
                 Cancelar
               </button>
               <button
                 type="submit"
                 disabled={!broadcastText && !broadcastFile}
                 className="bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
               >
                 Disparar Mensagem
               </button>
             </div>
           </form>
        </div>
      )}

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
