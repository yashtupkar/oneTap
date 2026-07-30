import { graphStore } from '../../core/GraphStore';
import { profileManager } from '../../core/ProfileManager';
import { EntityType, Entity, PropertySchema, PropertyValue } from '../../core/schema';

export class MigrationScript {
  /**
   * Translates the v1 dynamic schema to the v2 normalized Hybrid Data Model.
   * Runs exactly once during the extension upgrade cycle.
   */
  async run() {
    const isMigrated = await new Promise(resolve => {
      chrome.storage.local.get('v2_migration_complete', (data) => {
        resolve(data.v2_migration_complete === true);
      });
    });

    if (isMigrated) {
      console.log('[Migration] V2 migration already complete. Skipping.');
      return;
    }

    console.log('[Migration] Starting V1 to V2 migration...');
    
    // Ensure ProfileManager has initialized a default profile
    if (!profileManager.getActiveProfileId()) {
      await profileManager.init();
    }
    const profileId = profileManager.getActiveProfileId()!;

    // 1. Fetch old data (simulated structure of v1)
    const oldData = await new Promise<any>(resolve => {
      chrome.storage.local.get('oneTap_profileData', (data) => {
        resolve(data.oneTap_profileData || {});
      });
    });

    if (Object.keys(oldData).length === 0) {
      console.log('[Migration] No legacy data found. Completing migration.');
      this.markComplete();
      return;
    }

    // 2. Create foundational Entity Types (e.g. 'Personal', 'Employment')
    const personalType: EntityType = { id: crypto.randomUUID(), name: 'Personal Information', icon: 'user', createdAt: Date.now() };
    await graphStore.put('entityTypes', personalType);

    // 3. Create Property Schemas
    const firstNameSchema: PropertySchema = { id: crypto.randomUUID(), typeId: personalType.id, label: 'First Name', aliases: ['Given Name'], type: 'Text', isComputed: false, isSensitive: false, createdAt: Date.now() };
    const emailSchema: PropertySchema = { id: crypto.randomUUID(), typeId: personalType.id, label: 'Email', aliases: ['Email Address'], type: 'Text', isComputed: false, isSensitive: false, createdAt: Date.now() };
    await graphStore.put('propertySchemas', firstNameSchema);
    await graphStore.put('propertySchemas', emailSchema);

    // 4. Create Entity Instance
    const personalEntity: Entity = { id: crypto.randomUUID(), typeId: personalType.id, profileId, createdAt: Date.now(), updatedAt: Date.now() };
    await graphStore.put('entities', personalEntity);

    // 5. Map Old Values to New Properties
    if (oldData.firstName) {
      const propValue: PropertyValue = {
        id: crypto.randomUUID(),
        entityId: personalEntity.id,
        propertySchemaId: firstNameSchema.id,
        value: oldData.firstName,
        metadata: { confidence: 1.0 },
        updatedAt: Date.now()
      };
      await graphStore.put('propertyValues', propValue);
    }
    
    if (oldData.email) {
      const propValue: PropertyValue = {
        id: crypto.randomUUID(),
        entityId: personalEntity.id,
        propertySchemaId: emailSchema.id,
        value: oldData.email,
        metadata: { confidence: 1.0 },
        updatedAt: Date.now()
      };
      await graphStore.put('propertyValues', propValue);
    }

    console.log('[Migration] V1 to V2 Data Translation successful.');
    this.markComplete();
  }

  private markComplete() {
    chrome.storage.local.set({ v2_migration_complete: true });
  }
}

export const migrationScript = new MigrationScript();
