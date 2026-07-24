import React from 'react';

export function GlobalFillButton({ onFillAll, onSaveAll }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2147483640,
      display: 'flex',
      gap: '12px',
    }}>
      <button
        onClick={onSaveAll}
        style={{
          padding: '12px 20px',
          borderRadius: '30px',
          background: '#2e3248',
          color: 'white',
          border: '1px solid #4e52e8',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.background = '#363a54';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#2e3248';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
      >
        <span style={{ fontSize: '16px' }}>💾</span>
        Save New Fields
      </button>

      <button
        onClick={onFillAll}
        style={{
          padding: '12px 24px',
          borderRadius: '30px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          fontFamily: "'Inter', system-ui, sans-serif",
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(99, 102, 241, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.4)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
      >
        <span style={{ fontSize: '18px' }}>✨</span>
        Auto-fill Form
      </button>
    </div>
  );
}
