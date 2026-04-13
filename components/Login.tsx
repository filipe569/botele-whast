import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expectedUsername = import.meta.env.VITE_APP_USERNAME || 'admin';
    const expectedPassword = import.meta.env.VITE_APP_PASSWORD || 'admin123';

    if (username === expectedUsername && password === expectedPassword) {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center p-4 font-sans">
      <div className="bg-brand-surface p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400">Faça login para acessar a ponte de mensagens</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram outline-none transition-all"
              placeholder="Digite seu usuário"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-brand-telegram focus:border-brand-telegram outline-none transition-all"
              placeholder="Digite sua senha"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
