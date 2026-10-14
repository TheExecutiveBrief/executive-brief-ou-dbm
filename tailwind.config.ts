import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FAF8F5",
          100: "#F5F2EB",
          200: "#EAE4D8",
          300: "#DDD4C4",
          DEFAULT: "#FAF7F2",
          ivory: "#FCFAF6",
          dark: "#1A1816",
        },
        ink: {
          950: "#0D0C0B",
          900: "#181614",
          800: "#272422",
          700: "#403B37",
          600: "#57524C",
          500: "#756F67",
          400: "#A39C93",
          300: "#CDC7BE",
          DEFAULT: "#181614",
        },
        crimson: {
          900: "#521019",
          800: "#731623",
          700: "#8B1E2D",
          600: "#A82637",
          DEFAULT: "#8B1E2D",
          light: "#FBF1F2",
        },
        brass: {
          800: "#78350F",
          700: "#92400E",
          600: "#B45309",
          DEFAULT: "#92400E",
          light: "#FEF7EE",
        },
        forest: {
          900: "#12251D",
          800: "#1B382B",
          700: "#244D3B",
          DEFAULT: "#1B382B",
          light: "#F0F5F2",
        },
        editorial: {
          border: "#E4DDD0",
          hairline: "rgba(24, 22, 20, 0.12)",
          subtle: "rgba(24, 22, 20, 0.06)",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "Cambria", "Times New Roman", "serif"],
        editorial: ["var(--font-newsreader)", "Charter", "Georgia", "serif"],
        sans: ["var(--font-plus-jakarta)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "Consolas", "Courier New", "monospace"],
      },
      borderWidth: {
        hairline: "1px",
      },
      boxShadow: {
        editorial: "0 2px 10px rgba(24, 22, 20, 0.04)",
        "editorial-hover": "0 8px 24px rgba(24, 22, 20, 0.07)",
        "editorial-dropdown": "0 12px 32px rgba(24, 22, 20, 0.09)",
      },
      maxWidth: {
        masthead: "1320px",
      },
    },
  },
  plugins: [],
};

export default config;
