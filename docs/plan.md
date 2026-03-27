# Plan d’action Rudore OS

## Avancement (estimation)
- Global: 70% (Phases 0–3 terminées, Phase 4 en préparation)

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

## Phase 2 — Intelligence opérationnelle (fait)
- Pipeline ingestion initial (`lib/pipelines/ingest.ts`)
- Providers RSS + parsing minimal (`lib/pipelines/rss.ts`, `lib/pipelines/providers.ts`)
- Support RSS/Atom + ciblage par `startupSlug`
- `DataSource.rssUrl` pour séparer page source et flux RSS
- Scoring IA (impact, urgence, priorité) avec heuristiques
- Moteur de ranking (alertes + recommandations) basé sur priorité et fraîcheur
- Pondération sectorielle & boost par type d’insight (RISK, MARKET, COMPETITOR)
- Endpoint manuel `/api/ingest` pour déclencher l’ingestion
- Endpoint cron sécurisé `/api/ingest/cron` pour ingestion planifiée
- Génération d’insights/alertes/recommandations à partir des sources
- Déduplication simple via hash
- Enrichissement `RawDocument` (langue, tags, entités)
- Gouvernance IA (config DB + UI + API `/api/settings/ai`)
 

## Phase 3 — Automations avancées (fait)
- Builder minimal (triggers + actions) + écran dédié
- CRUD workflows + déclenchement manuel
- Runner d’exécution + logs détaillés
- Règles d’escalade (action dédiée) + schedule hebdo
- Workflows métier (intelligence, monitoring, opportunités, alerting, contenu, talent)
- Scheduler + priorités + retries

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
