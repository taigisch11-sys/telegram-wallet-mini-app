import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0e13",
        panel: "#121720",
        line: "#263140",
        action: "#2f8cff",
        actionSoft: "#1d395c",
        positive: "#32d178",
        positiveSoft: "#174f31",
        mint: "#32d178",
        amber: "#f2c45d",
        amberSoft: "#493b1f",
        danger: "#ff6b73"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
} satisfies Config;
