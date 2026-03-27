"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-start justify-center gap-4 px-8 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        Rudore OS
      </p>
      <h1 className="text-2xl font-semibold text-foreground font-display">
        Une erreur est survenue
      </h1>
      <p className="max-w-xl text-sm text-muted">
        Impossible de charger les données demandées. Vérifiez la connexion aux
        sources et réessayez.
      </p>
      <p className="text-xs text-muted">{error.message}</p>
      <Button size="sm" onClick={() => reset()}>
        Réessayer
      </Button>
    </div>
  );
}
