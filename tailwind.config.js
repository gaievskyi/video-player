import defaultTheme from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export default {
  content: ["src/**/*{js,ts,jsx,tsx}"],
  theme: {
    keyframes: {
      fade: {
        "0%": { opacity: "1" },
        "100%": { opacity: "0.25" },
      },
    },
    animation: {
      fade: "fade 1s linear infinite",
    },
    screens: {
      xs: "475px",
      ...defaultTheme.screens,
    },
    extend: {
      colors: {
        card: "#262423",
      },
    },
  },
  plugins: [],
}
