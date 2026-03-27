export default function AppLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col gap-6 border-b border-border px-8 py-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="h-3 w-24 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_60%)]" />
            <div className="h-8 w-80 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_45%)]" />
            <div className="h-4 w-96 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_65%)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_65%)]" />
            <div className="h-9 w-28 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_55%)]" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-7 w-44 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
          <div className="h-7 w-56 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
          <div className="h-7 w-40 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
        </div>
      </header>

      <main className="flex-1 px-8 py-10">
        <section className="border-y border-border py-6">
          <div className="grid gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-3 w-24 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
                <div className="h-7 w-32 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_55%)]" />
                <div className="h-3 w-20 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 xl:grid-cols-12">
          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_60%)]" />
              <div className="h-6 w-20 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_65%)]" />
            </div>
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <div className="h-4 w-32 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_55%)]" />
                  <div className="h-3 w-full rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-surface/70 p-6 xl:col-span-7">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_60%)]" />
              <div className="h-7 w-40 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_65%)]" />
            </div>
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3 border-b border-border/60 pb-4 last:border-b-0 last:pb-0">
                  <div className="h-4 w-64 rounded-full bg-[color-mix(in_oklab,var(--border),transparent_55%)]" />
                  <div className="h-3 w-full rounded-full bg-[color-mix(in_oklab,var(--border),transparent_70%)]" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
