import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        terracotta: {
          DEFAULT: "#6B4E3D",
          dark: "#4D3829",
          light: "#C9A88F",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          50: "#F4F3F1",
          100: "#E7E5E1",
          200: "#D1CEC8",
          300: "#A8A39A",
          400: "#78736A",
          500: "#3D3A33",
          600: "#27251F",
          700: "#1A1D24",
          800: "#14161C",
          900: "#0E0F14",
          950: "#08090D",
        },
        neutral: {
          50: "#FAFAF9",
          100: "#F4F3F1",
          200: "#E7E5E1",
          300: "#D1CEC8",
          400: "#A8A39A",
          500: "#78736A",
          600: "#575349",
          700: "#3D3A33",
          800: "#27251F",
          900: "#1A1814",
          950: "#0E0D0A",
        },
        signal: {
          gap: "#DC2626",
          watch: "#D97706",
          covered: "#059669",
          procurement: "#2563EB",
          trend: "#7C3AED",
          posting: "#0891B2",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
