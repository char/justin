import * as z from "npm:@zod/mini@next";

export const PersonSchema = z.object({
  fullName: z.string(),
  preferredName: z.string(),
  i18nInflection: z.optional(
    z.union([z.literal("masculine"), z.literal("feminine"), z.literal("neutral")]),
  ),
});

if (import.meta.main) {
  const person = PersonSchema.safeParse({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  console.log(person);
}
