import { DatabaseSync } from "node:sqlite";
import { env } from "$env/dynamic/private";

const dbUrl = env.DATABASE_URL ?? ":memory:";

if (dbUrl === ":memory:") {
  console.warn(
    "Using an in-memory SQLite database. All data will be lost when the process stops.",
  );
}

export const db = new DatabaseSync(dbUrl, {
  timeout: 5000,
});

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");
db.exec("PRAGMA foreign_keys = ON");
