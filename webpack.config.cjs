const path = require("path");

module.exports = {
  entry: [
    "./client/scripts/puzzle-main",
    "./client/scripts/puzzle-creator",
  ],
  mode: "development",
  context: __dirname,
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ["", ".ts", ".js"],
  },
};
