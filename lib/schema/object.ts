import {
  compileSchema,
  concatIR,
  irEmitError,
  irNext,
  irValue,
  registerSchemaCompiler,
  type IREntry,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { Flatten, TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

/** represents an object of some known shape */
export interface ObjectSchema<Shape extends Record<string, AnySchema>> {
  readonly type: "object";
  readonly shape: Shape;

  /** @ignore */
  // prettier-ignore
  readonly [out]?: TBox<Flatten<
    { [K in keyof Shape as undefined extends Infer<Shape[K]> ? never : K]:  Infer<Shape[K]> } &
    { [K in keyof Shape as undefined extends Infer<Shape[K]> ? K : never]?: Infer<Shape[K]> }
  >>;
}

const compileObject: SchemaCompiler<ObjectSchema<Record<string, AnySchema>>> = (
  ctx,
  schema,
) => {
  const obj = ctx.locals.next();

  let subschemaValidation: IREntry[] = [irNext];
  for (const [key, subschema] of Object.entries(schema.shape)) {
    const step: IREntry[] = [];
    for (let i = 0; i < subschemaValidation.length; i++) {
      const entry = subschemaValidation[i];
      if (entry === irNext) {
        step.push(
          ...compileSchema({ ...ctx, path: ctx.path + "." + key }, subschema).map((it) =>
            it === irValue ? `${obj}[${JSON.stringify(key)}]` : it,
          ),
        );
      } else {
        step.push(entry);
      }
    }
    subschemaValidation = step;
  }

  return concatIR`const ${obj} = ${irValue}
  if (typeof ${obj} !== "object" || ${obj} === null) {
    ${irEmitError({ ...ctx, path: ctx.path + "." }, "must be object")};
  } else {
    ${subschemaValidation}
  }
  ${irNext}`;
};

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
export const obj: <Shape extends Record<string, AnySchema>>(
  shape: Shape,
) => ObjectSchema<Shape> = /* #__PURE__ */ registerSchemaCompiler(
  "object",
  compileObject,
  (shape) => ({ type: "object", shape }),
);
