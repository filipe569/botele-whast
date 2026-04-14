import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  currentUser: string;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ currentUser, onClose }) => {
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.rules) setRules(data.rules);
      });
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, password: password || undefined, rules })
      });
      if (res.ok) {
        setMessage('Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage('Erro ao salvar configurações.');
    }
  };

  const addRule = () => {
    if (newRule.trim() && !rules.includes(newRule.trim())) {
      setRules([...rules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (ruleToRemove: string) => {
    setRules(rules.filter(r => r !== ruleToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-surface p-8 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Configurações do Painel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {message && (
          <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Senha */}
          <div className="bg-brand-bg-dark p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">Alterar Senha de Acesso</h3>
            <p className="text-sm text-gray-400 mb-4">Deixe em branco para não alterar.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

          {/* Regras */}
          <div className="bg-brand-bg-dark p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-2">Regras de Encaminhamento</h3>
            <p className="text-sm text-gray-400 mb-4">
              A mensagem só será encaminhada se contiver TODAS as palavras de pelo menos uma das regras. Use <code>&&</code> para separar palavras obrigatórias na mesma regra.
            </p>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule()}
                placeholder="Ex: BLAZE && Filme"
                className="flex-1 bg-brand-surface border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-brand-primary outline-none"
              />
              <button
                onClick={addRule}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {rules.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhuma regra configurada. Todas as mensagens serão encaminhadas.</p>
              ) : (
                rules.map((rule, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-brand-surface p-3 rounded-lg border border-gray-600">
                    <span className="text-gray-200 font-mono text-sm">{rule}</span>
                    <button
                      onClick={() => removeRule(rule)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
