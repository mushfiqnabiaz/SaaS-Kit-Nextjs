import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/models/postgres/schema";

type Db = PostgresJsDatabase<typeof schema>;

interface PostgresCache {
  client: ReturnType<typeof postgres> | null;
  db: Db | null;
}

declare global {
  // eslint-disable-next-line no-var
  var postgresCache: PostgresCache | undefined;
}

const cached: PostgresCache = global.postgresCache ?? { client: null, db: null };

if (!global.postgresCache) {
  global.postgresCache = cached;
}

export function getPostgresDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }

  if (cached.db && cached.client) {
    return cached.db;
  }

  cached.client = postgres(url, { max: 10 });
  cached.db = drizzle(cached.client, { schema });
  return cached.db;
}

export async function closePostgres(): Promise<void> {
  if (cached.client) {
    await cached.client.end();
    cached.client = null;
    cached.db = null;
  }
}
