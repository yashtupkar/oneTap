import React, { useState, useEffect } from 'react';
import { Assistant } from './pages/Assistant';
import { Search } from './pages/Search';
import { Auth } from './pages/Auth';

import ProfilePage from '../options/pages/ProfilePage';
import DocumentsPage from '../options/pages/DocumentsPage';
import MappingsPage from '../options/pages/MappingsPage';
import PreferencesPage from '../options/pages/PreferencesPage';

import { getToken, logout, getProfile } from '../shared/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('assistant');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await getToken();
      if (res && res.token) {
        setToken(res.token);
        fetchUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const p = await getProfile();
      if (p && p.profile) {
        setUserName(p.profile.firstName || 'User');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToken(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-surface">
        <svg className="w-8 h-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!token) {
    return <Auth onSuccess={(t) => { setToken(t); fetchUser(); }} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-surface text-gray-100 font-sans antialiased">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">oneTap</h1>
            <p className="text-[10px] text-primary-400 font-bold uppercase tracking-wider mt-0.5">Identity Vault</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 hidden sm:inline-block">
            Hey, {userName}
          </span>
          <button 
            onClick={handleLogout}
            className="text-xs font-medium text-gray-500 hover:text-red-400 transition-colors bg-surface-elevated hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-surface-border hover:border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex items-center space-x-1 p-3 bg-surface-card border-b border-surface-border overflow-x-auto no-scrollbar">
        {[
          { id: 'assistant', label: '🤖 Assistant' },
          { id: 'profile',   label: '👤 Profile' },
          { id: 'documents', label: '📄 Documents' },
          { id: 'rules',     label: '🧠 Rules' },
          { id: 'search',    label: '🔍 Search' },
          { id: 'settings',  label: '⚙️ Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'text-gray-400 hover:text-white hover:bg-surface-elevated'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-0 relative">
        {activeTab === 'assistant' && <Assistant />}
        {activeTab === 'profile'   && <ProfilePage />}
        {activeTab === 'documents' && <DocumentsPage />}
        {activeTab === 'rules'     && <MappingsPage />}
        {activeTab === 'search'    && <Search />}
        {activeTab === 'settings'  && <PreferencesPage />}
      </main>
    </div>
  );
}
