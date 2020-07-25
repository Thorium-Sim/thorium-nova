const path = require("path");

module.exports = {
  ...require("./jest.common.cjs"),
  displayName: "client",
  coverageDirectory: path.join(__dirname, "../coverage/client"),
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/client/**/*.test.{js,ts,tsx,jsx}"],
  transform: {
    "^.+\\.[t|j]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "<rootDir>/test/fetch.cjs",
  ],
  snapshotSerializers: ["jest-emotion"],
};
