import { aiCoordinator } from '../ai/AICoordinator';
import { graphStore } from '../../core/GraphStore';

export interface FeedbackEvent {
  id: string;
  profileId: string;
  website: string;
  formContext: string; // Serialized FormContext
  fieldId: string;
  rejectedMappingId?: string; // What the AI predicted (and got wrong)
  acceptedMappingId: string; // What the user manually chose
  reason: 'Wrong Value' | 'Wrong Record' | 'Wrong Category' | 'Wrong Mapping' | 'Other';
  timestamp: number;
}

export class LearningEngine {
  /**
   * Records a user override event when they correct an AI prediction.
   * This is stored locally for immediate Rule Engine updates, and sent to the cloud for global model fine-tuning.
   */
  async recordOverride(event: Omit<FeedbackEvent, 'id' | 'timestamp'>) {
    const feedback: FeedbackEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    // 1. Save locally to 'history' store (assume created in GraphStore)
    console.log(`[LearningEngine] Recording override for ${event.website}`);
    await graphStore.put('feedback_history', feedback);

    // 2. Adjust local RuleEngine implicitly (e.g. creating a new conditional rule)
    await this.generateLocalRule(feedback);

    // 3. Send to backend AI Coordinator for global learning
    await aiCoordinator.sendFeedback(
      JSON.parse(feedback.formContext),
      feedback.fieldId,
      feedback.acceptedMappingId,
      feedback.rejectedMappingId || '',
      feedback.reason
    );
  }

  /**
   * Analyzes the feedback and synthesizes a new local rule to prevent the mistake next time.
   */
  private async generateLocalRule(feedback: FeedbackEvent) {
    // Example: If user consistently corrects "Expected Salary" to INR on Indian job boards
    // This engine would synthesize a rule for the RuleEngine AST.
    // For now, it's a stub demonstrating the architecture.
    console.log(`[LearningEngine] Synthesized local rule from feedback ${feedback.id}`);
  }
}

export const learningEngine = new LearningEngine();
