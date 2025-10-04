import type {
  ArraySchema,
  BooleanSchema,
  CustomSchema,
  DiscriminatedUnionSchema,
  LiteralSchema,
  NumberSchema,
  ObjectSchema,
  OptionalSchema,
  StringSchema,
  TupleSchema,
  UnionSchema,
  UnknownSchema,
} from "./mod.ts";

export function counterToString(i: number): string {
  let s = "";
  while (i > 0) {
    i--;
    s = String.fromCharCode(0x61 + (i % 26)) + s;
    i = Math.floor(i / 26);
  }
  return "_" + s;
}

/** encode a literal value */
export function literal(value: unknown): string {
  const s = String(JSON.stringify(value));
  // literal strings with double quotes can maybe get single-quoted:
  if (typeof value === "string" && value.includes('"') && !value.includes("'"))
    return `'${s.slice(1, -1).replace(/\\"/g, '"')}'`;
  return s;
}

/** traverse from object to property */
export function traversal(key: string): string {
  if (key.match(/[$_\p{ID_Start}][$\p{ID_Continue}]*/u)) return `.${key}`;
  return `[${literal(key)}]`;
}

export type ConcreteSchema =
  | NumberSchema
  | StringSchema
  | BooleanSchema
  | UnknownSchema
  | LiteralSchema<any>
  | ArraySchema
  | TupleSchema
  | UnionSchema
  | ObjectSchema
  | DiscriminatedUnionSchema
  | OptionalSchema
  | CustomSchema<any>;

export type TemplateStringPiece<IR> = string | { interpolate: IR[] };
export const renderTemplateString = <IR>(pieces: TemplateStringPiece<IR>[]): (IR | string)[] => {
  if (pieces.every(it => typeof it === "string")) return [literal(pieces.join(""))];

  const expr: (IR | string)[] = [];
  const literalRun = [];
  for (const piece of pieces) {
    if (typeof piece === "string") literalRun.push(piece);
    else {
      if (literalRun.length) {
        expr.push(literal(literalRun.join("")).slice(1, -1));
        literalRun.length = 0;
      }
      expr.push("${");
      expr.push(...piece.interpolate);
      expr.push("}");
    }
  }
  if (literalRun.length) expr.push(literal(literalRun.join("")).slice(1, -1));
  expr.unshift("`");
  expr.push("`");

  return expr;
};
