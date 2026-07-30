import { graphStore } from '../../core/GraphStore';
import { aiCoordinator } from '../ai/AICoordinator';

export interface DocumentMetadata {
  id: string; // UUID
  profileId: string;
  name: string;
  type: string; // 'Resume', 'Cover Letter', 'Portfolio'
  tags: string[];
  skills: string[]; // Extracted skills
  targetRole: string; // e.g. 'Backend Engineer'
  version: number;
  blobUrl: string | null; // For local preview
  uploadedAt: number;
}

export class DocumentLibrary {
  /**
   * Uploads a document, saves it to IndexedDB, and triggers AI parsing.
   */
  async uploadDocument(profileId: string, file: File, type: string, targetRole: string): Promise<DocumentMetadata> {
    const id = crypto.randomUUID();
    
    // Create an object URL for local preview (if it's a PDF/Image)
    const blobUrl = URL.createObjectURL(file);
    
    const metadata: DocumentMetadata = {
      id,
      profileId,
      name: file.name,
      type,
      tags: [],
      skills: [],
      targetRole,
      version: 1,
      blobUrl,
      uploadedAt: Date.now()
    };

    // Save metadata immediately
    await graphStore.put('documents', metadata); // Note: Need to add 'documents' store to GraphStore schema in production

    // Trigger AI parsing in the background (fire and forget for this example)
    this.parseWithAI(id, profileId, file).catch(console.error);

    return metadata;
  }

  /**
   * Parses the uploaded document via backend AI to extract Entities (Skills, Experience, etc).
   */
  private async parseWithAI(documentId: string, profileId: string, file: File) {
    // 1. Send file to backend
    // 2. Wait for extracted entities
    // 3. Update the DocumentMetadata with extracted tags/skills
    // 4. Update the GraphStore with new Entities (e.g. adding missing skills to the graph)
    console.log(`[DocumentLibrary] Parsing document ${documentId} with AI...`);
    
    // Simulating extraction
    setTimeout(async () => {
      console.log(`[DocumentLibrary] Extracted skills from document ${documentId}`);
      const doc = await graphStore.get<DocumentMetadata>('documents', documentId);
      if (doc) {
        doc.skills = ['React', 'Node.js', 'AWS'];
        doc.tags = ['Frontend', 'Fullstack'];
        await graphStore.put('documents', doc);
      }
    }, 2000);
  }

  /**
   * Gets all documents for a given profile.
   */
  async getDocumentsForProfile(profileId: string): Promise<DocumentMetadata[]> {
    const docs = await graphStore.getAll<DocumentMetadata>('documents');
    return docs.filter(d => d.profileId === profileId);
  }

  /**
   * Smart AI Document Recommendation
   * Suggests the best document based on Form Context
   */
  async recommendDocument(profileId: string, formKeywords: string[]): Promise<DocumentMetadata | null> {
    const docs = await this.getDocumentsForProfile(profileId);
    if (docs.length === 0) return null;

    // Simple TF-IDF or keyword matching heuristic
    let bestDoc = docs[0];
    let highestScore = 0;

    for (const doc of docs) {
      const matchCount = doc.skills.filter(s => formKeywords.includes(s.toLowerCase())).length;
      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestDoc = doc;
      }
    }

    return bestDoc;
  }
}

export const documentLibrary = new DocumentLibrary();
