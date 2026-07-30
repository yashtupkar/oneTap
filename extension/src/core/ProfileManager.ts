import { GraphStore, graphStore } from './GraphStore';
import { Profile } from './schema';
import { EventBus } from './EventBus';

export class ProfileManager {
  private store: GraphStore;
  private currentProfileId: string | null = null;

  constructor(store: GraphStore) {
    this.store = store;
  }

  /**
   * Initializes the ProfileManager.
   * If no profiles exist, it creates a default "Personal" profile.
   */
  async init(): Promise<void> {
    await this.store.init();
    
    const profiles = await this.store.getAll<Profile>('profiles');
    if (profiles.length === 0) {
      const defaultProfile: Profile = {
        id: crypto.randomUUID(),
        name: 'Personal',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await this.store.put('profiles', defaultProfile);
      this.currentProfileId = defaultProfile.id;
    } else {
      // For now, default to the first profile.
      // In a real scenario, this would be read from extension sync storage.
      this.currentProfileId = profiles[0].id;
    }
  }

  /**
   * Gets the currently active Profile ID.
   */
  getActiveProfileId(): string | null {
    return this.currentProfileId;
  }

  /**
   * Switches the active profile and notifies the rest of the application.
   */
  async switchProfile(profileId: string): Promise<boolean> {
    const profile = await this.store.get<Profile>('profiles', profileId);
    if (!profile) return false;

    this.currentProfileId = profile.id;
    
    // Notify the UI and other modules that the profile has changed
    // This allows the Side Panel to unmount/remount or refetch graph data
    // EventBus.send('PROFILE_CHANGED', { profileId: this.currentProfileId });
    
    return true;
  }

  /**
   * Fetches all available profiles for the user to switch between.
   */
  async getAllProfiles(): Promise<Profile[]> {
    return await this.store.getAll<Profile>('profiles');
  }

  /**
   * Creates a new profile.
   */
  async createProfile(name: string): Promise<Profile> {
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await this.store.put('profiles', newProfile);
    return newProfile;
  }
}

// Export a singleton instance
export const profileManager = new ProfileManager(graphStore);
