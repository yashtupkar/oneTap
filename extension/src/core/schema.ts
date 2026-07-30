/**
 * oneTap v2 Hybrid Data Model Schema
 * 
 * Represents the normalized relational tables that will be stored in IndexedDB.
 * These tables are reconstructed into an in-memory graph by the Background Worker.
 */

// Represents an isolated sandbox (e.g., Personal vs Work)
export interface Profile {
  id: string; // UUID
  name: string; // 'Personal', 'Professional'
  createdAt: number;
  updatedAt: number;
}

// Defines a type of entity (e.g., 'Company', 'Education')
export interface EntityType {
  id: string; // UUID
  name: string;
  icon: string;
  createdAt: number;
}

// Defines the properties an EntityType can have
export interface PropertySchema {
  id: string; // UUID
  typeId: string; // FK -> EntityType.id
  label: string;
  aliases: string[]; // Crucial for the Alias Engine
  type: 'Text' | 'Number' | 'Date' | 'Currency' | 'Boolean' | 'Select';
  isComputed: boolean;
  formula?: string; // If computed
  isSensitive: boolean;
  createdAt: number;
}

// Defines how EntityTypes can relate (e.g., 'Employment' BELONGS_TO 'Company')
export interface RelationshipSchema {
  id: string; // UUID
  sourceTypeId: string; // FK -> EntityType.id
  targetTypeId: string; // FK -> EntityType.id
  relationshipType: 'BELONGS_TO' | 'LOCATED_IN' | 'USES_SKILL';
}

// An actual instance of an EntityType
export interface Entity {
  id: string; // UUID
  typeId: string; // FK -> EntityType.id
  profileId: string; // FK -> Profile.id
  createdAt: number;
  updatedAt: number;
}

// The actual values for an Entity's properties
export interface PropertyValue {
  id: string; // UUID
  entityId: string; // FK -> Entity.id
  propertySchemaId: string; // FK -> PropertySchema.id
  value: string; // Plaintext (or Ciphertext if sensitive and encrypted)
  metadata: {
    confidence?: number;
    visibility?: 'public' | 'private';
  };
  updatedAt: number;
}

// Connects two actual entities
export interface Relationship {
  id: string; // UUID
  sourceEntityId: string; // FK -> Entity.id
  targetEntityId: string; // FK -> Entity.id
  relationshipSchemaId: string; // FK -> RelationshipSchema.id
  createdAt: number;
}
