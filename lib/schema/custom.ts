import {
  concatIR,
  irEmitError,
  irValue,
  registerSchemaCompiler,
  type out,
  type SchemaCompiler,
  type TBox,
} from "../_internal.ts";

/** represents a value gated by a custom check */
export interface CustomSchema<T> {
  readonly type: "custom";
  readonly check: (value: unknown) => value is T;
  readonly message: string;

  /** @ignore */
  readonly [out]?: TBox<T>;
}

const compileCustom: SchemaCompiler<CustomSchema<unknown>> = (ctx, schema) => {
  const check = ctx.locals.next();
  ctx.custom[check] = schema.check;
  return concatIR`if (!$custom[${JSON.stringify(check)}](${irValue})) ${irEmitError(ctx, schema.message)};`;
};

/**
 * a custom check, gated by a type guard function
 *
 * ```typescript
 * j.custom((v): v is `${string}.com` => typeof v === "string" && v.endsWith(".com"))
 * ```
 */
export const custom: <T>(
  check: (value: unknown) => value is T,
  message?: string,
) => CustomSchema<T> = /* #__PURE__ */ registerSchemaCompiler(
  "custom",
  compileCustom,
  (check, message) => ({
    type: "custom",
    check,
    message: message ?? "must match custom check",
  }),
);
