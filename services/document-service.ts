import type { Document } from "@/domain/types";

export interface DocumentRepository {
  createDocument(document: Document): Promise<Document>;
  getDocument(documentId: string): Promise<Document | null>;
  updateDocument(document: Pick<Document, "id" | "blocks">): Promise<void>;
  deleteDocument(documentId: string): Promise<void>;
  restoreDocument(documentId: string): Promise<void>;
  listDocuments(): Promise<Document[]>;
  searchDocuments(query: string): Promise<Document[]>;
}

const storageKey = (documentId: string) => `grapho-document-${documentId}`;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export class LocalStorageDocumentRepository implements DocumentRepository {
  async createDocument(document: Document) {
    await this.updateDocument(document);
    return document;
  }

  async getDocument(documentId: string) {
    if (!canUseStorage()) return null;
    const value = window.localStorage.getItem(storageKey(documentId));
    if (!value) return null;
    try {
      const content = JSON.parse(value) as Document["blocks"];
      return { id: documentId, blocks: content } as Document;
    } catch {
      return null;
    }
  }

  async updateDocument(document: Pick<Document, "id" | "blocks">) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(storageKey(document.id), JSON.stringify(document.blocks));
  }

  async deleteDocument(documentId: string) {
    if (canUseStorage()) window.localStorage.removeItem(storageKey(documentId));
  }

  async restoreDocument() {
    // Trash metadata belongs to the workspace repository; content remains local.
  }

  async listDocuments() {
    return [];
  }

  async searchDocuments() {
    return [];
  }
}

export class DocumentService {
  constructor(private readonly repository: DocumentRepository) {}

  createDocument(document: Document) {
    return this.repository.createDocument(document);
  }

  getDocument(documentId: string) {
    return this.repository.getDocument(documentId);
  }

  updateDocument(document: Pick<Document, "id" | "blocks">) {
    return this.repository.updateDocument(document);
  }

  deleteDocument(documentId: string) {
    return this.repository.deleteDocument(documentId);
  }

  restoreDocument(documentId: string) {
    return this.repository.restoreDocument(documentId);
  }
}

export const localDocumentService = new DocumentService(new LocalStorageDocumentRepository());
