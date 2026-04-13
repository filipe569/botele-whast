
import React from 'react';
import TelegramIcon from './icons/TelegramIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const Header: React.FC = () => {
  return (
    <header className="py-6">
      <div className="container mx-auto text-center">
        <div className="flex justify-center items-center gap-4 mb-2">
          <TelegramIcon className="w-10 h-10" />
          <ArrowRightIcon className="w-8 h-8 text-gray-400" />
          <WhatsAppIcon className="w-10 h-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-telegram to-brand-whatsapp">
          Ponte de Mensagens Tele-Zap
        </h1>
        <p className="text-gray-400 mt-2">Sincronize suas conversas entre plataformas.</p>
      </div>
    </header>
  );
};

export default Header;
