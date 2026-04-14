import React, { useState } from 'react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Usuário criado com sucesso! Você pode voltar para o login.');
        setError('');
        setUsername('');
        setPassword('');
      } else {
        setError(data.message || 'Erro ao criar usuário');
        setMessage('');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark flex items-center justify-center p-4 font-sans">
      <div className="bg-brand-surface p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Registro Oculto</h2>
          <p className="text-gray-400">Crie um novo usuário de acesso</p>
        </div>

        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">{error}</div>}
        {message && <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Novo Usuário</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-brand-telegram outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-brand-telegram outline-none" required />
          </div>
          <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2">Criar Usuário</button>
        </form>
        <div className="mt-4 text-center">
          <a href="/" className="text-brand-primary hover:underline text-sm">Voltar para o Login</a>
        </div>
      </div>
    </div>
  );
};

export default Register;
