import type { SQLInputValue } from "node:sqlite";
import { DatabaseSync } from "node:sqlite";
import * as z from "zod";

type HKEvent<TPayload = unknown> = {
  type: string;
  payload: TPayload;
};

type HKProjection<TEvent extends HKEvent = HKEvent> = {
  name: string;
  schema: z.ZodObject;
  apply(event: TEvent): [string, ...SQLInputValue[]] | void;
  all(): [string, ...SQLInputValue[]];
};

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE IF NOT EXISTS Event (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL
  ) STRICT
`);

function createStore<TEvent extends HKEvent = HKEvent>() {
  return function <const TProjection extends HKProjection<TEvent>>(
    projections: TProjection[],
  ) {
    for (const projection of projections) {
      const columns = Object.entries(projection.schema.shape).flatMap(
        ([key, value]) => {
          if (value instanceof z.ZodString) {
            return `${key} TEXT`;
          }

          if (value instanceof z.ZodNumber) {
            return `${key} INTEGER`;
          }

          if (value instanceof z.ZodBoolean) {
            return `${key} BOOLEAN`;
          }

          return [];
        },
      );

      db.exec(`
        CREATE TABLE IF NOT EXISTS ${projection.name} (
          id INTEGER PRIMARY KEY,
          ${columns.join(",\n")}
        ) STRICT
      `);
    }

    return {
      ...projections.reduce(
        (acc, projection) => {
          return {
            ...acc,
            [projection.name]: {
              all() {
                const result = projection.all();

                return z
                  .array(projection.schema)
                  .parse(db.prepare(result[0]).all());
              },
            },
          };
        },
        {} as Record<
          TProjection["name"],
          { all(): z.infer<TProjection["schema"]>[] }
        >,
      ),

      dispatch(event: TEvent) {
        db.exec("BEGIN TRANSACTION");

        try {
          db.prepare("INSERT INTO Event (type, payload) VALUES (?, ?)").run(
            event.type,
            JSON.stringify(event.payload),
          );

          for (const projection of projections) {
            const result = projection.apply(event);

            if (result) {
              db.prepare(result[0]).run(...result.slice(1));
            }
          }

          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");

          throw error;
        }
      },
    };
  };
}

type Event = {
  type: "UserCreated";
  payload: {
    pid: string;
    name: string;
  };
};

const store = createStore<Event>()([
  {
    name: "User",
    schema: z.object({
      pid: z.string(),
      name: z.string(),
    }),
    apply(event) {
      switch (event.type) {
        case "UserCreated": {
          return [
            `INSERT INTO ${this.name} (pid, name) VALUES (?, ?)`,
            event.payload.pid,
            event.payload.name,
          ];
        }
      }
    },
    all() {
      return [`SELECT * FROM ${this.name}`];
    },
  },
]);

store.dispatch({
  type: "UserCreated",
  payload: {
    pid: crypto.randomUUID(),
    name: "John",
  },
});

store.dispatch({
  type: "UserCreated",
  payload: {
    pid: crypto.randomUUID(),
    name: "Alice",
  },
});

const users = store.User.all();

console.log(users);
