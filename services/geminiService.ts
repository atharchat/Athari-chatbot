// Mock Implementation
// NOTE: Future Gemini API calls MUST be strictly from server.ts (backend)
// No API keys should be exposed to the client.

import { Topic } from "../types";

export const getSystemInstruction = async (): Promise<string> => {
    return "Mock System Instruction";
};

// Mock function for classification
export const classifyTopic = async (query: string, topics: Topic[], currentTopic?: Topic): Promise<Topic | null> => {
    // Mock logic: simply bypass parsing actual AI response and return null 
    // to stick with the current active topic.
    console.log("Mock: classifyTopic called, returning null (no topic change).");
    return null;
};
