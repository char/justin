import {
  compileSchema,
  concatIR,
  irNext,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

export interface OptionalSchema<InSchema extends AnySchema> {
  readonly type: "optional";
  readonly schema: InSchema;
  readonly [out]?: TBox<Infer<InSchema> | undefined>;
}

export const compileOptional: SchemaCompiler<OptionalSchema<AnySchema>> = (ctx, schema) =>
  concatIR`if (${irValue} !== undefined) { ${compileSchema(ctx, schema.schema)} }
${irNext}`;

function makeOptional<InSchema extends AnySchema>(schema: InSchema): OptionalSchema<InSchema> {
  return { type: "optional", schema };
}

export const optional = /* #__PURE__ */ registerSchemaCompiler(
  "optional",
  compileOptional,
  makeOptional,
);
