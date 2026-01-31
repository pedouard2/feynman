import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    const result = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, content } = body;
    
    if (!role || !content) {
      return NextResponse.json({ error: 'role and content are required' }, { status: 400 });
    }
    
    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json({ error: 'role must be user, assistant, or system' }, { status: 400 });
    }
    
    const result = await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [id, role, content]
    );
    
    await query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
