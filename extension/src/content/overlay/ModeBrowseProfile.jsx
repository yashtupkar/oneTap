import React, { useState } from 'react';
import { Search, User, GraduationCap, MapPin, Briefcase, Fingerprint, Building2, FileText, Clock, Component } from 'lucide-react';

function getCategoryIcon(categoryName) {
  const name = (categoryName || '').toLowerCase();
  if (name.includes('personal')) return <User size={14} />;
  if (name.includes('education')) return <GraduationCap size={14} />;
  if (name.includes('address')) return <MapPin size={14} />;
  if (name.includes('employ') || name.includes('work')) return <Briefcase size={14} />;
  if (name.includes('identit')) return <Fingerprint size={14} />;
  if (name.includes('bank') || name.includes('card')) return <Building2 size={14} />;
  if (name.includes('file') || name.includes('document')) return <FileText size={14} />;
  if (name.includes('recent')) return <Clock size={14} />;
  return <Component size={14} />;
}

export function ModeBrowseProfile({ flattenedProfileData, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = (flattenedProfileData || []).filter(item => 
    (item.label || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.value && String(item.value).toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #374151' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '10px', top: '10px', color: '#9CA3AF' }}>
            <Search size={16} />
          </div>
          <input
            placeholder="Search saved data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              height: '36px', 
              paddingLeft: '32px', 
              paddingRight: '12px', 
              fontSize: '13px', 
              background: '#111827', 
              border: '1px solid #374151', 
              color: '#F9FAFB', 
              borderRadius: '8px', 
              width: '100%', 
              boxSizing: 'border-box',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
            onBlur={(e) => e.target.style.borderColor = '#374151'}
            autoFocus
          />
        </div>
      </div>
      
      {/* Scrollable list */}
      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {filteredData.map((opt, i) => (
          <div
            key={i}
            onClick={() => onSelect(opt.value)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px', 
              padding: '12px 16px', 
              cursor: 'pointer', 
              borderBottom: i === filteredData.length - 1 ? 'none' : '1px solid #374151',
              transition: 'background 150ms ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#374151'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#F9FAFB', fontSize: '13px', fontWeight: 500 }}>
                {opt.label}
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                fontSize: '10px', 
                color: '#9CA3AF', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                background: '#111827', 
                padding: '2px 6px', 
                borderRadius: '4px' 
              }}>
                {getCategoryIcon(opt.category)}
                {opt.category}
              </span>
            </div>
            <div style={{ 
              color: '#9CA3AF', 
              fontSize: '11px', 
              fontFamily: "'JetBrains Mono', 'SF Mono', monospace", 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {opt.isSensitive ? '••••••••' : opt.value}
            </div>
          </div>
        ))}
        {filteredData.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
            No saved data found.
          </div>
        )}
      </div>
    </div>
  );
}
