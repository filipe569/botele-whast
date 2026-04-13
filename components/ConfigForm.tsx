
import React, { useState } from 'react';
import { ConnectionStatus } from '../types';
import TelegramIcon from './icons/TelegramIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';

interface ConfigFormProps {
  onConnect: (apiId: string, apiHash: string, phoneNumber: string, telegramGroup: string, whatsappGroup: string) => void;
  status: ConnectionStatus;
  error: string | null;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onConnect, status, error }) => {
  const [apiId, setApiId] = useState<string>('22192384');
  const [apiHash, setApiHash] = useState<string>('5d9e8640320c112997aea86e674fe9c3');
  const [phoneNumber, setPhoneNumber] = useState<string>('+5571988070918');
  const [telegramGroup, setTelegramGroup] = useState<string>('@blazetopt');
  const [whatsappGroup, setWhatsappGroup] = useState<string>('557188070918-1601429751@g.us');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiId && apiHash && phoneNumber) {
      onConnect(apiId, apiHash, phoneNumber, telegramGroup, whatsappGroup);
    }
  };

  const isConnecting = status === ConnectionStatus.CONNECTING;

  return (
    <div className="p-8 md:p-12">
      <h2 className="text-2xl font-bold text-white mb-2">Configurar a Ponte (Userbot)</h2>
      <p className="text-gray-400 mb-8">
        Insira suas credenciais do Telegram e os IDs dos grupos para iniciar.
      </p>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">API ID</label>
            <input
              type="text"
              value={apiId}
              onChange={(e) => setApiId(e.target.value)}
              className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram transition"
              required
              disabled={isConnecting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">API Hash</label>
            <input
              type="text"
              value={apiHash}
              onChange={(e) => setApiHash(e.target.value)}
              className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram transition"
              required
              disabled={isConnecting}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-medium text-gray-300 mb-2">
            <TelegramIcon className="w-6 h-6" />
            Número de Telefone (com código do país)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ex: +5511999999999"
            className="w-full bg-brand-surface border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram transition"
            required
            disabled={isConnecting}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-medium text-gray-300 mb-2">
            <TelegramIcon className="w-6 h-6" />
            ID do Grupo Telegram (Opcional)
          </label>
          <input
            type="text"
            value={telegramGroup}
            onChange={(e) => setTelegramGroup(e.target.value)}
            placeholder="Ex: @blazetopt"
            className="w-full bg-brand-surface border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram transition"
            disabled={isConnecting}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-lg font-medium text-gray-300 mb-2">
            <WhatsAppIcon className="w-6 h-6" />
            ID do Grupo WhatsApp (Opcional)
          </label>
          <input
            type="text"
            value={whatsappGroup}
            onChange={(e) => setWhatsappGroup(e.target.value)}
            placeholder="Ex: 557188070918-1601429751@g.us"
            className="w-full bg-brand-surface border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-whatsapp focus:border-brand-whatsapp transition"
            disabled={isConnecting}
          />
        </div>

        <button
          type="submit"
          disabled={isConnecting || !apiId || !apiHash || !phoneNumber}
          className="w-full flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-primary-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          {isConnecting ? (
             <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Conectando...
            </>
          ) : 'Iniciar Ponte'}
        </button>
      </form>
    </div>
  );
};

export default ConfigForm;
