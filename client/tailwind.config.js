const plugin = require("tailwindcss/plugin");

module.exports = {
  mode: "jit",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      typography: theme => ({
        DEFAULT: {
          css: {
            h1: {
              color: theme("colors.gray.100"),
            },
            h2: {
              color: theme("colors.gray.100"),
            },
            h3: {
              color: theme("colors.gray.100"),
            },
            h4: {
              color: theme("colors.gray.100"),
            },
            p: {
              color: theme("colors.gray.100"),
            },
            strong: {
              color: theme("colors.gray.100"),
            },
            li: {
              color: theme("colors.gray.100"),
            },
            code: {
              color: theme("colors.gray.400"),
            },
            a: {
              color: theme("colors.primary"),
              "&:hover": {
                color: theme("colors.primary-highlight"),
              },
            },
          },
        },
      }),
      colors: {
        primary: "#60a5fa",
        "primary-focus": "#2563eb",
        "primary-content": "#ffffff",
        "primary-highlight": "#91c1fb",
        secondary: "#718096",
        "secondary-focus": "#2d3748",
        "secondary-content": "#ffffff",
        "secondary-highlight": "#8e9aab",
        accent: "#37cdbe",
        "accent-focus": "#2aa79b",
        "accent-content": "#ffffff",
        "accent-highlight": "#60d7cb",
        neutral: "#3d4451",
        "neutral-focus": "#2a2e37",
        "neutral-content": "#ffffff",
        "neutral-highlight": "#535c6e",
        "base-100": "#ffffff",
        "base-200": "#f9fafb",
        "base-300": "#d1d5db",
        "base-content": "#1f2937",
        "base-highlight": "#314158",
        info: "#319795",
        "info-focus": "#285e61",
        "info-content": "#ffffff",
        "info-highlight": "#3dbdbb",
        success: "#38a169",
        "success-focus": "#276749",
        "success-content": "#ffffff",
        "success-highlight": "#4bc182",
        warning: "#dd6b20",
        "warning-focus": "#9c4221",
        "warning-content": "#ffffff",
        "warning-highlight": "#e5884b",
        error: "#e53e3e",
        "error-focus": "#9b2c2c",
        "error-content": "#ffffff",
        "error-highlight": "#eb6b6b",
        notice: "#805ad5",
        "notice-focus": "#553c9a",
        "notice-content": "#ffffff",
        "notice-highlight": "#9f83df",
        "alert-color": "var(--alert-color, #60a5fa)",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require("daisyui"),
    require("@tailwindcss/typography"),

    plugin(function ({addComponents}) {
      addComponents(require("./tailwindComponents"));
    }),
  ],
  daisyui: {
    logs: false,
    styled: false,
    themes: [],
  },
};
