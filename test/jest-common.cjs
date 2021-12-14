const path = require("path");

const esModules = ["@geckos\\.io"];

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
    "\\.(css|jpg|png)$": require.resolve("./style-mock.cjs"),
    "@thorium/ui/(.*)": "<rootDir>/client/src/components/ui/$1",
    "@thorium/(.*)": "<rootDir>/shared/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "esbuild-jest",
      {
        sourcemap: true,
      },
    ],
    [`node_modules/(${esModules.join("|")})/*`]: [
      "esbuild-jest",
      {
        sourcemap: true,
      },
    ],
  },
  transformIgnorePatterns: [`node_modules/(?!(${esModules.join("|")})/)`],
  watchPlugins: ["jest-watch-select-projects"],
};
