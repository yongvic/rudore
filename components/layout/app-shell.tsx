import type { ReactNode } from "react";
import { SideNav } from "@/components/layout/side-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <SideNav />
        <div className="flex min-h-screen flex-col">{children}</div>
      </div>
    </div>
  );
}
