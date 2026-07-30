import { EventBus } from '../core/EventBus';
import { aliasEngine } from './matching/AliasEngine';
import { aiCoordinator } from './ai/AICoordinator';

/**
 * MessageRouter acts as the central hub for the extension.
 * It listens to events on the EventBus and triggers the appropriate offline/online engines.
 */
export class MessageRouter {
  init() {
    // When a form is detected by the Content Script
    EventBus.listen('FORM_DETECTED', async (payload, sender) => {
      console.log('[MessageRouter] Form detected:', payload);
      // This will trigger the AI Coordinator in the background
      // and notify the Side Panel to update the Dashboard
    });

    // When a user focuses a specific field in the Content Script
    EventBus.listen('FIELD_FOCUSED', async (payload, sender) => {
      console.log('[MessageRouter] Field focused:', payload.label);
      
      // 1. Try offline Alias Matching first
      const aliasMatch = await aliasEngine.findBestMatch(payload.label);
      
      if (aliasMatch) {
        // High confidence offline match, send back immediately
        EventBus.send('AI_PREDICTION_READY', {
          fieldId: payload.fieldId,
          value: aliasMatch.propertyId, // In reality, fetch actual value from GraphStore
          confidence: aliasMatch.confidence
        }, sender.tab?.id);
      } else {
        // 2. Trigger AI Coordinator (Background Processing)
        // ...
      }
    });

    // When the user overrides an AI prediction manually
    EventBus.listen('USER_OVERRIDE', async (payload, sender) => {
      console.log('[MessageRouter] User override:', payload);
      // Notify Learning Engine & AI Coordinator
    });
  }
}

export const messageRouter = new MessageRouter();
