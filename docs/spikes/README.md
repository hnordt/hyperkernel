# Architecture spikes

Files in this directory preserve experiments used to validate an architectural
idea. They are not production modules, public APIs, or supported examples.

The production database boundary lives in `src/lib/server/db` and uses the
built-in `node:sqlite` module. The event-sourcing and projection layer is still
being designed; spikes may explore its contracts without becoming supported
production APIs.

## Preserved work

- [`event-sourcing.ts`](event-sourcing.ts) is the original isolated event and
  projection code spike.
- [Hyperkernel experiment retrospective](hyperkernel-experiment-retrospective.md)
  records what the external command, event, projection, benchmark, event-log,
  and time-travel experiment demonstrated, what it did not prove, and which
  lessons should inform the official implementation.
