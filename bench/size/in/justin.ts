import * as j from "@char/justin";

export const PersonSchema = j.obj({
  fullName: j.string,
  preferredName: j.string,
  i18nInflection: j.optional(
    j.union(j.literal("masculine"), j.literal("feminine"), j.literal("neutral")),
  ),
});

if (import.meta.main) {
  const personValidator = j.compile(PersonSchema);

  const { value: person } = personValidator({
    fullName: "Guy Nameson",
    preferredName: "Guy",
    i18nInflection: "masculine",
  });
  console.log(person);
}
