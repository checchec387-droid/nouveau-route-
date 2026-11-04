# ARP Road Design Expert — Conception Routière & Ingénierie Géométrique (Cerema 2022)

> Application d'ingénierie routière conforme aux guides Cerema (ARP 2022, ICTAAL 2015/2021, Carrefours Interurbains SETRA et Guide des Échangeurs).
> Déployable sur Vercel avec persistance PostgreSQL (Neon, Supabase) ou fichier JSON local.

---

## 1. Déploiement Vercel & Base de Données PostgreSQL

### A. Exécution de la Migration de Base de Données

Le fichier `migrations/001_init.sql` initialise les tables `users`, `sessions` et `activity_logs`.

#### Option 1 : Via l'éditeur SQL de Neon ou Supabase
1. Rendez-vous sur votre console **Neon** (Console SQL) ou **Supabase** (SQL Editor).
2. Copiez le contenu du fichier `migrations/001_init.sql`.
3. Exécutez le script SQL pour créer les tables et index.

#### Option 2 : Via CLI `psql`
```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
```

> **Note :** Le serveur vérifie également et crée automatiquement les tables nécessaires si elles n'existent pas encore (`CREATE TABLE IF NOT EXISTS`) et initialise le compte administrateur racine dès le premier démarrage.

---

## 2. Variables d'Environnement Requises

Sur Vercel (dans **Project Settings > Environment Variables**) ou dans votre fichier local `.env` :

| Variable | Description | Exemple / Requis |
| :--- | :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL (Neon, Supabase) avec SSL activé. Si non définie, l'application utilise le stockage JSON local (`data/app_database.json`). | `postgres://user:pass@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
| `ADMIN_INITIAL_PASSWORD` | Mot de passe initial du superadministrateur (créé au premier démarrage). | **Min. 12 caractères** (ex: `Admin@ARP2026!StrongPass`) |
| `ADMIN_RECOVERY_KEY` | Clé secrète de secours d'urgence administrateur (sans e-mail). | **Min. 24 caractères** (ex: `ARP_EMERGENCY_RECOVERY_KEY_LONG_AND_SECURE_2026`) |
| `SESSION_SECRET` | Clé secrète de chiffrement / signature des sessions. | Chaîne aléatoire sécurisée |
| `ADMIN_EMAIL` | Adresse e-mail du compte administrateur racine (défaut : `youcefyoucefbelallia@gmail.com`). | `youcefyoucefbelallia@gmail.com` |
| `NODE_ENV` | Environnement d'exécution. | `production` sur Vercel, `development` en local |

---

## 3. Architecture Serveur & Vercel Serverless

- **`vercel.json`** :
  - `buildCommand` : `"npm run build"`
  - `outputDirectory` : `"dist"`
  - `rewrites` :
    - `/api/(.*)` vers `/api/index.ts` (fonction serverless Express)
    - `/(.*)` vers `/index.html` (Single Page Application React)
- **`api/index.ts`** : Point d'entrée de la fonction serverless Express Vercel avec middlewares `express.json()` et `cookieParser()`.
- **`server/db.ts`** : Couche d'abstraction bivalente :
  - Si `DATABASE_URL` est renseigné : PostgreSQL managé (`pg.Pool`), requêtes paramétrées sécurisées (`$1`, `$2`), SSL activé (`rejectUnauthorized: false` pour Neon/Supabase).
  - Si `DATABASE_URL` est absent : stockage local persistant `data/app_database.json`.

---

## 4. Tests et Compilation

### Lancement des tests de sécurité et de conformité ARP
```bash
npm test
```

### Construction pour la production
```bash
npm run build
```

### Lancement du serveur de développement local
```bash
npm run dev
```
