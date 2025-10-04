import type { LiteralSchema, AnySchema, Infer } from "./mod.ts";
import {
  counterToString,
  traversal,
  literal,
  type ConcreteSchema,
  renderTemplateString,
  type TemplateStringPiece,
} from "./_util.ts";

const value: unique symbol = Symbol();
const error: unique symbol = Symbol();
const userData: unique symbol = Symbol();
type IRNode = string | typeof value | typeof error | typeof userData;

const ir = (strings: TemplateStringsArray, ...values: (IRNode | IRNode[])[]): IRNode[] => {
  const nodes: IRNode[] = [];
  for (let i = 0; i < strings.length; i++) {
    if (strings[i]) nodes.push(strings[i]);
    const v = values[i];
    if (v !== undefined) {
      if (Array.isArray(v)) nodes.push(...v);
      else nodes.push(v);
    }
  }
  return nodes;
};

type CompileContext = { locals: [number]; path: TemplateStringPiece<IRNode>[]; userData: Record<string, unknown> };

// macros
const nextLocal = (ctx: CompileContext) => counterToString(++ctx.locals[0]);
const emitError = (ctx: CompileContext, message: string) =>
  ir`${error}({ path: ${renderTemplateString<IRNode>(ctx.path)}, msg: ${literal(message)} })`;
const ensureTypeof = (ctx: CompileContext, t: string) =>
  ir`if (typeof ${value} !== ${literal(t)}) ${emitError(ctx, `must be type '${t}'`)}`;

type SchemaCompiler<T extends AnySchema = AnySchema> = (ctx: CompileContext, schema: T) => IRNode[];
type CompilerMap = { readonly [T in ConcreteSchema["type"]]: SchemaCompiler<ConcreteSchema & { type: T }> };

const findCompiler = (type: string): SchemaCompiler => {
  if (!(type in compilers)) throw new Error("unsupported schema type: " + type);
  return compilers[type as keyof CompilerMap] as SchemaCompiler;
};
const compilers: CompilerMap = {
  number: (ctx, _n) => ensureTypeof(ctx, "number"),
  string: (ctx, _s) => ensureTypeof(ctx, "string"),
  boolean: (ctx, _s) => ensureTypeof(ctx, "boolean"),
  unknown: (_ctx, _u) => [],
  literal: (ctx, schema) =>
    ir`if (${value} !== ${literal(schema.value)}) ${emitError(ctx, "must match literal value: " + literal(schema.value))}`,
  array: (ctx, schema) => {
    const subcompiler = findCompiler(schema.subschema.type);
    const item = nextLocal(ctx);
    const index = nextLocal(ctx);
    return ir`if (!Array.isArray(${value})) ${emitError(ctx, "must be an array")}; else {
      let ${index} = 0;
      for (const ${item} of ${value}) {
        ${subcompiler(
          {
            ...ctx,
            path: [...ctx.path, "[", { interpolate: [index] }, "]"],
          },
          schema.subschema,
        ).map(it => (it === value ? item : it))};
        ${index}++;
      }
    }`;
  },
  tuple: (ctx, schema) => {
    const item = nextLocal(ctx);

    return ir`if (!Array.isArray(${value})) ${emitError(ctx, "must be an array")}; else {
      let ${item};
      ${schema.schemas.flatMap((subschema, index) => {
        const subcompiler = findCompiler(subschema.type);
        return ir`
          ${item} = ${value}[${literal(index)}];
          ${subcompiler({ ...ctx, path: [...ctx.path, "[", literal(index), "]"] }, subschema).map(it => (it === value ? item : it))}
        `;
      })}
    }`;
  },
  union: (ctx, schema) => {
    const valid = nextLocal(ctx);
    const invalidate = nextLocal(ctx);

    return ir`do {
      let ${valid};
      const ${invalidate} = _err => (${valid} = false);
      ${schema.schemas.flatMap(subschema => {
        const subcompiler = findCompiler(subschema.type);
        return ir`
          ${valid} = true;
          ${subcompiler(ctx, subschema).map(it => (it === error ? invalidate : it))}
          if (${valid}) break;`;
      })}
      ${emitError(ctx, "invalid value")}
    } while (false);`;
  },
  object: (ctx, schema) => {
    const obj = nextLocal(ctx);
    return ir`const ${obj} = ${value};
      if (typeof ${obj} !== "object" || ${obj} === null) {
        ${emitError(ctx, "must be object")};
      } else {
        ${Object.entries(schema.shape).flatMap(([key, subschema]) => {
          const subcompiler = findCompiler(subschema.type);
          return [
            "\n",
            ...subcompiler({ ...ctx, path: [...ctx.path, ".", key] }, subschema).map(it =>
              it === value ? `${obj}${traversal(key)}` : it,
            ),
          ];
        })}
      }`;
  },
  "d-union": (ctx, schema) => {
    const suberrors = nextLocal(ctx);
    const suberror = nextLocal(ctx);
    return ir`switch (${value}${traversal(schema.discriminant)}) {
      ${schema.schemas.flatMap(subschema => {
        const key = subschema.shape[schema.discriminant] as LiteralSchema<any>;
        if (key.type !== "literal") throw new Error("union discriminant must be a LiteralSchema");
        const subcompiler = findCompiler(subschema.type);
        return ir`
        case ${literal(key.value)}: {
          const ${suberrors} = [];
          ${subcompiler(ctx, subschema).flatMap(it => (it === error ? [suberrors, ".push"] : it))}
          for (const ${suberror} of ${suberrors}) {
            ${error}(${suberror});
          }
          break;
        }
        `;
      })}
      default: {
        ${emitError(ctx, "unknown union variant")};
        break;
      }
    }`;
  },
  optional: (ctx, schema) => {
    const subcompiler = findCompiler(schema.subschema.type);
    return ir`if (${value} !== undefined) { ${subcompiler(ctx, schema.subschema)} }`;
  },
  custom: (ctx, schema) => {
    if (schema.validate === undefined) throw new Error(`custom schema is missing validation function`);
    const check = nextLocal(ctx);
    ctx.userData[check] = schema.validate;
    return ir`if (!${userData}${traversal(check)}(${value})) ${emitError(ctx, schema.validateMessage ?? "must pass custom check")}`;
  },
};

/** a schema validation function */
export type SchemaValidator<Schema extends AnySchema> = (
  x: unknown,
) =>
  | { value?: undefined; errors: { readonly path: string; readonly msg: string }[] }
  | { value: Infer<Schema>; errors?: undefined };

/** compile a validation function from a given schema. returns a {@link SchemaValidator} */
export function compile<Schema extends AnySchema>(schema: Schema): SchemaValidator<Schema> {
  const ctx: CompileContext = { locals: [0], path: [], userData: {} };
  const errors = nextLocal(ctx);
  const source = [`const ${errors} = [];`];

  const compiler = findCompiler(schema.type);
  const ir = compiler(ctx, schema);
  for (let i = 0; i < ir.length; i++) {
    if (ir[i] === value) ir[i] = "value";
    if (ir[i] === error) ir[i] = `${errors}.push`;
    if (ir[i] === userData) ir[i] = "userData";
  }
  source.push(ir.join(""));
  source.push(`if (${errors}.length) return { errors: ${errors} }`);
  source.push(`return { value }`);

  const outer = new Function("userData", `return value => { ${source.join("\n")} }`);
  const inner = outer(ctx.userData);
  return inner as SchemaValidator<Schema>;
}
