# Architecture spikes

Files in this directory preserve experiments used to validate an architectural
idea. They are not production modules, public APIs, or supported examples.

The production database boundary lives in `src/lib/server/db` and uses Drizzle
ORM with the `better-sqlite3` driver. A spike may intentionally use a different
API when that difference is the subject of the experiment.
