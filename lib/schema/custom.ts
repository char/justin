import {
  concatIR,
  irEmitError,
  irNext,
  irValue,
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

export function custom<T>(
  check: (value: unknown) => value is T,
  message: string = "must match custom check",
): CustomSchema<T> {
  return { type: "custom", check, message };
}

export const compileCustom: SchemaCompiler<CustomSchema<unknown>> = (ctx, schema) => {
  const check = ctx.locals.next();
  ctx.custom[check] = schema.check;
  return concatIR`if (!$custom[${JSON.stringify(check)}](${irValue})) ${irEmitError(ctx, schema.message)};
  ${irNext}`;
};
