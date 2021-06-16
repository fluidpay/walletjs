import { terser } from "rollup-plugin-terser";
export default {
  input: "src/wallet.js",
  output: [
    {
      name: "walletjs",
      file: "walletjs.js",
      format: "umd"
    }
  ],
  plugins: [
    terser({
      mangle: {
        eval: true,
        toplevel: true
      }
    })
  ]
};
