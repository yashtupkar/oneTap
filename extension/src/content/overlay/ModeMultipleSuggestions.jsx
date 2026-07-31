import React from 'react';

export function ModeMultipleSuggestions({ options, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div 
        style={{ 
          padding: '12px 16px', 
          fontSize: '11px', 
          fontWeight: 600, 
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid #374151'
        }}
      >
        Autofill Options
      </div>
      
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        {options.map((opt, i) => (
          <div
            key={i}
            onClick={() => onSelect(opt.value, opt)}
            style={{
              padding: '12px 16px',
              borderBottom: i === options.length - 1 ? 'none' : '1px solid #374151',
              cursor: 'pointer',
              transition: 'background 150ms ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#374151'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '13px', color: '#F9FAFB', fontWeight: 500 }}>
              {opt.label}
            </span>
            <span style={{ 
              fontSize: '11px', 
              color: '#9CA3AF',
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {opt.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
