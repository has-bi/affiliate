// tailwind.config.js for Tailwind CSS v4
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        youvit: {
          orange: "#F48028",
          yellow: "#FCBA2D",
          green: "#209848",
          pink: "#EE186E",
          blue: "#0A7DAF",
          "orange-light": "#FEF5EF",
          "yellow-light": "#FEF9EE",
          "green-light": "#EFF7F1",
          "pink-light": "#FEEEF4",
          "blue-light": "#EFF5FA",
        },
      },
    },
  },
};
