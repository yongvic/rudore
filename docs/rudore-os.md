# Rudore OS — Dossier Produit & Architecture

Ce document consolide l’état actuel et la suite à construire pour faire de Rudore OS une plateforme opérationnelle d’intelligence et d’exécution pour un Venture Studio panafricain.

## 1. Concept produit détaillé

**Vision.** Un “système nerveux” qui transforme des signaux externes et internes en décisions actionnables, puis en automatisations mesurables.

**Promesse.** Réduire le temps de décision stratégique, augmenter la précision des priorités, et orchestrer l’exécution cross-startups.

**Valeur centrale.** Centraliser la vérité (data), prioriser par IA (insights), automatiser l’action (workflows), et capitaliser la mémoire stratégique.

**Boucles clés.** 
- Collecte continue → analyse → recommandations → action → feedback → modèle amélioré.
- Détection d’opportunités de synergies → exécution coordonnée → gains multi‑startups.

**Personas.** Managing partners (vision + arbitrage), venture leads (priorisation + suivi), analysts (veille + synthèses), ops (exécution + automatisations), fondateurs internes (pilotage terrain).

**Métriques de succès.**
- Temps moyen décision → action.
- Taux d’adoption des recommandations IA.
- Nombre d’automatisations actives et ROI estimé.
- Diminution des risques critiques non détectés.

**Différenciation.** Intelligence systémique (graph d’écosystème) + mémoire décisionnelle + automatisation stratégique multi‑entités.

## 2. UX complet (écran par écran)

1. **Tableau de bord global** — But: synthèse exécutable de l’écosystème. Sections: KPIs, alertes critiques, insights IA prioritaires, signaux marché, exécution automatisée. Actions: lancer un brief IA, explorer insights. États: normal, surcharge d’alertes, manque de signaux (empty state).
1. **Portefeuille startups** — But: comparer et sélectionner une startup. Sections: liste filtrable, indicateurs clés, statut santé. Actions: ouvrir fiche, créer startup. États: portfolio vide, filtres actifs, tri par risque.
1. **Fiche startup** — But: pilotage opérationnel d’une entité. Sections: métriques clés, timeline d’activités, recommandations IA, intelligence marché dédiée. Actions: exporter, ouvrir brief IA, escalader alerte. États: data incomplète, données divergentes, accès restreint.
1. **Intelligence marché** — But: flux multi‑sources consolidé. Sections: filtres par startup, liste des signaux avec score et source. Actions: ajouter source, qualifier signal, créer alerte. États: aucune source active, flux saturé, signal critique.
1. **Assistant IA** — But: requêtes stratégiques naturelles + mémoire. Sections: fil de conversation, contexte opérationnel, actions suggérées. Actions: lancer analyse, enregistrer insight, créer tâche. États: conversation vide, requête longue, réponse différée.
1. **Automations** — But: orchestration d’actions récurrentes. Sections: workflows actifs, historique d’exécution. Actions: créer workflow, ouvrir builder, mettre en pause. États: workflow en échec, erreurs d’exécution, droits insuffisants.
1. **Écosystème** — But: visualiser relations et synergies. Sections: graphe, relations prioritaires, opportunités de convergence. Actions: exporter la carte, créer relation, annoter lien. États: graphe partiel, incohérences de données.
1. **Paramètres** — But: gouvernance et sécurité. Sections: rôles, sources, intégrations. Actions: ajouter utilisateur, connecter source, gérer droits. États: intégration défaillante, audit de permissions.

## 3. UI précise (spacing, layout, comportement)

**Grille.** Layout 12 colonnes desktop, side‑nav fixe `280px`, contenu centré `max-w-[1200–1320px]` selon écran, gouttières `24–32px`.

**Échelle d’espacement.** Base 8px. Sections `24–40px`, groupes `12–20px`, micro‑espaces `6–8px`. Pas d’espaces arbitraires.

**Typo.** Titres `Bricolage Grotesque`, corps `Google Sans`. Hiérarchie: H1 `30–32px`, H2 `18–20px`, labels `11–12px` uppercase tracking. Textes longs limités à `65ch`.

**Surfaces.** `background` profond #141414, surfaces `#1b1a19` et `#211f1d`. Bords subtils via `border` teinté.

**Comportement.** Transitions `150–220ms` ease‑out, focus visible systématique, hover subtil. Aucun bounce.

**Listes.** Rangées sans cartes imbriquées, séparation par dividers. Densité régulière, avec ellipsis/retour à la ligne pour longs textes.

**États.** Chargement, vide, erreur, succès. Indicateurs sémantiques via badges (success/warning/danger/info).

## 4. Architecture technique

**Frontend.** Next.js App Router + Tailwind + shadcn/ui. Composants UI réutilisables, pages en Server Components, interactions isolées en Client Components.

**Backend.** Route handlers pour API, Prisma pour accès données, logique métier organisée par domaine: `insights`, `alerts`, `automations`, `ecosystem`, `startups`.

**Jobs asynchrones.** Un worker dédié exécute scraping, enrichissement, scoring, génération d’insights, et déclenchement d’alertes.

**Sécurité.** NextAuth, RBAC par workspace et startup, audit des actions IA (journal d’exécution).

**Data flow.** Sources → scraping → normalisation → stockage brut → extraction sémantique → insight → alerte/recommandation → automation → feedback.

## 5. Prisma schema (état actuel)

Le schéma actuel couvre déjà l’ossature “OS” complète: workspaces, startups, data sources, scraping, insights, alertes, recommandations, automatisations, graphe écosystème, IA runs.

Référence: `prisma/schema.prisma`.

Points forts:
- Traçabilité des sources (`DataSource`, `ScrapeJob`, `RawDocument`).
- Séparation insight/alerte/recommandation pour contrôle métier.
- Graphe interne (`EcosystemNode`, `EcosystemEdge`) prêt pour la cartographie.
- Mémoire IA (`AiRun`) pour audit et coût.

## 6. Structure Next.js (état actuel + cible)

```
app/
  (app)/
    dashboard/
    startups/
      [startupId]/
    intelligence/
    assistant/
    automations/
    ecosystem/
    settings/
  layout.tsx
  globals.css
components/
  layout/
  ui/
lib/
  db.ts
  cn.ts
prisma/
  schema.prisma
docs/
  rudore-os.md
```

Extension cible:
- `app/api/*` pour endpoints métiers.
- `lib/services/*` pour logique pure.
- `lib/pipelines/*` pour ingestion + IA.
- `components/blocks/*` pour sections réutilisables.

## 7. Pipeline Scraping + IA

1. **Gestion des sources.** Déclaration de sources par workspace, typage, fréquence, fiabilité.
1. **Scheduler.** Planification des `ScrapeJob` par priorité et criticité.
1. **Scraping.** Playwright/Puppeteer avec extraction structurée + fallback HTML brut.
1. **Normalisation.** Déduplication via hash, nettoyage, langue, entités.
1. **Stockage brut.** `RawDocument` pour audit et reprocessing.
1. **Extraction IA.** Résumés, tags, score d’impact, entités reconnues.
1. **Génération d’insights.** Création d’`Insight` relié à une startup ou global.
1. **Déclenchement d’alertes.** Règles + seuils + priorisation.
1. **Recommandations.** Rationale + action suggérée, stockée dans `Recommendation`.
1. **Apprentissage.** Feedback utilisateur → ajustement de scoring.

## 8. Roadmap de développement

1. **Phase 1 — OS fonctionnel (4–6 semaines).** Auth, modèles Prisma, pages actuelles branchées sur API, lecture/écriture de base, seed data.
1. **Phase 2 — Intelligence (4–8 semaines).** Ingestion multi‑sources, scoring IA, alertes, feed dynamique.
1. **Phase 3 — Automations (4–6 semaines).** Builder minimal, triggers KPI, logs d’exécution.
1. **Phase 4 — Ecosystem graph (4–6 semaines).** Graphe dynamique, éditeur de relations, suggestions IA.
1. **Phase 5 — Optimisation (continu).** Performance, multi‑régions, sécurité avancée, modèle d’apprentissage.

## Bonus obligatoire — Différenciation & IA‑native

**Fonctions innovantes.**
- “Decision Memory”: chaque décision majeure conserve contexte, preuves, et impact mesuré.
- “Insight Arbitration”: comparaison entre deux hypothèses stratégiques avec score de confiance.
- “Opportunity Radar”: projection de nouvelles startups à créer via signaux combinés.

**Automations avancées.**
- Brief board automatique avec comparaison trimestrielle.
- Escalade prédictive si deux signaux risqués convergent.
- Cross‑sell engine: déclenchement de projets inter‑startups.

**Différenciation forte.**
- Graphe vivant des synergies avec “score d’opportunité” par relation.
- Benchmarks panafricains propriétaires (par secteur, pays, maturité).

**IA‑native (pas juste intégrations).**
- Génération de stratégie par scénarios (optimiste/base/pessimiste).
- Simulations d’impact KPI à partir d’actions proposées.
- “Autopilot limité”: l’IA exécute des automatisations à faible risque après validation.
