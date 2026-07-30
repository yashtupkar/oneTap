import React, { useState, useEffect } from 'react';
import ProfilePage from './pages/ProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import PreferencesPage from './pages/PreferencesPage';
import MappingsPage from './pages/MappingsPage';

const NAV_ITEMS = [
  { id: 'profile',     icon: '👤', label: 'Profile' },
  { id: 'documents',  icon: '📄', label: 'Documents' },
  { id: 'preferences',icon: '⚙️', label: 'Preferences' },
  { id: 'mappings',   icon: '🧠', label: 'Learned Mappings' },
];

const PAGE_COMPONENTS: Record<string, React.FC> = {
  profile:     ProfilePage,
  documents:   DocumentsPage,
  preferences: PreferencesPage,
  mappings:    MappingsPage,
};

export default function Options() {
  const [activePage, setActivePage] = useState('profile');

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && NAV_ITEMS.find(n => n.id === hash)) {
      setActivePage(hash);
    }
  }, []);

  const ActiveComponent = PAGE_COMPONENTS[activePage] || ProfilePage;

  return (
    <div className="min-h-screen bg-surface text-gray-100 flex font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-card border-r border-surface-border flex flex-col min-h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary-500/20 text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">oneTap</h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Identity Vault</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Menu</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activePage === item.id 
                  ? 'bg-primary-500/10 text-primary-400 shadow-sm' 
                  : 'text-gray-400 hover:bg-surface-elevated hover:text-gray-200'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border">
          <div className="flex items-center gap-2 justify-center text-xs text-gray-500 font-medium">
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Data encrypted locally
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-screen overflow-y-auto bg-surface relative">
        <ActiveComponent />
      </main>
    </div>
  );
}
