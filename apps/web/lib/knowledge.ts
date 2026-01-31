import { webLLM } from './web-llm';
import { Concept } from '../stores/feynman';
import { JUDGE_SYSTEM_PROMPT } from './prompts';

export async function analyzeKnowledge(topic: string, transcript: string): Promise<Concept[]> {
  if (!topic || !transcript) return [];

  const systemPrompt = JUDGE_SYSTEM_PROMPT(topic);

  try {
    const jsonStr = await webLLM.generateResponse(transcript, systemPrompt);
    // Attempt to clean markdown code blocks if present
    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Knowledge Analysis Failed", e);
    return fallbackConcepts(topic);
  }
}

function fallbackConcepts(topic: string): Concept[] {
  // Simple heuristic fallback if LLM fails
  return [
    { name: "Core Definition", status: "missing" },
    { name: "Key Mechanism", status: "missing" },
    { name: "Real-world Analogy", status: "missing" }
  ];
}
