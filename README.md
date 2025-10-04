# justin

a runtime type info library with just-in-time compilation for type validation and deep equality.

[available on jsr.io](http://jsr.io/@char/justin).

## features

- dependency-free
- small bundle size (pay for what you use, ranges from sub-1kb to 4kb)
- low-allocation design of generated functions
- much faster than validation via interpreting schema objects

## limitations

- since all checks are inlined, we do not support circular schemas
  - you probably want to use `j.unknown` and reapply the validator function to the member object
- transformation is not supported since we return the exact same object that was passed in
- compilation is very slow, so ad-hoc construction of schemata is considered an anti-pattern

## example

```typescript
import * as j from "@char/justin";

const PersonSchema = j.obj({
  fullName: j.string,
  preferredName: j.string,
  i18nInflection: j.optional(
    j.union(j.literal("masculine"), j.literal("feminine"), j.literal("neutral")),
  ),
});

type Person = j.Infer<typeof PersonSchema>;
/* ⇒ {
    fullName: string;
    preferredName: string;
    i18nInflection?: "masculine" | "feminine" | "neutral" | undefined;
} */

const validator = j.validation.compile(PersonSchema);
const { value: person, errors: personErrors } = validator({
  fullName: "Guy Jones",
  preferredName: "guy",
  i18nInflection: "masculine",
});
// person: passed through verbatim, personErrors: undefined

const { errors } = validator({
  fullName: "Guy Jones",
});
// errors: [ { path: ".preferredName", msg: "must be string" } ]
```
