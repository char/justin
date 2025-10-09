export declare const underlyingType: unique symbol;

export type AnySchema = {
  readonly type: string;
  readonly [underlyingType]?: [unknown];
};
export type Infer<T> = T extends AnySchema ? NonNullable<T[typeof underlyingType]>[0] : never;

interface BasicSchema<T extends unknown = unknown, TypeName extends string = string> {
  readonly type: TypeName;
  readonly [underlyingType]?: [T];
}
/** represents a number */
export type NumberSchema = BasicSchema<number, "number">;
/** represents a string */
export type StringSchema = BasicSchema<string, "string">;
/** represents a boolean */
export type BooleanSchema = BasicSchema<boolean, "boolean">;
/** represents an unknown value */
export type UnknownSchema = BasicSchema<unknown, "unknown">;
/** a number */
export const number: NumberSchema = { type: "number" };
/** a string */
export const string: StringSchema = { type: "string" };
/** a boolean */
export const boolean: BooleanSchema = { type: "boolean" };
/** an unknown value */
export const unknown: UnknownSchema = { type: "unknown" };

type Literal = number | string | boolean | null | undefined;
/** represents a compile-time-known literal value */
export interface LiteralSchema<T extends Literal> {
  readonly type: "literal";
  readonly [underlyingType]?: [T];
  readonly value: T;
}
/** a literal value
 *
 * ```typescript
 * const GreetingSchema = j.union(
 *   j.literal("hello"),
 *   j.literal("hey"),
 *   j.literal("howdy"),
 * );
 * type Greeting = j.Infer<typeof GreetingSchema>; // => "hello" | "hey" | "howdy"
 * ```
 */
export const literal = <const T extends Literal>(value: T): LiteralSchema<T> => ({ type: "literal", value });

/** the literal null */
const _null: LiteralSchema<null> = literal(null);
/** the literal undefined */
const _undefined: LiteralSchema<undefined> = literal(undefined);
export { _null as null, _undefined as undefined };

/** represents an array whose contents are represented by Subschema */
export interface ArraySchema<Subschema extends AnySchema = AnySchema> {
  readonly type: "array";
  readonly subschema: Subschema;
  readonly [underlyingType]?: [Infer<Subschema>[]];
}
/** an array */
export const array = <const Subschema extends AnySchema>(subschema: Subschema): ArraySchema<Subschema> => ({
  type: "array",
  subschema,
});

// prettier-ignore
type InferTuple<Schemas extends readonly AnySchema[]> =
  Schemas extends readonly [infer S extends AnySchema, ...infer Rest extends readonly AnySchema[]]
    ? [Infer<S>, ...InferTuple<Rest>]
    : [];
/** represents a tuple whose contents are represented by individual subschemas */
export interface TupleSchema<Subschemas extends readonly AnySchema[] = AnySchema[]> {
  readonly type: "tuple";
  readonly schemas: Subschemas;
  readonly [underlyingType]?: [InferTuple<Subschemas>];
}
/** a tuple value */
export const tuple = <const Subschemas extends readonly AnySchema[]>(
  ...schemas: Subschemas
): TupleSchema<Subschemas> => ({ type: "tuple", schemas });

/** represents a union type, whose constituent types are defined by Subschemas */
export interface UnionSchema<Subschemas extends readonly AnySchema[] = AnySchema[]> {
  readonly type: "union";
  readonly schemas: Subschemas;
  readonly [underlyingType]?: [Infer<Subschemas[number]>];
}
/**
 * a union value.
 * ```typescript
 * const Schema = j.union(j.string, j.number)
 * type T = j.Infer<typeof Schema>; // => string | number
 * ```
 */
export const union = <const Subschemas extends readonly AnySchema[]>(
  ...schemas: Subschemas
): UnionSchema<Subschemas> => ({ type: "union", schemas });

type Identity<T> = T; // don't worry kitten
type Flatten<T> = Identity<{ [K in keyof T]: T[K] }>;
/** represents an object of some known shape */
export interface ObjectSchema<Shape extends Record<string, AnySchema> = Record<string, AnySchema>> {
  readonly type: "object";
  readonly shape: Shape;

  // prettier-ignore
  readonly [underlyingType]?: [
    // flatten<non-optionals & optionals>
    Flatten<
      { -readonly [K in keyof Shape as Shape[K] extends OptionalSchema ? never : K]:  Infer<Shape[K]>; } &
      { -readonly [K in keyof Shape as Shape[K] extends OptionalSchema ? K : never]?: Infer<Shape[K]>; }
    >,
  ];
}
/**
 * an object value.
 *
 * ```typescript
 * const PlayerSchema = j.obj({
 *   name: j.string,
 *   level: j.number,
 * });
 * type Player = j.Infer<typeof PlayerSchema>; // => { name: string, level: number }
 * ```
 */
export const obj = <const Shape extends Record<string, AnySchema>>(shape: Shape): ObjectSchema<Shape> => ({
  type: "object",
  shape,
});

/** represents a discriminated union of object types */
export interface DiscriminatedUnionSchema<Subschemas extends readonly ObjectSchema[] = ObjectSchema[]> {
  readonly type: "d-union";
  readonly discriminant: string;
  readonly schemas: Subschemas;
  readonly [underlyingType]?: [Infer<Subschemas[number]>];
}
/**
 * a discriminated union of object values.
 *
 * compiles to a `switch` statement, so the discriminant must be a `j.literal` in each case.
 *
 * ```typescript
 * const Schema = j.discriminatedUnion("t", [
 *   j.obj({ t: j.literal("1"), a: j.string }),
 *   j.obj({ t: j.literal("2"), b: j.string }),
 *   j.obj({ t: j.literal("3"), c: j.string }),
 * ]);
 * ```
 */
export const discriminatedUnion = <const Subschemas extends readonly ObjectSchema[]>(
  discriminant: string,
  ...schemas: Subschemas
) => ({ type: "d-union", discriminant, schemas });

/** represents a value which may be undefined (or not provided at all, e.g. in an object),
 *  but is otherwise represented by Subschema */
export interface OptionalSchema<Subschema extends AnySchema = AnySchema> {
  readonly type: "optional";
  readonly subschema: Subschema;
  readonly [underlyingType]?: [Infer<Subschema> | undefined];
}
/**
 * an optional value.
 *
 * ```typescript
 * const Schema = j.optional(j.string);
 * type T = j.Infer<typeof MaybeStringSchema>; // => string | undefined
 * ```
 */
export const optional = <const Subschema extends AnySchema>(subschema: Subschema): OptionalSchema<Subschema> => ({
  type: "optional",
  subschema,
});

/** represents a value gated by a custom check */
export interface CustomSchema<T> {
  readonly type: "custom";
  validate?: (x: unknown) => x is T;
  validateMessage?: string;
  equality?: (a: T, b: T) => boolean;
  readonly [underlyingType]?: [T];
}
/**
 * a custom check, gated by a type guard function
 *
 * ```typescript
 * j.custom((v): v is `${string}.com` => typeof v === "string" && v.endsWith(".com"))
 * ```
 */
export const custom = <T>(
  validate?: (x: unknown) => x is T,
  validateMessage?: string,
  equality?: (a: T, b: T) => boolean,
): CustomSchema<T> => ({
  type: "custom",
  validate,
  validateMessage,
  equality,
});

export * as validation from "./validation.ts";
export * as equality from "./equality.ts";
