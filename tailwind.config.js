/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        exo2: ['"Exo 2"', "sans-serif"],
        figtree: ["Figtree", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        lato: ["Lato", "sans-serif"],
        leckerli: ["Leckerli One", "cursive"],
        roboto: ["Roboto", "sans-serif"],
        sourceSans3: ['"Source Sans 3"', "sans-serif"],
        syne: ["Syne", "sans-serif"],
      },
      fontSize: {
        xxs: "0.625rem",
      },
      keyframes: {
        timestampIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        timestampOut: {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(4px)" },
        },
        slideInBottom: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideOutBottom: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        heartPop: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "30%": { transform: "scale(1.2)", opacity: "1" },
          "60%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.8)", opacity: "0" },
        },
      },
      animation: {
        "timestamp-in": "timestampIn 0.2s ease-out forwards",
        "timestamp-out": "timestampOut 0.2s ease-in forwards",
        "slide-in-bottom": "slideInBottom 0.3s ease-out forwards",
        "slide-out-bottom": "slideOutBottom 0.3s ease-in forwards",
        heartPop: "heartPop 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};
