// Preset de Tailwind sobre los tokens Designio del Banco (ver MANUAL_DE_MARCA.md y tokens.css).
// Uso: `presets: [bancoPopularPreset]` en tailwind.config.ts, e importar tokens.css en el layout raíz.
import type { Config } from "tailwindcss";

const designio = (token: string) => `var(--bpop-designio-color-${token})`;
const escala = (familia: string, pasos: string[]) =>
  Object.fromEntries(pasos.map((paso) => [paso, designio(`${familia}-${paso}`)]));

const bancoPopularPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: { ...escala("primary", ["100", "400", "600", "800", "900"]), DEFAULT: designio("primary-600") },
        brand: { ...escala("brand", ["100", "400", "600", "900"]), logo: "var(--bpop-logo-green)" },
        secondary: escala("secondary", ["100", "400", "600", "900"]),
        terciary: escala("terciary", ["100", "400", "600", "900"]),
        success: escala("success", ["100", "400", "600", "900"]),
        warning: { ...escala("warning", ["100", "400", "600", "900"]), text: "var(--g360-warning-text)" },
        error: escala("error", ["100", "400", "600", "900"]),
        info: escala("info", ["100", "400", "600", "800", "900"]),
        dark: escala("dark", ["100", "400", "600", "900"]),
        mid: escala("mid", ["100", "400", "600", "900"]),
        light: escala("light", ["100", "400", "500", "600", "900"]),
        canvas: "var(--g360-canvas)",
        link: "var(--g360-link)",
        chart: {
          1: "var(--g360-chart-1)",
          2: "var(--g360-chart-2)",
          3: "var(--g360-chart-3)",
          4: "var(--g360-chart-4)",
          5: "var(--g360-chart-5)",
          6: "var(--g360-chart-6)",
        },
      },
      backgroundImage: {
        "primary-grad": "var(--bpop-designio-primary-grad)",
        "accent-grad": "var(--bpop-designio-accent-grad)",
      },
      fontFamily: {
        sans: ["var(--bpop-designio-font-family)"],
      },
      // Escala Designio usada en Garantías 360 (ver sección 4 del manual).
      fontSize: {
        h3: ["var(--bpop-designio-font-size-h3)", { lineHeight: "var(--bpop-designio-line-height-h3)" }],
        h4: ["var(--bpop-designio-font-size-h4)", { lineHeight: "var(--bpop-designio-line-height-h4)" }],
        h5: ["var(--bpop-designio-font-size-h5)", { lineHeight: "var(--bpop-designio-line-height-h5)" }],
        s1: ["var(--bpop-designio-font-size-s1)", { lineHeight: "var(--bpop-designio-line-height-s1)" }],
        s2: ["var(--bpop-designio-font-size-s2)", { lineHeight: "var(--bpop-designio-line-height-s2)" }],
        a1: ["var(--bpop-designio-font-size-a1)", { lineHeight: "var(--bpop-designio-line-height-a1)" }],
        a2: ["var(--bpop-designio-font-size-a2)", { lineHeight: "var(--bpop-designio-line-height-a2)" }],
        a3: ["var(--bpop-designio-font-size-a3)", { lineHeight: "var(--bpop-designio-line-height-a3)" }],
        b1: ["var(--bpop-designio-font-size-b1)", { lineHeight: "var(--bpop-designio-line-height-b1)" }],
        b2: ["var(--bpop-designio-font-size-b2)", { lineHeight: "var(--bpop-designio-line-height-b2)" }],
        b3: ["var(--bpop-designio-font-size-b3)", { lineHeight: "var(--bpop-designio-line-height-b3)" }],
        c: ["var(--bpop-designio-font-size-c)", { lineHeight: "var(--bpop-designio-line-height-c)" }],
        o: ["var(--bpop-designio-font-size-o)", { lineHeight: "var(--bpop-designio-line-height-o)" }],
      },
      borderRadius: {
        "dg-2": "var(--bpop-designio-radius-2)",
        "dg-4": "var(--bpop-designio-radius-4)",
        "dg-8": "var(--bpop-designio-radius-8)",
        "dg-12": "var(--bpop-designio-radius-12)",
        "dg-16": "var(--bpop-designio-radius-16)",
        "dg-32": "var(--bpop-designio-radius-32)",
        "dg-full": "var(--bpop-designio-radius-full)",
      },
      spacing: {
        "bp-xxxxs": "var(--bpop-spacing-xxxxs)",
        "bp-xxxs": "var(--bpop-spacing-xxxs)",
        "bp-xxs": "var(--bpop-spacing-xxs)",
        "bp-xs": "var(--bpop-spacing-xs)",
        "bp-2xs": "var(--bpop-spacing-2xs)",
        "bp-s": "var(--bpop-spacing-s)",
        "bp-sm": "var(--bpop-spacing-sm)",
        "bp-2sm": "var(--bpop-spacing-2sm)",
        "bp-md": "var(--bpop-spacing-md)",
        "bp-lg": "var(--bpop-spacing-lg)",
        "bp-xl": "var(--bpop-spacing-xl)",
        "bp-2xl": "var(--bpop-spacing-2xl)",
        "bp-3xl": "var(--bpop-spacing-3xl)",
        "bp-4xl": "var(--bpop-spacing-4xl)",
      },
      boxShadow: {
        card: "var(--g360-shadow-card)",
        float: "var(--g360-shadow-float)",
        modal: "var(--g360-shadow-modal)",
        focus: "var(--g360-focus-ring)",
      },
      height: {
        control: "var(--g360-control-height)",
        "control-compact": "var(--g360-control-height-compact)",
      },
    },
  },
};

export default bancoPopularPreset;
