const path = require("path");

module.exports = {
  rootDir: path.join(__dirname, ".."),
  moduleDirectories: [
    "node_modules",
    path.join(__dirname, "../src"),
    "shared",
    path.join(__dirname),
  ],
  moduleNameMapper: {
    "\\.module\\.css$": "identity-obj-proxy",
    "\\.css$": require.resolve("./style-mock.cjs"),
    "@thorium/(.*)": "<rootDir>/shared/$1",
  },
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
  watchPlugins: ["jest-watch-select-projects"],
};
