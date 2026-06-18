/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10231f",
        muted: "#66756f",
        ocean: "#0f8b8d",
        forest: "#0b5f61"
      },
      boxShadow: {
        search: "0 24px 80px rgba(13, 45, 40, 0.14)"
      }
    }
  },
  plugins: []
};
