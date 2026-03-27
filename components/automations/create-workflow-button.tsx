"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CreateWorkflowButton() {
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/automations", { method: "POST" });
      if (!res.ok) {
        throw new Error("Impossible de créer le workflow.");
      }
      const data = (await res.json()) as { id?: string };
      if (data.id) {
        window.location.href = `/automations/builder/${data.id}`;
      }
    } catch (error) {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleCreate} disabled={loading}>
      {loading ? "Création..." : "Créer un workflow"}
    </Button>
  );
}
