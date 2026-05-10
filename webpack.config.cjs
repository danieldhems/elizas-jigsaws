const path = require("path");

module.exports = {
  entry: {
    PuzzleMain: {
      import: "./client/scripts/puzzle-main",
      filename: "./puzzle-main.bundle.js",
    },
    PuzzleCreator: {
      import: "./client/scripts/puzzle-creator",
      filename: "./puzzle-creator.bundle.js",
    }
  },
  mode: "development",
  context: __dirname,
  output: {
    clean: true,
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
