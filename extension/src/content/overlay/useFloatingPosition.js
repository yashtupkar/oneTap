import { useState, useEffect } from 'react';

/**
 * Calculates smart floating position for a popup.
 *
 * @param {DOMRect} rect - Bounding rect of the target input element.
 * @param {boolean} expanded - Whether the popup is open.
 * @param {number} popupWidth - Expected width of the popup.
 * @param {number} estimatedHeight - Expected max height of the popup.
 * @returns {object} - CSS styles for the popup container.
 */
export function useFloatingPosition(rect, expanded, popupWidth = 280, estimatedHeight = 350) {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!expanded || !rect) return;

    const updatePosition = () => {
      const vHeight = window.innerHeight;
      
      const spaceBelow = vHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top = 0;
      let left = 0;
      let transformOrigin = 'top right';
      
      // Align to the right edge of the input by default
      left = rect.right + window.scrollX - popupWidth;
      
      // If it overflows left side of window, align it to the left edge of the screen + padding
      if (left < window.scrollX + 8) {
        left = window.scrollX + 8;
        transformOrigin = 'top left';
      }

      // Vertical positioning
      if (spaceBelow >= estimatedHeight + 16 || spaceBelow > spaceAbove) {
        // Place below the input
        top = rect.bottom + window.scrollY + 8;
      } else {
        // Place above the input
        top = rect.top + window.scrollY - estimatedHeight - 8;
        transformOrigin = 'bottom right';
      }
      
      setStyle({
        position: 'absolute',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popupWidth}px`,
        zIndex: 2147483641,
        transformOrigin
      });
    };

    updatePosition();
    
    // We also bind scroll/resize internally just in case index.jsx's event doesn't fire fast enough
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [rect, expanded, popupWidth, estimatedHeight]);

  return style;
}
