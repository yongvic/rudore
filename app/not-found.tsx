import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Rudore OS</p>
        <h1 className="mt-4 text-3xl font-semibold font-display">
          Ressource introuvable
        </h1>
        <p className="mt-3 text-sm text-muted">
          La page demandée n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
