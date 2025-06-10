import type { out } from "./_internal.ts";
import type { TBox } from "./_util.ts";

export type AnySchema = {
  readonly type: string;
  readonly [out]?: TBox<unknown>;
};

export type Infer<T> = T extends AnySchema
  ? NonNullable<T[typeof out]>["v"]
  : never;

export interface BasicSchema<
  T extends unknown = unknown,
  TypeName extends string = string,
> {
  readonly type: TypeName;
  readonly [out]?: TBox<T>;
}
