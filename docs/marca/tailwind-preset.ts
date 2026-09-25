// Preset de Tailwind con los tokens de marca de Garantías 360 (ver MANUAL_DE_MARCA.md).
// Uso: `presets: [bancoPopularPreset]` en tailwind.config.ts, e importar tokens.css en el layout raíz.
import type { Config } from "tailwindcss";

const bancoPopularPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: {
          900: "var(--bp-primary-900)",
          700: "var(--bp-primary-700)",
          600: "var(--bp-primary-600)",
          300: "var(--bp-primary-300)",
          100: "var(--bp-primary-100)",
          DEFAULT: "var(--bp-primary-700)",
        },
        accent: {
          700: "var(--bp-accent-700)",
          500: "var(--bp-accent-500)",
          400: "var(--bp-accent-400)",
          DEFAULT: "var(--bp-accent-500)",
        },
        success: { DEFAULT: "var(--bp-success)", bg: "var(--bp-success-bg)", text: "var(--bp-success-text)" },
        warning: { DEFAULT: "var(--bp-warning)", bg: "var(--bp-warning-bg)", text: "var(--bp-warning-text)" },
        danger: { DEFAULT: "var(--bp-danger)", bg: "var(--bp-danger-bg)", text: "var(--bp-danger-text)" },
        info: { DEFAULT: "var(--bp-info)", bg: "var(--bp-info-bg)", text: "var(--bp-info-text)" },
        ink: {
          900: "var(--bp-ink-900)",
          800: "var(--bp-ink-800)",
          700: "var(--bp-ink-700)",
          600: "var(--bp-ink-600)",
          500: "var(--bp-ink-500)",
        },
        gray: {
          400: "var(--bp-gray-400)",
          300: "var(--bp-gray-300)",
          200: "var(--bp-gray-200)",
          100: "var(--bp-gray-100)",
          50: "var(--bp-gray-50)",
        },
        canvas: "var(--bp-canvas)",
        chart: {
          1: "var(--bp-chart-1)",
          2: "var(--bp-chart-2)",
          3: "var(--bp-chart-3)",
          4: "var(--bp-chart-4)",
          5: "var(--bp-chart-5)",
          6: "var(--bp-chart-6)",
        },
      },
      fontFamily: {
        sans: ["var(--bp-font-sans)"],
      },
      fontSize: {
        caption: ["11px", { lineHeight: "16px" }],
        small: ["12px", { lineHeight: "17px", fontWeight: "500" }],
        body: ["14px", { lineHeight: "20px" }],
        h3: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "28px", fontWeight: "700" }],
        h1: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        display: ["32px", { lineHeight: "40px", fontWeight: "700" }],
      },
      borderRadius: {
        sm: "var(--bp-radius-sm)",
        md: "var(--bp-radius-md)",
        toast: "var(--bp-radius-toast)",
        lg: "var(--bp-radius-lg)",
        pill: "var(--bp-radius-pill)",
      },
      boxShadow: {
        card: "var(--bp-shadow-card)",
        float: "var(--bp-shadow-float)",
        modal: "var(--bp-shadow-modal)",
        focus: "var(--bp-focus-ring)",
      },
      height: {
        control: "48px",
        "control-compact": "40px",
      },
    },
  },
};

export default bancoPopularPreset;
