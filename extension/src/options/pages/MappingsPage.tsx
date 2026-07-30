import React, { useState, useEffect } from 'react';
import { graphStore } from '../../core/GraphStore';
import { FeedbackEvent } from '../../background/learning/LearningEngine';
import { PropertySchema } from '../../core/schema';

export default function MappingsPage() {
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackEvent[]>([]);
  const [schemas, setSchemas] = useState<PropertySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      setLoading(true);
      await graphStore.init();
      
      const allFeedback = await graphStore.getAll<FeedbackEvent>('feedback_history');
      const allSchemas = await graphStore.getAll<PropertySchema>('propertySchemas');
      
      setFeedbackHistory(allFeedback.sort((a, b) => b.timestamp - a.timestamp));
      setSchemas(allSchemas);
    } catch (err: any) {
      setError('Failed to load mappings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this learned association?')) return;

    try {
      const db = (graphStore as any).db as IDBDatabase;
      const tx = db.transaction('feedback_history', 'readwrite');
      const store = tx.objectStore('feedback_history');
      store.delete(id);
      
      tx.oncomplete = () => {
        setFeedbackHistory(prev => prev.filter(m => m.id !== id));
      };
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getSchemaLabel = (schemaId: string) => {
    const schema = schemas.find(s => s.id === schemaId);
    return schema ? schema.label : 'Unknown Property';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-primary-500">
        <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-100 font-sans">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Learned Mappings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Review field associations the Rule Engine has learned from your manual corrections.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {feedbackHistory.length === 0 ? (
        <div className="bg-surface-card border border-surface-border border-dashed rounded-2xl text-center py-16 text-gray-500 flex flex-col items-center">
          <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 text-3xl">
            🧠
          </div>
          <p className="font-medium text-gray-300">No mappings learned yet.</p>
          <p className="text-xs text-gray-500 mt-1 max-w-[250px]">Correct the AI when it fills a field wrong, and it will learn your preference here.</p>
        </div>
      ) : (
        <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-elevated border-b border-surface-border text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Website</th>
                  <th className="p-4">Form Context</th>
                  <th className="p-4">Learned Rule</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-sm">
                {feedbackHistory.map(feedback => {
                  let contextPreview = 'Unknown';
                  try {
                    const ctx = JSON.parse(feedback.formContext);
                    contextPreview = ctx.id || ctx.name || 'Unnamed Field';
                  } catch(e) {}

                  return (
                    <tr key={feedback.id} className="hover:bg-surface-elevated/40 transition-colors">
                      {/* Website */}
                      <td className="p-4 font-medium text-gray-200">
                        {feedback.website}
                      </td>

                      {/* Context */}
                      <td className="p-4 text-gray-400">
                        <div className="truncate max-w-[200px] text-xs font-mono bg-surface p-1.5 rounded border border-surface-border inline-block">
                          {contextPreview}
                        </div>
                      </td>

                      {/* Learned Rule */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 line-through text-xs bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            {feedback.rejectedMappingId ? getSchemaLabel(feedback.rejectedMappingId) : 'Empty'}
                          </span>
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-emerald-400 font-medium text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                            {getSchemaLabel(feedback.acceptedMappingId)}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{feedback.reason}</div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-gray-500">
                        {new Date(feedback.timestamp).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20"
                          title="Delete learned association"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
