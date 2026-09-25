import type { Config } from "tailwindcss";
import bancoPopularPreset from "./styles/banco-popular.preset";

const config: Config = {
  presets: [bancoPopularPreset as Config],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};

export default config;
