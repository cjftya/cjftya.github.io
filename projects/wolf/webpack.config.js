var path = require("path");
 
module.exports = {
  entry: "./ts/playground.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "playground.js",
    path: path.resolve(__dirname, "build"),
  },
};