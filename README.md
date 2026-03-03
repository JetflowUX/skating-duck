# Arctic Drift Duck

A retro-style 2D canvas runner built with React.
You control a duck on a skateboard, dodging incoming rocks and penguins on an icy track.

## Features

- Full-screen HTML Canvas gameplay
- React + `useRef` game architecture for minimal re-renders
- Smooth horizontal mouse steering with interpolation
- Duck tilt while turning
- Dynamic obstacle spawning (rock/penguin)
- Progressive speed/difficulty scaling
- Collision detection + game over overlay
- Skate ice-particle trail effects
- HUD with score and speed

## Controls

- Move mouse left/right to steer the duck
- Avoid all obstacles as long as possible
- Click **Restart** after game over

## Project Structure

```text
src/
 ├── App.jsx
 ├── components/
 │    └── DuckSkateGame.jsx
 ├── main.jsx
 └── styles.css
```

## Architecture Notes

The game keeps runtime state in `useRef` to avoid frequent React re-renders:

- `duck` position, tilt, and target X
- `obstacles` array
- `particles` array
- `speed` and `score`
- `animationFrameId`
- `gameOver` flag

React state (`useState`) is used only for UI-level game-over toggle:

- `isGameOver`

Main loop is implemented with:

- `useEffect` (setup/cleanup)
- `requestAnimationFrame` (update + draw)

## How to Run

This repository currently contains the React source and `index.html`, but no build tooling config files yet.

### Option A: Add Vite (recommended)

1. Scaffold Vite in this folder (if not already done):
   - `npm create vite@latest . -- --template react`
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`

### Option B: Integrate into existing React setup

- Copy `src/` and `index.html` into your existing React/Vite project
- Ensure entry points match `src/main.jsx`

## Gameplay Logic Summary

- Duck stays near bottom of screen and smoothly follows mouse X
- Obstacles spawn from top and move downward each frame
- Penguins include slight horizontal sway
- Speed increases gradually over time
- Collision uses axis-aligned bounding-box checks
- On collision, loop stops and game-over overlay appears

## Tech Stack

- React
- Canvas API
- JavaScript (ES modules)
- CSS
