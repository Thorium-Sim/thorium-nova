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
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  projects: ["./test/jest.client.cjs", "./test/jest.server.cjs"],
};
