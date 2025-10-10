import { type ConcreteSchema, counterToString, irTemplate, literal, traversal } from "./_util.ts";
import type { AnySchema, Infer, LiteralSchema } from "./mod.ts";

const valueA: unique symbol = Symbol();
const valueB: unique symbol = Symbol();
const userData: unique symbol = Symbol();
type IRNode = string | typeof valueA | typeof valueB | typeof userData;
const ir = (strings: TemplateStringsArray, ...values: (IRNode | IRNode[])[]) => {
  return irTemplate<IRNode>(strings, ...values);
};

type CompileContext = { locals: [number]; userData: Record<string, unknown> };

// macros
const nextLocal = (ctx: CompileContext) => counterToString(++ctx.locals[0]);
const primitiveEq = ir`if (${valueA} !== ${valueB}) return false;`;

type SchemaCompiler<T extends AnySchema = AnySchema> = (ctx: CompileContext, schema: T) => IRNode[];
type CompilerMap = { readonly [T in ConcreteSchema["type"]]: SchemaCompiler<ConcreteSchema & { type: T }> };

const findCompiler = (type: string): SchemaCompiler => {
  if (!(type in compilers)) throw new Error("unsupported schema type: " + type);
  return compilers[type as keyof CompilerMap] as SchemaCompiler;
};
const compilers: CompilerMap = {
  boolean: (_c, _s) => primitiveEq,
  number: (_c, _s) => primitiveEq,
  string: (_c, _s) => primitiveEq,
  literal: (_c, _s) => primitiveEq,
  unknown: (_c, _s) => [],
  array: (ctx, schema) => {
    const subcompiler = findCompiler(schema.subschema.type);

    const idx = nextLocal(ctx);

    // prettier-ignore
    return ir`
      if (${valueA}.length !== ${valueB}.length) return false;
      for (let ${idx} = 0; ${idx} < ${valueA}.length; idx++) {
        ${subcompiler(ctx, schema.subschema)
          .flatMap(it => (it === valueA || it === valueB) ? ir`${it}[${idx}]` : it)}
      }
    `;
  },
  tuple: (ctx, schema) => {
    return ir`
      ${schema.schemas.flatMap((subschema, index) => {
        const subcompiler = findCompiler(subschema.type);
        return subcompiler(ctx, subschema).flatMap(it =>
          it === valueA || it === valueB ? ir`${it}[${literal(index)}]` : it,
        );
      })}
    `;
  },
  optional: (ctx, schema) => {
    const subcompiler = findCompiler(schema.subschema.type);
    return ir`
      if ((${valueA} === undefined) != (${valueB} === undefined)) return false;
      else if (${valueA} !== undefined) {
        ${subcompiler(ctx, schema.subschema)}
      }
    `;
  },
  object: (ctx, schema) => {
    return ir`
      ${Object.entries(schema.shape).flatMap(([key, subschema]) => {
        const subcompiler = findCompiler(subschema.type);
        const out = subcompiler(ctx, subschema).flatMap(it =>
          it === valueA || it === valueB ? ir`${it}${traversal(key)}` : it,
        );
        out.unshift("\n");
        return out;
      })}
    `;
  },
  union: (_c, _s) => {
    throw new Error("generating equality functions for bare unions is not yet supported");
  },
  "d-union": (ctx, schema) => {
    return ir`
      if (${valueA}${traversal(schema.discriminant)} !== ${valueB}${traversal(schema.discriminant)}) return false;
      switch (${valueA}${traversal(schema.discriminant)}) {
      ${schema.schemas.flatMap(subschema => {
        const key = subschema.shape[schema.discriminant] as LiteralSchema<any>;
        if (key.type !== "literal") throw new Error("union discriminant must be a LiteralSchema");
        const subcompiler = findCompiler(subschema.type);
        return ir`
        case ${literal(key.value)}: {
          ${subcompiler(ctx, subschema)}
          break;
        }
        `;
      })}
      }
    `;
  },
  custom: (ctx, schema) => {
    if (!schema.equality) throw new Error("unresolvable custom schema");
    const eq = nextLocal(ctx);
    ctx.userData[eq] = schema.equality;
    return ir`if (!${userData}${traversal(eq)}) return false;`;
  },
};

export type EqualityFunction<Schema extends AnySchema> = (a: Infer<Schema>, b: Infer<Schema>) => boolean;
export function compile<Schema extends AnySchema>(schema: Schema): EqualityFunction<Schema> {
  const ctx: CompileContext = { locals: [0], userData: {} };

  const compiler = findCompiler(schema.type);
  const ir = compiler(ctx, schema);
  for (let i = 0; i < ir.length; i++) {
    if (ir[i] === valueA) ir[i] = "a";
    else if (ir[i] === valueB) ir[i] = "b";
    else if (ir[i] === userData) ir[i] = "userData";
  }

  const source: string[] = [];
  source.push(ir.join(""));
  source.push("return true;");

  const outer = new Function(
    "userData",
    `return (a, b) => {
      ${source.join("\n")}
    }`,
  );
  const f = outer(ctx.userData);
  return f as EqualityFunction<Schema>;
}
