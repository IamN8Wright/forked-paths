# Forked Paths

A browser-based, text-driven RPG engine by **InN8 Labs**.

This repository is the first deployable application build of the Forked Paths world and mechanics developed during the design project.

## What is already implemented

- Responsive browser game UI
- InN8 Labs branding
- Canon world map asset
- A-Z / 0-15 world coordinate model with minor-grid-ready coordinates
- New Game and Continue
- Local browser save system
- Data-driven scene and choice engine
- Player health, gold, reputation, elemental affinity, inventory, boons, journal, and discovered locations
- Forgotten Memories origin scaffold
- Hidden martial-art reveal through narrative rather than character-creation selection
- Wolf Pup early-game discovery
- Wolf danger-sense choice injection
- Westwood onboarding
- Mira's intentional first introduction
- First Forgotten Memories kata sequence
- World lore/data definitions for:
  - Highland Watch
  - Westwood
  - Xera's Old Cottage
  - Eridyn
  - Eris
  - Ironvale
  - Thieve's Run
  - Whispering Meadow
  - Velor Nymm's Grove
  - Crumbling Obelisk
- Hidden martial arts:
  - The Reed and Current
  - The Cinder Sovereign
  - The Mountain Unbroken
  - The Silent Tempest
- Fourth-form catastrophe law
- Dual-form harmony rules
- Avery, Mira, Vernal, and Mad King data
- Xera relics
- Vernal boon: The Open Current
- Wolf → Dire Wolf progression model

## Run locally

Requires Node.js 20+.

```bash
npm start
```

Open:

```text
http://localhost:3000
```

No npm dependencies are required for this initial engine build.

## Railway

The repository includes `railway.json`.

Once pushed to GitHub:

1. Create a Railway project.
2. Deploy from the GitHub repository.
3. Railway runs `npm start`.
4. Health endpoint is `/health`.
5. Generate a Railway domain to verify the deployment.
6. Attach the desired `inn8labs.com` custom domain/subdomain and apply the DNS records Railway provides.

## Architecture

This build deliberately separates **engine behavior** from **world canon**.

- `public/app.js` — game state, scene runner, effects, save/load, UI behavior
- `public/data/world-data.js` — world canon, locations, NPCs, martial arts, boons, relics, companion systems
- `public/assets/world-map.jpg` — canonical Forked Paths world map
- `public/assets/inn8labs-logo.png` — InN8 Labs branding
- `server.js` — tiny dependency-free production web server

The next development step should be expanding the scene/event data model so quests, NPC schedules, crime, guard suspicion, travel nodes, combat resolution, Fae Favor, and procedural encounters can be authored as data instead of hard-coded scene branches.

## Current build

**Engine v0.1.0**

This is a playable foundation, not the completed content of the entire game.
