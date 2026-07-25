import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "$env/dynamic/private";
import * as schema from "./schema";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(env.DATABASE_URL, { schema });
