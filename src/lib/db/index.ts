/**
 * Database Connection for Neon Postgres + Drizzle ORM
 *
 * Requires DATABASE_URL environment variable.
 * Fails fast with clear error when database access is attempted.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { getDatabaseUrl } from '@/lib/config/runtime';

function createDatabaseClient() {
  const sql = neon(getDatabaseUrl());
  return drizzle(sql, { schema });
}

type DatabaseClient = ReturnType<typeof createDatabaseClient>;

let databaseClient: DatabaseClient | null = null;

function getDatabaseClient(): DatabaseClient {
  if (!databaseClient) {
    databaseClient = createDatabaseClient();
  }

  return databaseClient;
}

export const db = new Proxy({} as DatabaseClient, {
  get(_target, property) {
    const client = getDatabaseClient();
    const value = Reflect.get(client, property);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Re-export schema types for convenience
export * from './schema';

// Export type for the db instance
export type Database = DatabaseClient;
