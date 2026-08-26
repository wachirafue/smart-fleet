/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        blinkRed: {
          "0%, 100%": { borderColor: "rgb(239, 68, 68)", boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "50%": { borderColor: "rgb(239, 68, 68)", boxShadow: "0 0 0 6px rgba(239,68,68,0.4)" },
        },
      },
      animation: {
        "blink-red": "blinkRed 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
