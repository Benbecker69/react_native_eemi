# Qualité du code, performance et tests

Ce document décrit les contrôles automatiques du projet, ce que couvrent les
tests, les choix de performance et la façon de vérifier l'application. Il
correspond à la ligne « Qualité du code, performance, README, testabilité » du
barème.

Documents liés : [architecture](architecture.md) · [Git et GitHub](git-et-github.md).

## Les contrôles

| Commande              | Ce qu'elle vérifie                                              | Résultat au 9 octobre 2026                      |
| --------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `npm run lint`        | ESLint, configuration d'Expo (`eslint-config-expo`)             | Aucune erreur, aucun avertissement              |
| `npx tsc --noEmit`    | TypeScript en mode strict                                       | Aucune erreur                                   |
| `npm test`            | Tests unitaires (Jest, préréglage `jest-expo`)                  | 136 tests réussis, 13 fichiers                  |
| `npx expo-doctor`     | Cohérence du projet avec le SDK Expo                            | 21 contrôles réussis sur 21                     |

Je lance ces contrôles avant chaque commit.

## Ce qui garde le code lisible

- **TypeScript strict** (`tsconfig.json`), et les formes des réponses de l'API
  typées une seule fois dans `src/types/api.ts`.
- **Routes typées** (`typedRoutes` dans `app.json`) : un chemin de navigation
  qui n'existe pas est une erreur de compilation.
- **React Compiler** activé (`reactCompiler` dans `app.json`) : il mémorise les
  composants à ma place, et ses règles ESLint refusent par exemple un `setState`
  appelé directement dans un effet.
- **Les règles hors des écrans** : une règle métier est une fonction pure dans
  `src/features/`, avec son test à côté. Un écran ne fait que l'appeler.
- **Un seul client d'API**, un seul endroit pour la session, un seul pour la
  position, un seul pour les couleurs.
- **Trois écrans, un formulaire** : la page d'un espace, « près de moi » et
  « nouvelle réservation » partagent `useBookingForm` et `BookingSection`.

## Les tests

Les tests portent sur ce qui se trompe en silence : les règles et le client
réseau. Ils sont dans des dossiers `__tests__/` à côté du code testé.

| Fichier                                        | Tests | Ce qui est vérifié                                                                     |
| ---------------------------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `features/booking/__tests__/slots.test.ts`     | 24    | Heures réservables, créneau passé ou pris, plage de plusieurs heures, limite d'un mois, coût |
| `features/booking/__tests__/calendar.test.ts`  | 9     | Grille du mois (lundi en premier), comparaison de jours, clé de jour                   |
| `features/reservations/__tests__/rules.test.ts` | 13   | À venir / passée / annulée, droit d'annuler, libellé et couleur du statut              |
| `features/reservations/__tests__/grouping.test.ts` | 8 | « Aujourd'hui », « Demain », « Hier », regroupement par jour                          |
| `features/checkins/__tests__/qr.test.ts`       | 5     | Lecture du QR code : bon format, espaces, code étranger, préfixe seul                  |
| `features/checkins/__tests__/grouping.test.ts` | 6     | Regroupement et filtre de l'historique par jour                                        |
| `features/home/__tests__/insights.test.ts`     | 12    | Salutation, « Dans 35 min » / « Demain », taux de présence, heures                     |
| `features/spaces/__tests__/map.test.ts`        | 13    | Un repère par lieu, filtre par lieu, cadrage de la carte, lien vers Plans              |
| `features/spaces/__tests__/search.test.ts`     | 6     | Recherche sans accents ni majuscules, plusieurs mots                                   |
| `features/auth/__tests__/name.test.ts`         | 7     | Séparer et réunir prénom et nom                                                        |
| `services/__tests__/api.test.ts`               | 11    | Jeton ajouté ou non, refus local sans jeton, 401 signalé une fois, 204, erreurs, panne réseau, délai dépassé |
| `storage/__tests__/token.test.ts`              | 5     | Enregistrer, lire, effacer le jeton ; trousseau illisible = pas de session             |
| `utils/__tests__/format.test.ts`               | 17    | Dates, plages horaires, distances, crédits, libellés des refus                         |

```bash
npm test                                  # tout
npm test -- src/features/booking          # un dossier
npm test -- slots.test.ts -t "bookable"   # un fichier, filtré par nom
```

Précisions :

- Les tests de date fixent le fuseau à `Europe/Paris` (`jest.setup.js`) pour
  donner le même résultat sur toutes les machines. L'application, elle, utilise
  le fuseau du téléphone.
- Le stockage sécurisé et `fetch` sont remplacés par des doublures dans les
  tests : le vrai trousseau et le vrai réseau se vérifient sur le téléphone.
- Les règles du serveur (arrivée, réservation) sont testées dans le projet web
  (`src/lib/mobile/checkin.test.ts`).

## Performance

| Sujet                         | Ce qui est fait                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Listes                        | `FlatList` / `SectionList` ; réservations et historique chargés par pages de 20                         |
| Appels réseau                 | Une donnée reste fraîche 30 secondes ; pas d'interrogation périodique du serveur                        |
| Recherche                     | Filtrage sur la liste en mémoire : aucun appel par lettre tapée                                         |
| Disponibilités                | Chargées jour par jour, chaque jour gardé en cache sous sa propre clé                                   |
| Après une action              | Seules les données devenues fausses sont rechargées (invalidation par clé)                              |
| Ouverture                     | Dernières données affichées depuis le cache du téléphone, puis rafraîchies                              |
| GPS                           | Une lecture par action, jamais de suivi ; précision haute seulement pour l'arrivée                      |
| Caméra                        | Mise en pause pendant la vérification                                                                   |
| Cartes                        | La carte n'est pas montée tant que la localisation n'est pas autorisée                                  |
| Rendus                        | React Compiler ; changement de jour sans vider l'écran (`keepPreviousData`)                             |
| Animations                    | API `Animated` sur le fil natif (`useNativeDriver`)                                                     |

Le tunnel gratuit a un quota de requêtes : c'est une raison de plus de ne pas
recharger à chaque changement d'onglet.

## Vérifier l'application à la main

Ce qui dépend du téléphone (caméra, GPS, Face ID, trousseau, réseau) ne se teste
pas par un test unitaire. Le projet fournit de quoi le vérifier vite :

| Besoin                                   | Moyen                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Se connecter sans rien taper             | Bouton « Compte de démonstration » sur l'écran de connexion                        |
| Des QR codes à scanner                   | Page `/qrcode` du site (administrateur)                                            |
| Un lieu à ses coordonnées                | Administration du site → Lieux                                                     |
| Savoir si l'API répond                   | `GET /api/mobile/v1/health`                                                        |
| Savoir si la passerelle filtre           | Les trois `curl` de [backend-et-securite.md](backend-et-securite.md#la-passerelle--nexposer-que-lapi) |

Scénarios pas à pas :

| Scénario                                 | Où                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------ |
| Scan : code étranger, mauvais espace, arrivée validée | [scan-qr.md](scan-qr.md#tester-le-scan)               |
| Position accordée, refusée, arrivée trop loin         | [geolocalisation.md](geolocalisation.md#tester-la-géolocalisation) |
| Session expirée                          | Ci-dessous                                                         |
| Hors ligne                               | Ci-dessous                                                         |

### Session expirée (erreur 401)

1. Se connecter dans l'application.
2. Sur le site, avec le même compte : Mon compte → Sécurité → changer le mot de
   passe. Toutes les sessions mobiles du compte sont révoquées.
3. Revenir dans l'application et tirer une liste pour la rafraîchir.
4. Résultat attendu : retour à l'écran de connexion.

Pour le compte de démonstration, remettre ensuite `demo1234` de la même façon.

### Hors ligne

1. Ouvrir l'application connecté, parcourir l'accueil et les réservations.
2. Passer le téléphone en mode avion.
3. Résultat attendu : le bandeau « Hors ligne — les données affichées peuvent
   être obsolètes » apparaît, les écrans déjà visités restent consultables.
4. Couper le mode avion : le bandeau disparaît et les données se rafraîchissent.

Hors ligne, TanStack Query met les requêtes en attente jusqu'au retour du
réseau : l'application sert à consulter ce qui est déjà chargé. Un écran jamais
ouvert reste en chargement tant que le réseau n'est pas revenu.

## Limites

- **Pas de test de composant ni de test de bout en bout** : les tests couvrent
  les fonctions pures, le client de l'API et le stockage du jeton. Les écrans
  sont vérifiés à la main sur le téléphone.
- **Quelques paquets du gabarit de départ ne sont pas utilisés** par le code
  (`@expo/ui`, `expo-glass-effect`, `expo-device`, `expo-image`,
  `react-native-reanimated`…), ainsi qu'une police installée mais pas chargée
  (`@expo-google-fonts/schibsted-grotesk`).
- **Pas d'intégration continue** : les contrôles sont lancés à la main avant
  chaque commit.
