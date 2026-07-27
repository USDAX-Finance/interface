import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// DATABASE_URL is required for DB-backed routes.
// If it is not set (e.g. during production cold-start before Replit injects
// it, or in environments without a provisioned database) we warn instead of
// throwing so the server can still start, pass the health-check probe, and
// serve static files.  Any route that calls into `db` will surface a 500 at
// request time — acceptable and easily diagnosed from logs.
const url = process.env.DATABASE_URL;

if (!url) {
  console.warn(
    "[db] DATABASE_URL is not set — database-dependent routes will be " +
    "unavailable until the environment variable is provided.",
  );
}

export const pool = url
  ? new Pool({ connectionString: url })
  : (null as unknown as InstanceType<typeof Pool>);

export const db = url
  ? drizzle(pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from "./schema";
