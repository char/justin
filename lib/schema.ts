import type { out } from "./_internal.ts";
import type { TBox } from "./_util.ts";

export type AnySchema = {
  readonly type: string;
  /** @ignore */
  readonly [out]?: TBox<unknown>;
};

export type Infer<T> = T extends AnySchema
  ? NonNullable<T[typeof out]>["v"]
  : never;
