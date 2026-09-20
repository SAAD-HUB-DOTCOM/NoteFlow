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
        // Lighter indigo used only for nebula glows / halos behind cosmic cards.
        violet: "#8B7CF6",
        foreground: "#F5F5F7",
        muted: "#9B9BAE",
        danger: "#FF6B6B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Display voice for the cosmic marketing page (headlines, nav, buttons).
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
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
        // Hero entrance: a translate-only rise from an already-visible default, so content is
        // never stranded at low opacity if the animation is throttled or motion is reduced.
        "rise-in": {
          from: { transform: "translateY(20px)" },
          to: { transform: "translateY(0)" },
        },
        // Gentle bob for floating product cards in the hero cluster.
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "rise-in": "rise-in 0.7s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
