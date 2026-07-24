import React, { useState, useEffect } from 'react';
import ProfilePage from './pages/ProfilePage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import PreferencesPage from './pages/PreferencesPage.jsx';
import MappingsPage from './pages/MappingsPage.jsx';

const NAV_ITEMS = [
  { id: 'profile',     icon: '👤', label: 'Profile' },
  { id: 'documents',  icon: '📄', label: 'Documents' },
  { id: 'preferences',icon: '⚙️', label: 'Preferences' },
  { id: 'mappings',   icon: '🧠', label: 'Learned Mappings' },
];

const PAGE_COMPONENTS = {
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
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-card border-r border-surface-border flex flex-col min-h-screen">
        {/* Logo */}
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-lg shadow-glow">
              ⚡
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">AI Form Autofill</h1>
              <p className="text-xs text-slate-500">v1.0.0</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="section-title px-3">Menu</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full nav-item ${activePage === item.id ? 'active' : ''}`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-border">
          <p className="text-xs text-slate-600 text-center">Data stored securely & locally</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <ActiveComponent />
      </main>
    </div>
  );
}
