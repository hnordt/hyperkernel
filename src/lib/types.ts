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
    }
  | {
      type: "relation";
      label: string;
      target: "self" | HKObject;
      required?: boolean;
    };

/**
 * Represents an object in the system.
 */
export type HKObject<
  T extends string = string,
  U extends Record<string, HKObjectAttribute> = Record<
    string,
    HKObjectAttribute
  >,
> = {
  type: T;
  attributes: U;
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
  actorId?: HKActorId;
  type: T;
  payload: U;
  recordedAt: HKInstant;
};

/**
 * Represents a unique identifier for a record.
 */
export type HKRecordId = HKBrand<number, "HKRecordId">;

export type HKRecordValues<T extends HKObject> = {
  [K in keyof T["attributes"]]: {
    string: string;
    number: number;
    boolean: boolean;
    relation: number;
  }[T["attributes"][K]["type"]];
};

/**
 * Represents a record in the system.
 */
export type HKRecord<T extends HKObject> = {
  id: HKRecordId;
  actorId?: HKActorId;
  type: T["type"];
  values: HKRecordValues<T>;
  createdAt: HKInstant;
};
