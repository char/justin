import {
  compileSchema,
  irError,
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
  const ctx: CompileContext = { locals: new LocalVariableAllocator(), path: "", custom: {} };
  const errors = ctx.locals.next();

  const source = [`const ${errors} = [];`];
  const ir = compileSchema(ctx, schema);
  for (let i = 0; i < ir.length; i++) {
    const entry = ir[i];
    if (entry === irValue) ir[i] = "$value";
    if (entry === irError) ir[i] = `${errors}.push`;
  }
  source.push(ir.join(""));
  source.push(`if (${errors}.length) return { errors: ${errors} }`);
  source.push(`return { value: $value }`);

  const outer = new Function(
    "$custom",
    `return ($value) => {
  ${source.join("\n")}
}`,
  );
  const inner = outer(ctx.custom);
  return inner as ValidationFunction<Schema>;
}
