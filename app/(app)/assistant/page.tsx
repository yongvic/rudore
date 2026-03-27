import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import type { AssistantResponse } from "@/lib/api-types";

export default async function AssistantPage() {
  const data = await apiGet<AssistantResponse>("/api/assistant");
  const { conversation, context, suggestions } = data;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar
        title="Assistant stratégique"
        description="Interrogez l'OS en langage naturel pour piloter les décisions critiques."
        actionLabel="Nouveau fil"
      />

      <main className="flex-1 px-8 py-10">
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-display">
                Conversation active
              </h2>
              <Badge variant="accent">Mémoire activée</Badge>
            </div>
            <div className="mt-6 space-y-5">
              {conversation.map((item, index) => (
                <div
                  key={index}
                  className="border-b border-border/60 pb-5 last:border-b-0 last:pb-0"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {item.role === "user" ? "Vous" : "Rudore IA"}
                  </p>
                  <p className="mt-2 break-words text-sm text-foreground">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-5">
              <input
                className="h-11 flex-1 rounded-full border border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/70"
                placeholder="Posez une question stratégique..."
                aria-label="Question stratégique"
              />
              <Button size="sm">Analyser</Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6">
            <h2 className="text-lg font-semibold text-foreground font-display">
              Contexte opérationnel
            </h2>
            <div className="mt-6 space-y-4">
              {context.map((item) => (
                <div key={item.label} className="border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-sm text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border/60 pt-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                Actions suggérées
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
