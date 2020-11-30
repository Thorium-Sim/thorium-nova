module.exports = {
  extends: [require.resolve("./config/eslint")],
  overrides: [
    {
      files: ["**/server/**"],
      settings: {
        "import/resolver": "typescript",
      },
    },
    {
      files: ["**/__tests__/**", "*.test.*"],
      settings: {
        "import/resolver": {
          jest: {
            jestConfigFile: "./jest.config.js",
          },
        },
      },
    },
  ],
  parserOptions: {
    sourceType: "module",
    allowImportExportEverywhere: true,
  },
  ignorePatterns: ["dist"],
};
