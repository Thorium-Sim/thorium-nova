module.exports = {
  ...require("./test/jest-common.cjs"),
  collectCoverageFrom: [
    "**/{client,server}/src/**/*.{js,jsx,ts,tsx}",
    "**/shared/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/__test__/**",
    "!**/*.test.*",
    "!**/coverage/**",
    "!**/generated/**",
  ],
  coverageReporters: ["text", "html"],

  coverageThreshold: {
    global: {
      statements: 15,
      branches: 10,
      functions: 15,
      lines: 15,
    },
  },
  projects: [
    "./test/jest.shared.cjs",
    "./test/jest.client.cjs",
    "./test/jest.server.cjs",
  ],
};
