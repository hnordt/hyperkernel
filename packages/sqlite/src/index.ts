import { DatabaseSync } from "node:sqlite";

/**
 * Opens a SQLite database and applies Hyperkernel's baseline connection settings.
 *
 * The database is created by SQLite when `path` names a file that does not yet
 * exist. Callers own the returned connection and must close it when finished.
 */
export function openDatabase(
  path: string | URL = ":memory:",
  options: { timeout?: number } = {},
): DatabaseSync {
  if (path === ":memory:") {
    console.warn(
      "Using an in-memory SQLite database. All data will be lost when the process stops.",
    );
  }

  const database = new DatabaseSync(path, {
    timeout: options.timeout ?? 5000,
  });

  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA synchronous = NORMAL");
  database.exec("PRAGMA foreign_keys = ON");

  return database;
}
