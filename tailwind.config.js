// tailwind.config.js

const defaultTheme = require("tailwindcss/defaultTheme")

module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./data/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // ─── Brand colours ───────────────────────────────────────────────────
      colors: {
        cream:  "#E8E1D7",   // main background
        dark:   "#333333",   // text, borders, CTA
        mid:    "#888880",   // muted text
        light:  "#C8C4BC",   // dividers, subtle UI
        pale:   "#F7F5F2",   // section backgrounds
        accent: "#8B7355",   // warm brown accent
      },

      // ─── Font families ────────────────────────────────────────────────────
      fontFamily: {
        jost:   ["Jost", ...defaultTheme.fontFamily.sans],
        serif:  ["Cormorant Garamond", ...defaultTheme.fontFamily.serif],
        script: ["Dancing Script", "cursive"],
      },

      // ─── Custom animations ────────────────────────────────────────────────
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(22px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scrollPulse: {
          "0%, 100%": { opacity: "0.3", transform: "scaleY(1)" },
          "50%":      { opacity: "0.7", transform: "scaleY(0.8)" },
        },
        // Used by .js-fade-in via CSS (see application.css)
      },
      animation: {
        "fade-up":      "fadeUp 1s ease both",
        "scroll-pulse": "scrollPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
