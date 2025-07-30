const path = require("path");

module.exports = {
  entry: __dirname + "/client/scripts/main.ts",
  mode: "development",
  context: __dirname + "/client/scripts",
  output: {
    path: path.resolve(__dirname, "./client/dist"),
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
