import externals from "rollup-plugin-node-externals";
import typescript from "@rollup/plugin-typescript";
import babel from "rollup-plugin-babel";
import generatePackageJson from "rollup-plugin-generate-package-json";
import { getPkgJsonBaseContents } from "./scripts/gen-pkg";

import glob from "glob";
import path from "path";

const kvToObj = ([k, v]) => ({ [k]: v });

const entryFiles = Object.assign(
  {},
  ...glob
    .sync("src/*.ts")
    .map(f => [path.parse(f).name, f])
    .map(kvToObj),
  ...glob
    .sync("src/*/index.ts")
    .map(f => [path.basename(path.dirname(f)), f])
    .map(kvToObj),
);

export default {
  input: entryFiles,
  output: [
    { dir: "dist", format: "cjs", sourcemap: true },
    { dir: "dist/es", format: "es", sourcemap: true },
  ],
  plugins: [
    // https://github.com/Septh/rollup-plugin-node-externals
    externals({
      builtins: true,
      deps: true,
      peerDeps: true,
      optDeps: true,
      devDeps: false,
    }),
    // https://github.com/rollup/plugins/tree/master/packages/typescript
    typescript({
      tsconfig: "tsconfig.prod.json",
      sourceMap: true,
      inlineSources: true,
    }),
    // https://github.com/rollup/rollup-plugin-babel
    babel(),
    // https://github.com/vladshcherbin/rollup-plugin-generate-package-json
    generatePackageJson({
      baseContents: getPkgJsonBaseContents,
      additionalDependencies: [
        // types support for tar entry headers
        "@types/tar-stream",
      ],
      outputFolder: "dist",
    }),
  ],
};
