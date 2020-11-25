const testMode = process.env.NODE_ENV === "test";
const plugins = [
  ["@babel/plugin-transform-typescript", {isTSX: true}],
  ["@babel/plugin-proposal-decorators", {legacy: true}],
  ["@babel/plugin-proposal-class-properties", {loose: true}],
  "macros",
];

if (!testMode) {
  plugins.push([
    "i18next-extract",
    {
      outputPath: "locales/{{locale}}/{{ns}}.json",
      discardOldKeys: true,
      keyAsDefaultValue: ["en", "en_US"],
    },
  ]);
}
module.exports = {
  parserOpts: {
    strictMode: true,
  },
  presets: [
    "@babel/preset-env",
    "@babel/preset-react",
    "@emotion/babel-preset-css-prop",
  ],
  plugins,
};
