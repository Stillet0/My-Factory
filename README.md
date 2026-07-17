# Plastique Tycoon

Jeu de gestion (tycoon) d'une entreprise d'injection plastique, jouable dans le
navigateur. Négociez des contrats, réglez vos presses avec de vrais paramètres
process (température, pression, vitesse, refroidissement), gérez votre
personnel, entretenez votre parc machine et développez votre usine.

## Stack

- Vite + TypeScript + React pour l'interface de gestion
- Phaser pour le rendu animé de l'atelier (pixel art généré procéduralement,
  sans assets binaires)
- Zustand comme état partagé entre la simulation, le rendu et l'UI
- Vitest pour les tests unitaires du moteur de simulation

## Démarrer

```bash
npm install
npm run dev       # serveur de développement
npm run test      # tests unitaires (formules de simulation)
npm run build     # build de production
```

## Architecture

- `src/sim` — moteur de simulation pur (horloge, entités, systèmes, formules
  de qualité/défauts), découplé du rendu
- `src/data` — catalogues (presses, matières, moules, clients) qui pilotent le
  contenu du jeu
- `src/store` — pont Zustand entre la simulation, Phaser et React
- `src/render` — scène Phaser (atelier animé : presses, employés, palan)
- `src/ui` — panneaux React (contrats, réglage machine, RH, finances)
- `src/save` — sauvegarde/chargement via `localStorage`

Voir le plan de développement complet (phases suivantes : conception de
moules sur mesure, arbre technologique, multi-usines) dans l'historique de
conversation du projet.
