#  Rudore OS

**Rudore OS** est une plateforme d’intelligence opérationnelle conçue pour transformer un Venture Studio en une machine autonome de création, d’analyse et de scaling de startups.

Elle centralise la **veille stratégique**, l’**automatisation**, les **insights IA** et les **synergies entre startups** au sein d’une interface premium, rapide et orientée décision.

---

##  Vision

Rudore OS n’est pas un simple dashboard.

C’est un **Operating System pour Venture Studio** qui permet de :

* Comprendre le marché en temps réel
* Automatiser les tâches à faible valeur
* Générer des recommandations stratégiques
* Exploiter les synergies entre startups
* Accélérer la prise de décision

---

##  Fonctionnalités principales

### ️ Dashboard global

* KPIs consolidés
* Alertes critiques
* Insights IA
* Signaux marché
* Activité automatisée

---

###  Gestion des startups

* Vue centralisée (DoAsi, SpeedMaker, Miame, Koodi, LPT)
* Santé et performance
* Timeline d’activité
* Recommandations intelligentes

---

###  Veille intelligente

* Agrégation multi-sources
* Filtrage par startup
* Résumés automatiques
* Détection de tendances

---

###  Assistant IA

* Chat contextuel
* Suggestions stratégiques
* Mémoire opérationnelle
* Analyse en langage naturel

---

### ⚙️ Automatisations

* Workflows personnalisés
* Triggers intelligents (veille, alertes, briefs)
* Historique d’exécution

---

###  Ecosystem Intelligence

* Visualisation des relations entre entités
* Détection de synergies
* Mapping des talents et ressources

---

### ⚙️ Settings & gouvernance

* Gestion des sources
* Paramètres workspace
* Intégrations

---

## ️ Architecture

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Composants modulaires (`components/ui`, `components/layout`)

---

### Backend

* Route Handlers Next.js (`app/api/*`)
* API typée via DTO (`lib/api-types.ts`)
* Accès via `lib/api.ts`

---

### Base de données

* PostgreSQL (Neon)
* Prisma ORM
* Singleton Prisma (`lib/db.ts`)

---

### Scraping & IA

* Playwright / Puppeteer (collecte de données)
* API LLM (analyse, résumé, recommandations)
* Simulation actuelle via seed

---

### Automations

* `AutomationWorkflow`
* `WorkflowRun`
* Système de triggers + historique

---

## ️ Modélisation des données

Le schéma Prisma inclut :

* Workspace
* Users
* Startups
* Metrics
* Activity logs
* Insights
* Alerts
* Recommendations
* Automations
* Ecosystem Graph
* AI Runs

---

##  Design System

### Palette

* Primary : `#FC532A`
* Background : `#141414`
* Surfaces : `#1b1a19`, `#211f1d`
* Texte : blanc cassé / gris clair

---

### Typographie

* Display : **Bricolage Grotesque**
* Body : **Google Sans**

---

### Principes UX

* Minimalisme
* Hiérarchie par espace
* Focus action
* Fluidité maximale
* Automation-first

---

##  API Endpoints

| Endpoint             | Description             |
| -------------------- | ----------------------- |
| `/api/dashboard`     | KPIs, alertes, insights |
| `/api/startups`      | Liste des startups      |
| `/api/startups/[id]` | Détail startup          |
| `/api/intelligence`  | Veille globale          |
| `/api/assistant`     | IA + mémoire            |
| `/api/automations`   | Workflows               |
| `/api/ecosystem`     | Graphe relations        |
| `/api/settings`      | Configuration           |

---

## ⚙️ Installation & Setup

```bash
# Installer les dépendances
npm install

# Générer Prisma Client
npm exec prisma generate

# Push le schéma en base
npm exec prisma db push

# Seed la base de données
npm run seed

# Lancer le projet
npm run dev
```

---

###  Reset des données

```bash
SEED_RESET=1 npm run seed
```

---

##  Workflow de développement

1. Développement sur branche `features`
2. Commit & push vers `origin features`
3. PR gérée côté mainteneur

---

##  Tests & validation

* Navigation :

  * dashboard
  * startups
  * intelligence
  * assistant
  * automations
  * ecosystem
  * settings

* Vérifier :

  * données dynamiques (pas de hardcode)
  * cohérence API → UI
  * exécution seed

---

## ⚠️ Problèmes connus

### Neon DB

* Erreur `EPERM` sur `deleteMany` / `create`
* Solution :

  * utiliser un compte avec permissions
  * ou seed incrémental

---

### GitHub

* Problème accès HTTPS (`port 443`)
* Vérifier :

  * réseau
  * VPN
  * firewall

---

##  Roadmap

### Phase 1

* MVP dashboard + startups
* Seed data
* API stable

---

### Phase 2

* Intégration scraping réel
* Pipeline IA dynamique
* Automations avancées

---

### Phase 3

* Ecosystem graph dynamique
* Score intelligent startup
* Assistant stratégique avancé

---

### Phase 4

* Simulation d’impact (KPI)
* Suggestions business automatisées
* Création semi-autonome de startups

---

##  Ambition

Faire de Rudore :

> une **machine intelligente autonome capable de créer, analyser et scaler des startups à grande vitesse**

---

##  Auteur

Projet conçu par **Rudore Venture Studio**
Développement & vision produit pilotés avec une approche SaaS moderne et AI-first.

---

##  Note finale

Rudore OS n’est pas un outil.

C’est le **cerveau central** d’un écosystème entrepreneurial.
