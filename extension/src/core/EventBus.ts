// Event types definition
export type EventMap = {
  'FORM_DETECTED': { url: string; fieldsCount: number; context: string };
  'FIELD_FOCUSED': { fieldId: string; label: string; aliases: string[] };
  'AI_PREDICTION_READY': { fieldId: string; value: string; confidence: number };
  'USER_OVERRIDE': { fieldId: string; newValue: string; reason: string };
  'SYNC_COMPLETE': { timestamp: number };
  'OPEN_SIDE_PANEL': void;
};

type EventName = keyof EventMap;

// Helper to send messages
export const EventBus = {
  send<K extends EventName>(
    event: K,
    payload: EventMap[K],
    tabId?: number
  ): Promise<any> {
    const message = { type: event, payload };
    if (tabId !== undefined) {
      return chrome.tabs.sendMessage(tabId, message);
    } else {
      return chrome.runtime.sendMessage(message);
    }
  },

  // Helper to listen to messages
  listen<K extends EventName>(
    event: K,
    handler: (payload: EventMap[K], sender: chrome.runtime.MessageSender) => void | Promise<void>
  ) {
    const listener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message && message.type === event) {
        // Handle async responses if the handler returns a promise
        const result = handler(message.payload, sender);
        if (result instanceof Promise) {
          result.then(sendResponse);
          return true; // Indicates async response
        } else {
          sendResponse(result);
        }
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(listener);

    // Return a function to remove the listener
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  },
};
