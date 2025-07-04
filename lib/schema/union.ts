import {
  compileSchema,
  concatIR,
  irEmitError,
  irError,
  registerSchemaCompiler,
  type Flatten,
  type out,
  type SchemaCompiler,
  type TBox,
} from "../_internal.ts";
import type { AnySchema, Infer } from "../schema.ts";

type Values<T> = Flatten<T[keyof T]>;

/** represents a union type, whose constituent types are defined by InSchemas */
export interface UnionSchema<InSchemas extends readonly AnySchema[]> {
  readonly type: "union";
  readonly schemas: InSchemas;

  /** @ignore */
  // prettier-ignore
  readonly [out]?: TBox<Values<{
    [K in keyof InSchemas as
      K extends `${infer N extends number}` ? N : never
    ]: Infer<InSchemas[K]>;
  }>>;
}

const compileUnion: SchemaCompiler<UnionSchema<readonly AnySchema[]>> = (ctx, schema) => {
  const valid = ctx.locals.next();
  const invalidate = ctx.locals.next();

  return concatIR`do {
    let ${valid};
    const ${invalidate} = _err => (${valid} = false);
    ${schema.schemas.flatMap(
      (subschema) => concatIR`
      ${valid} = true;
      ${compileSchema(ctx, subschema).flatMap((it) => (it === irError ? [invalidate] : it))}
      if (${valid}) break;`,
    )}
    ${irEmitError(ctx, "invalid value")};
  } while (false);`;
};

/**
 * a union value.
 *
 * ```typescript
 * const Schema = j.union(j.string, j.number);
 * type T = j.infer<typeof Schema>; // => string | number
 * ```
 */
export const union: <const InSchemas extends readonly AnySchema[]>(
  ...schemas: InSchemas
) => UnionSchema<InSchemas> = /* #__PURE__ */ registerSchemaCompiler(
  "union",
  compileUnion,
  (...schemas) => ({ type: "union", schemas }),
);
