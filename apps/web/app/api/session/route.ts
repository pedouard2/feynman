import { NextResponse } from 'next/server';

import { PERSONA_SYSTEM_PROMPT } from '../../../lib/prompts';

const OPENAI_REALTIME_URL = process.env.OPENAI_REALTIME_URL || 'https://api.openai.com/v1/realtime/sessions';
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2024-12-17';
const REQUEST_TIMEOUT = 30000;

export async function POST() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        mock: true, 
        client_secret: { value: `mock-${Date.now()}` } 
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(OPENAI_REALTIME_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_REALTIME_MODEL,
          voice: 'verse',
          instructions: PERSONA_SYSTEM_PROMPT
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        return NextResponse.json(
          { error: `OpenAI API error: ${response.status}`, details: errorText },
          { status: response.status }
        );
      }

      let data;
      try {
        data = await response.json();
      } catch {
        return NextResponse.json(
          { error: 'Invalid response from OpenAI' },
          { status: 502 }
        );
      }

      return NextResponse.json(data);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
