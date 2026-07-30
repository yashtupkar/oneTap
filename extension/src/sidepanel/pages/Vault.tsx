import React, { useState } from 'react';

export const Vault: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate unlocking
    if (masterPassword === 'password') {
      setUnlocked(true);
    }
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col h-full bg-surface items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-primary-500/10 text-primary-500 rounded-full flex items-center justify-center mb-8 border border-primary-500/20 shadow-lg shadow-primary-500/10">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Secure Vault</h2>
        <p className="text-sm text-gray-400 mb-10 max-w-[250px]">Enter your master password to access your encrypted credentials.</p>
        
        <form onSubmit={handleUnlock} className="w-full max-w-xs space-y-5">
          <input
            type="password"
            className="w-full px-5 py-3 bg-surface-elevated border border-surface-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-center tracking-widest text-lg"
            placeholder="••••••••"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <button 
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-lg shadow-primary-500/20"
          >
            Unlock Vault
          </button>
        </form>
      </div>
    );
  }

  // Mock Vault Items
  const credentials = [
    { website: 'github.com', username: 'yashtupkar', lastUpdated: '2 days ago' },
    { website: 'aws.amazon.com', username: 'admin@startup.io', lastUpdated: '1 month ago' },
    { website: 'workday.com', username: 'yash.t@gmail.com', lastUpdated: 'just now' }
  ];

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 border-b border-surface-border bg-surface-card flex justify-between items-center sticky top-0">
        <h2 className="font-bold text-white tracking-tight">Password Vault</h2>
        <button 
          onClick={() => setUnlocked(false)}
          className="text-xs font-semibold text-gray-400 hover:text-white uppercase tracking-wider bg-surface-elevated px-3 py-1.5 rounded-md transition-colors"
        >
          Lock
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
        <button className="w-full mb-8 border-2 border-dashed border-surface-border bg-surface-card rounded-xl p-4 text-sm font-medium text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-all flex items-center justify-center gap-2 group">
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Login
        </button>

        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 pl-1">Saved Credentials</h3>
        
        <ul className="space-y-3">
          {credentials.map((cred, i) => (
            <li key={i} className="p-3 bg-surface-card border border-surface-border rounded-xl hover:border-primary-500/50 transition-colors cursor-pointer flex items-center gap-4 group">
              <div className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center text-primary-400 font-bold text-lg">
                {cred.website.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-medium text-gray-200 text-sm truncate group-hover:text-white transition-colors">{cred.website}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{cred.username}</div>
              </div>
              <button className="text-gray-500 hover:text-primary-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
