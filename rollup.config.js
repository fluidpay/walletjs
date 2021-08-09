import babel from "@rollup/plugin-babel";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/walletjs.js",
    output: [
      {
        file: "dist/walletjs.esm.js",
        format: "esm",
        name: "walletjs",
        exports: "named",
        sourcemap: false
      },
      {
        file: "dist/walletjs.cjs.js",
        format: "cjs",
        name: "walletjs",
        exports: "named",
        sourcemap: false
      }
    ],
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled"
      }),
      terser()
    ]
  },
  {
    input: "src/walletjs-umd.js",
    output: [
      {
        file: "dist/walletjs.js",
        format: "umd",
        name: "walletjs",
        esModule: false,
        exports: "named",
        sourcemap: false
      },
      {
        file: "dist/walletjs.umd.js",
        format: "umd",
        name: "walletjs",
        esModule: false,
        exports: "named",
        sourcemap: false
      }
    ],
    plugins: [
      resolve(),
      babel({
        babelHelpers: "bundled"
      }),
      terser()
    ]
  }
];
