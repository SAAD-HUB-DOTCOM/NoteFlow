import type { Config } from "tailwindcss";

/**
 * NoteFlow design tokens — see DESIGN.md (canonical). Derived from the Fathom visual world:
 * near-black canvas, warm off-white text, Sora type, and a 4-hue accent set that appears only as
 * gradients / glows / small marks. Build components from these names, not raw hex.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: "#0E0E10",
        "surface-hover": "#17171A",
        offblack: "#191919",
        border: "#2A2A2A",
        foreground: "#FAF5F5",
        muted: "#A7A2A2", // warm gray tinted from off-white (≈ foreground @ 66%)
        // Brand accent set — gradient stops / links / marks (never large flat UI fills).
        brand: {
          cyan: "#00BEFF",
          purple: "#9600FF",
          pink: "#FFA8BB",
          orange: "#F55200",
          yellow: "#FFF58C",
        },
        // `primary` kept for existing call sites; mapped to the brand purple. Prefer the gradient
        // button (.btn-grad) for real CTAs — see DESIGN.md §2.1.
        primary: {
          DEFAULT: "#9600FF",
          hover: "#7d00d6",
        },
        accent: "#00BEFF",
        danger: "#F55200",
      },
      fontFamily: {
        // One family for display + body (Fathom idiom).
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Fluid clamp scale (min at ~20rem vw → max at ~120rem vw). See DESIGN.md §1.2.
        h1: ["clamp(3.5rem, 3.1rem + 2vw, 5.5rem)", { lineHeight: "1.02", letterSpacing: "-0.045em" }],
        h2: ["clamp(2.5rem, 2.2rem + 1.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
        h3: ["clamp(2rem, 1.8rem + 1vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        h4: ["clamp(1.25rem, 1.15rem + 0.5vw, 1.75rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "p-large": ["clamp(1.25rem, 1.1rem + 0.75vw, 2rem)", { lineHeight: "1.4" }],
        "p-medium": ["clamp(1rem, 0.857rem + 0.714vw, 1.5rem)", { lineHeight: "1.5" }],
        "p-regular": ["clamp(1rem, 0.975rem + 0.125vw, 1.125rem)", { lineHeight: "1.5" }],
        "p-small": ["clamp(0.725rem, 0.67rem + 0.275vw, 1rem)", { lineHeight: "1.5" }],
        "p-tiny": ["clamp(0.85rem, 0.845rem + 0.025vw, 0.875rem)", { lineHeight: "1.4" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        boxed: "1.5rem",
      },
      maxWidth: {
        reading: "48rem",
        "container-large": "80rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rise-in": {
          from: { transform: "translateY(20px)" },
          to: { transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "rise-in": "rise-in 0.7s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 3.2s ease-in-out infinite",
        marquee: "marquee 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
