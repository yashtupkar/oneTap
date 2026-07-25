// import React, { useState } from 'react';

// export function GlobalFillButton({ onFillAll, onSaveAll, isLoading = false }) {
//   const [showHelp, setShowHelp] = useState(false);
//   const [hoveredBtn, setHoveredBtn] = useState(null);

//   const Tooltip = ({ text, show }) => (
//     <div style={{
//       position: 'absolute',
//       right: '100%',
//       marginRight: '14px',
//       background: '#2e3248',
//       color: 'white',
//       padding: '6px 12px',
//       borderRadius: '8px',
//       fontSize: '13px',
//       fontWeight: '500',
//       pointerEvents: 'none',
//       whiteSpace: 'nowrap',
//       opacity: show ? 1 : 0,
//       transform: show ? 'translateX(0)' : 'translateX(10px)',
//       transition: 'all 0.2s ease',
//       boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
//       zIndex: 10,
//     }}>
//       {text}
//       <div style={{
//         position: 'absolute',
//         right: '-5px',
//         top: '50%',
//         transform: 'translateY(-50%)',
//         borderTop: '5px solid transparent',
//         borderBottom: '5px solid transparent',
//         borderLeft: '5px solid #2e3248',
//       }} />
//     </div>
//   );

//   return (
//     <div
//       className="ai-af-right-sidebar"
//       style={{
//         position: 'fixed',
//         top: '50%',
//         right: 0,
//         transform: 'translateY(-50%)',
//         zIndex: 2147483640,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'flex-end',
//         gap: '12px',
//         fontFamily: "'Inter', system-ui, sans-serif",
//       }}
//     >
//       {/* Main Action Panel (Half-pill shape) */}
//       <div
//         style={{
//           background: '#1a1d27',
//           border: '1px solid #2e3248',
//           borderRight: 'none',
//           borderRadius: '24px 0 0 24px',
//           padding: '12px 8px 12px 12px',
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '16px',
//           boxShadow: '-4px 4px 20px rgba(0,0,0,0.5)',
//         }}
//       >
//         {/* Auto-fill Button */}
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//           <button
//             onClick={isLoading ? undefined : onFillAll}
//             onMouseEnter={() => setHoveredBtn('fill')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '40px',
//               height: '40px',
//               borderRadius: '50%',
//               background: isLoading ? '#64748b' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
//               color: 'white',
//               border: 'none',
//               boxShadow: isLoading ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.4)',
//               cursor: isLoading ? 'wait' : 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '20px',
//               transition: 'all 0.2s ease',
//               opacity: isLoading ? 0.7 : 1,
//             }}
//             onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1.1)'; }}
//             onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.transform = 'scale(1)'; }}
//           >
//             {isLoading ? '⏳' : <img src={chrome.runtime.getURL('icons/icon32.png')} alt="OneTap" style={{ width: '24px', height: '24px' }} />}
//           </button>
//           <Tooltip text={isLoading ? "Analyzing..." : "Auto-fill Form"} show={hoveredBtn === 'fill'} />
//         </div>

//         {/* Save Button */}
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//           <button
//             onClick={onSaveAll}
//             onMouseEnter={() => setHoveredBtn('save')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '40px',
//               height: '40px',
//               borderRadius: '50%',
//               background: '#2e3248',
//               color: 'white',
//               border: '1px solid #4e52e8',
//               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '18px',
//               transition: 'all 0.2s ease',
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#363a54'; e.currentTarget.style.transform = 'scale(1.1)'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.transform = 'scale(1)'; }}
//           >
//             💾
//           </button>
//           <Tooltip text="Save New Fields" show={hoveredBtn === 'save'} />
//         </div>
//       </div>

//       {/* Settings & Help Buttons Container */}
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '12px' }}>
        
//         {/* Settings Button */}
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <button
//             onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
//             onMouseEnter={() => setHoveredBtn('settings')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '32px',
//               height: '32px',
//               borderRadius: '50%',
//               background: '#1a1d27',
//               color: '#94a3b8',
//               border: '1px solid #2e3248',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '16px',
//               transition: 'all 0.2s ease',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#fff'; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = '#1a1d27'; e.currentTarget.style.color = '#94a3b8'; }}
//           >
//             ⚙️
//           </button>
//           <Tooltip text="Settings" show={hoveredBtn === 'settings'} />
//         </div>

//         {/* Help Button */}
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <button
//             onClick={() => setShowHelp(!showHelp)}
//             onMouseEnter={() => setHoveredBtn('help')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '32px',
//               height: '32px',
//               borderRadius: '50%',
//               background: showHelp ? '#4e52e8' : '#1a1d27',
//               color: showHelp ? '#fff' : '#94a3b8',
//               border: '1px solid #2e3248',
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '14px',
//               transition: 'all 0.2s ease',
//               boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
//             }}
//             onMouseOver={(e) => { if(!showHelp) { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#fff'; } }}
//             onMouseOut={(e) => { if(!showHelp) { e.currentTarget.style.background = '#1a1d27'; e.currentTarget.style.color = '#94a3b8'; } }}
//           >
//             ❓
//           </button>
//           <Tooltip text="How it works" show={hoveredBtn === 'help' && !showHelp} />
//         </div>

//       </div>

//       {/* Help Popup / Widget Details */}
//       {showHelp && (
//         <div
//           style={{
//             position: 'absolute',
//             right: '60px',
//             bottom: '0',
//             background: '#1a1d27',
//             border: '1px solid #2e3248',
//             borderRadius: '16px',
//             padding: '20px',
//             width: '300px',
//             boxShadow: '-4px 12px 40px rgba(0,0,0,0.5)',
//             color: '#e2e8f0',
//             animation: 'ai-af-fade-in 0.2s ease-out',
//           }}
//         >
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//             <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <span>✨</span> How OneTap Works
//             </h3>
//             <button
//               onClick={() => setShowHelp(false)}
//               style={{
//                 background: 'transparent',
//                 border: 'none',
//                 color: '#6b7280',
//                 cursor: 'pointer',
//                 fontSize: '18px',
//                 padding: '4px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 width: '28px',
//                 height: '28px',
//                 borderRadius: '50%',
//                 transition: 'all 0.2s',
//               }}
//               onMouseEnter={(e) => { e.currentTarget.style.background = '#2e3248'; e.currentTarget.style.color = '#e2e8f0'; }}
//               onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
//             >
//               ×
//             </button>
//           </div>
//           <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: '1.5' }}>
//             <li><strong style={{ color: '#e2e8f0' }}>Auto-fill:</strong> Fields with matching data are filled automatically.</li>
//             <li><strong style={{ color: '#e2e8f0' }}>Review & Edit:</strong> Click the badge next to any field to edit the value.</li>
//             <li><strong style={{ color: '#e2e8f0' }}>Save New Data:</strong> Simply submit the form! New fields will be saved automatically.</li>
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }
// import React, { useState } from 'react';

// /* ------------------------------------------------------------------ */
// /* Design tokens — shared with FieldOverlay for a consistent system    */
// /* ------------------------------------------------------------------ */
// const ZINC = {
//   900: '#18181b',
//   800: '#27272a',
//   700: '#3f3f46',
//   600: '#52525b',
//   500: '#71717a',
//   400: '#a1a1aa',
//   300: '#d4d4d8',
//   200: '#e4e4e7',
//   100: '#f4f4f5',
// };

// const ACCENT = '#6366f1';
// const FONT = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";

// export function GlobalFillButton({ onFillAll, isLoading = false }) {
//   const [showHelp, setShowHelp] = useState(false);
//   const [hoveredBtn, setHoveredBtn] = useState(null);

//   const Tooltip = ({ text, show }) => (
//     <div style={{
//       position: 'absolute',
//       right: '100%',
//       marginRight: '10px',
//       background: ZINC[700],
//       color: ZINC[100],
//       padding: '4px 9px',
//       borderRadius: '5px',
//       fontSize: '11px',
//       fontWeight: 500,
//       pointerEvents: 'none',
//       whiteSpace: 'nowrap',
//       opacity: show ? 1 : 0,
//       transform: show ? 'translateX(0)' : 'translateX(6px)',
//       transition: 'all 0.15s ease',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
//       zIndex: 10,
//     }}>
//       {text}
//       <div style={{
//         position: 'absolute',
//         right: '-4px',
//         top: '50%',
//         transform: 'translateY(-50%)',
//         borderTop: '4px solid transparent',
//         borderBottom: '4px solid transparent',
//         borderLeft: `4px solid ${ZINC[700]}`,
//       }} />
//     </div>
//   );

//   return (
//     <div
//       className="onetap-right-sidebar"
//       style={{
//         position: 'fixed',
//         top: '50%',
//         right: 0,
//         transform: 'translateY(-50%)',
//         zIndex: 2147483640,
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'flex-end',
//         gap: '8px',
//         fontFamily: FONT,
//       }}
//     >
//       {/* Main action panel */}
//       <div
//         style={{
//           background: ZINC[800],
//           border: `1px solid ${ZINC[700]}`,
//           borderRight: 'none',
//           borderRadius: '12px 0 0 12px',
//           padding: '8px',
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '8px',
//           boxShadow: '-2px 2px 14px rgba(0,0,0,0.35)',
//         }}
//       >
//         {/* Auto-fill button */}
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//           <button
//             onClick={isLoading ? undefined : onFillAll}
//             onMouseEnter={() => setHoveredBtn('fill')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '32px',
//               height: '32px',
//               borderRadius: '8px',
//               background: isLoading ? ZINC[600] : ACCENT,
//               color: '#fff',
//               border: 'none',
//               boxShadow: isLoading ? 'none' : `0 2px 8px rgba(99,102,241,0.35)`,
//               cursor: isLoading ? 'wait' : 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '15px',
//               transition: 'all 0.15s ease',
//               opacity: isLoading ? 0.7 : 1,
//             }}
//             onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
//             onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; }}
//           >
//             {isLoading ? '⏳' : <img src={chrome.runtime.getURL('icons/icon32.png')} alt="OneTap" style={{ width: '18px', height: '18px' }} />}
//           </button>
//           <Tooltip text={isLoading ? 'Analyzing…' : 'Auto-fill form'} show={hoveredBtn === 'fill'} />
//         </div>
//       </div>

//       {/* Settings & help */}
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginRight: '8px' }}>
//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <button
//             onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
//             onMouseEnter={() => setHoveredBtn('settings')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '26px',
//               height: '26px',
//               borderRadius: '7px',
//               background: ZINC[800],
//               color: ZINC[400],
//               border: `1px solid ${ZINC[700]}`,
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '12px',
//               transition: 'all 0.15s ease',
//               boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
//             }}
//             onMouseOver={(e) => { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; }}
//             onMouseOut={(e) => { e.currentTarget.style.background = ZINC[800]; e.currentTarget.style.color = ZINC[400]; }}
//           >
//             ⚙️
//           </button>
//           <Tooltip text="Settings" show={hoveredBtn === 'settings'} />
//         </div>

//         <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//           <button
//             onClick={() => setShowHelp(!showHelp)}
//             onMouseEnter={() => setHoveredBtn('help')}
//             onMouseLeave={() => setHoveredBtn(null)}
//             style={{
//               width: '26px',
//               height: '26px',
//               borderRadius: '7px',
//               background: showHelp ? ACCENT : ZINC[800],
//               color: showHelp ? '#fff' : ZINC[400],
//               border: `1px solid ${showHelp ? ACCENT : ZINC[700]}`,
//               cursor: 'pointer',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               fontSize: '11px',
//               transition: 'all 0.15s ease',
//               boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
//             }}
//             onMouseOver={(e) => { if (!showHelp) { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; } }}
//             onMouseOut={(e) => { if (!showHelp) { e.currentTarget.style.background = ZINC[800]; e.currentTarget.style.color = ZINC[400]; } }}
//           >
//             ❓
//           </button>
//           <Tooltip text="How it works" show={hoveredBtn === 'help' && !showHelp} />
//         </div>
//       </div>

//       {/* Help popup */}
//       {showHelp && (
//         <div
//           style={{
//             position: 'absolute',
//             right: '46px',
//             bottom: '0',
//             background: ZINC[800],
//             border: `1px solid ${ZINC[700]}`,
//             borderRadius: '8px',
//             padding: '0',
//             width: '250px',
//             boxShadow: '-2px 8px 28px rgba(0,0,0,0.45)',
//             color: ZINC[200],
//             animation: 'onetap-fade-in 0.15s ease-out',
//             overflow: 'hidden',
//           }}
//         >
//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               padding: '10px 11px',
//               borderBottom: `1px solid ${ZINC[700]}`,
//             }}
//           >
//             <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: ZINC[100] }}>
//               ✨ How OneTap works
//             </h3>
//             <button
//               onClick={() => setShowHelp(false)}
//               style={{
//                 background: 'transparent',
//                 border: 'none',
//                 color: ZINC[500],
//                 cursor: 'pointer',
//                 fontSize: '15px',
//                 lineHeight: 1,
//                 padding: '3px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 width: '20px',
//                 height: '20px',
//                 borderRadius: '5px',
//                 transition: 'all 0.15s',
//               }}
//               onMouseEnter={(e) => { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; }}
//               onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ZINC[500]; }}
//             >
//               ×
//             </button>
//           </div>
//           <ul style={{ margin: 0, padding: '10px 11px', listStyle: 'none', fontSize: '11.5px', color: ZINC[400], display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
//             <li><strong style={{ color: ZINC[100] }}>Auto-fill —</strong> fields with matching data are filled automatically.</li>
//             <li><strong style={{ color: ZINC[100] }}>Review & edit —</strong> click the badge next to any field to change its value.</li>
//             <li><strong style={{ color: ZINC[100] }}>Save new data —</strong> submit the form and new fields save automatically.</li>
//           </ul>
//           <div style={{ padding: '5px 11px 7px', borderTop: `1px solid ${ZINC[700]}`, textAlign: 'center' }}>
//             <span style={{ color: ZINC[600], fontSize: '8.5px', letterSpacing: '0.03em' }}>OneTap</span>
//           </div>
//         </div>
//       )}

//       <style>{`
//         @keyframes onetap-fade-in {
//           from { opacity: 0; transform: translateY(4px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//       `}</style>
//     </div>
//   );
// }

import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/* Design tokens — shared with FieldOverlay for a consistent system    */
/* ------------------------------------------------------------------ */
const ZINC = {
  900: '#18181b',
  800: '#27272a',
  700: '#3f3f46',
  600: '#52525b',
  500: '#71717a',
  400: '#a1a1aa',
  300: '#d4d4d8',
  200: '#e4e4e7',
  100: '#f4f4f5',
};

const ACCENT = '#6366f1';
const FONT = "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const EDGE_MARGIN = 12; // keep the panel fully on-screen top/bottom

export function GlobalFillButton({ onFillAll, isLoading = false }) {
  const [showHelp, setShowHelp] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // top position in px; initialised to vertical center once mounted
  const [top, setTop] = useState(null);
  const containerRef = useRef(null);
  const dragState = useRef({ startY: 0, startTop: 0 });

  useEffect(() => {
    if (top === null) {
      const h = containerRef.current?.offsetHeight || 160;
      setTop(window.innerHeight / 2 - h / 2);
    }
  }, [top]);

  const clampTop = useCallback((value) => {
    const h = containerRef.current?.offsetHeight || 0;
    const max = window.innerHeight - h - EDGE_MARGIN;
    return Math.min(Math.max(value, EDGE_MARGIN), Math.max(max, EDGE_MARGIN));
  }, []);

  const handleDragStart = (e) => {
    e.preventDefault();
    dragState.current = { startY: e.clientY, startTop: top ?? 0 };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      const delta = e.clientY - dragState.current.startY;
      setTop(clampTop(dragState.current.startTop + delta));
    };
    const handleUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = prevUserSelect;
    };
  }, [isDragging, clampTop]);

  // re-clamp on viewport resize so the panel never ends up off-screen
  useEffect(() => {
    const handleResize = () => setTop((t) => (t === null ? t : clampTop(t)));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampTop]);

  const Tooltip = ({ text, show }) => (
    <div style={{
      position: 'absolute',
      right: '100%',
      marginRight: '10px',
      background: ZINC[700],
      color: ZINC[100],
      padding: '4px 9px',
      borderRadius: '5px',
      fontSize: '11px',
      fontWeight: 500,
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      opacity: show ? 1 : 0,
      transform: show ? 'translateX(0)' : 'translateX(6px)',
      transition: 'all 0.15s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      zIndex: 10,
    }}>
      {text}
      <div style={{
        position: 'absolute',
        right: '-4px',
        top: '50%',
        transform: 'translateY(-50%)',
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderLeft: `4px solid ${ZINC[700]}`,
      }} />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="onetap-right-sidebar"
      style={{
        position: 'fixed',
        top: top === null ? '50%' : `${top}px`,
        transform: top === null ? 'translateY(-50%)' : 'none',
        right: 0,
        zIndex: 2147483640,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        fontFamily: FONT,
      }}
    >
      {/* Main action panel */}
      <div
        style={{
          background: ZINC[800],
          border: `1px solid ${ZINC[700]}`,
          borderRight: 'none',
          borderRadius: '12px 0 0 12px',
          padding: '6px 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          boxShadow: isDragging ? '-2px 2px 20px rgba(0,0,0,0.5)' : '-2px 2px 14px rgba(0,0,0,0.35)',
        }}
      >
        {/* Drag handle — vertical movement along the edge only */}
        <div
          onMouseDown={handleDragStart}
          title="Drag to reposition"
          style={{
            width: '28px',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            borderRadius: '4px',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = ZINC[700]; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ display: 'flex', gap: '3px' }}>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: ZINC[500] }} />
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: ZINC[500] }} />
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: ZINC[500] }} />
          </div>
        </div>

        {/* Auto-fill button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={isLoading ? undefined : onFillAll}
            onMouseEnter={() => setHoveredBtn('fill')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isLoading ? ZINC[600] : ACCENT,
              color: '#fff',
              border: 'none',
              boxShadow: isLoading ? 'none' : `0 2px 8px rgba(99,102,241,0.35)`,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              transition: 'all 0.15s ease',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            {isLoading ? '⏳' : <img src={chrome.runtime.getURL('icons/icon32.png')} alt="OneTap" style={{ width: '18px', height: '18px' }} />}
          </button>
          <Tooltip text={isLoading ? 'Analyzing…' : 'Auto-fill form'} show={hoveredBtn === 'fill'} />
        </div>
      </div>

      {/* Settings & help */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginRight: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' })}
            onMouseEnter={() => setHoveredBtn('settings')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: ZINC[800],
              color: ZINC[400],
              border: `1px solid ${ZINC[700]}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; }}
            onMouseOut={(e) => { e.currentTarget.style.background = ZINC[800]; e.currentTarget.style.color = ZINC[400]; }}
          >
            ⚙️
          </button>
          <Tooltip text="Settings" show={hoveredBtn === 'settings'} />
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => setShowHelp(!showHelp)}
            onMouseEnter={() => setHoveredBtn('help')}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              background: showHelp ? ACCENT : ZINC[800],
              color: showHelp ? '#fff' : ZINC[400],
              border: `1px solid ${showHelp ? ACCENT : ZINC[700]}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
            onMouseOver={(e) => { if (!showHelp) { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; } }}
            onMouseOut={(e) => { if (!showHelp) { e.currentTarget.style.background = ZINC[800]; e.currentTarget.style.color = ZINC[400]; } }}
          >
            ❓
          </button>
          <Tooltip text="How it works" show={hoveredBtn === 'help' && !showHelp} />
        </div>
      </div>

      {/* Help popup */}
      {showHelp && (
        <div
          style={{
            position: 'absolute',
            right: '46px',
            bottom: '0',
            background: ZINC[800],
            border: `1px solid ${ZINC[700]}`,
            borderRadius: '8px',
            padding: '0',
            width: '250px',
            boxShadow: '-2px 8px 28px rgba(0,0,0,0.45)',
            color: ZINC[200],
            animation: 'onetap-fade-in 0.15s ease-out',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 11px',
              borderBottom: `1px solid ${ZINC[700]}`,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: ZINC[100] }}>
              ✨ How OneTap works
            </h3>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: ZINC[500],
                cursor: 'pointer',
                fontSize: '15px',
                lineHeight: 1,
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '5px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = ZINC[700]; e.currentTarget.style.color = ZINC[100]; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ZINC[500]; }}
            >
              ×
            </button>
          </div>
          <ul style={{ margin: 0, padding: '10px 11px', listStyle: 'none', fontSize: '11.5px', color: ZINC[400], display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.5 }}>
            <li><strong style={{ color: ZINC[100] }}>Auto-fill —</strong> fields with matching data are filled automatically.</li>
            <li><strong style={{ color: ZINC[100] }}>Review & edit —</strong> click the badge next to any field to change its value.</li>
            <li><strong style={{ color: ZINC[100] }}>Save new data —</strong> submit the form and new fields save automatically.</li>
          </ul>
          <div style={{ padding: '5px 11px 7px', borderTop: `1px solid ${ZINC[700]}`, textAlign: 'center' }}>
            <span style={{ color: ZINC[600], fontSize: '8.5px', letterSpacing: '0.03em' }}>OneTap</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes onetap-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}