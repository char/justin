import {
  concatIR,
  irEmitError,
  irValue,
  registerSchemaCompiler,
  type out,
  type SchemaCompiler,
  type TBox,
} from "../_internal.ts";

/** represents a comptime-known literal value */
export interface LiteralSchema<Literal> {
  readonly type: "literal";
  readonly value: Literal;

  /** @ignore */
  readonly [out]?: TBox<Literal>;
}

const compileLiteral: SchemaCompiler<LiteralSchema<unknown>> = (ctx, schema) =>
  concatIR`if (${irValue} !== ${JSON.stringify(schema.value)}) ${irEmitError(ctx, "must match literal value: " + JSON.stringify(schema.value))};`;

/**
 * a literal value.
 *
 * ```typescript
 * const GreetingSchema = j.union(
 *   j.literal("hello"),
 *   j.literal("hey"),
 *   j.literal("howdy")
 * );
 * type Greeting = j.Infer<typeof GreetingSchema>; // => "hello" | "hey" | "howdy"
 * ```
 */
export const literal: <const Literal>(value: Literal) => LiteralSchema<Literal> =
  /* #__PURE__ */ registerSchemaCompiler("literal", compileLiteral, (value) => ({
    type: "literal",
    value,
  }));
