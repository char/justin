import type { AnySchema } from "./schema.ts";

export type I<T> = T;
export type Flatten<T> = I<{ [K in keyof T]: T[K] }>;
export type TBox<T> = { v: T };

export declare const out: unique symbol;
export const compileCacheSymbol: unique symbol = Symbol();

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

  throw new Error("unrecognized schema type: " + schema.type);
}
