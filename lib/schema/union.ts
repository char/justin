import {
  compileSchema,
  concatIR,
  irEmitError,
  irError,
  irNext,
  registerSchemaCompiler,
  type IREntry,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { Flatten, TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

type Values<T> = Flatten<T[keyof T]>;

export interface UnionSchema<InSchemas extends readonly AnySchema[]> {
  readonly type: "union";
  readonly schemas: InSchemas;
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

  let subschemaValidation: IREntry[] = [irNext];
  for (const subschema of schema.schemas) {
    const step = [];
    for (let i = 0; i < subschemaValidation.length; i++) {
      const entry = subschemaValidation[i];
      if (entry === irNext) {
        step.push(
          ...concatIR`${valid} = true;
          ${compileSchema(ctx, subschema).flatMap((it) =>
            it === irError
              ? [invalidate]
              : it === irNext
                ? concatIR`if (${valid}) break; ${irNext}`
                : [it],
          )}`,
        );
      } else {
        step.push(entry);
      }
    }
    subschemaValidation = step;
  }

  return concatIR`do {
    let ${valid};
    const ${invalidate} = _err => (${valid} = false);
    ${subschemaValidation}
    ${irEmitError(ctx, "invalid value")};
  } while (false);
  ${irNext}`;
};

export const union: <const InSchemas extends readonly AnySchema[]>(
  ...schemas: InSchemas
) => UnionSchema<InSchemas> = /* #__PURE__ */ registerSchemaCompiler(
  "union",
  compileUnion,
  (...schemas) => ({ type: "union", schemas }),
);
