import {
  compileSchema,
  concatIR,
  irEmitError,
  irError,
  irValue,
  registerSchemaCompiler,
  type Flatten,
  type out,
  type SchemaCompiler,
  type TBox,
} from "../_internal.ts";
import type { AnySchema, Infer } from "../schema.ts";
import type { LiteralSchema } from "./literal.ts";
import type { ObjectSchema } from "./object.ts";

type Values<T> = Flatten<T[keyof T]>;
export interface DiscriminatedUnionSchema<
  InSchemas extends readonly ObjectSchema<Record<string, AnySchema>>[],
> {
  readonly type: "d-union";
  readonly discriminant: string;
  readonly schemas: InSchemas;

  /** @ignore */
  // prettier-ignore
  readonly [out]?: TBox<Values<{
    [K in keyof InSchemas as
      K extends `${infer N extends number}` ? N : never
    ]: Infer<InSchemas[K]>;
  }>>;
}

const compileDiscriminatedUnion: SchemaCompiler<
  DiscriminatedUnionSchema<readonly ObjectSchema<Record<string, AnySchema>>[]>
> = (ctx, schema) => {
  const suberrors = ctx.locals.next();
  const suberror = ctx.locals.next();

  return concatIR`switch (${irValue}[${JSON.stringify(schema.discriminant)}]) {
    ${schema.schemas.flatMap((subschema) => {
      const discriminant = subschema.shape[schema.discriminant] as LiteralSchema<any>;
      if (discriminant.type !== "literal") {
        throw new Error("union discriminant must be a LiteralSchema");
      }

      return concatIR`
      case ${JSON.stringify(discriminant.value)}: {
        const ${suberrors} = [];
        ${compileSchema(ctx, subschema).flatMap((it) => (it === irError ? [suberrors, ".push"] : it))}
        for (const ${suberror} of ${suberrors}) {
          ${irError}(${suberror});
        }
        break;
      }`;
    })}
    default: {
      ${irEmitError({ ...ctx, path: ctx.path + "." }, "unknown union variant")};
      break;
    }
  }`;
};

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
export const discriminatedUnion: <
  const InSchemas extends readonly ObjectSchema<Record<string, AnySchema>>[],
>(
  discriminant: string,
  schemas: InSchemas,
) => DiscriminatedUnionSchema<InSchemas> = /* #__PURE__ */ registerSchemaCompiler(
  "d-union",
  compileDiscriminatedUnion,
  (discriminant, schemas) => ({ type: "d-union", discriminant, schemas }),
);
