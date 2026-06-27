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
          "0 20px 70px -45px rgb(14 165 233 / 0.65), 0 18px 44px -34px rgb(0 0 0 / 0.85)",
        glow: "0 0 0 1px hsl(var(--border)), 0 0 42px -18px hsl(var(--glow))"
      },
      opacity: {
        6: "0.06",
        7: "0.07",
        8: "0.08",
        9: "0.09",
        12: "0.12",
        15: "0.15",
        22: "0.22",
        28: "0.28",
        35: "0.35",
        55: "0.55"
      }
    }
  },
  plugins: []
} satisfies Config;
