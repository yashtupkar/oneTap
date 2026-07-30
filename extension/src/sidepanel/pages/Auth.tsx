import React, { useState } from 'react';
import { login, register, getDeviceId } from '../../shared/api';

interface AuthProps {
  onSuccess: (token: string) => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (authMode === 'login') {
        res = await login(email, password);
      } else {
        const dId = await getDeviceId();
        res = await register(email, password, dId.deviceId || dId);
      }

      if (res.error) {
        setError(res.error);
      } else if (res.token) {
        onSuccess(res.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center bg-surface p-6 font-sans text-gray-100">
      <div className="w-full max-w-sm bg-surface-card border border-surface-border rounded-2xl p-8 shadow-xl shadow-black/20">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20 text-white">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            {authMode === 'login' 
              ? 'Log in to securely sync your Graph Data' 
              : 'Sign up to enable encrypted cloud syncing'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              authMode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium hover:underline transition-colors"
          >
            {authMode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Log in'
            }
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Data encrypted with zero-knowledge architecture
      </div>
    </div>
  );
}
