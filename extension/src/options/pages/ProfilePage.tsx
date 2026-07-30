import React, { useState, useEffect } from 'react';
import { graphStore } from '../../core/GraphStore';
import { Profile, EntityType, PropertySchema, Entity, PropertyValue } from '../../core/schema';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [schemas, setSchemas] = useState<PropertySchema[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [values, setValues] = useState<PropertyValue[]>([]);

  // Local UI State for handling edits
  const [editValues, setEditValues] = useState<Record<string, string>>({}); // Keyed by `${entityId}_${schemaId}`
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    setLoading(true);
    await graphStore.init();
    
    // Load all structural graph nodes
    const allProfiles = await graphStore.getAll<Profile>('profiles');
    const allTypes = await graphStore.getAll<EntityType>('entityTypes');
    const allSchemas = await graphStore.getAll<PropertySchema>('propertySchemas');
    const allEntities = await graphStore.getAll<Entity>('entities');
    const allValues = await graphStore.getAll<PropertyValue>('propertyValues');

    // For options UI, we use the primary profile (or create one)
    let currentProfile = allProfiles[0];
    if (!currentProfile) {
      currentProfile = {
        id: crypto.randomUUID(),
        name: 'Personal',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await graphStore.put('profiles', currentProfile);
    }

    setProfile(currentProfile);
    setEntityTypes(allTypes);
    setSchemas(allSchemas);
    setEntities(allEntities.filter(e => e.profileId === currentProfile.id));
    setValues(allValues);

    // Initialize edit state
    const currentEdits: Record<string, string> = {};
    allValues.forEach(v => {
      currentEdits[`${v.entityId}_${v.propertySchemaId}`] = v.value;
    });
    setEditValues(currentEdits);

    if (allTypes.length > 0) {
      setExpandedSection(allTypes[0].id);
    }
    
    setLoading(false);
  };

  const handleValueChange = (entityId: string, schemaId: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [`${entityId}_${schemaId}`]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Find all modified values and update/create PropertyValue nodes
      for (const entity of entities) {
        const typeSchemas = schemas.filter(s => s.typeId === entity.typeId);
        
        for (const schema of typeSchemas) {
          const key = `${entity.id}_${schema.id}`;
          const newValue = editValues[key] || '';
          
          let existingValue = values.find(v => v.entityId === entity.id && v.propertySchemaId === schema.id);
          
          if (existingValue) {
            if (existingValue.value !== newValue) {
              existingValue.value = newValue;
              existingValue.updatedAt = Date.now();
              await graphStore.put('propertyValues', existingValue);
            }
          } else if (newValue) {
            const newVal: PropertyValue = {
              id: crypto.randomUUID(),
              entityId: entity.id,
              propertySchemaId: schema.id,
              value: newValue,
              metadata: { visibility: 'private' },
              updatedAt: Date.now()
            };
            await graphStore.put('propertyValues', newVal);
          }
        }
      }
      
      // Refresh local cache
      await loadGraph();
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  // Create an entirely new category (EntityType + Entity instance)
  const [newCatName, setNewCatName] = useState('');
  const handleCreateCategory = async () => {
    if (!newCatName || !profile) return;
    const typeId = crypto.randomUUID();
    
    const newType: EntityType = {
      id: typeId,
      name: newCatName,
      icon: '✨',
      createdAt: Date.now()
    };
    await graphStore.put('entityTypes', newType);

    const newEntity: Entity = {
      id: crypto.randomUUID(),
      typeId: typeId,
      profileId: profile.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await graphStore.put('entities', newEntity);
    
    setNewCatName('');
    await loadGraph();
    setExpandedSection(typeId);
  };

  // Create a new field (PropertySchema) for a specific EntityType
  const [newFieldState, setNewFieldState] = useState<Record<string, string>>({});
  const handleCreateField = async (typeId: string) => {
    const fieldName = newFieldState[typeId];
    if (!fieldName) return;

    const newSchema: PropertySchema = {
      id: crypto.randomUUID(),
      typeId: typeId,
      label: fieldName,
      aliases: [fieldName.toLowerCase()],
      type: 'Text',
      isComputed: false,
      isSensitive: false,
      createdAt: Date.now()
    };

    await graphStore.put('propertySchemas', newSchema);
    
    setNewFieldState(prev => ({ ...prev, [typeId]: '' }));
    await loadGraph();
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
    <div className="max-w-3xl mx-auto p-6 text-gray-100 font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Graph Profile</h2>
          <p className="text-sm text-gray-400 mt-1">Data is stored relationally in IndexedDB and stays on your device.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg shadow-primary-500/20 flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="space-y-4">
        {entityTypes.map(type => {
          // Find the entity instance for this profile
          const entity = entities.find(e => e.typeId === type.id);
          const typeSchemas = schemas.filter(s => s.typeId === type.id);
          const isExpanded = expandedSection === type.id;

          return (
            <div key={type.id} className="bg-surface-card border border-surface-border rounded-xl overflow-hidden transition-all shadow-sm">
              <button
                className="w-full flex items-center justify-between p-4 bg-surface-elevated hover:bg-surface-border/50 transition-colors"
                onClick={() => setExpandedSection(isExpanded ? null : type.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{type.icon}</span>
                  <span className="font-semibold text-white">{type.name}</span>
                  <span className="text-xs text-primary-400 font-medium bg-primary-500/10 px-2 py-0.5 rounded-full">
                    {typeSchemas.length} Fields
                  </span>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && entity && (
                <div className="p-5 border-t border-surface-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {typeSchemas.map(schema => {
                      const valKey = `${entity.id}_${schema.id}`;
                      return (
                        <div key={schema.id} className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{schema.label}</label>
                          <input
                            type={schema.isSensitive ? 'password' : 'text'}
                            className="bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                            value={editValues[valKey] || ''}
                            onChange={(e) => handleValueChange(entity.id, schema.id, e.target.value)}
                            placeholder={`Enter ${schema.label}`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Field UI */}
                  <div className="mt-6 pt-5 border-t border-surface-border flex gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                      placeholder="New Field Name (e.g. GitHub URL)"
                      value={newFieldState[type.id] || ''}
                      onChange={(e) => setNewFieldState(prev => ({ ...prev, [type.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateField(type.id)}
                    />
                    <button 
                      onClick={() => handleCreateField(type.id)}
                      className="bg-surface-elevated hover:bg-surface-border text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-surface-border"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Category UI */}
      <div className="mt-8 bg-surface-card border border-surface-border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-surface-elevated rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h3 className="text-white font-medium mb-1">Create New Category</h3>
        <p className="text-xs text-gray-400 mb-4">Add a new category (e.g. "Address", "Education") to organize your properties.</p>
        
        <div className="flex gap-2 w-full max-w-sm">
          <input
            type="text"
            className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2 text-sm text-white text-center focus:outline-none focus:border-primary-500"
            placeholder="Category Name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
          />
          <button 
            onClick={handleCreateCategory}
            className="bg-primary-500 hover:bg-primary-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
