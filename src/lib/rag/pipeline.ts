// MOCK RAG COMPONENT - TEMPORARY
// This pipeline orchestrates the backend RAG flow. Currently running in mock mode.

import { retrieveDocuments } from "./retrieve";
import { generateAnswer } from "./generate-answer";
import { verifyAnswer } from "./verify-answer";
import { checkInputSafety } from "../security/input-guard";

export const executeRagPipeline = async (query: string): Promise<string> => {
  const isSafe = await checkInputSafety(query);
  if (!isSafe) {
    return "يا أخي، اتق الله. الكلمة الطيبة صدقة، فلنتحاور بأدب واحترام كما يليق بالمسلم. بارك الله فيك.";
  }

  const docs = await retrieveDocuments(query);
  let answer = await generateAnswer(query, docs);
  
  const isValid = await verifyAnswer(answer, docs);
  if (!isValid) {
    answer = "المعذرة، لم أجد إجابة دقيقة على هذا السؤال في النصوص المتوفرة لدي حاليًا. للحصول على حكم شرعي مؤكد، يُرجى سؤال أهل العلم الموثوقين.";
  }
  
  return answer;
};
