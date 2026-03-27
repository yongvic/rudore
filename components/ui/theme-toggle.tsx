"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

const themes = ["dark", "light"] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = window.localStorage.getItem("rudore-theme");
    const initial = saved && themes.includes(saved as "dark" | "light")
      ? saved
      : document.documentElement.dataset.theme || "dark";
    document.documentElement.dataset.theme = initial;
    setTheme(initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("rudore-theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "group inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground",
        className
      )}
      aria-label="Basculer le thème"
    >
      <span className="h-2 w-2 rounded-full bg-accent transition-transform group-hover:scale-110" />
      {theme === "light" ? "Mode clair" : "Mode sombre"}
    </button>
  );
}
