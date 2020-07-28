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
      branches: 60,
      functions: 70,
      lines: 80,
    },
  },
  projects: ["./test/jest.client.cjs", "./test/jest.server.cjs"],
};
