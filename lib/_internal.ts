import type { AnySchema } from "./schema.ts";

export type I<T> = T;
export type Flatten<T> = I<{ [K in keyof T]: T[K] }>;
export type TBox<T> = { v: T };

export declare const out: unique symbol;

/// ⇒ variable name of value being validated
export const irValue: unique symbol = Symbol();
/// ⇒ variable name of error report function
export const irError: unique symbol = Symbol();

export type IREntry = string | typeof irValue | typeof irError;
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
  custom: Record<string, unknown>;
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

    return s;
  }
}

export type SchemaCompiler<T extends AnySchema> = (ctx: CompileContext, schema: T) => IREntry[];

const compilers = new Map<string, SchemaCompiler<any>>();
export function registerSchemaCompiler<T>(
  type: string,
  compiler: SchemaCompiler<any>,
  factory: T,
): T {
  compilers.set(type, compiler);
  return factory;
}

export function compileSchema(ctx: CompileContext, schema: AnySchema): IREntry[] {
  const compiler = compilers.get(schema.type);
  if (compiler) return compiler(ctx, schema);

  /* if (schema.type === "string") return compileString(ctx, schema as StringSchema);
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
  if (schema.type === "custom") return compileCustom(ctx, schema as CustomSchema<unknown>); */

  throw new Error("unrecognized schema type: " + schema.type);
}
