// MOCK RAG COMPONENT - TEMPORARY
// This file will later be replaced by the actual Retrieval component for Vector DB.

export interface RagDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

export const retrieveDocuments = async (query: string): Promise<RagDocument[]> => {
  // Mock retrieval
  return [
    {
      id: "mock1",
      text: "هذا نص تجريبي مستخرج من قاعدة البيانات.",
      metadata: { source: "كتاب تجريبي", page: 1 }
    }
  ];
};
