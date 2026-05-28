import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070a10",
        panel: "#0e131c",
        panel2: "#141b27",
        line: "#1e2735",
        mute: "#6b7a90",
        text: "#c9d4e3",
        amber: "#ffb000",
        cyan: "#3fd0d4",
        good: "#4ade80",
        warn: "#fbbf24",
        bad: "#f87171",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
