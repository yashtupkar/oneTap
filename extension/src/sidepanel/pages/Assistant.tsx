import React, { useState, useEffect } from 'react';
import { EventBus } from '../../core/EventBus';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I am ready to help you fill out this form. Ask me anything about your documents or the current application.' }
  ]);
  const [input, setInput] = useState('');
  const [formContext, setFormContext] = useState<any>(null);

  useEffect(() => {
    // Listen for form context updates from the background
    const unlisten = EventBus.listen('FORM_DETECTED', (payload) => {
      setFormContext(payload);
    });
    return () => unlisten();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    // Mock AI response for now
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I can help with that based on your selected Backend Resume!' }]);
    }, 1000);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      {formContext && (
        <div className="p-3 bg-primary-500/10 border-b border-primary-500/20 text-xs text-primary-400 font-medium flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
          Active on {new URL(formContext.url).hostname} ({formContext.fieldsCount} fields)
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary-500 text-white rounded-tr-sm' 
                : 'bg-surface-elevated text-gray-100 border border-surface-border rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-surface-card border-t border-surface-border">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            placeholder="Ask about this form or your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            className="bg-primary-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20 flex items-center justify-center"
            onClick={handleSend}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
