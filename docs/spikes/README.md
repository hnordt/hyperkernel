# Architecture spikes

Files in this directory preserve experiments used to validate an architectural
idea. They are not production modules, public APIs, or supported examples.

The production database boundary lives in
`apps/playground/src/lib/server/db` and uses the built-in `node:sqlite` module.
The event-sourcing and projection layer is still being designed; spikes may
explore its contracts without becoming supported production APIs.
