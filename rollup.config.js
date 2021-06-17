import babel from "@rollup/plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/wallet-umd.js",
    output: {
      file: "dist/umd/walletjs.js",
      format: "umd",
      name: "walletjs",
      esModule: false,
      exports: "named",
      sourcemap: false
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled"
      }),
      terser()
    ]
  },
  {
    input: "src/wallet-es.js",
    output: [
      {
        file: "dist/esm/walletjs.js",
        format: "esm",
        name: "walletjs",
        exports: "named",
        sourcemap: false
      },
      {
        file: "dist/cjs/walletjs.js",
        format: "cjs",
        name: "walletjs",
        exports: "named",
        sourcemap: false
      }
    ]
  }
];
