import React, { useState, useEffect } from 'react';
import { EventBus } from '../../core/EventBus';

export const AutofillDashboard: React.FC = () => {
  const [formContext, setFormContext] = useState<any>(null);

  useEffect(() => {
    // Listen for form context updates from the background
    const unlisten = EventBus.listen('FORM_DETECTED', (payload) => {
      setFormContext(payload);
    });
    return () => unlisten();
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface p-4 space-y-6">
      {!formContext ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-medium text-gray-300">No active form detected</p>
          <p className="text-xs mt-1 text-gray-500 text-center max-w-[200px]">Navigate to a page with a form to begin autofilling</p>
        </div>
      ) : (
        <>
          <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-lg text-white">Job Application Detected</h2>
            <p className="text-sm text-primary-400 mt-1 truncate">{new URL(formContext.url).hostname}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-surface-elevated p-4 rounded-xl border border-surface-border text-center">
                <div className="text-3xl font-bold text-white">{formContext.fieldsCount}</div>
                <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mt-1">Total Fields</div>
              </div>
              <div className="bg-status-filled/10 border border-status-filled/20 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-status-filled">14</div>
                <div className="text-[10px] text-status-filled uppercase font-semibold tracking-wider mt-1">Ready to Fill</div>
              </div>
            </div>

            <button className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-lg shadow-primary-500/20">
              Fill All Ready Fields
            </button>
          </div>

          <div>
            <h3 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider pl-1">Missing Information</h3>
            <div className="bg-status-suggested/5 border border-status-suggested/20 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center bg-surface-elevated p-3 border border-surface-border rounded-xl text-sm shadow-sm">
                <span className="font-medium text-gray-200">Notice Period</span>
                <button className="text-primary-400 font-medium hover:text-primary-300 hover:underline">Provide</button>
              </div>
              <div className="flex justify-between items-center bg-surface-elevated p-3 border border-surface-border rounded-xl text-sm shadow-sm">
                <span className="font-medium text-gray-200">Expected CTC</span>
                <button className="text-primary-400 font-medium hover:text-primary-300 hover:underline">Provide</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
