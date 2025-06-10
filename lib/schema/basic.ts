import {
  concatIR,
  irEmitError,
  irNext,
  irValue,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { BasicSchema } from "../schema.ts";

export type NumberSchema = BasicSchema<number, "number">;
export const number: NumberSchema = { type: "number" };
export const compileNumber: SchemaCompiler<NumberSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "number") ${irEmitError(ctx, "must be number")};;
  ${irNext}`;

export type StringSchema = BasicSchema<string, "string">;
export const string: StringSchema = { type: "string" };
export const compileString: SchemaCompiler<StringSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "string") ${irEmitError(ctx, "must be string")};
  ${irNext}`;

export type BooleanSchema = BasicSchema<boolean, "boolean">;
export const boolean: BooleanSchema = { type: "boolean" };
export const compileBoolean: SchemaCompiler<BooleanSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "boolean") ${irEmitError(ctx, "must be boolean")};
  ${irNext}`;

export type UnknownSchema = BasicSchema<unknown, "unknown">;
export const unknown: UnknownSchema = { type: "unknown" };
export const compileUnknown: SchemaCompiler<UnknownSchema> = (_ctx, _) => [irNext];
