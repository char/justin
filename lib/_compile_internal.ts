import type { AnySchema } from "./schema.ts";
import {
  compileBoolean,
  compileNumber,
  compileString,
  compileUnknown,
  type BooleanSchema,
  type NumberSchema,
  type StringSchema,
  type UnknownSchema,
} from "./schema/basic.ts";
import { compileLiteral, type LiteralSchema } from "./schema/literal.ts";
import { compileObject, type ObjectSchema } from "./schema/object.ts";
import { compileOptional, type OptionalSchema } from "./schema/optional.ts";
import { compileUnion, type UnionSchema } from "./schema/union.ts";

/// ⇒ variable name of value being validated
export const irValue: unique symbol = Symbol();
/// ⇒ variable name of error report function
export const irError: unique symbol = Symbol();
/// ⇒ next schema (in case a compiler wants to wrap it in a block or something)
export const irNext: unique symbol = Symbol();

export type IREntry = string | typeof irValue | typeof irError | typeof irNext;
export const concatIR = (
  strings: TemplateStringsArray,
  ...values: (IREntry | IREntry[])[]
): IREntry[] => {
  const results: IREntry[] = [];
  for (let i = 0; i < strings.length; i++) {
    if (strings[i]) results.push(strings[i]);
    const v = values[i];
    if (v !== undefined)
      if (Array.isArray(v)) results.push(...v);
      else results.push(v);
  }
  return results;
};

export const irEmitError = (ctx: CompileContext, message: string): IREntry[] =>
  concatIR`${irError}({ path: ${JSON.stringify(ctx.path)}, msg: ${JSON.stringify(message)} })`;

export interface CompileContext {
  locals: LocalVariableAllocator;
  path: string;
}

export class LocalVariableAllocator {
  counter = 1;
  next(): string {
    let s = "";
    let i = this.counter++;

    while (i > 0) {
      i--;
      s = String.fromCharCode(0x61 + (i % 26)) + s;
      i = Math.floor(i / 26);
    }

    return "_" + s;
  }
}

export type SchemaCompiler<T extends AnySchema> = (ctx: CompileContext, schema: T) => IREntry[];

export function compileSchema(ctx: CompileContext, schema: AnySchema): IREntry[] {
  if (schema.type === "string") return compileString(ctx, schema as StringSchema);
  if (schema.type === "number") return compileNumber(ctx, schema as NumberSchema);
  if (schema.type === "boolean") return compileBoolean(ctx, schema as BooleanSchema);
  if (schema.type === "unknown") return compileUnknown(ctx, schema as UnknownSchema);
  if (schema.type === "union")
    return compileUnion(ctx, schema as UnionSchema<readonly AnySchema[]>);
  if (schema.type === "object")
    return compileObject(ctx, schema as ObjectSchema<Record<string, AnySchema>>);
  if (schema.type === "literal") return compileLiteral(ctx, schema as LiteralSchema<unknown>);
  if (schema.type === "optional")
    return compileOptional(ctx, schema as OptionalSchema<AnySchema>);

  throw new Error("unrecognized schema type");
}
