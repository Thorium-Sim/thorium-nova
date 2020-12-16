// eslint-disable-next-line no-undef
module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: [
    "./client/**/*.html",
    "./client/**/*.js",
    "./client/**/*.jsx",
    "./client/**/*.tsx",
    "./client/**/*.ts",
  ],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    filter: {
      // defaults to {}
      none: "none",
      grayscale: "grayscale(1)",
      disabled: "grayscale(0.5) brightness(0.4)",
      invert: "invert(1)",
      sepia: "sepia(1)",
    },
    extend: {
      colors: {
        whiteAlpha: {
          50: "rgba(255, 255, 255, 0.04)",
          100: "rgba(255, 255, 255, 0.06)",
          200: "rgba(255, 255, 255, 0.08)",
          300: "rgba(255, 255, 255, 0.16)",
          400: "rgba(255, 255, 255, 0.24)",
          500: "rgba(255, 255, 255, 0.36)",
          600: "rgba(255, 255, 255, 0.48)",
          700: "rgba(255, 255, 255, 0.64)",
          800: "rgba(255, 255, 255, 0.80)",
          900: "rgba(255, 255, 255, 0.92)",
        },
        blackAlpha: {
          50: "rgba(0, 0, 0, 0.04)",
          100: "rgba(0, 0, 0, 0.06)",
          200: "rgba(0, 0, 0, 0.08)",
          300: "rgba(0, 0, 0, 0.16)",
          400: "rgba(0, 0, 0, 0.24)",
          500: "rgba(0, 0, 0, 0.36)",
          600: "rgba(0, 0, 0, 0.48)",
          700: "rgba(0, 0, 0, 0.64)",
          800: "rgba(0, 0, 0, 0.80)",
          900: "rgba(0, 0, 0, 0.92)",
        },
        primary: {
          50: "rgb(224,245,255)",
          100: "rgb(188,219,245)",
          200: "rgb(149,193,234)",
          300: "rgb(109,167,222)",
          400: "rgb(70,143,211)",
          500: "rgb(44,117,185)",
          600: "rgb(31,91,145)",
          700: "rgb(18,65,105)",
          800: "rgb(5,39,66)",
          900: "rgb(0,14,28)",
          hover: "rgba(44,117,185, 0.12)",
          active: "rgba(44,117,185, 0.24)",
        },
        secondary: {
          50: "#F7FAFC",
          100: "#EDF2F7",
          200: "#E2E8F0",
          300: "#CBD5E0",
          400: "#A0AEC0",
          500: "#718096",
          600: "#4A5568",
          700: "#2D3748",
          800: "#1A202C",
          900: "#171923",
          hover: "#71809612",
          active: "#71809624",
        },
        info: {
          50: "#E6FFFA",
          100: "#B2F5EA",
          200: "#81E6D9",
          300: "#4FD1C5",
          400: "#38B2AC",
          500: "#319795",
          600: "#2C7A7B",
          700: "#285E61",
          800: "#234E52",
          900: "#1D4044",
          hover: "#31979512",
          active: "#31979524",
        },
        alert: {
          50: "#faf5ff",
          100: "#e9d8fd",
          200: "#d6bcfa",
          300: "#b794f4",
          400: "#9f7aea",
          500: "#805ad5",
          600: "#6b46c1",
          700: "#553c9a",
          800: "#44337a",
          900: "#322659",
          hover: "#805ad512",
          active: "#805ad524",
        },
        warning: {
          50: "#FFFAF0",
          100: "#FEEBC8",
          200: "#FBD38D",
          300: "#F6AD55",
          400: "#ED8936",
          500: "#DD6B20",
          600: "#C05621",
          700: "#9C4221",
          800: "#7B341E",
          900: "#652B19",
          hover: "#DD6B2012",
          active: "#DD6B2024",
        },
        danger: {
          50: "#fff5f5",
          100: "#fed7d7",
          200: "#feb2b2",
          300: "#fc8181",
          400: "#f56565",
          500: "#e53e3e",
          600: "#c53030",
          700: "#9b2c2c",
          800: "#822727",
          900: "#63171b",
          hover: "#e53e3e12",
          active: "#e53e3e24",
        },
        success: {
          50: "#f0fff4",
          100: "#c6f6d5",
          200: "#9ae6b4",
          300: "#68d391",
          400: "#48bb78",
          500: "#38a169",
          600: "#2f855a",
          700: "#276749",
          800: "#22543d",
          900: "#1C4532",
          hover: "#38a16912",
          active: "#38a16924",
        },
      },
    },
  },
  variants: {
    backgroundColor: ["hover", "focus", "active", "checked"],
    color: ["hover", "focus", "active", "checked"],
  },
  plugins: [
    require("@tailwindcss/custom-forms"),
    require("tailwindcss-filters"),
  ],
};