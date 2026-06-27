import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-primary/35 bg-gradient-to-r from-primary via-violet to-accent text-primary-foreground shadow-neon hover:-translate-y-0.5 hover:brightness-110",
        secondary:
          "border border-border bg-background/70 text-foreground shadow-inset hover:bg-card dark:border-white/10 dark:bg-white/8 dark:hover:bg-white/12",
        ghost:
          "text-foreground hover:bg-background/70 hover:text-primary dark:hover:bg-white/8",
        destructive:
          "border border-destructive/30 bg-destructive text-white shadow-[0_0_30px_-18px_hsl(var(--destructive))] hover:bg-destructive/90",
        outline:
          "border border-border bg-background/70 text-foreground shadow-inset hover:border-primary/35 hover:bg-card dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
      },
      size: {
        default: "h-9 px-3",
        icon: "h-9 w-9 px-0",
        sm: "h-8 px-2.5 text-xs"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
