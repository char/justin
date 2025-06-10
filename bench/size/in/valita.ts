import * as v from "npm:@badrap/valita";

export const PersonSchema = v.object({
  fullName: v.string(),
  preferredName: v.string(),
  i18nInflection: v
    .union(v.literal("masculine"), v.literal("feminine"), v.literal("neutral"))
    .optional(),
});

if (import.meta.main) {
  const person = PersonSchema.parse({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  console.log(person);
}
