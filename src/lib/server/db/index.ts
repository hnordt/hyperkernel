import { DatabaseSync } from "node:sqlite";
import { env } from "$env/dynamic/private";

export const db = new DatabaseSync(env.DATABASE_URL, { timeout: 5000 });

db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA synchronous = NORMAL");
db.exec("PRAGMA foreign_keys = ON");
