const path = require("path");
module.exports = {
  ...require("./jest-common.cjs"),
  displayName: "client",
  testEnvironment: "jest-environment-jsdom",
  coverageDirectory: path.join(__dirname, "../coverage/client"),
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  testMatch: ["**/client/src/**/*.test.{js,ts,jsx,tsx}"],
};
