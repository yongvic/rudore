# Plan d’action Rudore OS

## Avancement (estimation)
- Global: 40% (Phases 0–1 terminées, Phase 2 en cours)

## Phase 0 — Socle produit (fait)
- Design system validé (dark/light, palette, typo, principes UX)
- Structure Next.js App Router + layout global
- Modélisation Prisma complète (workspaces, startups, insights, automations, ecosystem)
- Seed data réaliste + stratégie reset contrôlée
- Connexion Prisma/Neon + génération client

## Phase 1 — MVP UI + API (fait)
- UI branchée sur endpoints Prisma (dashboard, startups, intelligence, assistant, automations, ecosystem, settings)
- Types API consolidés (`lib/api-types.ts`) + client (`lib/api.ts`)
- États UX robustes (empty, error, loading)
- Navigation stable et cohérence UI → API

## Phase 2 — Intelligence opérationnelle (en cours)
- Pipeline ingestion initial (`lib/pipelines/ingest.ts`)
- Providers RSS + parsing minimal (`lib/pipelines/rss.ts`, `lib/pipelines/providers.ts`)
- Endpoint manuel `/api/ingest` pour déclencher l’ingestion
- Génération d’insights/alertes/recommandations à partir des sources
- Déduplication simple via hash

## Phase 2 — Reste à faire (prochaines itérations)
- Brancher des sources RSS réelles par type de source
- Ajouter un scoring IA plus fin (priorité, impact, urgence)
- Enrichir `RawDocument` (langue, tags, entités)
- Triggers automatiques (ingestion planifiée + règles d’alerte)

## Phase 3 — Automations avancées (à faire)
- Builder minimal (triggers + actions)
- Logs d’exécution détaillés
- Règles d’escalade et seuils dynamiques

## Phase 4 — Ecosystem Graph (à faire)
- Graphe dynamique + édition des relations
- Score d’opportunité par relation
- Suggestions IA de synergies

## Phase 5 — Optimisation & Autonomie (à faire)
- Performance, monitoring, sécurité avancée
- Simulation d’impact KPI
- Automations semi-autonomes validées

## Risques & dépendances
- Droits Neon (mutation/delete) requis pour seed complet
- Qualité des sources RSS et disponibilité réseau

## Règle de livraison
- Chaque feature terminée: commit + push sur `features`
