# Repère Mobile — réserver un espace de coworking et prouver son arrivée

Application mobile **Expo / React Native** de Repère, une plateforme de
réservation d'espaces de coworking. Elle permet de trouver l'espace libre le
plus proche, de le réserver en quelques gestes, puis de valider son arrivée sur
place par la **position** et le **scan d'un QR code**. Elle réutilise le backend
du projet web Repère (Next.js, PostgreSQL) par une API dédiée.

Projet fil rouge individuel — Ilias Benharrat, M2 EEMI, 2026.

- Dépôt de l'application : <https://github.com/Benbecker69/react_native_eemi>
- Dépôt du projet web et du backend : <https://github.com/Benbecker69/next_js_m_deux>

## Sommaire

- [Guide de correction](#guide-de-correction)
- [Le produit](#le-produit)
- [Projet web source](#projet-web-source)
- [Choix mobiles](#choix-mobiles)
- [Versions](#versions)
- [Architecture](#architecture)
- [Contexte de développement](#contexte-de-développement)
- [Lancer l'application](#lancer-lapplication)
- [Variables d'environnement](#variables-denvironnement)
- [Commandes](#commandes)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Tester en cinq minutes](#tester-en-cinq-minutes)
- [Tester le scan du QR code](#tester-le-scan-du-qr-code)
- [Tester la géolocalisation](#tester-la-géolocalisation)
- [Expo Go et development build](#expo-go-et-development-build)
- [Usage de l'IA](#usage-de-lia)
- [Limites connues](#limites-connues)
- [Documentation](#documentation)

## Guide de correction

Cette section relie chaque ligne du barème à la documentation qui l'explique,
aux fichiers à ouvrir et à ce que l'on peut observer sur le téléphone.

### Note React Native

| Ligne du barème                                   | Document                                                    | Fichiers à ouvrir                                                                     | À observer sur le téléphone                                                    |
| ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Architecture React Native / Expo Router           | [docs/architecture.md](docs/architecture.md)                | `src/app/_layout.tsx`, `src/app/(app)/_layout.tsx`, `src/services/api.ts`             | Après la connexion, le retour arrière ne ramène pas à l'écran de connexion     |
| Parcours mobile et valeur d'usage                 | [docs/parcours-mobile.md](docs/parcours-mobile.md)          | `src/app/(app)/(tabs)/`, `src/features/booking/useBookingForm.ts`                     | Accueil → Réserver près de moi → Confirmer → Arrivée → Historique              |
| Scan QR code fonctionnel et pertinent             | [docs/scan-qr.md](docs/scan-qr.md)                          | `src/app/(app)/scan-space.tsx`, `src/features/checkins/qr.ts`                         | Scanner un code de `/qrcode` : bon espace, mauvais espace, code étranger       |
| Géolocalisation                                   | [docs/geolocalisation.md](docs/geolocalisation.md)          | `src/features/location/useForegroundLocation.ts`, `src/components/SpacesPane.tsx`     | Distances dans la liste ; refus : liste alphabétique et carte grisée           |
| Backend, données réelles, auth, sécurité          | [docs/backend-et-securite.md](docs/backend-et-securite.md)  | `src/features/auth/AuthContext.tsx`, `src/storage/token.ts`, `tools/api-gateway/server.js` | Une réservation faite dans l'application apparaît sur le site             |
| UI mobile, navigation, états, permissions         | [docs/interface-et-etats.md](docs/interface-et-etats.md)    | `src/components/skeletons.tsx`, `src/components/ScreenState.tsx`, `src/components/ToastHost.tsx` | Squelettes au chargement, toasts, mode avion : bandeau hors ligne     |
| Qualité du code, performance, README, testabilité | [docs/qualite-et-tests.md](docs/qualite-et-tests.md), [docs/git-et-github.md](docs/git-et-github.md) | `src/features/**/__tests__/`, `src/services/__tests__/api.test.ts` | `npm run lint`, `npx tsc --noEmit`, `npm test` (136 tests), `npx expo-doctor` (21/21) |

### Ce que le sujet demande de retrouver

| Exigence                                          | Où                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Expo Router                                       | `src/app/`                                                                                       |
| Stack                                             | `src/app/_layout.tsx`, `src/app/(app)/_layout.tsx`                                               |
| Tabs                                              | `src/app/(app)/(tabs)/_layout.tsx` : Accueil, Réserver, Historique, Profil                       |
| Route dynamique et écran de détail                | `reservation/[id].tsx`, `space/[id].tsx`, `check-in/[id].tsx`                                    |
| Flux de connexion, pas de retour vers la connexion | `Stack.Protected` dans `src/app/_layout.tsx`                                                    |
| Un écran ne contient pas toute la logique         | `src/app` (écrans) → `src/features` (règles, hooks) → `src/services` (API) → `src/storage`       |
| Jeton en SecureStore                              | `src/storage/token.ts`                                                                           |
| Erreur 401 gérée                                  | `apiFetch` (`src/services/api.ts`) → `forceSignOut` (`src/features/auth/AuthContext.tsx`)        |
| Déconnexion                                       | Onglet Profil → « Se déconnecter »                                                               |
| Aucune clé secrète dans l'application             | Une seule variable, `EXPO_PUBLIC_API_URL` (adresse publique) ; cartes sans clé                   |
| Au moins une lecture du backend                   | Sept routes `GET` (espaces, réservations, historique, compte…)                                   |
| Au moins une écriture                             | Réserver, annuler, valider une arrivée, modifier son profil, changer e-mail et mot de passe      |
| Historique de l'action                            | Onglet Historique : chaque tentative d'arrivée, acceptée ou refusée                              |
| Validation côté serveur                           | Réservation, annulation et arrivée décidées par l'API (transactions)                             |
| États chargement / erreur / vide / succès         | Tableau par écran dans [docs/interface-et-etats.md](docs/interface-et-etats.md)                  |
| Permissions expliquées, refus géré                | Position et caméra demandées au moment de l'action, repli prévu                                  |
| Session persistée, reprise après fermeture        | Jeton dans le trousseau, cache des données enregistré sur le téléphone                           |
| Hors ligne minimal                                | Bandeau « Hors ligne », dernières données en cache                                               |
| `FlatList`, pagination                            | `FlatList` / `SectionList`, pages de 20 par curseur                                              |
| Zones tactiles, zones sûres, clavier, clair/sombre | [docs/interface-et-etats.md](docs/interface-et-etats.md), « Ergonomie au doigt »                |
| `.env.example`                                    | À la racine                                                                                      |
| Comptes de démonstration                          | [Comptes de démonstration](#comptes-de-démonstration)                                            |

## Le produit

Repère vend des heures d'espaces de coworking (poste flex, bureau privé, salle
de réunion, phone booth) dans plusieurs lieux, payées en crédits.

**Si le site existe déjà, pourquoi cette application ?** Parce que le site sert
à choisir et à gérer, et l'application sert au moment où l'on se déplace :

- le téléphone sait où je suis : il classe les espaces par distance et propose
  le plus proche qui est libre maintenant ;
- sur place, il prouve l'arrivée : le serveur n'accepte la validation qu'à
  150 m ou moins du lieu, et le scan du QR code confirme de quel espace il
  s'agit ;
- il garde ma prochaine réservation sous la main, même sans réseau.

L'application ne refait pas le site : pas de page d'accueil publique, pas de
pages de présentation, pas d'administration.

Le parcours complet, écran par écran : [docs/parcours-mobile.md](docs/parcours-mobile.md).

## Projet web source

Le projet web est **Repère**, une application Next.js :
<https://github.com/Benbecker69/next_js_m_deux>. Il fournit à l'application :

| Ce que le projet web fournit   | Où, dans son dépôt                                                    |
| ------------------------------ | --------------------------------------------------------------------- |
| La base de données             | PostgreSQL et Prisma — `docs/base-de-donnees.md`                      |
| L'API appelée par le téléphone | `/api/mobile/v1` — contrat complet dans `docs/api-mobile.md`          |
| Les QR codes de test           | Page `/qrcode`, connecté en administrateur                            |
| La création de lieux           | Administration → Lieux (pour placer un lieu à ses propres coordonnées) |

Le site et l'application partagent la même base : un compte, une réservation ou
une arrivée créés d'un côté se voient de l'autre.

## Choix mobiles

| Sujet                 | Choix                                                    | Raison                                                                                      |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Backend               | Réutiliser celui du projet web                           | Une seule base, les mêmes règles pour le site et l'application                              |
| Navigation            | Expo Router : pile, onglets, fenêtres modales            | Routes par fichiers, garde connecté / non connecté intégrée (`Stack.Protected`)             |
| Données du serveur    | TanStack Query, cache enregistré sur le téléphone        | États de chargement et d'erreur, invalidation après une action, relecture hors ligne        |
| Session               | Contexte React + `expo-secure-store`                     | Le jeton est un secret : il va dans le trousseau d'iOS                                      |
| État global           | Aucun gestionnaire dédié                                 | Les données viennent du serveur ; il ne reste que la session et les toasts                  |
| Interface             | Composants React Native de base, écrits pour le projet   | Pas de kit d'interface : chaque composant est court et lisible                              |
| Styles                | `StyleSheet.create`, couleurs dans `src/theme/colors.ts` | La palette du site, en clair et en sombre                                                   |
| Icônes                | SF Symbols (`expo-symbols`)                              | Les icônes d'iOS                                                                            |
| Position              | `expo-location`, lecture unique au premier plan          | Pas de suivi, pas de localisation en arrière-plan                                           |
| Scan                  | `expo-camera` (`CameraView`)                             | Lit les QR codes, disponible dans Expo Go                                                   |
| Cartes                | `react-native-maps`                                      | Apple Plans dans Expo Go, sans clé d'API                                                    |
| Écran sensible        | `expo-local-authentication`                              | Le code de l'appareil est demandé avant l'écran « Sécurité »                                |
| Accès au backend local | Tunnel ngrok + passerelle qui ne laisse passer que l'API | Poste d'entreprise à distance, sans droits d'administrateur : ses ports ne sont pas joignables ; le site et l'administration ne sont pas exposés |
| Tests                 | Jest (`jest-expo`) sur les règles et le client de l'API  | Ce sont les parties qui se trompent sans que cela se voie                                   |

## Versions

| Élément             | Version                                         |
| ------------------- | ----------------------------------------------- |
| Expo SDK            | 57 (`expo` ~57.0.27)                            |
| React Native        | 0.86.3                                          |
| React               | 19.2.3                                          |
| Expo Router         | ~57.0.25                                        |
| TypeScript          | ~6.0.3, mode strict                             |
| Node.js             | 24 (j'utilise 24.13.0, avec npm 11.7.0)         |
| Téléphone de test   | iPhone 15 Pro Max, application Expo Go          |

## Architecture

```
iPhone (Expo Go)
  src/app         écrans et navigation (Expo Router)
  src/features    règles métier (fonctions pures testées) et hooks
  src/services    client unique de l'API, un service par ressource
  src/storage     jeton (trousseau), cache des données
        │  HTTPS, jeton Bearer
        ▼
Tunnel ngrok  →  Passerelle (tools/api-gateway)  →  Next.js /api/mobile/v1  →  PostgreSQL
                 ne laisse passer que l'API
```

Détail, liste des écrans et « où intervenir pour… » :
[docs/architecture.md](docs/architecture.md).

## Contexte de développement

Ce contexte explique pourquoi le lancement ci-dessous passe par deux tunnels et
une passerelle, et non par un simple `npx expo start`.

Je développe sur un **ordinateur de mon entreprise** : un serveur Windows
Server 2022 auquel j'accède en **bureau à distance (RDS)**. **Je n'y ai pas les
droits d'administrateur.** Je teste sur un iPhone, avec Expo Go ; je n'ai pas de
Mac.

| Contrainte                                        | Conséquence                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Poste dans le domaine de l'entreprise, pare-feu géré par elle | L'iPhone ne peut pas se connecter aux ports de mon poste (essai sur le port 8081 : pas de réponse) |
| Pas de droits d'administrateur                    | Je ne peux pas ouvrir un port dans le pare-feu ni changer la configuration réseau |
| Poste partagé avec d'autres projets               | Le port 3000 était déjà pris en IPv4 par un autre serveur                      |
| Backend non déployé                               | Il tourne sur ce poste, que le téléphone doit pourtant atteindre               |

Ce que j'ai mis en place pour contourner ces blocages, sans rien modifier sur le
poste :

| Problème                                              | Solution                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Expo Go ne joint pas le serveur de développement      | `npx expo start --tunnel` : le serveur passe par un tunnel, en connexion sortante          |
| Le tunnel d'Expo ne démarrait pas                     | `@expo/ngrok` ajouté aux dépendances de développement du projet, plutôt qu'en global       |
| Le téléphone ne joint pas le backend                  | Un second tunnel, ngrok, avec un domaine fixe                                              |
| Un tunnel direct aurait exposé le site et l'administration | Une passerelle que j'ai écrite, qui ne transmet que `/api/mobile/v1/*`                |
| Port 3000 déjà pris en IPv4                           | La passerelle vise `[::1]:3000` par défaut ; `UPSTREAM` et `WEB_PORT` changent les ports sans toucher au code |
| Appels refusés par la passerelle (`404`)              | Le préfixe `/api/mobile/v1` manquait dans `.env` (commit `31475db`)                       |

Un tunnel fonctionne ici parce qu'il n'ouvre aucun port : c'est mon poste qui se
connecte vers l'extérieur, et le téléphone parle à l'adresse publique obtenue en
échange.

Le détail de chaque problème, les ports utilisés et la façon de lire une erreur
de connexion : [docs/environnement-et-reseau.md](docs/environnement-et-reseau.md).

## Lancer l'application

L'application a besoin de quatre choses, dans cet ordre : le backend, la
passerelle, le tunnel, puis Expo.

Pré-requis : Node.js 24, Docker (pour le backend), un compte ngrok gratuit, et
l'application **Expo Go** sur un iPhone.

### 1. Le backend (projet web)

```bash
git clone https://github.com/Benbecker69/next_js_m_deux.git
cd next_js_m_deux
docker compose up --build
```

La commande démarre PostgreSQL, applique les migrations, charge les données de
démonstration et lance le site sur <http://localhost:3000>. Vérifier :

```bash
curl http://localhost:3000/api/mobile/v1/health   # {"status":"ok","api":"mobile",…}
```

### 2. L'application et la passerelle

Dans un autre terminal :

```bash
git clone https://github.com/Benbecker69/react_native_eemi.git
cd react_native_eemi
npm install
npm run gateway
```

La passerelle écoute sur `127.0.0.1:3200` et transmet uniquement
`/api/mobile/v1/*` au backend. Par défaut elle vise `http://[::1]:3000`. Si le
backend répond ailleurs, l'indiquer avec `UPSTREAM` :

```bash
UPSTREAM=http://127.0.0.1:3000 npm run gateway             # bash
$env:UPSTREAM="http://127.0.0.1:3000"; npm run gateway     # PowerShell
```

Vérifier :

```bash
curl http://127.0.0.1:3200/api/mobile/v1/health   # {"status":"ok",…}
curl -i http://127.0.0.1:3200/admin               # 404 : le site n'est pas exposé
```

### 3. Le tunnel

Un téléphone ne peut pas joindre `localhost`. ngrok donne une adresse HTTPS
publique à la passerelle. Avec le domaine gratuit attribué au compte (tableau de
bord ngrok → Domains) :

```bash
ngrok http 3200 --url https://<votre-domaine>.ngrok-free.dev
```

### 4. La variable d'environnement

```bash
cp .env.example .env
```

Puis, dans `.env`, mettre l'adresse du tunnel **suivie de `/api/mobile/v1`** :

```
EXPO_PUBLIC_API_URL="https://<votre-domaine>.ngrok-free.dev/api/mobile/v1"
```

Sans ce préfixe, les appels arrivent à la racine du tunnel et la passerelle
répond `404`.

### 5. Expo

```bash
npx expo start --tunnel
```

Sur l'iPhone, scanner le QR code affiché dans le terminal avec l'appareil
photo : le projet s'ouvre dans Expo Go.

- `--tunnel` fait passer le serveur de développement par Internet. C'est le mode
  que j'utilise, pour la raison donnée dans
  [Contexte de développement](#contexte-de-développement). Si l'ordinateur et le
  téléphone sont sur le même Wi-Fi, `npx expo start` suffit.
- Pourquoi deux tunnels et une passerelle, les problèmes de ports rencontrés et
  comment lire une erreur de connexion :
  [docs/environnement-et-reseau.md](docs/environnement-et-reseau.md).
- Après une modification de `.env`, relancer avec `npx expo start --tunnel -c` :
  les variables `EXPO_PUBLIC_` sont lues au démarrage.

## Variables d'environnement

Une seule variable, décrite dans `.env.example`.

| Variable               | Rôle                                         | Exemple                                                  |
| ---------------------- | -------------------------------------------- | -------------------------------------------------------- |
| `EXPO_PUBLIC_API_URL`  | Adresse de l'API, préfixe `/api/mobile/v1` compris | `https://<votre-domaine>.ngrok-free.dev/api/mobile/v1` |

Une variable `EXPO_PUBLIC_` est inscrite en clair dans l'application : celle-ci
est une adresse publique, pas un secret. Le projet n'a aucune clé d'API.

La passerelle lit deux variables facultatives, dans le terminal qui la lance :

| Variable       | Rôle                            | Valeur par défaut      |
| -------------- | ------------------------------- | ---------------------- |
| `UPSTREAM`     | Adresse du backend              | `http://[::1]:3000`    |
| `GATEWAY_PORT` | Port d'écoute de la passerelle  | `3200`                 |

## Commandes

| Commande                              | Effet                                                        |
| ------------------------------------- | ------------------------------------------------------------ |
| `npx expo start --tunnel`             | Serveur de développement, joignable par Internet             |
| `npx expo start`                      | Serveur de développement sur le réseau local                 |
| `npx expo start -c`                   | Idem, en vidant le cache                                     |
| `npm run gateway`                     | Passerelle vers l'API (port 3200)                            |
| `npm run lint`                        | ESLint                                                       |
| `npx tsc --noEmit`                    | Vérification TypeScript                                      |
| `npm test`                            | Tests unitaires (Jest)                                       |
| `npm test -- src/features/booking`    | Les tests d'un dossier                                       |
| `npx expo-doctor`                     | Cohérence du projet avec le SDK Expo                         |

Côté projet web : `docker compose up --build` (tout lancer), `npm run dev`
(développement). Ses commandes sont dans son README.

## Comptes de démonstration

Créés par les données de démonstration du projet web. Mot de passe `demo1234`
pour les deux.

| Rôle           | E-mail                | Crédits au départ | Usage                                                    |
| -------------- | --------------------- | ----------------- | -------------------------------------------------------- |
| Membre         | `camille@example.com` | 250               | Dans l'application (bouton « Compte de démonstration »)  |
| Administrateur | `admin@example.com`   | 500               | Sur le site : page `/qrcode`, création d'un lieu         |

Un compte créé depuis l'écran d'inscription de l'application reçoit 20 crédits.

## Tester en cinq minutes

1. **Connexion.** « Compte de démonstration », puis « Se connecter » : l'accueil
   s'affiche avec le solde et l'activité.
2. **Position.** Onglet Réserver → « Autoriser la localisation » : la liste se
   classe par distance.
3. **Réservation.** Ouvrir un espace → choisir un jour, une heure de début et
   une heure de fin → le récapitulatif montre le coût et le solde restant →
   « Confirmer la réservation ».
4. **Arrivée.** Si le créneau commence dans moins de 15 minutes, la réservation
   propose « Scanner le code de l'espace » et « Valider sans scanner » : le
   serveur accepte ou refuse, avec le motif. Plus tôt, elle propose « Vérifier
   l'espace par QR ».
5. **Historique.** Onglet Historique : la tentative apparaît, avec la distance.
6. **Annulation.** Ouvrir une réservation à venir → « Annuler la réservation » :
   les crédits sont remboursés.
7. **Session.** Fermer complètement l'application et la rouvrir : toujours
   connecté. Profil → « Se déconnecter » : retour à la connexion.

## Tester le scan du QR code

1. Sur l'ordinateur, se connecter au site en administrateur et ouvrir
   <http://localhost:3000/qrcode> : un QR code par espace.
2. Dans l'application, ouvrir une réservation, puis « Scanner le code de
   l'espace » (pendant la fenêtre d'arrivée) ou « Vérifier l'espace par QR »
   (avant).
3. Viser l'écran de l'ordinateur.

| Code scanné                              | Résultat attendu                                                  |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Un QR code quelconque                    | « Ce code n'est pas un code Repère. » — aucun appel au serveur    |
| Celui d'un autre espace                  | « Ce n'est pas l'espace réservé. » ou « Mauvais espace scanné »   |
| Celui de l'espace réservé, avant l'heure | « C'est le bon espace ! » — rien n'est validé                     |
| Celui de l'espace réservé, sur place     | « Arrivée validée ! », visible dans l'historique                  |
| Celui de l'espace réservé, loin du lieu  | « Arrivée non validée : Trop loin. », visible dans l'historique   |

Le QR code n'ouvre pas une adresse web : il contient `repere:space:<identifiant>`,
que l'application contrôle puis envoie au serveur avec la position.

Explications et scénarios complets : [docs/scan-qr.md](docs/scan-qr.md).

## Tester la géolocalisation

| Scénario                 | Geste                                                              | Résultat attendu                                                       |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Permission accordée      | Réserver → « Autoriser la localisation »                           | Distances affichées, espaces les plus proches en premier               |
| Réserver près de moi     | Réserver → « Réserver près de moi »                                | L'espace libre le plus proche, une heure déjà sélectionnée             |
| Permission refusée       | Refuser, ou couper la localisation dans les Réglages               | Liste alphabétique, carte grisée, réservation toujours possible        |
| Retour des Réglages      | Réactiver la localisation, revenir dans l'application              | Distances et cartes de retour, sans relancer                           |
| Arrivée loin du lieu     | Réservation dans sa fenêtre d'arrivée, « Valider sans scanner »    | « Arrivée non validée : Trop loin. », tentative dans l'historique      |
| Arrivée sur place        | Idem, à 150 m ou moins du lieu                                     | « Arrivée validée ! »                                                  |

Les lieux de démonstration sont à Lyon, Nantes, Bordeaux et Lille. Pour valider
une arrivée ailleurs, créer un lieu à ses propres coordonnées depuis
l'administration du site :
[docs/geolocalisation.md](docs/geolocalisation.md#obtenir-une-arrivée-validée).

## Expo Go et development build

**Le projet tourne entièrement dans Expo Go.** Tous les modules natifs utilisés
y sont inclus : `expo-location`, `expo-camera`, `expo-secure-store`,
`expo-local-authentication`, `react-native-maps`, `expo-symbols`. Il n'y a pas
de dossier `ios/` ni `android/`.

Je n'ai pas fait de development build : je travaille sur Windows avec un
iPhone, sans Mac ni compte Apple Developer. Conséquences :

- le **NFC**, qui demande un module natif absent d'Expo Go, n'est pas
  implémenté ; l'arrivée repose sur le scan du QR code et la position ;
- l'application a été testée sur iPhone uniquement.

Expo Go ouvre les projets du SDK qu'il prend en charge : ce projet est en
SDK 57.

## Usage de l'IA

Cette application a été développée avec un agent IA, après le site web et avec
la même méthode. Il a écrit le code sous ma direction : je cadrais le travail,
je prenais les décisions techniques et je validais chaque modification avant
qu'elle soit commitée.

### Outils utilisés

| Outil                                           | Usage                                                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| ChatGPT                                         | Rédiger le prompt de départ : je lui ai donné une trentaine de lignes décrivant ce que je voulais, il en a fait un prompt adapté à Claude Code |
| Claude Code                                     | Agent de développement dans le terminal : plan, code, tests, documentation                                                                     |
| Claude Design                                   | Maquettes, que je validais avant le développement                                                                                              |
| Jira, relié à Claude Code par un connecteur MCP | Tableau agile, sprints et tickets du projet, créés par l'agent                                                                                 |

### Le prompt de départ

Ce prompt fixait la façon de travailler avant toute ligne de code.

- **Un rôle et un cadre.** Agir en lead développeur senior, commencer en mode
  plan et me poser une trentaine de questions avant de développer. Toute
  décision technique m'était soumise.
- **Des règles écrites.** Un fichier de règles : commits en anglais, à
  l'impératif, avec un tag ; une fonctionnalité par commit ; ne rien inventer ;
  aucun commit ni push sans ma validation.
- **Des fiches de connaissances (« skills »).** Pour que l'agent travaille sur
  la version actuelle d'Expo sans refaire les mêmes recherches à chaque
  session : des fiches écrites pour le projet (interface mobile, bonnes
  pratiques Expo, client de l'API) et des copies de fiches publiées par Expo
  et par Vercel (Expo Router, interface native, chargement des données).
- **Un fichier de contexte.** Il décrit le projet et ses règles, et dit quelle
  fiche consulter pour quel besoin ; à défaut, la documentation officielle. Il
  est tenu à jour au fil du projet : c'est lui qui permet de reprendre le
  travail dans une conversation neuve.
- **Des agents spécialisés.** Un agent lit les PDF des sujets avec un modèle
  plus léger, pour économiser le modèle principal ; un autre tenait le rôle de
  product owner.
- **Une limite de contexte.** Au-delà de 60 % de la fenêtre de contexte, la
  conversation est compactée, puis le contexte est rechargé depuis le fichier
  de contexte.

Les règles, les fiches, le fichier de contexte et les agents sont sur mon
poste : je ne les ai pas versionnés dans ce dépôt.

### Tâches confiées, et ce que j'ai gardé

| Confié à l'agent                                                    | Gardé pour moi                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Proposer le plan et l'architecture                                  | Répondre aux questions du plan et trancher chaque choix technique   |
| Écrire le code : écrans, hooks, services, passerelle de l'API       | Relire et valider chaque modification avant qu'elle soit commitée   |
| Écrire les tests unitaires et la documentation                      | Tester sur l'iPhone : l'agent n'a pas accès au téléphone            |

### Une décision de l'IA que j'ai refusée

L'agent a proposé un bouton « Confirmer quand même », qui aurait validé une
arrivée dans l'application alors que le serveur l'avait refusée. Je l'ai
refusé : le serveur doit rester seul juge d'une arrivée. Il n'existe aucun
contournement dans l'application
([docs/scan-qr.md](docs/scan-qr.md)).

### Une partie que je peux expliquer intégralement

Le scan du QR code : la lecture par la caméra, le contrôle du préfixe
`repere:space:` avant tout appel réseau (`src/features/checkins/qr.ts`), la
protection contre le double scan et l'envoi au serveur avec la position
(`src/app/(app)/scan-space.tsx`). Détail : [docs/scan-qr.md](docs/scan-qr.md).

### Limites et bugs rencontrés

- **L'agent ne voit pas le téléphone.** Tout ce qui dépend de l'appareil
  (caméra, position, code de l'appareil) n'est vérifié que lorsque je le teste
  moi-même sur l'iPhone. Les deux bugs ci-dessous n'ont été trouvés qu'ainsi.
- **Tous les appels en `404` au premier essai sur le téléphone.** L'adresse de
  l'API dans `.env` n'avait pas le préfixe `/api/mobile/v1` : la passerelle
  refusait les appels (commit `31475db`).
- **Une session révoquée n'était détectée qu'après avoir fermé
  l'application.** TanStack Query s'appuie par défaut sur des événements du
  navigateur qui n'existent pas sur React Native. Correctif dans
  `src/storage/queryClient.ts` ; explication dans
  [docs/backend-et-securite.md](docs/backend-et-securite.md).

## Limites connues

- **Pas de déploiement.** Le backend tourne sur mon ordinateur ; le téléphone
  l'atteint par un tunnel. L'ordinateur doit être allumé, avec le projet web,
  la passerelle et le tunnel lancés.
- **iOS uniquement.** Je n'ai pas testé l'application sur Android.
- **Pas de NFC**, pas de development build (voir ci-dessus).
- **La position vient du téléphone et peut être falsifiée.** Le serveur décide,
  mais ne peut prouver la présence que si le téléphone dit vrai. Le QR code est
  statique : c'est la position qui empêche de valider une arrivée à distance.
- **Hors ligne, l'application est en lecture seule** sur les données déjà
  chargées ; un écran jamais ouvert reste en chargement jusqu'au retour du
  réseau.
- **La liste des espaces est limitée à 30** (plafond de l'API) ; la recherche
  porte sur cette liste.
- **Le filtre par date de l'historique** porte sur les pages déjà chargées ; un
  bouton permet de charger la suite.
- **Les heures sont celles du fuseau du téléphone.**
- **Tests** : fonctions pures, client de l'API et stockage du jeton. Pas de
  test de composant ni de bout en bout.

Détail par sujet dans la section « Limites » de chaque document.

## Documentation

| Document                                                     | Contenu                                                                 |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                 | Dossiers, routes, garde de connexion, chemin d'une action, cache        |
| [docs/parcours-mobile.md](docs/parcours-mobile.md)           | Pourquoi l'application, parcours de bout en bout, écran par écran       |
| [docs/scan-qr.md](docs/scan-qr.md)                           | Rôle du scan, flux complet, double scan, erreurs, scénarios de test     |
| [docs/geolocalisation.md](docs/geolocalisation.md)           | Usages de la position, permission, refus, règles de l'arrivée, cartes   |
| [docs/backend-et-securite.md](docs/backend-et-securite.md)   | API, passerelle, client, session, erreur 401, sécurité, cache           |
| [docs/environnement-et-reseau.md](docs/environnement-et-reseau.md) | Poste d'entreprise à distance, sans droits d'administrateur : ports bloqués, tunnels, passerelle, diagnostic |
| [docs/interface-et-etats.md](docs/interface-et-etats.md)     | Navigation, quatre états, retours, permissions, ergonomie, accessibilité |
| [docs/qualite-et-tests.md](docs/qualite-et-tests.md)         | Contrôles, tests, performance, vérifications à la main                  |
| [docs/git-et-github.md](docs/git-et-github.md)               | Règles de commit, vérifications, déroulé du projet                      |

Dans le dépôt du projet web : `docs/api-mobile.md` (contrat de l'API),
`docs/base-de-donnees.md` (schéma), `docs/authentification-et-securite.md`.
