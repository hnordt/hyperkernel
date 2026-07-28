import { DatabaseSync } from "node:sqlite";
import { expect, test, vi } from "vitest";
import { openDatabase } from "@hyperkernel/sqlite";

test("opens an in-memory SQLite database by default", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const database = openDatabase(undefined);

  try {
    expect(database).toBeInstanceOf(DatabaseSync);
    expect(warn).toHaveBeenCalledWith(
      "Using an in-memory SQLite database. All data will be lost when the process stops.",
    );
    expect(database.prepare("PRAGMA foreign_keys").get()).toEqual({
      foreign_keys: 1,
    });
  } finally {
    database.close();
    warn.mockRestore();
  }
});
