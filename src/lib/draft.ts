import { DatabaseSync } from "node:sqlite";
import * as z from "zod";

const db = new DatabaseSync(":memory:");

const sql = db.createTagStore();

db.exec(`
  CREATE TABLE IF NOT EXISTS Event (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL
  ) STRICT
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Object (
    id INTEGER PRIMARY KEY,
    eventId INTEGER NOT NULL REFERENCES Event(id),
    pid TEXT NOT NULL,
    type TEXT NOT NULL,
    state TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
  ) STRICT
`);

function object<T extends string, U extends z.ZodObject>(type: T, schema: U) {
  return {
    all() {
      return sql.all`SELECT pid, state FROM Object WHERE type = ${type}`.map(
        (row) => ({
          pid: String(row.pid),
          ...schema.parse(
            typeof row.state === "string" && JSON.parse(row.state),
          ),
        }),
      );
    },

    get(pid: string) {
      const row = sql.get`SELECT state FROM Object WHERE pid = ${pid}`;

      if (!row) {
        throw new Error(`Object with pid ${pid} and type ${type} not found`);
      }

      return {
        pid,
        ...schema.parse(typeof row.state === "string" && JSON.parse(row.state)),
      };
    },

    // @todo: currently we have a naive projection mechanism
    insert(data: z.infer<U>) {
      const event = {
        type: "ObjectCreated",
        payload: { pid: crypto.randomUUID(), type, data },
      };

      const { lastInsertRowid: eventId } =
        sql.run`INSERT INTO Event (type, payload) VALUES (${event.type}, ${JSON.stringify(
          event.payload,
        )})`;

      sql.run`INSERT INTO Object (eventId, pid, type, state) VALUES (${eventId}, ${event.payload.pid}, ${event.payload.type}, ${JSON.stringify(
        event.payload.data,
      )})`;

      return event.payload;
    },

    // @todo: currently we have a naive projection mechanism
    update(pid: string, data: Partial<z.infer<U>>) {
      const event = {
        type: "ObjectUpdated",
        payload: { pid, type, data },
      };

      const { lastInsertRowid: eventId } =
        sql.run`INSERT INTO Event (type, payload) VALUES (${event.type}, ${JSON.stringify(
          event.payload,
        )})`;

      // @todo: transaction
      const existing = sql.get`SELECT state FROM Object WHERE pid = ${pid} AND type = ${type}`;

      if (!existing) {
        throw new Error(`Object with pid ${pid} and type ${type} not found`);
      }

      sql.run`UPDATE Object SET eventId = ${eventId}, state = ${JSON.stringify({
        ...(typeof existing.state === "string" && JSON.parse(existing.state)),
        ...data,
      })}, version = version + 1 WHERE pid = ${event.payload.pid} AND type = ${type}`;

      return event.payload;
    },

    // @todo: currently we have a naive projection mechanism
    delete(pid: string) {
      const event = {
        type: "ObjectDeleted",
        payload: { pid },
      };

      sql.run`INSERT INTO Event (type, payload) VALUES (${event.type}, ${JSON.stringify(
        event.payload,
      )})`;

      sql.run`DELETE FROM Object WHERE pid = ${pid} AND type = ${type}`;
    },
  };
}

const User = object(
  "User",
  z.strictObject({
    name: z.string().min(1),
  }),
);

const inserted = User.insert({
  name: "Alice",
});

const updated = User.update(inserted.pid, {
  name: "John",
});

const user = User.get(inserted.pid);

const users = User.all();

console.log({
  inserted,
  updated,
  user,
  users,
  events: sql.all`SELECT * FROM Event`.map((row) => ({ ...row })),
  objects: sql.all`SELECT * FROM Object`.map((row) => ({ ...row })),
});
