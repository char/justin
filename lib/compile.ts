import {
  compileSchema,
  irError,
  irNext,
  irValue,
  LocalVariableAllocator,
  type CompileContext,
} from "./_compile_internal.ts";
import type { AnySchema, Infer } from "./schema.ts";

export interface ValidationError {
  path: string;
  msg: string;
}

// prettier-ignore
export type ValidationFunction<Schema extends AnySchema> =
  (x: unknown) =>
    | { value: undefined; errors: ValidationError[] }
    | { value: Infer<Schema>; errors: undefined };

export function compile<Schema extends AnySchema>(schema: Schema): ValidationFunction<Schema> {
  const ctx: CompileContext = { locals: new LocalVariableAllocator(), path: "" };
  const errors = ctx.locals.next();

  const source = [`const ${errors} = [];`];
  const ir = compileSchema(ctx, schema);
  for (let i = 0; i < ir.length; i++) {
    const entry = ir[i];
    if (entry === irValue) ir[i] = "value";
    if (entry === irError) ir[i] = `${errors}.push`;
    if (entry === irNext) ir[i] = "";
  }
  source.push(ir.join(""));
  source.push(`if (${errors}.length) return { errors: ${errors} }`);
  source.push(`return { value }`);

  return new Function("value", source.join("\n")) as ValidationFunction<Schema>;
}
