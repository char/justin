# justin

a typescript data validation library utilizing just-in-time function compilation.

## limitations

- since all checks are inlined, we do not support circular schemas
  - you probably want to use `j.unknown` and reapply the validator function to the member object

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

const validator = j.compile(PersonSchema);
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
