import {
  compileSchema,
  concatIR,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

/** represents a value which may additionally be undefined, but is otherwise represented by InSchema */
export interface OptionalSchema<InSchema extends AnySchema> {
  readonly type: "optional";
  readonly schema: InSchema;

  /** @ignore */
  readonly [out]?: TBox<Infer<InSchema> | undefined>;
}

const compileOptional: SchemaCompiler<OptionalSchema<AnySchema>> = (ctx, schema) =>
  concatIR`if (${irValue} !== undefined) { ${compileSchema(ctx, schema.schema)} }`;

/**
 * an optional value.
 *
 * ```typescript
 * const Schema = j.optional(j.string);
 * type T = j.Infer<typeof MaybeStringSchema>; // => string | undefined
 * ```
 */
export const optional: <InSchema extends AnySchema>(
  schema: InSchema,
) => OptionalSchema<InSchema> = /* #__PURE__ */ registerSchemaCompiler(
  "optional",
  compileOptional,
  (schema) => ({ type: "optional", schema }),
);
