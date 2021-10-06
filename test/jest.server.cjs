const path = require("path");

module.exports = {
  ...require("./jest-common.cjs"),
  displayName: "server",
  coverageDirectory: path.join(__dirname, "../coverage/server"),
  testEnvironment: "jest-environment-node",
  testMatch: ["**/server/src/**/*.test.{js,ts}"],
};
