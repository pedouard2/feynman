import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MAX_CONTENT_LENGTH = 50000;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_ROLES = ['user', 'assistant', 'system'] as const;

function isValidId(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Invalid conversation ID format' }, { status: 400 });
    }
    
    const result = await query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );
    
    return NextResponse.json(result.rows || []);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    
    const { role, content } = body;
    
    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'role is required and must be a string' }, { status: 400 });
    }
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'content is required and must be a string' }, { status: 400 });
    }
    
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json({ error: `content must be less than ${MAX_CONTENT_LENGTH} characters` }, { status: 400 });
    }
    
    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return NextResponse.json({ error: 'role must be user, assistant, or system' }, { status: 400 });
    }
    
    const result = await query(
      'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [id, role, content]
    );
    
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
    
    await query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
