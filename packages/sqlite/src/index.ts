import { DatabaseSync } from "node:sqlite";

/**
 * Opens a SQLite database and applies Hyperkernel's baseline connection settings.
 *
 * The database is created by SQLite when `path` names a file that does not yet
 * exist. Callers own the returned connection and must close it when finished.
 *
 * @param path SQLite database filename. Defaults to `:memory:` when omitted.
 * @param options SQLite connection options.
 * @param options.timeout Maximum time, in milliseconds, to wait for a locked database. Defaults to `5000`.
 */
export function openDatabase(
  path: string | URL = ":memory:",
  options = { timeout: 5000 },
): DatabaseSync {
  if (path === ":memory:") {
    console.warn(
      "Using an in-memory SQLite database. All data will be lost when the process stops.",
    );
  }

  const database = new DatabaseSync(path, { timeout: options.timeout });

  // TODO: Define single-server database ownership: prevent concurrent Hyperkernel
  // instances from sharing a database, preferably through an exclusive lock. This
  // protects the running database from external writes but is not a deployment security
  // boundary. Reconcile it with native daily snapshots and incremental event export to
  // S3; external tools such as Litestream may not access an exclusively locked database.

  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA synchronous = NORMAL");
  database.exec("PRAGMA foreign_keys = ON");

  return database;
}
