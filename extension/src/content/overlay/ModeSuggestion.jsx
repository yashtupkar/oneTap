import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function ModeSuggestion({ suggestion, onApply, onBrowse }) {
  const confidence = suggestion?.confidence ? Math.round(suggestion.confidence * 100) : 0;
  const displayValue = suggestion?.isSensitive
    ? '••••••••'
    : suggestion?.value;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Suggested
        </span>
        {confidence > 0 && (
          <span style={{ fontSize: '10px', color: '#71717a' }}>
            {confidence}% Match
          </span>
        )}
      </div>

      {/* Clickable Value Box */}
      <div 
        onClick={onApply}
        style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '8px', 
          padding: '10px 12px',
          cursor: 'pointer',
          transition: 'border-color 150ms ease, background 150ms ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#3f3f46';
          e.currentTarget.style.background = '#18181b';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#27272a';
          e.currentTarget.style.background = '#09090b';
        }}
        title="Click to fill"
      >
        <span style={{
          fontSize: '13px',
          color: '#f4f4f5',
          fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {displayValue}
        </span>
        <Check size={14} color="#71717a" />
      </div>

      {/* Browse Action */}
      <div style={{ marginTop: '4px' }}>
        <button
          onClick={onBrowse}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            width: '100%',
            height: '28px',
            background: 'transparent',
            color: '#a1a1aa',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'color 150ms ease',
            borderRadius: '6px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = '#f4f4f5';
            e.currentTarget.style.background = '#27272a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = '#a1a1aa';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Browse profile
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
