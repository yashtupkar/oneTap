import { graphStore } from '../../core/GraphStore';
import { Entity, Relationship, PropertySchema, PropertyValue } from '../../core/schema';

export class RelationshipEngine {
  /**
   * Recalculates all computed properties for a given profile.
   * This is triggered whenever an entity is created, updated, or a relationship is formed.
   */
  async recompute(profileId: string): Promise<void> {
    const propertySchemas = await graphStore.getAll<PropertySchema>('propertySchemas');
    const computedSchemas = propertySchemas.filter(s => s.isComputed && s.formula);

    if (computedSchemas.length === 0) return;

    // In a real application, you'd traverse the graph to find entities that have computed schemas.
    // We fetch all entities in the profile.
    const entities = await graphStore.getByIndex<Entity>('entities', 'by_profileId', profileId);
    
    for (const entity of entities) {
      // Find computed properties applicable to this entity's type
      const applicableSchemas = computedSchemas.filter(s => s.typeId === entity.typeId);
      
      for (const schema of applicableSchemas) {
        // Calculate the value based on the formula.
        // Example formula: 'diff_years(record.dob, now())'
        const computedValue = await this.evaluateFormula(schema.formula!, entity);
        
        if (computedValue !== null) {
          // Check if this property value already exists
          const existingValues = await graphStore.getByIndex<PropertyValue>('propertyValues', 'by_entityId', entity.id);
          let propValue = existingValues.find(v => v.propertySchemaId === schema.id);

          if (propValue) {
            propValue.value = computedValue.toString();
            propValue.updatedAt = Date.now();
          } else {
            propValue = {
              id: crypto.randomUUID(),
              entityId: entity.id,
              propertySchemaId: schema.id,
              value: computedValue.toString(),
              metadata: { confidence: 1.0 },
              updatedAt: Date.now()
            };
          }
          await graphStore.put('propertyValues', propValue);
        }
      }
    }
  }

  /**
   * Evaluates a computation formula in the context of an entity.
   */
  private async evaluateFormula(formula: string, contextEntity: Entity): Promise<string | number | null> {
    // This is a stub for the formula evaluator.
    // It would normally resolve dependencies (e.g. fetching 'contextEntity.dob')
    // and execute the function (e.g. diff_years).
    console.log(`[RelationshipEngine] Evaluating formula: ${formula} for entity: ${contextEntity.id}`);
    return null; // Return null until fully implemented
  }
}

export const relationshipEngine = new RelationshipEngine();
