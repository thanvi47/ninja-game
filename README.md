# Ninja Hattori: Anti-Gravity Runner 🥷⚡

A fast-paced 2D HTML5 side-scrolling runner built with **Phaser.js** featuring **Ninja Hattori** dodging incoming shurikens and collecting ninja scrolls, with a signature **Anti-Gravity Mechanic** allowing Hattori to flip between floor and ceiling at will!

---

## 🎮 Core Mechanics & Features

### Phase 1: Game Concept & Core Mechanics
- **Theme**: Fast-paced 2D feudal Japan runner featuring Ninja Hattori in his iconic blue ninja dogi, red obi, headband, and rosy spiral cheeks.
- **The Twist (Anti-Gravity)**: Hattori can instantly flip upside-down to run on the ceiling and flip back to the floor with a single touch or keypress.
- **Obstacles**: Razor-sharp 4-pointed metallic spinning shurikens spawning on the floor, on the ceiling, or mid-air.
- **Collectibles**: Ancient ninja scrolls (*Makimono*) granting bonus points and score multipliers.
- **Atmosphere**: Multi-layered parallax scrolling (Mount Fuji night sky with glowing moon, feudal Japanese pagodas and torii gates, roof tile platforms, and drifting sakura petals).
- **Retro Audio**: Procedural Web Audio API sound effects (anti-gravity swoosh, scroll chimes, impact crashes) and a chiptune feudal ninja BGM.

### Phase 2: Project Initialization & Setup
- **Engine**: **Phaser.js** (Arcade Physics).
- **Tooling**: **Vite** modern build pipeline with HMR (Hot Module Replacement) and ES Modules.
- **Cloud Leaderboard**: **Firebase Firestore** integration ready to record global high scores, with automatic local storage fallback.

### Phase 3: Core Coding & Anti-Gravity Physics
- **Gravity Vector**: World gravity configured initially to `650` downwards (`this.physics.world.gravity.y = CONFIG.GRAVITY_Y`).
- **The Flip Trigger**:
  - Touch tap or mouse click anywhere on the canvas (`pointerdown`).
  - Keyboard triggers: `SPACE`, `UP`, `DOWN`, `W`, `S`.
  - Inverts gravity value: `this.physics.world.gravity.y *= -1`.
  - Flips Hattori sprite upside down: `this.player.setFlipY(this.isCeiling)`.
  - Applies responsive acrobatic impulse and triggers cyan chakra burst particles.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Build for Production
```bash
npm run build
```
Generates minified production assets in the `dist/` directory.

---

## 🕹️ Controls
- **Touch / Click Screen**: Invert Gravity (Flip between Floor and Ceiling)
- **Spacebar / Arrow Keys / W / S**: Invert Gravity
- **Sound Icon (Top Right)**: Toggle Sound & Music on/off

---

## 🔥 Optional: Connecting Firebase Firestore High Scores

To connect your own Firebase project for global leaderboards across all players:
1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** in test or production mode
3. Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
When configured, scores will automatically sync to your Firestore `highscores` collection!
If not configured, the game seamlessly uses high-performance local storage and clan hall records.
