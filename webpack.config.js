var path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/wallet.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "wallet.bundle.js",
  },
};
