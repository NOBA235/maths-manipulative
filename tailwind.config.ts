import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        paper: "#fbfaf6",
        chalk: "#edf7f5",
        coral: "#e85d75",
        saffron: "#f5b642",
        leaf: "#2e8f65",
        lake: "#2f79c6",
        plum: "#7558a7",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 51, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
