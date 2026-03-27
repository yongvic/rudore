import * as React from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:bg-[color-mix(in_oklab,var(--accent),#000_12%)]",
  secondary:
    "bg-elevated text-foreground hover:bg-[color-mix(in_oklab,var(--elevated),#000_10%)]",
  ghost:
    "bg-transparent text-foreground hover:bg-[color-mix(in_oklab,var(--border),transparent_55%)]",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-transparent font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
