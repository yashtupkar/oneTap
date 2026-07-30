import { graphStore } from '../../core/GraphStore';
import { PropertySchema } from '../../core/schema';

export class AliasEngine {
  /**
   * Normalizes a string for matching by lowercasing, removing punctuation, and trimming.
   */
  normalize(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]|_/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  }

  /**
   * Calculates Levenshtein distance between two strings.
   */
  levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) == a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Computes a similarity score (0 to 1).
   */
  similarityScore(a: string, b: string): number {
    const normA = this.normalize(a);
    const normB = this.normalize(b);
    if (normA === normB) return 1.0;
    if (normA.length === 0 || normB.length === 0) return 0.0;
    
    const distance = this.levenshteinDistance(normA, normB);
    const maxLength = Math.max(normA.length, normB.length);
    return (maxLength - distance) / maxLength;
  }

  /**
   * Finds the best matching PropertySchema for a given field label.
   */
  async findBestMatch(fieldLabel: string): Promise<{ propertyId: string; confidence: number; matchedAlias: string } | null> {
    const properties = await graphStore.getAll<PropertySchema>('propertySchemas');
    
    let bestMatch = null;
    let highestScore = 0;

    for (const prop of properties) {
      // Check the primary label
      const labelScore = this.similarityScore(fieldLabel, prop.label);
      if (labelScore > highestScore) {
        highestScore = labelScore;
        bestMatch = { propertyId: prop.id, confidence: labelScore, matchedAlias: prop.label };
      }

      // Check all aliases
      if (prop.aliases && Array.isArray(prop.aliases)) {
        for (const alias of prop.aliases) {
          const aliasScore = this.similarityScore(fieldLabel, alias);
          if (aliasScore > highestScore) {
            highestScore = aliasScore;
            bestMatch = { propertyId: prop.id, confidence: aliasScore, matchedAlias: alias };
          }
        }
      }
    }

    // Require at least a 0.85 similarity score to consider it a high confidence match via AliasEngine alone.
    if (highestScore >= 0.85 && bestMatch) {
      return bestMatch;
    }

    return null;
  }
}

export const aliasEngine = new AliasEngine();
