import React, { useState, useRef, useEffect } from 'react';
import { askAiAssistant } from '../shared/api.js';
import { Languages, BookOpen, Sparkles, Mail, Phone, Link as LinkIcon, Map, MoreHorizontal } from 'lucide-react';

const QUICK_ACTIONS = [
  { label: 'Translate', icon: <Languages size={16} />, actionType: 'translate' },
  { label: 'Explain', icon: <BookOpen size={16} />, prompt: 'Explain this text simply.' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Hindi', 'Arabic'];

const getDynamicActions = (text, isInputField) => {
  const actions = [...QUICK_ACTIONS];
  


  // Email heuristic
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)[0];
    actions.push({ label: 'Send Email', icon: <Mail size={16} />, isLink: true, url: `mailto:${match}` });
  }
  // Phone heuristic (basic check for digits, spaces, hyphens, optional plus)
  else if (/^(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/.test(text.trim())) {
    actions.push({ label: 'Call', icon: <Phone size={16} />, isLink: true, url: `tel:${text.trim().replace(/[^\d+]/g, '')}` });
  }
  // URL heuristic
  else if (/^https?:\/\/[^\s]+$/.test(text.trim())) {
    actions.push({ label: 'Open Link', icon: <LinkIcon size={16} />, isLink: true, url: text.trim() });
  }
  // Map heuristic: fallback for any short text (e.g. cities, landmarks, partial addresses)
  else if (text.length > 2 && text.length < 80) {
    actions.push({ label: 'Search Map', icon: <Map size={16} />, isLink: true, url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}` });
  }

  return actions;
};

export function TextSelectionAssistant({ rect, selectedText, isInputField, onDismiss }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [translateMode, setTranslateMode] = useState(false);

  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onDismiss();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onDismiss]);

  const handleAction = async (prompt) => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await askAiAssistant(prompt, selectedText);
      if (response.error) {
        setError(response.error);
      } else {
        setResult(response.result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (customPrompt.trim()) {
      handleAction(customPrompt);
    }
  };

  if (!isOpen) {
    return (
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          top: rect.bottom + window.scrollY + 5,
          left: rect.right + window.scrollX + 5,
          zIndex: 2147483640,
        }}
        onMouseDown={(e) => {
          // Prevent losing selection
          e.preventDefault();
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: '#27272a',
            color: '#e4e4e7',
            border: '2px solid #3f3f46',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="Ask OneTap AI"
        >
          <img src={chrome.runtime.getURL('icons/icon16.png')} alt="OneTap" style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    );
  }

  const actions = getDynamicActions(selectedText, isInputField);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: rect.bottom + window.scrollY + 10,
        left: Math.min(Math.max(0, rect.left + window.scrollX), window.innerWidth + window.scrollX - 300),
        width: '280px',
        backgroundColor: '#1f1f1f',
        color: '#f5f5f5',
        borderRadius: '20px',
        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.7)',
        zIndex: 2147483640,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden',
        border: '1px solid #333'
      }}
      onMouseDown={(e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
    >
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #333' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
          <Sparkles size={18} color="#fff" style={{ marginRight: '10px' }} />
          <input 
            type="text" 
            placeholder="Type any prompt..." 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500
            }}
            autoFocus
          />
          <MoreHorizontal size={18} color="#999" style={{ cursor: 'pointer', marginLeft: '8px' }} />
        </form>
      </div>

      {!result && !isLoading && (
        <div style={{ padding: '8px 0' }}>
          {translateMode ? (
            <>
              <div style={{ padding: '4px 16px 12px', fontSize: '13px', color: '#999', display: 'flex', alignItems: 'center' }}>
                <button 
                  onClick={() => setTranslateMode(false)}
                  style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', marginRight: '8px', padding: 0, fontSize: '13px', fontWeight: 500 }}
                >
                  ← Back
                </button>
                <span>Translate to:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '0 8px' }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang}
                    onClick={() => handleAction(`Translate this text to ${lang}.`)}
                    style={{
                      padding: '10px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ddd',
                      textAlign: 'center',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ddd'; }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </>
          ) : (
            actions.map((action, idx) => (
              <React.Fragment key={idx}>
                {action.isLink ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (action.url.startsWith('http')) {
                        window.open(action.url, '_blank');
                      } else {
                        const link = document.createElement('a');
                        link.href = action.url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                      onDismiss();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: 'calc(100% - 16px)',
                      margin: '2px 8px',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ddd',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 500,
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ddd'; }}
                  >
                    <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>{action.icon}</span>
                    {action.label}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (action.actionType === 'translate') {
                        setTranslateMode(true);
                      } else {
                        handleAction(action.prompt);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: 'calc(100% - 16px)',
                      margin: '2px 8px',
                      padding: '10px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#ddd',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 500,
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#333'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#ddd'; }}
                  >
                    <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>{action.icon}</span>
                    {action.label}
                    {action.actionType === 'translate' && (
                      <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>▶</span>
                    )}
                  </button>
                )}
                {/* Insert divider after 'Explain' action */}
                {action.label === 'Explain' && (
                  <div style={{ height: '1px', backgroundColor: '#333', margin: '4px 16px' }} />
                )}
              </React.Fragment>
            ))
          )}
        </div>
      )}

      {isLoading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#aaa' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginBottom: '8px' }}>
            <Sparkles size={20} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>Thinking...</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', color: '#ef4444', fontSize: '14px', backgroundColor: '#3a1a1a', fontWeight: 500 }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ padding: '16px', maxHeight: '300px', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#f5f5f5' }}>
          {result}
        </div>
      )}
    </div>
  );
}
