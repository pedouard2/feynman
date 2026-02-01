import { webLLM } from './web-llm';
import { Concept } from '../stores/feynman';
import { JUDGE_SYSTEM_PROMPT } from './prompts';

function fallbackConcepts(): Concept[] {
  return [
    { name: "Core Definition", status: "missing" },
    { name: "Key Mechanism", status: "missing" },
    { name: "Real-world Analogy", status: "missing" }
  ];
}

function parseConceptsJson(jsonStr: string): Concept[] | null {
  try {
    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    if (!Array.isArray(parsed)) return null;
    
    return parsed.filter((item): item is Concept => 
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      ['covered', 'missing', 'partial'].includes(item.status)
    );
  } catch {
    return null;
  }
}

export async function analyzeKnowledge(topic: string, transcript: string): Promise<Concept[]> {
  if (!topic || !transcript) return [];

  const systemPrompt = JUDGE_SYSTEM_PROMPT(topic);

  try {
    const jsonStr = await webLLM.generateResponse(transcript, systemPrompt);
    const concepts = parseConceptsJson(jsonStr);
    return concepts || fallbackConcepts();
  } catch {
    return fallbackConcepts();
  }
}
