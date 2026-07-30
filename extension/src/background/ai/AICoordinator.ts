import { apiRequest } from '../../shared/api';
import { STORAGE_KEYS } from '../../shared/constants';

interface AIFieldDescriptor {
  id: string;
  label: string;
  aliases: string[];
  placeholder: string;
  neighbors: string[];
}

interface AIFormContext {
  url: string;
  formType: string;
  step: string;
  progress: string;
}

export class AICoordinator {
  /**
   * Fetches AI predictions for the entire form at once.
   */
  async analyzeForm(
    context: AIFormContext,
    fields: AIFieldDescriptor[]
  ): Promise<any> {
    const data = await chrome.storage.local.get([STORAGE_KEYS.DEVICE_ID, STORAGE_KEYS.TOKEN]);
    const deviceId = data[STORAGE_KEYS.DEVICE_ID];
    const token = data[STORAGE_KEYS.TOKEN];
    const serverUrl = 'https://onetap-8arx.onrender.com';

    try {
      const response = await apiRequest(
        '/api/v2/ai/analyze-form',
        {
          method: 'POST',
          body: JSON.stringify({
            url: context.url,
            formType: context.formType,
            step: context.step,
            progress: context.progress,
            fields: fields
          }),
        },
        serverUrl,
        deviceId,
        token
      );
      return response;
    } catch (err) {
      console.error('[AICoordinator] Analyze form failed:', err);
      // Fails gracefully in offline mode
      return { predictions: [], error: 'offline_or_failed' };
    }
  }

  /**
   * Sends feedback to the backend to improve the learning engine.
   */
  async sendFeedback(
    context: AIFormContext,
    fieldId: string,
    acceptedMapping: string,
    rejectedMapping: string,
    reason: string
  ): Promise<void> {
    const data = await chrome.storage.local.get([STORAGE_KEYS.DEVICE_ID, STORAGE_KEYS.TOKEN]);
    const deviceId = data[STORAGE_KEYS.DEVICE_ID];
    const token = data[STORAGE_KEYS.TOKEN];
    const serverUrl = 'https://onetap-8arx.onrender.com';

    try {
      await apiRequest(
        '/api/v2/learning/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            context,
            fieldId,
            acceptedMapping,
            rejectedMapping,
            reason
          }),
        },
        serverUrl,
        deviceId,
        token
      );
    } catch (err) {
      console.error('[AICoordinator] Send feedback failed:', err);
    }
  }
}

export const aiCoordinator = new AICoordinator();
