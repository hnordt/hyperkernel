import { DatabaseSync } from "node:sqlite";

import type {
  HKObjectType,
  HKObjectAttributes,
  HKObject,
  HKRecord,
} from "./types";

const db = new DatabaseSync(":memory:");

db.exec(`
  CREATE TABLE IF NOT EXISTS Event (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    payload TEXT NOT NULL
  ) STRICT
`);

const insertEvent = db.prepare(
  "INSERT INTO Event (type, payload) VALUES (?, ?)",
);

const selectRecords = db.prepare(
  `SELECT json_extract(payload, '$.record') AS record
   FROM Event
   WHERE type = 'RECORD_CREATED'
     AND json_extract(payload, '$.object.type') = ?
   ORDER BY id DESC`,
);

function object<T extends HKObjectType, U extends HKObjectAttributes>(
  type: T,
  attributes: U,
): HKObject<T, U> {
  return { type, attributes };
}

function all<T extends HKObject>(object: T) {
  return selectRecords
    .all(object.type)
    .flatMap((row) =>
      "record" in row && typeof row.record === "string"
        ? (JSON.parse(row.record) as HKRecord<T>)
        : [],
    );
}

function insert<T extends HKObject>(
  object: T,
  record: Pick<HKRecord<T>, "values">,
) {
  return insertEvent.run(
    "RECORD_CREATED",
    JSON.stringify({
      object,
      record: {
        id: crypto.randomUUID(),
        values: record.values,
      },
    }),
  );
}

const User = object("User", {
  name: {
    type: "string",
    label: "Name",
    required: true,
  },
});

insert(User, {
  values: {
    name: "John",
  },
});

insert(User, {
  values: {
    name: "Alice",
  },
});

console.log(all(User));
