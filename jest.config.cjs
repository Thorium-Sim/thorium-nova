module.exports = {
  ...require("./test/jest.common.cjs"),
  collectCoverageFrom: [
    "**/{client,server,shared}/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/__test__/**",
    "!**/*.test.*",
    "!**/coverage/**",
    "!**/generated/**",
    "!**/unused/**",
  ],
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 60,
      functions: 60,
      lines: 75,
    },
  },
  projects: ["./test/jest.client.cjs", "./test/jest.server.cjs"],
};
