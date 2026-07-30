import React, { useState } from 'react';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  
  // Mock results for UI display
  const results = query ? [
    { type: 'Skill', title: 'React JS', context: 'Used in 3 projects' },
    { type: 'Document', title: 'Frontend Resume v3', context: 'Last updated 2 days ago' },
    { type: 'Experience', title: 'Senior Developer at Microsoft', context: '2021 - Present' },
  ] : [];

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="p-4 border-b border-surface-border bg-surface-card sticky top-0">
        <div className="relative group">
          <svg className="w-5 h-5 absolute left-3.5 top-3 text-gray-500 group-focus-within:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm"
            placeholder="Search profiles, documents, skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {query === '' ? (
          <div className="text-center text-gray-500 mt-12 text-sm flex flex-col items-center">
            <svg className="w-12 h-12 mb-4 text-surface-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Search across your entire Personal Knowledge Graph.</p>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              <span className="px-3 py-1.5 bg-surface-elevated border border-surface-border text-gray-400 rounded-lg text-xs cursor-pointer hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/30 transition-colors" onClick={() => setQuery('resume')}>resume</span>
              <span className="px-3 py-1.5 bg-surface-elevated border border-surface-border text-gray-400 rounded-lg text-xs cursor-pointer hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/30 transition-colors" onClick={() => setQuery('address')}>address</span>
              <span className="px-3 py-1.5 bg-surface-elevated border border-surface-border text-gray-400 rounded-lg text-xs cursor-pointer hover:bg-primary-500/10 hover:text-primary-400 hover:border-primary-500/30 transition-colors" onClick={() => setQuery('github')}>github</span>
            </div>
          </div>
        ) : results.length > 0 ? (
          <ul className="space-y-2">
            {results.map((res, i) => (
              <li key={i} className="p-3 bg-surface-card border border-surface-border hover:border-primary-500/50 rounded-xl cursor-pointer flex flex-col group transition-all">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-200 text-sm group-hover:text-primary-400 transition-colors">{res.title}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-surface-elevated px-2 py-0.5 rounded">{res.type}</span>
                </div>
                <span className="text-xs text-gray-500 mt-1">{res.context}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-gray-500 mt-12 text-sm">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};
