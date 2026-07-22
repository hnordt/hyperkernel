/**
 * Core domain types.
 *
 * See `CONTEXT.md` at the repository root for domain language and semantics.
 *
 * @packageDocumentation
 */

/**
 * A unique symbol used for branding types in the system.
 */
declare const HKBrandSymbol: unique symbol;

/**
 * Brands `T` at compile time without changing its runtime representation.
 */
type HKBrand<T, U extends `HK${string}`> = T & { readonly [HKBrandSymbol]: U };

/**
 * Represents an instant in time.
 */
export type HKInstant = HKBrand<string, "HKInstant">;

/**
 * Represents a unique identifier for an actor.
 */
export type HKActorId = HKBrand<number, "HKActorId">;

/**
 * Represents an actor in the system.
 */
export type HKActor = {
  id: HKActorId;
};

/**
 * Represents an attribute of an object in the system.
 */
export type HKObjectAttribute =
  | {
      type: "string";
      label: string;
      required?: boolean;
      minLength?: number;
    }
  | {
      type: "number";
      label: string;
      required?: boolean;
      min?: number;
      max?: number;
    }
  | {
      type: "boolean";
      label: string;
      required?: boolean;
    };

/**
 * Represents an object in the system.
 */
export type HKObject<T extends string> = {
  type: T;
  attributes: Record<string, HKObjectAttribute>;
};

/**
 * Represents a unique identifier for an event.
 */
export type HKEventId = HKBrand<number, "HKEventId">;

/**
 * Represents an event in the system.
 */
export type HKEvent<T extends string, U> = {
  id: HKEventId;
  actorId: HKActorId;
  type: T;
  payload: U;
  recordedAt: HKInstant;
};
