import * as j from "@char/justin";
import * as v from "npm:@badrap/valita";
import * as z from "npm:@zod/mini@next";
import { bench, do_not_optimize, run } from "npm:mitata";

const Person = j.obj({
  fullName: j.string,
  preferredName: j.string,
  i18nInflection: j.optional(
    j.union(j.literal("masculine"), j.literal("feminine"), j.literal("neutral")),
  ),
});
const personValidator = j.compile(Person);

bench("justin", () => {
  const { value: person } = personValidator({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  do_not_optimize(person);
});

const ZodPerson = z.object({
  fullName: z.string(),
  preferredName: z.string(),
  i18nInflection: z.optional(
    z.union([z.literal("masculine"), z.literal("feminine"), z.literal("neutral")]),
  ),
});

bench("zod v4 mini", () => {
  const { data: person } = ZodPerson.safeParse({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  do_not_optimize(person);
});

const ValitaPerson = v.object({
  fullName: v.string(),
  preferredName: v.string(),
  i18nInflection: v
    .union(v.literal("masculine"), v.literal("feminine"), v.literal("neutral"))
    .optional(),
});

bench("valita", () => {
  const person = ValitaPerson.parse({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  do_not_optimize(person);
});

await run();
