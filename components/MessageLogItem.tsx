
import React from 'react';
import { LogMessage } from '../types';
import TelegramIcon from './icons/TelegramIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';

interface MessageLogItemProps {
  log: LogMessage;
}

const MessageLogItem: React.FC<MessageLogItemProps> = ({ log }) => {
  const isSystemMessage = log.user === 'Sistema';

  return (
    <div className={`p-3 rounded-lg ${isSystemMessage ? 'bg-indigo-900/40 text-center' : 'bg-brand-surface'}`}>
      {isSystemMessage ? (
        <p className="text-sm text-indigo-300">{log.text}</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
                <span className="font-bold text-brand-telegram">{log.user}</span>
                <span className="text-xs text-gray-500">via Telegram</span>
            </div>
            <span className="text-xs text-gray-500">{log.timestamp}</span>
          </div>
          <p className="text-gray-300 ml-1">{log.text}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-green-400/70">
            <ArrowRightIcon className="w-3 h-3"/>
            <span>Enviado para WhatsApp</span>
            <WhatsAppIcon className="w-3 h-3"/>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageLogItem;
