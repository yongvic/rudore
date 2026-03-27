# Rudore OS — plateforme

**Rudore OS** unifie l’intelligence, les automatismes et les synergies d’un Venture Studio panafricain (DoAsi, SpeedMaker, Miame, Koodi, LPT) en une seule interface premium. L’application est bâtie sur Next.js App Router, Prisma, Neon, Playwright/Puppeteer et des APIs LLM pour fournir des insights, des workflows, des recommandations et un graphe d’écosystème en temps réel.

## 1. Architecture globale
- **Frontend** : `app/(app)` contient les pages Server Components qui sollicitent `lib/api.ts` (`apiGet`) dans `TopBar` et les sections métier. Les composants UI (side-nav, badges, boutons) vivent dans `components/layout` et `components/ui`.
- **Backend** : chaque surface a son Route Handler Prisma (`app/api/*`). Les tableaux, listes, feed IA et assistant consomment des DTO typés via `lib/api-types.ts`.
- **Base de données** : `prisma/schema.prisma` modélise workspaces, users, startups, métriques, activités, insights, alertes, recommandations, automations, graphe, IA runs. `lib/db.ts` assure un singleton Prisma.
- **Scraping & IA** : `prisma/seed.js` simule la pile : sources, jobs, documents, insights, alerts, recommendations, automations et IA runs. À terme, Playwright/LLM remplacera la génération statique.
- **Automatisations** : tables `AutomationWorkflow`/`WorkflowRun` matérialisent les triggers (briefs, veille, alertes) et la timeline visible dans l’UI du moteur d’automatisation.

## 2. Couche UI & UX
- **Design System** : fond `#141414`, surfaces `#1b1a19`/`#211f1d`, accent `#FC532A`, polices Google Sans (corps) & Bricolage Grotesque (display), espace basé sur 8 px. Pas de cartes imbriquées ; plutôt des dividers.
- **Principes** : priorité à l’action, hiérarchie par l’espace et la typographie, automation-first (alertes, briefs, recom), robustesse (états vides/mauvais accès, texte long).
- **Flux utilisateur** : TopBar + SideNav + pages stratégiques (dashboard, startups, intelligence, assistant, automatisations, écosystème, settings). `apiGet` fournit les données en direct via Prisma et le formatage `lib/formatters.ts`/`lib/metrics.ts`.

## 3. APIs & données exposées
- `GET /api/dashboard` → KPIs, alertes critiques, watchlist, insights, signaux marché, exécution automatisée.
- `GET /api/startups` → liste des startups, focus, statut santé.
- `GET /api/startups/[startupId]` → profil (métriques, timeline, recommandations, intelligence).
- `GET /api/intelligence` → feed multi- sources et filtres par startup.
- `GET /api/assistant` → mémoires IA, contexte opérationnel, suggestions.
- `GET /api/automations` → workflows + historique.
- `GET /api/ecosystem` → nodes + relations pour la carte réseau.
- `GET /api/settings` → gouvernance, sources, intégrations.
- `POST /api/ingest` → ingestion manuelle (ScrapeJob + RawDocument + Insight + Alert).

## 4. Workflow dev
1. `npm install`
1. `npm exec prisma generate`
1. `npm exec prisma db push`
1. `npm run seed`
1. `npm run dev`
- Optionnel : `SEED_RESET=1 npm run seed` pour réinitialiser complètement les données si les droits DB le permettent.
- **Data flow** : les Route Handlers interrogent Prisma → DTO typés → UI.
- **Instructions Git** : tu restes sur la branche `features`, commit et push vers `origin features`, je gère la PR.

## 5. Tests & validation
- Navigation manuelle : dashboard, startups, intelligence, assistant, automatisations, écosystème, settings.
- Seed : `npm run seed` pour reproduire dataset (workspace Rudore, startups, metrics, activité, insights, automations, graphes, logs IA).
- Prisma : `npm exec prisma generate`, `npm exec prisma db push`.
- Vérifier que `apiGet` consomme les routes `app/api/*` sans données hardcodées.

## 6. Alerte opérationnelle
- Les seeds actuels échouent car Neon refuse les `deleteMany`/`create` (EPERM). Il faut un compte avec droits ou une stratégie de seed incrémentale.
- Les pushes vers GitHub échouent tant que l’accès HTTPS (port 443) à `github.com/yongvic/rudore.git` reste indisponible.

## 7. Perspectives
- Automatiser la collecte (Playwright/LLM) + pipeline d’analyses continues.
- Compléter la cartographie Ecosystem avec un graphe vivant et des scores de synergie.
- Étendre l’Assistant/IA pour inclure des simulations d’impact KPI.
