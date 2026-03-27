# Rudore OS

Rudore OS est l’intelligence opérationnelle centralisée du Venture Studio panafricain. Chaque écran de l’app combine une couche IA, des données Prisma et des automatisations programmées pour guider les décisionnaires (partners, venture leads, analysts, ops, fondateurs internés) dans leurs arbitrages stratégiques.

## Fonctionnalités déployées
- Dashboards connectés : KPIs, alertes, watchlist, insights, signaux marché et exécution automatisée sont servis par des APIs Prisma (`/api/dashboard`, `/api/intelligence`, `/api/assistant`, `/api/automations`, `/api/ecosystem`, `/api/settings`, `/api/startups`, `/api/startups/[startupId]`).
- Starter dataset : la base PostgreSQL Neon est seedée (workspaces, startups, metrics, activities, insights, automations, graphes, logs IA) pour reproduire le portefeuille (DoAsi, SpeedMaker, Miame, Koodi, LPT).
- Polices & design : Bricolage Grotesque + Google Sans, surfaces tintées, aucune carte imbriquée, espaces maîtrisés.
- Pipeline local prêt : Prisma + Seed + Automations, accessible en mode développement `npm run dev`.

## Installation locale
1. `npm install` (les dépendances anglais/IA sont déjà dans `package-lock.json`).
2. `npm exec prisma generate` — rebuild le client (Prisma 6.19.2, moteur binaire).
3. `npm exec prisma db push` — synchronise la base Neon avec le schéma.
4. `npm run seed` — recrée les startups, métriques, insights, automatismes et graphe.
5. `npm run dev` — lance Next.js avec App Router.

> Si tu changes le schéma, refais `prisma generate` puis `prisma db push` avant de rerun le seed.

## Architecture rapide
- **Frontend** : `app/(app)` contient les pages Server Components qui appellent `lib/api.ts` via `apiGet`. Les composants partagés vivent dans `components/layout` et `components/ui`.
- **Backend** : `app/api/*` sont des Route Handlers Prisma-read only (dashboard, startups, intelligence, assistant, automations, ecosystem, settings). `lib/db.ts` distribue un client Prisma singletons.
- **Données** : `prisma/schema.prisma` modélise workspaces, startups, métriques, activités, insights, alertes, recommandations, automations, graphes, runs IA. `prisma/seed.js` injecte les jeux de données.
- **Automations IA** : `AutomationWorkflow` + `WorkflowRun` pilotent la timeline / alertes / briefs.

## Flux de travail
- Tu travailles toujours sur la branche `features`. Après avoir validé une feature, `git add` + `git commit`, puis `git push origin features`.
- Je me charge du pull request. N’hésite pas à détailler les endpoints touchés, les seeds et les vérifications faites dans le message de commit.

## Points à surveiller
- Les endpoints Prisma utilisent des helpers (`lib/formatters.ts`, `lib/metrics.ts`, `lib/api-types.ts`) pour produire des données lisibles dans l’UI sans transformer la base à chaque requête.
- Chaque page importe `apiGet` pour récupérer des données en direct. Vérifie que `apiGet` est bien utilisé et que les types `DashboardResponse`, etc. correspondent au JSON servi par la route.

## Tests recommandés
- Lancer `npm run dev` et parcourir les écrans (dashboard, startups, intelligence, assistant, automatisations, écosystème, settings) pour vérifier que les sections affichent des données.
- Vérifier que les seeds reposent sur les mêmes données que l’API (comparaison des réponses avec `lib/api-types.ts`).
