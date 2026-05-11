import { GoogleGenAI } from "@google/genai";
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config();

let _ai: GoogleGenAI | null = null;
export const getGenAIClient = () => {
    if (!_ai) {
        const API_KEY = process.env.GEMINI_API_KEY1 || process.env.GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error("GEMINI_API_KEY or GEMINI_API_KEY1 environment variable is not set.");
        }
        _ai = new GoogleGenAI({ apiKey: API_KEY });
    }
    return _ai;
};

let pc: Pinecone | null = null;
const INDEX_NAME = "salafi-scholar"; // Feel free to change this or make it environment variable

export const getPineconeClient = () => {
    if (!pc) {
        const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
        if (!PINECONE_API_KEY) {
            console.warn("PINECONE_API_KEY environment variable is not set. Vector database features will not work.");
            return null;
        }
        pc = new Pinecone({
          apiKey: PINECONE_API_KEY
        });
    }
    return pc;
};

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    topic: string;
    page?: string;
  };
  embedding?: number[];
}

/**
 * Splits text into chunks by paragraphs or fixed length.
 * Can be enhanced later to respect semantic boundaries.
 */
export const chunkText = (text: string, metadata: Omit<DocumentChunk['metadata'], 'page'>, chunkSize = 1000, overlap = 200): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Try to find a reasonable boundary (newline or period) near the end index
    if (endIndex < text.length) {
      const nextNewline = text.indexOf('\n', endIndex - 100);
      const nextPeriod = text.indexOf('.', endIndex - 50);
      
      if (nextNewline !== -1 && nextNewline < endIndex + 200) {
        endIndex = nextNewline;
      } else if (nextPeriod !== -1 && nextPeriod < endIndex + 100) {
        endIndex = nextPeriod + 1;
      }
    } else {
      endIndex = text.length;
    }

    const chunkText = text.substring(startIndex, endIndex).trim();
    if (chunkText.length > 50) { // Ignore very small overlapping tails
      chunks.push({
        id: crypto.randomUUID(),
        text: chunkText,
        metadata,
      });
    }

    if (endIndex >= text.length) {
      break;
    }

    startIndex = endIndex - overlap;
    
    // Safety check to avoid infinite loops
    if (startIndex >= endIndex) {
      startIndex = endIndex;
    }
  }

  return chunks;
};

/**
 * Gets embeddings for chunks using Gemini API.
 */
export const getEmbeddings = async (texts: string[]): Promise<number[][]> => {
  try {
    const ai = getGenAIClient();
    const allEmbeddings: number[][] = [];
    
    // Process in smaller batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batchTexts = texts.slice(i, i + batchSize);
      const batchPromises = batchTexts.map(async (text) => {
        const response = await ai.models.embedContent({
          model: "gemini-embedding-2",
          contents: text,
          config: { outputDimensionality: 768 }
        });
        if (!response.embeddings || !response.embeddings[0]?.values) {
            throw new Error("No embeddings returned from Gemini API");
        }
        return response.embeddings[0].values;
      });
      
      const batchResults = await Promise.all(batchPromises);
      allEmbeddings.push(...batchResults);
    }

    return allEmbeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
};

/**
 * Maps and upserts chunks with their embeddings into Pinecone.
 */
export const upsertChunks = async (chunks: DocumentChunk[]): Promise<void> => {
  const client = getPineconeClient();
  if (!client) {
      throw new Error("Pinecone client not initialized");
  }

  const index = client.index(INDEX_NAME);
  
  // Format data for Pinecone
  const vectors = chunks.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding!,
      metadata: {
          text: chunk.text, // Store text in metadata so we can retrieve it
          ...chunk.metadata
      }
  }));

  console.log(`Upserting ${chunks.length} chunks into Pinecone. Arrays length:`, vectors.length);

  // Pinecone recommends upserting in batches (e.g., 100 vectors at a time)
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
      console.log(`Upserted batch ${i / batchSize + 1} of ${Math.ceil(vectors.length / batchSize)}`);
  }
};

/**
 * Queries Pinecone for relevant documents based on an embedding.
 */
export const queryRelevantDocuments = async (queryEmbedding: number[], topK = 5, filter?: Record<string, any>) => {
  const client = getPineconeClient();
  if (!client) {
      throw new Error("Pinecone client not initialized");
  }

  const index = client.index(INDEX_NAME);
  
  const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter
  });

  return queryResponse.matches;
};

