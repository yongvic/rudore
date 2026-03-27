import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  neutral: "bg-[color-mix(in_oklab,var(--border),transparent_75%)] text-muted",
  accent: "bg-[color-mix(in_oklab,var(--accent),transparent_75%)] text-foreground",
  success: "bg-[color-mix(in_oklab,var(--success),transparent_75%)] text-foreground",
  warning: "bg-[color-mix(in_oklab,var(--warning),transparent_75%)] text-foreground",
  danger: "bg-[color-mix(in_oklab,var(--danger),transparent_75%)] text-foreground",
  info: "bg-[color-mix(in_oklab,var(--info),transparent_75%)] text-foreground",
};

export function Badge({
  className,
  variant = "neutral",
  children,
}: {
  className?: string;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
