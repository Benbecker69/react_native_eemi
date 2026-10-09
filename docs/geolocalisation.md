# Géolocalisation

Ce document explique à quoi sert la position dans l'application, quand elle est
demandée, ce qui se passe quand elle est refusée, et comment la tester. Il
correspond à la ligne « Géolocalisation » du barème.

Documents liés : [scan QR](scan-qr.md) · [backend et sécurité](backend-et-securite.md) ·
[interface et états](interface-et-etats.md).

## Quatre usages, tous liés au métier

| Usage                      | Où                                         | Ce que la position change                                                    |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Trier par distance         | Onglet Réserver, liste des espaces         | Les espaces les plus proches en premier, avec leur distance                  |
| Réserver près de moi       | Carte en tête de l'onglet Réserver         | Le serveur propose l'espace libre maintenant le plus proche                  |
| Valider son arrivée        | Détail d'une réservation, écran de scan    | Le serveur n'accepte l'arrivée qu'à 150 m ou moins du lieu                   |
| Afficher les cartes        | Écrans de réservation                      | La carte n'apparaît que si la localisation est autorisée                     |

La position n'est jamais affichée pour elle-même : elle sert à classer, à
proposer ou à prouver.

## Les principes que je respecte

- **Jamais au lancement.** La permission est demandée au moment d'une action
  (« Réserver près de moi », « Autoriser la localisation », valider une arrivée),
  pas à l'ouverture de l'application.
- **Une explication avant la demande.** L'écran dit pourquoi : « Autorisez la
  localisation pour voir les espaces les plus proches de vous. » Le texte de la
  fenêtre d'iOS, défini dans `app.json`, est : « Repère utilise votre position
  pour trouver les espaces les plus proches et confirmer votre arrivée. »
- **La seule permission nécessaire.** Position « pendant l'utilisation de
  l'app » uniquement. Aucune localisation en arrière-plan.
- **Une lecture, pas un suivi.** L'application lit la position une fois
  (`getCurrentPositionAsync`). Elle n'utilise pas `watchPositionAsync` et
  n'interroge pas le GPS en boucle.
- **Le refus est un cas normal.** Tout continue de fonctionner sans position,
  sauf la validation de l'arrivée, qui n'a pas de sens sans elle.
- **Le serveur calcule et décide.** Les distances viennent du serveur ; pour une
  arrivée, c'est lui qui accepte ou refuse.

## Dans le code

Seuls deux fichiers appellent `expo-location`.

### `useForegroundLocation` — lire la position

`src/features/location/useForegroundLocation.ts`

```ts
const location = useForegroundLocation();              // précision « Balanced » : pour trier
const checkIn = useForegroundLocation(Accuracy.High);  // précision haute : pour l'arrivée
```

Le hook renvoie `permission`, `canAskAgain`, `coords`, `isLocating`,
`positionError` et `request()`.

| Moment                         | Ce que fait le hook                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| À l'affichage de l'écran       | Lit l'état de la permission **sans rien demander** (`getForegroundPermissionsAsync`). Si elle est déjà accordée, lit la position une fois. |
| Sur un geste de l'utilisateur  | `request()` : demande la permission si besoin, puis lit la position une fois.                             |
| Au retour au premier plan      | Relit l'état de la permission. Si elle a été retirée dans les Réglages, la position gardée est effacée.   |

Le dernier point vient d'un bug rencontré sur l'iPhone : après avoir activé la
localisation dans les Réglages puis être revenu dans l'application, rien ne
changeait. iOS suspend l'application sans la fermer, donc une vérification faite
seulement à l'affichage ne se relançait pas. Un écouteur `AppState` la relance à
chaque retour au premier plan.

Deux précisions, pour deux besoins :

- `Balanced` (environ 100 m) suffit pour classer une liste.
- `High` pour l'arrivée : le serveur refuse une position dont la précision est
  moins bonne que 100 m, `Balanced` serait à la limite.

### `useLocationPermission` — savoir si c'est autorisé

`src/features/location/useLocationPermission.ts`

Ce hook lit seulement l'état de la permission, **sans lire de position**. Il
sert à décider si une carte s'affiche (`MapAccessGate`). Utiliser
`useForegroundLocation` à cet endroit aurait lancé une lecture GPS dont personne
ne se sert.

### Trier par distance

1. `book.tsx` possède `useForegroundLocation()` et passe le résultat à
   `SpacesPane`.
2. `useSpaceBrowser(coords)` appelle
   `GET /spaces/nearby?lat=…&lng=…&limit=30&includeBusy=true`.
3. Le serveur calcule la distance de chaque lieu (formule de haversine) et
   renvoie la liste triée, avec `distanceM` pour chaque espace.
4. `formatDistance` l'affiche : « 350 m », « 2.4 km ».

Sans position, le même appel part sans `lat` ni `lng` : le serveur répond par
ordre alphabétique (`hasPosition: false`, `distanceM: null`) et aucune distance
n'est affichée. La liste s'affiche d'abord ainsi, puis se reclasse quand la
position arrive.

### Réserver près de moi

`handleReserveNearMe` dans `src/components/SpacesPane.tsx` :

1. utilise la position déjà connue, sinon appelle `request()` (c'est ici que la
   fenêtre d'iOS apparaît la première fois) ;
2. sans position : une alerte « Localisation nécessaire » explique quoi faire ;
3. avec position : ouvre `/reserve` avec `lat` et `lng`. L'écran demande au
   serveur les espaces libres maintenant, triés par distance, et propose le
   premier.

### Valider son arrivée

Sur le détail d'une réservation (`src/app/(app)/reservation/[id].tsx`) et sur
l'écran de scan :

1. au toucher, l'application lit une position **neuve** en haute précision —
   jamais une position gardée en mémoire ;
2. elle envoie `lat`, `lng`, `accuracyM` (la précision annoncée par le
   téléphone) et `capturedAt` (l'heure de la mesure) ;
3. le serveur applique ses règles, dans cet ordre, et s'arrête à la première qui
   échoue.

| Règle du serveur                                   | Motif renvoyé    | Libellé dans l'application  |
| -------------------------------------------------- | ---------------- | --------------------------- |
| La réservation est confirmée                       | `NOT_CONFIRMED`  | Réservation non confirmée   |
| Le QR code scanné (s'il y en a un) est le bon      | `WRONG_SPACE`    | Mauvais espace scanné       |
| Pas plus de 15 minutes avant le début              | `TOO_EARLY`      | Trop tôt                    |
| Pas après la fin                                   | `TOO_LATE`       | Trop tard                   |
| Précision de 100 m ou mieux                        | `LOW_ACCURACY`   | Précision insuffisante      |
| Position mesurée il y a moins de 60 secondes       | `STALE_POSITION` | Position trop ancienne      |
| À 150 m ou moins du lieu                           | `TOO_FAR`        | Trop loin                   |

Ces seuils sont dans le projet web (`src/lib/mobile/config.ts`) ; la fonction
qui les applique est `refusalReason` (`src/lib/mobile/checkin.ts`), testée dans
`checkin.test.ts`.

**Chaque tentative est enregistrée**, acceptée ou refusée, dans la table
`check_ins` avec la distance mesurée et la précision. C'est la trace demandée
par le sujet : elle est visible dans l'onglet Historique. Un refus n'est pas une
erreur : le serveur répond `201` et l'application lit `checkIn.accepted` et
`checkIn.reason`.

## Quand la permission est refusée

| Endroit                         | Ce que l'utilisateur voit                                                                               | Ce qui marche encore                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Liste des espaces               | « Localisation refusée — espaces triés par ordre alphabétique. » et « Autoriser la localisation » ou « Ouvrir les réglages » | La liste, la recherche, la réservation |
| Réserver près de moi            | Alerte « Localisation nécessaire »                                                                      | La réservation en choisissant un espace       |
| Cartes                          | Une carte grise, non interactive, avec « Activez la localisation pour voir la carte. »                  | L'adresse et le bouton « Itinéraire »         |
| Valider son arrivée             | « Localisation indisponible — vérifiez qu'elle est autorisée et que le GPS est activé. »                | Tout le reste de la réservation               |

iOS ne redemande pas une permission refusée. Dans ce cas (`canAskAgain` à
`false`), le bouton devient « Ouvrir les réglages » (`Linking.openSettings()`).
Au retour dans l'application, le nouvel état est pris en compte sans la
relancer.

Autres cas traités :

- **Permission accordée mais position introuvable** (GPS coupé, délai dépassé) :
  « Impossible d'obtenir votre position. Vérifiez que le GPS est activé. » avec
  un bouton « Réessayer ». La permission reste accordée.
- **Permission pas encore demandée** : une invitation « Autorisez la
  localisation pour voir les espaces les plus proches de vous. »
- **Vérification en cours** : rien ne s'affiche tant que l'état n'est pas connu,
  pour éviter un message qui disparaîtrait aussitôt.

## Les cartes

`src/components/LocationsMap.tsx`, `SpaceLocationMap.tsx`, `MapAccessGate.tsx`,
`LockedMap.tsx` — bibliothèque `react-native-maps`, qui affiche Apple Plans dans
Expo Go sur iOS, sans clé d'API.

- Les repères sont ceux des **lieux** : un espace n'a pas de coordonnées à lui.
- La carte ne s'affiche que si la localisation est autorisée. Sinon
  `LockedMap` montre une carte grise centrée sur une ville tirée au hasard, qui
  ne révèle aucun lieu réel, avec le bouton pour activer la localisation.
- La carte n'affiche pas la position de l'utilisateur et n'en lit aucune.
- Le cadrage et le regroupement par lieu sont des fonctions pures et testées
  (`src/features/spaces/map.ts`).

## Tester la géolocalisation

Préparer : lancer le projet web et l'application (voir le
[README](../README.md), « Lancer l'application »), se connecter avec
`camille@example.com` / `demo1234`.

### Scénario 1 — permission accordée

1. Onglet Réserver. Si la permission n'a pas encore été demandée, un encadré
   invite à autoriser la localisation.
2. « Autoriser la localisation », puis accepter dans la fenêtre d'iOS.
3. Résultat attendu : l'encadré disparaît, la liste se reclasse et chaque espace
   affiche sa distance.
4. « Réserver près de moi » : l'espace libre le plus proche est proposé, avec sa
   distance et une heure présélectionnée.

### Scénario 2 — permission refusée

1. Refuser dans la fenêtre d'iOS (ou couper la localisation de Expo Go dans
   Réglages → Confidentialité et sécurité → Service de localisation).
2. Résultat attendu, onglet Réserver : « Localisation refusée — espaces triés
   par ordre alphabétique. », la liste reste utilisable, aucune distance.
3. « Réserver près de moi » : alerte « Localisation nécessaire ».
4. Ouvrir un espace : la carte est grise avec « Ouvrir les réglages » ; la
   réservation fonctionne.
5. Réactiver la localisation dans les Réglages et revenir dans l'application :
   la carte et les distances reviennent sans relancer l'application.

### Scénario 3 — arrivée refusée pour distance

1. Réserver un créneau qui commence dans moins de 15 minutes.
2. Ouvrir la réservation, « Valider sans scanner ».
3. Résultat attendu, loin du lieu : « Arrivée non validée : Trop loin. »
4. Onglet Historique : la tentative apparaît avec la distance mesurée ; son
   détail affiche la distance et la précision du GPS.

### Obtenir une arrivée validée

Les lieux de démonstration sont à Lyon, Nantes, Bordeaux et Lille. Pour valider
une arrivée ailleurs, il faut un lieu à l'endroit où l'on se trouve :

1. sur le site, connecté en administrateur : Administration → Lieux → créer un
   lieu en saisissant la latitude et la longitude de l'endroit, puis lui ajouter
   un espace ;
2. dans l'application, tirer la liste des espaces vers le bas pour la
   rafraîchir, puis réserver cet espace sur un créneau qui commence dans moins
   de 15 minutes ;
3. ouvrir la réservation et valider l'arrivée, avec ou sans scan.

Résultat attendu : « Arrivée validée ! », la carte « Arrivée » indique la date
de validation, et l'historique contient la tentative acceptée.

## Limites

- **La position vient du téléphone et peut être falsifiée** (appareil modifié,
  application modifiée). Le serveur décide, mais il ne peut prouver la présence
  que si le téléphone dit vrai. Le scan du QR code ajoute un second élément,
  sans supprimer cette limite.
- À l'intérieur d'un bâtiment, le GPS est moins précis : une arrivée peut être
  refusée pour « Précision insuffisante ». On peut alors réessayer : chaque
  tentative lit une position neuve.
- Les coordonnées sont celles du lieu, pas de l'espace : le rayon de 150 m ne
  distingue pas deux espaces d'un même lieu. C'est le rôle du QR code.
- Aucune notification à l'approche d'un lieu : l'application ne suit pas la
  position en arrière-plan.
