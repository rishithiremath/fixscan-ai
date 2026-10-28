/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#7c2d2d",
        gold: "#c9a227",
        cream: "#fdf8ec",
      },
    },
  },
  plugins: [],
};
