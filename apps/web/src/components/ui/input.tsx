import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-border bg-background/70 px-3 text-sm outline-none shadow-inset transition-all placeholder:text-muted-foreground focus:border-primary/70 focus:bg-card focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:focus:bg-white/9",
        className
      )}
      {...props}
    />
  );
});
