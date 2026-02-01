import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MAX_TITLE_LENGTH = 200;
const MAX_CONTEXT_LENGTH = 10000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    const conversationResult = await query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );
    
    if (!conversationResult.rows || conversationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    const messagesResult = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    return NextResponse.json({
      ...conversationResult.rows[0],
      messages: messagesResult.rows || []
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    const { title, context } = body;
    
    if (title !== undefined && (typeof title !== 'string' || title.length > MAX_TITLE_LENGTH)) {
      return NextResponse.json({ error: `title must be a string with max ${MAX_TITLE_LENGTH} characters` }, { status: 400 });
    }
    
    if (context !== undefined && (typeof context !== 'string' || context.length > MAX_CONTEXT_LENGTH)) {
      return NextResponse.json({ error: `context must be a string with max ${MAX_CONTEXT_LENGTH} characters` }, { status: 400 });
    }
    
    const result = await query(
      'UPDATE conversations SET title = COALESCE($1, title), context = COALESCE($2, context), updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, context, id]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.rows[0]);
  } catch {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    const result = await query(
      'DELETE FROM conversations WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    return NextResponse.json({ deleted: true, id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
