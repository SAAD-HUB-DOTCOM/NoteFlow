import type { Config } from "tailwindcss";

/**
 * NoteFlow design-system tokens (from the noteflow-design-system skill).
 * Every component should build from these names rather than raw hex values.
 *
 * Naming note: the skill lists a near-white "text-primary" token AND an indigo
 * "primary" token, which collide under Tailwind's `text-*` utility. We resolve it:
 *   - `foreground` (#F5F5F7) = headings/body text; also the global default text color,
 *      so `text-foreground` is rarely needed — plain text inherits it.
 *   - `muted`      (#9B9BAE) = timestamps, speaker meta, secondary labels → `text-muted`.
 *   - `primary`    (#6C5CE7) = indigo actions/links/active speaker labels → `text-primary`, `bg-primary`.
 * This keeps the skill's intent while giving each color one unambiguous utility.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F0F1A",
        surface: "#1A1A2E",
        "surface-hover": "#24243D",
        border: "#2D2D45",
        primary: {
          DEFAULT: "#6C5CE7",
          hover: "#5B4BD6",
        },
        accent: "#00D9C0",
        foreground: "#F5F5F7",
        muted: "#9B9BAE",
        danger: "#FF6B6B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Card corners per the skill: rounded-xl on cards, lg on buttons.
        xl: "0.875rem",
      },
      maxWidth: {
        // Reading-focused pages (transcript view) cap line length.
        reading: "48rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
