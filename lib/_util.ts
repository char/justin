export type I<T> = T;
export type Flatten<T> = I<{ [K in keyof T]: T[K] }>;
export type TBox<T> = { v: T };
