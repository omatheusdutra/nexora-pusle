import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        surface: "hsl(var(--surface))",
        "surface-strong": "hsl(var(--surface-strong))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        violet: "hsl(var(--violet))"
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px"
      },
      boxShadow: {
        panel:
          "inset 0 1px 0 rgb(255 255 255 / 0.06), 0 22px 80px -54px hsl(var(--panel-shadow)), 0 18px 48px -38px rgb(0 0 0 / 0.95)",
        glow: "0 0 0 1px hsl(var(--panel-border)), 0 0 44px -20px hsl(var(--glow))",
        neon:
          "0 0 0 1px hsl(var(--panel-border)), 0 0 38px -22px hsl(var(--primary)), 0 0 72px -48px hsl(var(--violet))",
        inset:
          "inset 0 1px 0 rgb(255 255 255 / 0.08), inset 0 -1px 0 rgb(255 255 255 / 0.03)"
      },
      opacity: {
        6: "0.06",
        7: "0.07",
        8: "0.08",
        9: "0.09",
        12: "0.12",
        15: "0.15",
        18: "0.18",
        22: "0.22",
        28: "0.28",
        35: "0.35",
        55: "0.55"
      }
    }
  },
  plugins: []
} satisfies Config;
