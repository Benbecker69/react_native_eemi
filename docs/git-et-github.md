# Git et GitHub : comment j'ai organisé le travail

Ce document décrit ma façon de travailler avec Git sur ce projet : la forme des
commits, les vérifications avant chaque commit, le déroulé du projet et ce qui
n'entre jamais dans le dépôt. Il correspond à la ligne « Qualité du code,
performance, README, testabilité » du barème.

Dépôt : <https://github.com/Benbecker69/react_native_eemi> (public, une seule
branche : `main`).

Le backend est dans un autre dépôt, celui du projet web :
<https://github.com/Benbecker69/next_js_m_deux>. Son propre document
`docs/git-et-github.md` décrit la branche `mobile-api` sur laquelle j'ai
développé l'API utilisée ici.

## Mes règles

1. **Un commit = une fonctionnalité.** Je ne mélange pas deux sujets dans un
   commit. Chaque commit laisse l'application dans un état qui se lance.
2. **Un commit = un push.** Je pousse dès que le commit est fait : le dépôt
   distant reflète l'état réel du travail.
3. **Je vérifie avant de committer** (voir plus bas). Si une vérification
   échoue, je corrige d'abord.
4. **Messages en anglais, à l'impératif**, avec une étiquette entre crochets.
5. **Aucune valeur propre à ma machine dans le dépôt** : `.env` n'est jamais
   suivi, seul `.env.example` l'est.

Ce sont les mêmes règles que sur le projet web.

## Forme d'un message de commit

```
[étiquette] description courte à l'impératif
```

Exemples tirés de l'historique :

```
[feat] add allow-list gateway for the mobile API tunnel
[feat] add API client, session storage and auth context
[fix] correct the mobile API base URL to include the /api/mobile/v1 prefix
[test] add unit tests for the API client and token storage
[feat] confirm the reserved space by scanning its QR code
```

| Étiquette    | Usage                                      |
| ------------ | ------------------------------------------ |
| `[feat]`     | Nouvelle fonctionnalité                    |
| `[fix]`      | Correction d'un bug                        |
| `[refactor]` | Réécriture sans changement de comportement |
| `[style]`    | Mise en forme                              |
| `[perf]`     | Performance                                |
| `[docs]`     | Documentation                              |
| `[test]`     | Tests                                      |
| `[build]`    | Outils de build, dépendances               |
| `[ci]`       | Intégration continue                       |
| `[chore]`    | Tâche d'entretien                          |

La description dit **ce que le commit apporte**, pas la liste des fichiers
touchés : `git show` donne déjà cette liste.

## Vérifications avant chaque commit

```bash
npm run lint        # ESLint, configuration d'Expo
npx tsc --noEmit    # TypeScript en mode strict
npm test            # tests unitaires (Jest)
npx expo-doctor     # cohérence avec le SDK Expo
```

| Commande      | Ce qu'elle attrape                                                                    |
| ------------- | ------------------------------------------------------------------------------------- |
| `lint`        | Erreurs de hooks React, règles du React Compiler                                      |
| `tsc`         | Erreurs de type, route de navigation inexistante, champ de l'API mal nommé            |
| `test`        | Une règle cassée : créneau, annulation, lecture du QR code, client de l'API           |
| `expo-doctor` | Une dépendance incompatible avec le SDK                                               |

Pour un changement d'écran ou de comportement, je vérifie aussi sur l'iPhone,
dans Expo Go : un test unitaire ne dit rien d'une permission, de la caméra ou
du clavier.

Le détail des tests est dans [qualite-et-tests.md](qualite-et-tests.md).

## Déroulé du projet

L'historique se lit comme la construction de l'application, couche par couche :
d'abord l'accès au backend, puis la session, puis les écrans.

| Date       | Commit    | Message                                                                              |
| ---------- | --------- | ------------------------------------------------------------------------------------ |
| 2026-09-22 | `7528774` | `[feat] initialize Expo SDK 57 project`                                              |
| 2026-09-22 | `cb0960e` | `[feat] add allow-list gateway for the mobile API tunnel`                            |
| 2026-09-22 | `e3ce853` | `[feat] add API client, session storage and auth context`                            |
| 2026-09-22 | `1a83018` | `[feat] add login, registration and tab navigation screens`                          |
| 2026-09-22 | `c08a628` | `[test] add unit tests for the API client and token storage`                         |
| 2026-09-22 | `31475db` | `[fix] correct the mobile API base URL to include the /api/mobile/v1 prefix`         |
| 2026-09-22 | `688fcb3` | `[feat] add nearby, reservations and history screens with offline banner`            |
| 2026-09-22 | `1f6d160` | `[test] add unit tests for date, distance and credit formatting`                     |
| 2026-09-28 | `2f2a756` | `[feat] add reservation mutations, check-in accuracy and space availability types`   |
| 2026-09-28 | `706ab14` | `[feat] add skeleton loading states and a month calendar for booking`                |
| 2026-09-28 | `c20fc9d` | `[feat] add space search and a shared status pill`                                   |
| 2026-09-29 | `a84b1f2` | `[feat] redesign the reservations list and detail screen`                            |
| 2026-09-29 | `b69c6c4` | `[feat] merge the Reserver tabs into one searchable screen`                          |
| 2026-10-06 | `4fc01ef` | `[feat] align the visual identity with the web app and add toasts`                   |
| 2026-10-06 | `2ef6c40` | `[feat] add profile editing and account security screens`                            |
| 2026-10-06 | `b3797ea` | `[feat] group the check-in history by day and add a check-in detail screen`          |
| 2026-10-06 | `78a3a61` | `[feat] confirm the reserved space by scanning its QR code`                          |
| 2026-10-06 | `cbb63ba` | `[feat] add a home tab with the next reservation, shortcuts and activity figures`    |
| 2026-10-06 | `f486bf4` | `[feat] show a map of the places while booking, locked until the location is on`     |
| 2026-10-09 | `79cd005` | `[chore] reword code comments to stand on their own`                                 |
| 2026-10-09 | `fdc9165` | `[fix] raise small touch targets to 44pt and remove a debug log`                     |
| 2026-10-09 | `1afa892` | `[fix] answer gateway errors in French`                                              |
| 2026-10-09 | `ee70a64` | `[build] update Expo packages to the latest SDK 57 patch versions`                   |

```bash
git log --oneline          # l'historique complet
git show --stat 78a3a61    # les fichiers d'un commit
```

Cinq étapes se distinguent :

1. **Les fondations (22 septembre).** La passerelle, le client de l'API, la
   session, la navigation protégée, puis les premiers écrans de lecture. Un
   correctif (`31475db`) suit le premier essai sur le téléphone : l'adresse de
   l'API ne contenait pas le préfixe `/api/mobile/v1`, et la passerelle
   répondait `404`.
2. **Les écritures (28 septembre).** Réserver, annuler, valider une arrivée ;
   le calendrier mensuel et les squelettes de chargement.
3. **La refonte de l'onglet Réserver (29 septembre).** La recherche d'espaces
   et la liste des réservations réunies dans un seul écran.
4. **Le dernier lot (6 octobre).** L'identité visuelle du site, les toasts, le
   profil et la sécurité, l'historique par jour, le scan du QR code, l'onglet
   Accueil et les cartes.
5. **La relecture (9 octobre).** En écrivant la documentation, j'ai relu tout
   le code : zones tactiles portées à 44 pt, messages de la passerelle en
   français, paquets Expo mis à jour, puis le README et les documents de
   `docs/`.

## Deux dépôts, un contrat

L'application et son backend évoluent dans deux dépôts. Quand une
fonctionnalité demande une nouvelle route ou un nouveau champ (par exemple
`scannedSpaceId` pour le scan), trois endroits changent :

1. la route et sa documentation dans le dépôt web (`docs/api-mobile.md`) ;
2. le type correspondant dans `src/types/api.ts` ici ;
3. le service, puis l'écran.

`src/types/api.ts` est le miroir du contrat. Si les deux divergent, TypeScript
ne peut pas le voir : c'est le fichier à tenir à jour en premier.

## Ce qui n'entre pas dans le dépôt

`.gitignore` :

| Motif                        | Raison                                                              |
| ---------------------------- | ------------------------------------------------------------------- |
| `node_modules/`              | Dépendances, réinstallées par `npm install`                         |
| `.expo/`, `dist/`, `web-build/` | Fichiers générés par Expo                                        |
| `/ios`, `/android`           | Dossiers natifs générés ; le projet tourne dans Expo Go             |
| `.env`, `.env*.local`        | L'adresse de mon tunnel, propre à ma machine                        |
| `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem` | Clés et certificats de signature |
| `expo-env.d.ts`, `*.tsbuildinfo` | Fichiers générés par TypeScript et Expo                         |

`.env.example` est suivi : il documente la seule variable du projet, sans
valeur réelle.

## Reprendre le projet

```bash
git clone https://github.com/Benbecker69/react_native_eemi.git
cd react_native_eemi
npm install
cp .env.example .env    # puis y mettre l'adresse de son tunnel
```

La suite (backend, passerelle, tunnel, Expo Go) est dans le
[README](../README.md), « Lancer l'application ».
