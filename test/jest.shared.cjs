const path = require("path");

module.exports = {
  ...require("./jest-common.cjs"),
  displayName: "shared",
  coverageDirectory: path.join(__dirname, "../coverage/shared"),
  testEnvironment: "jest-environment-node",
  testMatch: ["**/shared/**/*.test.{js,ts}"],
};
