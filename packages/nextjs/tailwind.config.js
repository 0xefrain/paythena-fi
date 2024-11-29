/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  plugins: [require("daisyui")],
  darkTheme: "dark",
  darkMode: ["selector", "[data-theme='dark']"],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#2563eb",
          "primary-content": "#ffffff",
          secondary: "#3b82f6",
          "secondary-content": "#ffffff",
          accent: "#1d4ed8",
          "accent-content": "#ffffff",
          neutral: "#1e293b",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f8fafc",
          "base-300": "#f1f5f9",
          "base-content": "#1e293b",
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          "--rounded-btn": "0.5rem",
        },
      },
      {
        dark: {
          primary: "#3b82f6",
          "primary-content": "#ffffff",
          secondary: "#2563eb",
          "secondary-content": "#ffffff",
          accent: "#1d4ed8",
          "accent-content": "#ffffff",
          neutral: "#f8fafc",
          "neutral-content": "#1e293b",
          "base-100": "#0f172a",
          "base-200": "#1e293b",
          "base-300": "#334155",
          "base-content": "#f8fafc",
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          "--rounded-btn": "0.5rem",
        },
      },
    ],
  },
  theme: {
    extend: {
      boxShadow: { center: "0 0 12px -2px rgb(0 0 0 / 0.05)" },
      animation: { "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite" },
    },
  },
};
