'use server';

import OpenAI from 'openai';
import { PERSONA_SYSTEM_PROMPT } from '../lib/prompts';


export async function generateResponse(messages: { role: 'user' | 'assistant' | 'system', content: string }[]) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PERSONA_SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "I'm not sure what to say.";
  } catch (error) {
    console.error("LLM Error:", error);
    return "Sorry, I had trouble thinking of a response.";
  }
}
