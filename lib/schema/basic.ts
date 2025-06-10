import {
  concatIR,
  irEmitError,
  irNext,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { BasicSchema } from "../schema.ts";

export type NumberSchema = BasicSchema<number, "number">;
export const compileNumber: SchemaCompiler<NumberSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "number") ${irEmitError(ctx, "must be number")};;
  ${irNext}`;
export const number: NumberSchema =
  /* #__PURE__ */
  registerSchemaCompiler("number", compileNumber, { type: "number" });

export type StringSchema = BasicSchema<string, "string">;
export const compileString: SchemaCompiler<StringSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "string") ${irEmitError(ctx, "must be string")};
  ${irNext}`;
export const string: StringSchema =
  /* #__PURE__ */
  registerSchemaCompiler("string", compileString, { type: "string" });

export type BooleanSchema = BasicSchema<boolean, "boolean">;
export const compileBoolean: SchemaCompiler<BooleanSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "boolean") ${irEmitError(ctx, "must be boolean")};
  ${irNext}`;
export const boolean: BooleanSchema =
  /* #__PURE__ */
  registerSchemaCompiler("boolean", compileBoolean, { type: "boolean" });

export type UnknownSchema = BasicSchema<unknown, "unknown">;
export const compileUnknown: SchemaCompiler<UnknownSchema> = (_ctx, _) => [irNext];
export const unknown: UnknownSchema =
  /* #__PURE__ */
  registerSchemaCompiler("unknown", compileUnknown, { type: "unknown" });
