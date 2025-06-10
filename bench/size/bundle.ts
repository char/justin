import * as esbuild from "jsr:@char/aftercare/esbuild";

await esbuild.build({
  in: ["./in/justin.ts", "./in/zod-mini.ts", "./in/valita.ts"],
  outDir: "./out",
  extraOptions: { keepNames: false, splitting: false },
});

await esbuild.build({
  in: ["./in/justin-full.ts"],
  outDir: "./out",
  extraOptions: { keepNames: false },
});
