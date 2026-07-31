import React from 'react';
import { Sparkles, Check, Plus } from 'lucide-react';

export function FieldChip({ status, onClick, expanded }) {
  let label = '✨';
  let bg = '#1F2937'; // Surface
  let color = '#3B82F6'; // Primary
  let border = '#374151'; // Border

  if (status === 'filled') {
    label = '✅';
    color = '#22C55E'; // Success
  } else if (status === 'save') {
    label = '📋';
    color = '#9CA3AF'; // Secondary
  }

  if (expanded) {
    bg = 'rgba(59, 130, 246, 0.1)'; // Primary tint
    border = '#3B82F6';
  }

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        height: '24px',
        padding: '0 8px',
        borderRadius: '12px',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: expanded ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'all 150ms ease',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        fontWeight: 500,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title="Click to manage autofill"
    >
     
      <span>{label}</span>
    </div>
  );
}
