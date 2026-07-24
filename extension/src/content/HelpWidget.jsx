import React, { useState } from 'react';

export function HelpWidget() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="ai-af-help-widget"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 2147483646,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: '#1a1d27',
            border: '1px solid #4e52e8',
            borderRadius: '24px',
            padding: '8px 16px',
            color: '#e2e8f0',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#22263a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1a1d27'; }}
        >
          <span>✨</span> OneTap Active
        </button>
      ) : (
        <div
          style={{
            background: '#1a1d27',
            border: '1px solid #2e3248',
            borderRadius: '12px',
            padding: '16px',
            width: '280px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            color: '#e2e8f0',
            animation: 'ai-af-slide-up 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✨</span> How OneTap Works
            </h3>
            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2e3248'; color = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; color = '#6b7280'; }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong style={{ color: '#e2e8f0' }}>Auto-fill:</strong> Fields with matching data are filled automatically.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Review & Edit:</strong> Click the badge next to any field to edit the value.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Save New Data:</strong> Simply submit the form! New fields will be saved automatically.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
