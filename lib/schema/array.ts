import type { out } from "../_internal.ts";
import type { TBox } from "../_util.ts";
import type { AnySchema, Infer } from "../schema.ts";

export interface ArraySchema<Items extends AnySchema> {
  readonly type: "array";
  readonly items: Items;
  readonly [out]?: TBox<Infer<Items>[]>;
}

export function array<Items extends AnySchema>(items: Items): ArraySchema<Items> {
  return { type: "array", items };
}
