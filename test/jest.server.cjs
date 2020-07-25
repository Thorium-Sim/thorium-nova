const path = require("path");

module.exports = {
  ...require("./jest.common.cjs"),
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "server",
  coverageDirectory: path.join(__dirname, "../coverage/server"),
  testEnvironment: "jest-environment-node",
  testMatch: ["**/server/**/*.test.{js,ts}"],
  setupFilesAfterEnv: ["reflect-metadata"],
};
