export type RuleCondition = 
  | { '==': [any, any] }
  | { '!=': [any, any] }
  | { 'AND': RuleCondition[] }
  | { 'OR': RuleCondition[] };

export interface RuleAction {
  'SET': [string, any]; // Sets a context variable or field prediction
}

export interface Rule {
  id: string;
  condition: RuleCondition;
  action: RuleAction;
}

export class RuleEngine {
  /**
   * Resolves a variable from the context context (e.g. "formContext.country").
   */
  resolveVariable(path: any, context: Record<string, any>): any {
    if (typeof path === 'object' && path !== null && 'var' in path) {
      const parts = path.var.split('.');
      let current = context;
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
      }
      return current;
    }
    return path; // Literal value
  }

  /**
   * Evaluates a single rule condition against the current context.
   */
  evaluateCondition(condition: RuleCondition, context: Record<string, any>): boolean {
    if ('==' in condition) {
      const [left, right] = condition['=='];
      return this.resolveVariable(left, context) === this.resolveVariable(right, context);
    }
    
    if ('!=' in condition) {
      const [left, right] = condition['!='];
      return this.resolveVariable(left, context) !== this.resolveVariable(right, context);
    }

    if ('AND' in condition) {
      return condition['AND'].every(cond => this.evaluateCondition(cond, context));
    }

    if ('OR' in condition) {
      return condition['OR'].some(cond => this.evaluateCondition(cond, context));
    }

    return false;
  }

  /**
   * Applies the rule's action to the output context.
   */
  applyAction(action: RuleAction, output: Record<string, any>): void {
    if ('SET' in action) {
      const [path, value] = action['SET'];
      const parts = path.split('.');
      let current = output;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
    }
  }

  /**
   * Evaluates a list of rules against the input context, applying actions to an output object.
   */
  run(rules: Rule[], inputContext: Record<string, any>): Record<string, any> {
    const outputContext: Record<string, any> = {};

    for (const rule of rules) {
      try {
        if (this.evaluateCondition(rule.condition, inputContext)) {
          this.applyAction(rule.action, outputContext);
        }
      } catch (err) {
        console.error(`[RuleEngine] Error evaluating rule ${rule.id}:`, err);
      }
    }

    return outputContext;
  }
}

export const ruleEngine = new RuleEngine();
