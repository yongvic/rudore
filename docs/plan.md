# Plan d’action Rudore OS

## 1. Vision & périmètre global
- Intelligence Layer (market monitoring, insights IA, trends).  
- Automation Layer (workflows, content briefs, alertes).  
- Startup Brain (profil, recommandations, mémoire).  
- Ecosystem Engine (graphe, synergies).  
- Assistant IA natif (requêtes stratégiques, simulations).  
- Infrastructure fullstack (Next.js App Router, Prisma/Neon, scraping, LLM).

## 2. Ce qui est déjà livré
- Couche API route handler Prisma pour chaque surface clé (`app/api/*`).  
- UI alignée avec `apiGet` et types (`lib/api-types.ts`) : dashboard, startups (list + détail), intelligence, assistant, automatisations, écosystème, settings.  
- Helpers `lib/formatters.ts`, `lib/metrics.ts` pour rendre les chiffres lisibles (€, %, confiance, etc.).  
- Seed complet `prisma/seed.js` + données (workspaces, startups, métriques, activities, insights, alertes, automatisations, graphes, AI runs).  
- Documentation améliorée (`README.md`) qui couvre architecture, data, workflows, tests et contraintes.  
- Branches/features : tout est sur `features`, commit `feat: wire UI to Prisma APIs`.  
- Prisma synchronisé avec Neon (`prisma generate`, `prisma db push`). Client binary 6.19.2.

## 3. Blocages ouverts
- Push GitHub échoue tant que https://github.com/yongvic/rudore.git reste inaccessible (erreur de connexion port 443).  
- `npm run seed` échoue sur Neon (EPERM) car l’utilisateur ne peut pas supprimer/créer; il faut rights ou un seed qui s’attaque à un schéma test isolé.  
- Nécessité d’un pipeline scraping + IA réel (Playwright/Puppeteer + LLM) pour remplacer les données fixes du seed.

## 4. Étapes suivantes
1. **Droits & seed** : obtenir un accès avec les permissions nécessaires ou intégrer des `upsert`/`migrations` pour que `seed.js` ne crashe pas sur `EPERM`. Rebuilder les données une fois possible.  
2. **Pipeline ingestion** : déployer le scheduler (Playwright/Playwright) qui crée `ScrapeJob` & `RawDocument`, puis appeler les LLM pour générer `Insight`, `Alert`, `Recommendation`.  
3. **Assistant IA interactif** : connecter les prompts de l’assistant à un vrai LLM (avec mémoire de conversations) et enrichir les suggestions (`lib/api-types`).  
4. **Automations avancées** : ajouter builder visuel, triggers cross-startups, règles d’escalade prédictive (via `AutomationWorkflow` + `WorkflowRun`).  
5. **Ecosystème vivant** : étendre `EcosystemNode/EcosystemEdge` avec scores, talent matching, notifications de synergies.  
6. **Monitoring & qualité** : ajouter tests (API + UI), métriques (NPS, adoption des recommandations), alerting sur erreurs d’automations.

## 5. Suivi quotidien
- Sprint actuel : *wire-up complet UI → Prisma*.  
- Dépendances : Next.js 16.2.1, Prisma 6.19.2, Neon PostgreSQL, LLM via API (à décider).  
- Communication : pushes sur `features`, PR déclenchée une fois le push possible. Je m’occupe du PR; note bien dans ton commit message les endpoints modifiés, les seeds touchés et les tests exécutés.
