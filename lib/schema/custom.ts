import {
  concatIR,
  irEmitError,
  irNext,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";

export interface CustomSchema<T> {
  readonly type: "custom";
  readonly check: (value: unknown) => value is T;
  readonly message: string;
  readonly [out]?: TBox<T>;
}

export const compileCustom: SchemaCompiler<CustomSchema<unknown>> = (ctx, schema) => {
  const check = ctx.locals.next();
  ctx.custom[check] = schema.check;
  return concatIR`if (!$custom[${JSON.stringify(check)}](${irValue})) ${irEmitError(ctx, schema.message)};
  ${irNext}`;
};

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
