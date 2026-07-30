import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EventBus } from '../../core/EventBus';

interface OverlayState {
  visible: boolean;
  x: number;
  y: number;
  fieldId: string | null;
  suggestion: string | null;
  confidence: number | null;
}

export const OverlayManager: React.FC = () => {
  const [state, setState] = useState<OverlayState>({
    visible: false,
    x: 0,
    y: 0,
    fieldId: null,
    suggestion: null,
    confidence: null,
  });

  useEffect(() => {
    // Listen for focus events bubbling up
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        const rect = target.getBoundingClientRect();
        
        setState(prev => ({
          ...prev,
          visible: true,
          x: rect.right + window.scrollX + 10,
          y: rect.top + window.scrollY,
          fieldId: target.id || null
        }));

        // Request prediction from Background Service Worker
        EventBus.send('FIELD_FOCUSED', {
          fieldId: target.id,
          label: target.getAttribute('aria-label') || target.getAttribute('name') || '',
          aliases: [] // Extracted by Fingerprinter normally
        }).catch(console.error);
      }
    };

    const handleFocusOut = () => {
      // Hide after a small delay to allow clicking on the overlay
      setTimeout(() => {
        setState(prev => ({ ...prev, visible: false }));
      }, 200);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Listen for AI predictions returning from the Background Worker
    const unlisten = EventBus.listen('AI_PREDICTION_READY', (payload) => {
      if (payload.fieldId === state.fieldId) {
        setState(prev => ({
          ...prev,
          suggestion: payload.value,
          confidence: payload.confidence
        }));
      }
    });

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      unlisten();
    };
  }, [state.fieldId]);

  if (!state.visible) return null;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: state.y,
        left: state.x,
        zIndex: 2147483647,
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        padding: '6px 12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {state.suggestion ? (
        <>
          <span style={{ color: '#0f172a', fontWeight: 500 }}>{state.suggestion}</span>
          <span style={{ color: '#10b981', fontSize: '12px' }}>
            {Math.round((state.confidence || 0) * 100)}%
          </span>
          <button 
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              e.preventDefault();
              // Fill logic here (dispatch synthetic events)
            }}
          >
            Fill
          </button>
        </>
      ) : (
        <span style={{ color: '#64748b' }}>Searching...</span>
      )}
    </div>,
    document.body
  );
};
