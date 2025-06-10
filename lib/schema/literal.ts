import {
  concatIR,
  irEmitError,
  irNext,
  irValue,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";

export interface LiteralSchema<Literal> {
  readonly type: "literal";
  readonly value: Literal;
  readonly [out]?: TBox<Literal>;
}

export function literal<const Literal>(value: Literal): LiteralSchema<Literal> {
  return { type: "literal", value };
}

export const compileLiteral: SchemaCompiler<LiteralSchema<unknown>> = (ctx, schema) =>
  concatIR`if (${irValue} !== ${JSON.stringify(schema.value)}) ${irEmitError(ctx, "must match literal value: " + JSON.stringify(schema.value))};
  ${irNext}`;
