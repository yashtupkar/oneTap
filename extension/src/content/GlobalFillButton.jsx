import React, { useState } from 'react';

export function GlobalFillButton({ onFillAll, onSaveAll, isLoading = false }) {
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const Tooltip = ({ text, show }) => (
    <div style={{
      position: 'absolute',
      right: '100%',
      marginRight: '14px',
      background: '#2e3248',
      color: 'white',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      opacity: show ? 1 : 0,
      transform: show ? 'translateX(0)' : 'translateX(10px)',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 10,
    }}>
      {text}
      <div style={{
        position: 'absolute',
        right: '-5px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: '5px solid #2e3248',
      }} />
    </div>
  );

  return (
    <div
      className="ai-af-right-sidebar"
      style={{
        position: 'fixed',
        top: '50%',
        right: 0,
        transform: 'translateY(-50%)',
        zIndex: 2147483640,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Main Action Panel (Half-pill shape) */}
      <div
        style={{
          background: '#1a1d27',
          border: '1px solid #2e3248',
          borderRight: 'none',
          borderRadius: '24px 0 0 24px',
          padding: '12px 8px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '-4px 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Auto-fill Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={isLoading ? undefined : onFillAll}
            onMouseEnter={() => setHoveredBtn('fill')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isLoading ? '#64748b' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: 'white',
              border: 'none',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.4)',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              transition: 'all 0.2s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isLoading ? '⏳' : '✨'}
          </button>
          <Tooltip text={isLoading ? "Analyzing..." : "Auto-fill Form"} show={hoveredBtn === 'fill'} />
        </div>

        {/* Save Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={onSaveAll}
            onMouseEnter={() => setHoveredBtn('save')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#2e3248',
              color: 'white',
              border: '1px solid #4e52e8',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#363a54'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            💾
          </button>
          <Tooltip text="Save New Fields" show={hoveredBtn === 'save'} />
        </div>
      </div>

      {/* Settings & Help Buttons Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '12px' }}>
        
        {/* Settings Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
            onMouseEnter={() => setHoveredBtn('settings')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#1a1d27',
              color: '#94a3b8',
              border: '1px solid #2e3248',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#1a1d27'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            ⚙️
          </button>
          <Tooltip text="Settings" show={hoveredBtn === 'settings'} />
        </div>

        {/* Help Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            onMouseEnter={() => setHoveredBtn('help')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: showHelp ? '#4e52e8' : '#1a1d27',
              color: showHelp ? '#fff' : '#94a3b8',
              border: '1px solid #2e3248',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
            onMouseOver={(e) => { if(!showHelp) { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#fff'; } }}
            onMouseOut={(e) => { if(!showHelp) { e.currentTarget.style.background = '#1a1d27'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            ❓
          </button>
          <Tooltip text="How it works" show={hoveredBtn === 'help' && !showHelp} />
        </div>

      </div>

      {/* Help Popup / Widget Details */}
      {showHelp && (
        <div
          style={{
            position: 'absolute',
            right: '60px',
            bottom: '0',
            background: '#1a1d27',
            border: '1px solid #2e3248',
            borderRadius: '16px',
            padding: '20px',
            width: '300px',
            boxShadow: '-4px 12px 40px rgba(0,0,0,0.5)',
            color: '#e2e8f0',
            animation: 'ai-af-fade-in 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✨</span> How OneTap Works
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
            >
              ×
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.5' }}>
            <li><strong style={{ color: '#e2e8f0' }}>Auto-fill:</strong> Fields with matching data are filled automatically.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Review & Edit:</strong> Click the badge next to any field to edit the value.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Save New Data:</strong> Simply submit the form! New fields will be saved automatically.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
