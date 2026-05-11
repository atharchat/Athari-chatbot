// MOCK RAG COMPONENT - TEMPORARY
// This mimics the Pinecone/Vector DB service logic.

import { VectorEntity } from "./types";

export class MockVectorStore {
  async query(vector: number[], topK: number = 5): Promise<VectorEntity[]> {
    return [
      {
        id: "test1",
        values: [0.1, 0.2, 0.3],
        metadata: { source: "Mock DB", page: "1" }
      }
    ];
  }

  async upsert(entities: VectorEntity[]): Promise<void> {
    console.log("Mocking upsert of", entities.length, "entities");
  }
}

export const getVectorStore = () => new MockVectorStore();
