import {
  compileSchema,
  concatIR,
  irEmitError,
  irNext,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

/** represents an array whose contents are represented by Items */
export interface ArraySchema<Items extends AnySchema> {
  readonly type: "array";
  readonly items: Items;

  /** @ignore */
  readonly [out]?: TBox<Infer<Items>[]>;
}

const compileArray: SchemaCompiler<ArraySchema<AnySchema>> = (ctx, schema) => {
  const item = ctx.locals.next();
  return concatIR`if (!Array.isArray(${irValue}))
  ${irEmitError(ctx, "must be an array")};
else {
  for (const ${item} of ${irValue}) {
    ${compileSchema(
      /* TODO: figure out how to get the index in the path (not comptime-known) */
      { ...ctx, path: ctx.path + "[?]" },
      schema.items,
    ).map((it) => (it === irValue ? item : it))}
  }
}
  ${irNext}`;
};

/**
 * an array value.
 *
 * ```typescript
 * const Schema = j.array(j.string);
 * type T = j.Infer<typeof Schema>; // => string[]
 * ```
 */
export const array: <Items extends AnySchema>(items: Items) => ArraySchema<Items> =
  /* #__PURE__ */
  registerSchemaCompiler("array", compileArray, (items) => ({ type: "array", items }));
