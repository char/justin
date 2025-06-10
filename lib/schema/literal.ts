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

export interface LiteralSchema<Literal> {
  readonly type: "literal";
  readonly value: Literal;
  readonly [out]?: TBox<Literal>;
}

export const compileLiteral: SchemaCompiler<LiteralSchema<unknown>> = (ctx, schema) =>
  concatIR`if (${irValue} !== ${JSON.stringify(schema.value)}) ${irEmitError(ctx, "must match literal value: " + JSON.stringify(schema.value))};
  ${irNext}`;

function makeLiteral<const Literal>(value: Literal): LiteralSchema<Literal> {
  return { type: "literal", value };
}

export const literal = /* #__PURE__ */ registerSchemaCompiler(
  "literal",
  compileLiteral,
  makeLiteral,
);
