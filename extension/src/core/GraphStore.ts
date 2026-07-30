import {
  Profile,
  EntityType,
  PropertySchema,
  RelationshipSchema,
  Entity,
  PropertyValue,
  Relationship
} from './schema';

const DB_NAME = 'oneTap_GraphStore';
const DB_VERSION = 3;

export class GraphStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create Object Stores for Normalized Tables
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entityTypes')) {
          db.createObjectStore('entityTypes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('propertySchemas')) {
          const store = db.createObjectStore('propertySchemas', { keyPath: 'id' });
          store.createIndex('by_typeId', 'typeId', { unique: false });
        }
        if (!db.objectStoreNames.contains('relationshipSchemas')) {
          db.createObjectStore('relationshipSchemas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entities')) {
          const store = db.createObjectStore('entities', { keyPath: 'id' });
          store.createIndex('by_profileId', 'profileId', { unique: false });
          store.createIndex('by_typeId', 'typeId', { unique: false });
        }
        if (!db.objectStoreNames.contains('propertyValues')) {
          const store = db.createObjectStore('propertyValues', { keyPath: 'id' });
          store.createIndex('by_entityId', 'entityId', { unique: false });
        }
        if (!db.objectStoreNames.contains('relationships')) {
          const store = db.createObjectStore('relationships', { keyPath: 'id' });
          store.createIndex('by_source', 'sourceEntityId', { unique: false });
          store.createIndex('by_target', 'targetEntityId', { unique: false });
        }
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'id' });
          store.createIndex('by_profileId', 'profileId', { unique: false });
        }
        if (!db.objectStoreNames.contains('feedback_history')) {
          const store = db.createObjectStore('feedback_history', { keyPath: 'id' });
          store.createIndex('by_profileId', 'profileId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[GraphStore] IndexedDB error:', event);
        reject('Could not open IndexedDB');
      };
    });
  }

  // Generic helper for putting data
  async put<T>(storeName: string, item: T): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Generic helper for getting data by ID
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }

  // Generic helper for getting all items in a store
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  // Generic helper for querying by index
  async getByIndex<T>(storeName: string, indexName: string, key: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(key);
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }
}

// Export a singleton instance
export const graphStore = new GraphStore();
