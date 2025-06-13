import {
  concatIR,
  irEmitError,
  irValue,
  registerSchemaCompiler,
  type SchemaCompiler,
} from "../_compile_internal.ts";
import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";

interface BasicSchema<T extends unknown = unknown, TypeName extends string = string> {
  readonly type: TypeName;
  /** @ignore */
  readonly [out]?: TBox<T>;
}

/** represents a number */
export type NumberSchema = BasicSchema<number, "number">;
const compileNumber: SchemaCompiler<NumberSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "number") ${irEmitError(ctx, "must be number")};`;
export const number: NumberSchema =
  /* #__PURE__ */
  registerSchemaCompiler("number", compileNumber, { type: "number" });

/** represents a string */
export type StringSchema = BasicSchema<string, "string">;
const compileString: SchemaCompiler<StringSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "string") ${irEmitError(ctx, "must be string")};`;
export const string: StringSchema =
  /* #__PURE__ */
  registerSchemaCompiler("string", compileString, { type: "string" });

/** represents a boolean */
export type BooleanSchema = BasicSchema<boolean, "boolean">;
const compileBoolean: SchemaCompiler<BooleanSchema> = (ctx, _) =>
  concatIR`if (typeof ${irValue} !== "boolean") ${irEmitError(ctx, "must be boolean")};`;
export const boolean: BooleanSchema =
  /* #__PURE__ */
  registerSchemaCompiler("boolean", compileBoolean, { type: "boolean" });

/** represents a value of some unknown type */
export type UnknownSchema = BasicSchema<unknown, "unknown">;
const compileUnknown: SchemaCompiler<UnknownSchema> = (_ctx, _) => [];
export const unknown: UnknownSchema =
  /* #__PURE__ */
  registerSchemaCompiler("unknown", compileUnknown, { type: "unknown" });
