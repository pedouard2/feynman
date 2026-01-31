import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const personaId = searchParams.get('personaId');
    
    let sql = 'SELECT * FROM conversations ORDER BY updated_at DESC';
    let params: string[] = [];
    
    if (personaId) {
      sql = 'SELECT * FROM conversations WHERE persona_id = $1 ORDER BY updated_at DESC';
      params = [personaId];
    }
    
    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personaId, title, context } = body;
    
    if (!personaId) {
      return NextResponse.json({ error: 'personaId is required' }, { status: 400 });
    }
    
    const result = await query(
      'INSERT INTO conversations (persona_id, title, context) VALUES ($1, $2, $3) RETURNING *',
      [personaId, title || null, context || null]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
