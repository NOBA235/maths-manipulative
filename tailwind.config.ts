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
        ink: "#20233a",
        paper: "#f7fbff",
        chalk: "#eaf7f0",
        coral: "#f45575",
        saffron: "#ffc83d",
        leaf: "#249b68",
        lake: "#3478e5",
        plum: "#7855b7",
        aqua: "#16a7a0",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(32, 35, 58, 0.12)",
        lift: "0 10px 24px rgba(32, 35, 58, 0.14)",
        button: "0 4px 0 rgba(32, 35, 58, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
