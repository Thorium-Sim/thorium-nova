const path = require("path");

module.exports = {
  testEnvironment: "jest-environment-jsdom",
  moduleDirectories: ["node_modules", "./test"],
  moduleNameMapper: {
    "\\.css$": require.resolve("./test/styleMocker.js"),
  },
  transform: {
    "^.*server.*\\.[t|j]sx?$": "ts-jest",
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  snapshotSerializers: ["jest-emotion"],
  collectCoverageFrom: [
    "**/{client,server,shared}/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
  ],
};
