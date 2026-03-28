"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ActionLogItem, ActionLogsResponse } from "@/lib/api-types";

type StartupOption = {
  slug: string;
  name: string;
};

type Props = {
  initialLogs: ActionLogItem[];
  initialMeta?: ActionLogsResponse["meta"];
  startups: StartupOption[];
};

export function ActionLogsPanel({ initialLogs, initialMeta, startups }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPage = initialMeta?.page ?? 1;
  const defaultPageSize = initialMeta?.pageSize ?? 40;
  const initialFromQuery = () => {
    const startup = searchParams.get("startup") ?? "ALL";
    const type = searchParams.get("type") ?? "";
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");
    const parsedPage = Math.max(
      1,
      Number.parseInt(pageParam ?? String(defaultPage), 10) || defaultPage
    );
    const parsedPageSize = Math.min(
      100,
      Math.max(
        5,
        Number.parseInt(pageSizeParam ?? String(defaultPageSize), 10) ||
          defaultPageSize
      )
    );
    return {
      filters: { startup, type },
      page: parsedPage,
      pageSize: parsedPageSize,
    };
  };
  const initialState = initialFromQuery();
  const [logs, setLogs] = useState<ActionLogItem[]>(initialLogs);
  const [meta, setMeta] = useState<ActionLogsResponse["meta"]>(
    initialMeta ?? {
      page: 1,
      pageSize: 40,
      total: initialLogs.length,
      hasMore: false,
    }
  );
  const [page, setPage] = useState(initialState.page);
  const [pageSize, setPageSize] = useState(initialState.pageSize);
  const [filters, setFilters] = useState(initialState.filters);

  const startupOptions = useMemo(
    () => [
      { label: "Studio", value: "studio" },
      ...startups.map((startup) => ({
        label: startup.name,
        value: startup.slug,
      })),
    ],
    [startups]
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.startup !== "ALL") params.set("startup", filters.startup);
    if (filters.type.trim()) params.set("type", filters.type.trim());
    if (page !== defaultPage) params.set("page", String(page));
    if (pageSize !== defaultPageSize) {
      params.set("pageSize", String(pageSize));
    }
    const query = params.toString();
    const target = query ? `?${query}` : window.location.pathname;
    if (query !== searchParams.toString()) {
      router.replace(target, { scroll: false });
    }
  }, [filters, page, pageSize, router, defaultPage, defaultPageSize, searchParams]);

  useEffect(() => {
    let active = true;
    async function load() {
      const params = new URLSearchParams();
      if (filters.startup !== "ALL") params.set("startup", filters.startup);
      if (filters.type.trim()) params.set("type", filters.type.trim());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/action-logs?${params.toString()}`);
      if (!res.ok) return;
      const payload = (await res.json()) as ActionLogsResponse;
      if (!active) return;
      setLogs(payload.logs);
      if (payload.meta) {
        setMeta(payload.meta);
        if (payload.meta.page !== page) setPage(payload.meta.page);
        if (payload.meta.pageSize !== pageSize) {
          setPageSize(payload.meta.pageSize);
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, page, pageSize]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border/60 bg-surface/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted">
          Filtres
        </div>
        <select
          className="h-9 rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          value={filters.startup}
          onChange={(event) => {
            setPage(1);
            setFilters((current) => ({
              ...current,
              startup: event.target.value,
            }));
          }}
        >
          <option value="ALL">Toutes startups</option>
          {startupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          className="h-9 min-w-[220px] rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          placeholder="Type d'événement (ex: task.created)"
          value={filters.type}
          onChange={(event) => {
            setPage(1);
            setFilters((current) => ({ ...current, type: event.target.value }));
          }}
        />
        <select
          className="h-9 rounded-full border border-border/60 bg-surface/70 px-3 text-xs text-foreground outline-none"
          value={pageSize}
          onChange={(event) => {
            setPage(1);
            setPageSize(Number.parseInt(event.target.value, 10));
          }}
        >
          {[20, 40, 80].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const params = new URLSearchParams();
            if (filters.startup !== "ALL") params.set("startup", filters.startup);
            if (filters.type.trim()) params.set("type", filters.type.trim());
            window.location.href = `/api/action-logs/export?${params.toString()}`;
          }}
        >
          Export JSON
        </Button>
      </section>

      <section className="rounded-2xl border border-border/70 bg-surface/70">
        <div className="hidden grid-cols-[1.2fr_1fr_2fr] gap-6 border-b border-border/60 px-6 py-4 text-xs uppercase tracking-[0.2em] text-muted md:grid">
          <span>Type</span>
          <span>Startup</span>
          <span>Données</span>
        </div>
        {logs.length > 0 ? (
          <div className="divide-y divide-border/60">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex min-w-0 flex-col gap-3 px-6 py-5 text-sm md:grid md:grid-cols-[1.2fr_1fr_2fr] md:gap-6"
              >
                <div className="space-y-2">
                  <p className="min-w-0 break-words text-sm font-medium text-foreground">
                    {log.type}
                  </p>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <span className="min-w-0 break-words text-sm text-muted">
                  {log.startup ?? "Studio"}
                </span>
                <div className="rounded-xl border border-border/60 bg-surface/80 p-3 text-xs text-muted">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-sm text-muted">
            Aucun événement IA enregistré.
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          {meta ? `${meta.total} événements • page ${page}` : "—"}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPage((current) => current + 1)}
            disabled={!meta?.hasMore}
          >
            Suivant
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted">
        <Badge variant="neutral">{logs.length}</Badge>
        <span>événements chargés</span>
      </div>
    </div>
  );
}
