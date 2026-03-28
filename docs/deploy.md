# Déploiement Rudore OS

## Pré‑requis
- Node.js 20+
- Base PostgreSQL accessible (Neon recommandé)
- Variables d’environnement configurées (voir `.env.example`)

## Étapes
1. Installer les dépendances
   ```bash
   npm install
   ```
2. Générer Prisma
   ```bash
   npm exec prisma generate
   ```
3. Pousser le schéma (dev / staging)
   ```bash
   npm exec prisma db push
   ```
4. (Optionnel) Seed
   ```bash
   npm run seed
   ```
5. Build
   ```bash
   npm run build
   ```
6. Start
   ```bash
   npm run start
   ```

## Production checklist
- `DATABASE_URL` en SSL actif.
- `CRON_SECRET` défini pour `/api/ingest/cron`.
- `INTERNAL_API_TOKEN` défini pour protéger les endpoints sensibles (optionnel).
- `API_RATE_LIMIT` et `API_RATE_LIMIT_WINDOW_MS` ajustés selon la charge.
- `GEMINI_API_KEY` et `RESEND_API_KEY` configurés.
- Monitoring des endpoints critiques:
  - `/api/ingest`
  - `/api/ingest/cron`
  - `/api/automations`
  - `/api/action-logs`
- Planifier le cron d’ingestion (toutes les 6h / 12h selon besoin).

## Notes
- Le système fonctionne en “couche externe” : aucune donnée interne des startups n’est manipulée.
- Les tâches et action logs servent d’audit continu des décisions IA.
