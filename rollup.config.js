import { terser } from "rollup-plugin-terser";
export default {
  input: "src/wallet.js",
  output: [
    {
      name: "walletjs",
      file: "bundle.js",
      format: "es",
    },
  ],
  plugins: [
    terser({
      mangle: {
        eval: true,
        toplevel: true,
      },
    }),
  ],
};
