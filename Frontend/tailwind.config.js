/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e8ecff",
          500: "#3056d3",
          600: "#2646b3",
          700: "#203c95",
        },
        accent: {
          500: "#ff8c42",
          600: "#f97316",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.18)",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
