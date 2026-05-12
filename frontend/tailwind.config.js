/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          950: "#071014",
          900: "#0b171d",
          800: "#10242d",
          700: "#163644",
          gold: "#f2b84b",
          orange: "#f97316",
          teal: "#22d3ee",
          lime: "#a3e635",
        },
      },
      boxShadow: {
        glow: "0 0 35px rgba(34, 211, 238, 0.12)",
      },
    },
  },
  plugins: [],
};
