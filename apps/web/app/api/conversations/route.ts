import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTEXT_LENGTH = 10000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personaId = searchParams.get('personaId');
    
    let sql = 'SELECT * FROM conversations ORDER BY updated_at DESC';
    let params: string[] = [];
    
    if (personaId) {
      if (!UUID_REGEX.test(personaId)) {
        return NextResponse.json({ error: 'Invalid personaId format' }, { status: 400 });
      }
      sql = 'SELECT * FROM conversations WHERE persona_id = $1 ORDER BY updated_at DESC';
      params = [personaId];
    }
    
    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { personaId, title, context } = body;
    
    if (!personaId || typeof personaId !== 'string') {
      return NextResponse.json({ error: 'personaId is required and must be a string' }, { status: 400 });
    }
    
    if (title && (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH)) {
      return NextResponse.json({ error: `title must be a string with max ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }
    
    if (context && (typeof context !== 'string' || context.length > MAX_CONTEXT_LENGTH)) {
      return NextResponse.json({ error: `context must be a string with max ${MAX_CONTEXT_LENGTH} characters` }, { status: 400 });
    }
    
    const result = await query(
      'INSERT INTO conversations (persona_id, title, context) VALUES ($1, $2, $3) RETURNING *',
      [personaId, title || null, context || null]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
