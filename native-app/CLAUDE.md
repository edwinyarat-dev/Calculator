@AGENTS.md

# MathQuest RPG Development Guidelines

## Core System Architecture
* **State Management:** Keep track of level progress, user experience points (XP), and character progression inside a global structure (`/src/utils/gameState.js`). Save state updates automatically to `localStorage`.
* **Visual Identity:** Adhere strictly to the "No-Number Kinetic Layout". Avoid showing raw equations at the beginning of modules. Instead, treat equations as completion rewards revealed seamlessly upon successful visual interaction.
* **Component Modularity:** Place all layout viewports within `/src/components/` to ensure clean separation between asset layers and functional mechanics.
