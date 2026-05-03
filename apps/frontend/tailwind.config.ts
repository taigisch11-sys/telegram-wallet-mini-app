import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0e13",
        panel: "#121720",
        line: "#263140",
        mint: "#5cf0b2",
        amber: "#f2c45d",
        danger: "#ff6b73"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;
