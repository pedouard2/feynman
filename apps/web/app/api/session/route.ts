import { NextResponse } from 'next/server';

import { PERSONA_SYSTEM_PROMPT } from '../../../lib/prompts';

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set. Using mock mode.');
      return NextResponse.json({ 
        mock: true, 
        client_secret: { value: 'mock-token-123' } 
      });
    }

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse',
        instructions: PERSONA_SYSTEM_PROMPT
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create OpenAI session' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
