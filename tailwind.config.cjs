const { resolveProjectPath } = require("wasp/dev");
const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [resolveProjectPath("./src/**/*.{js,jsx,ts,tsx}")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: colors.slate[50],
          100: colors.slate[100],
          200: colors.slate[200],
          300: colors.slate[300],
          400: colors.slate[400],
          500: colors.slate[500],
          600: colors.slate[600],
          700: colors.slate[700],
          800: colors.slate[800],
          900: colors.slate[900],
        },
      },
      keyframes: {
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out-down": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
        },
        "pulse-once": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.3s ease-out",
        "fade-out-down": "fade-out-down 0.3s ease-out forwards", // forwards to keep the final state
        "pulse-once": "pulse-once 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};
