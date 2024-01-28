module.exports = {
  plugins: [
    require("postcss-import"),
    require("tailwindcss/nesting"),
    require("postcss-mixins"),
    require("tailwindcss"),
    require("autoprefixer"),
  ],
};
