import { Pool, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}/${process.env.PGDATABASE || 'feynman'}`;

const CONNECTION_TIMEOUT = parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000', 10);
const IDLE_TIMEOUT = parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10);
const MAX_CONNECTIONS = parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10);

export const pool = new Pool({
  connectionString,
  max: MAX_CONNECTIONS,
  idleTimeoutMillis: IDLE_TIMEOUT,
  connectionTimeoutMillis: CONNECTION_TIMEOUT,
});

pool.on('error', () => {
  process.exit(1);
});

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const result = await pool.query<T>(text, params);
  return result;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}
