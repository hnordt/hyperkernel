# CONTEXT.md

This document defines the current domain language for Hyperkernel.

## Instant

An instant represents a precise point in time.

## Actor

An actor is an entity that performs work in the system.

The current model does not yet distinguish between human, application, agent,
or system actors.

## Object

An object is a declarative schema for a kind of business object.

## Object attribute

An object attribute defines the value type, presentation label, and validation
constraints for a named field in an object schema.

## Event

An event is the immutable historical record of a fact attributed to an actor.

It has a unique identifier, a type, a payload, an actor reference, and the
instant at which the kernel recorded it.

It is not a request to perform work. Commands or actions may cause events to be
recorded, but they are separate concepts and were not formally introduced yet.
