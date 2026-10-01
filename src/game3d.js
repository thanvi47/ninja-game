import * as THREE from 'three';

/**
 * =========================================================================
 * NINJA HATTORI: 3D BEHIND-THE-BACK ANTI-GRAVITY RUNNER
 * Engine: Three.js
 * Perspective: 3rd-Person Dynamic Chase Camera
 * Mechanics: 3 Lanes + Floor/Ceiling Anti-Gravity Flip + 3D Obstacles
 * =========================================================================
 */

// ── Audio Synthesizer ─────────────────────────────────────────────
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
  }
  
  startBGM() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    this._playNextFluteNote();
  }

  stopBGM() {
    this.bgmPlaying = false;
  }

  _playNextFluteNote() {
    // If not playing, or muted, don't schedule WebAudio, but keep the loop alive so it can resume when unmuted
    if (!this.bgmPlaying) return;
    if (this.muted) {
      setTimeout(() => this._playNextFluteNote(), 1000);
      return;
    }
    this.init();
    console.log("Playing flute note");
    if (!this.ctx) return;
    
    // Japanese Shakuhachi / Hirajōshi-inspired scale
    const freqs = [349.23, 369.99, 466.16, 523.25, 554.37, 698.46, 739.99];
    // Favor lower notes slightly
    const idx = Math.floor(Math.pow(Math.random(), 1.5) * freqs.length);
    const freq = freqs[idx];
    
    // Sometimes play a grace note (quick slide up)
    const isGrace = Math.random() > 0.7;
    
    const duration = 1.5 + Math.random() * 2.5;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    
    if (isGrace && idx > 0) {
      osc.frequency.setValueAtTime(freqs[idx-1], t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.15);
    } else {
      osc.frequency.setValueAtTime(freq, t);
    }
    
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 4 + Math.random() * 2; 
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = freq * 0.012; 
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.6); 
    gain.gain.setValueAtTime(0.3, t + duration - 0.8); 
    gain.gain.linearRampToValueAtTime(0, t + duration); 
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    
    // Add some noise for "breath"
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = freq;
    noiseFilter.Q.value = 3;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.015, t + 0.6);
    noiseGain.gain.setValueAtTime(0.015, t + duration - 0.8);
    noiseGain.gain.linearRampToValueAtTime(0, t + duration);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    osc.connect(gain);
    gain.connect(filter);
    filter.connect(this.ctx.destination);
    
    osc.start(t);
    lfo.start(t);
    noise.start(t);
    osc.stop(t + duration);
    lfo.stop(t + duration);
    
    const rest = Math.random() > 0.6 ? 500 : 1500 + Math.random() * 2000;
    const nextDelay = duration * 1000 + rest;
    setTimeout(() => this._playNextFluteNote(), nextDelay);
  }
  init() {
    if (this.muted) return;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(850, t + 0.09);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.20);
    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }
  playLane() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.06);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }
  playScroll() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.20, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.24);
    });
  }
  playHit() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }
}

// ── Game Constants ────────────────────────────────────────────────
const LANES = [-2.4, 0, 2.4];
const FLOOR_Y = 0.5;
const CEIL_Y = 5.5;
const CHUNK_LEN = 40;
const CHUNK_COUNT = 10;
const BASE_SPEED = 24.0;
const MAX_SPEED = 52.0;

// ── Anime Japan Sky Keyframes (120-second full cycle) ─────────────────────
const CYCLE_TOTAL = 120.0; // full loop in seconds

// Each keyframe:
// t            = time in cycle (seconds)
// zenith       = top of sky color (hex)
// horizon      = horizon glow color (hex)
// nadir        = below-horizon color (hex)
// fogColor     = scene fog color (hex)
// fogDensity   = FogExp2 density
// ambColor     = ambient light color (hex)
// ambInt       = ambient intensity
// moonInt      = moonLight intensity
// sunInt       = sunLight intensity
// starOp       = stars opacity
// exposure     = renderer tone-mapping exposure
const SKY_KEYFRAMES = [
  // 0 – Deep Night
  {
    t: 0, zenith: 0x020408, horizon: 0x0d1535, nadir: 0x040810,
    fogColor: 0x06081a, fogDensity: 0.020,
    ambColor: 0x0a0e30, ambInt: 0.7, moonInt: 2.4, sunInt: 0.0, starOp: 1.0, exposure: 0.85
  },

  // 12 – Pre-Dawn (faint purple pulse on horizon)
  {
    t: 12, zenith: 0x06091e, horizon: 0x1a0a3c, nadir: 0x0a061a,
    fogColor: 0x100820, fogDensity: 0.018,
    ambColor: 0x150a35, ambInt: 0.9, moonInt: 1.8, sunInt: 0.0, starOp: 0.85, exposure: 0.90
  },

  // 20 – Sunrise Begins (orange bleeds up from horizon)
  {
    t: 20, zenith: 0x200840, horizon: 0xff5722, nadir: 0x3d1500,
    fogColor: 0x2d0e00, fogDensity: 0.013,
    ambColor: 0x3d1a10, ambInt: 1.4, moonInt: 0.6, sunInt: 0.3, starOp: 0.35, exposure: 1.05
  },

  // 26 – Sunrise Peak (ANIME! hot pink zenith + gold horizon)
  {
    t: 26, zenith: 0xe91e8c, horizon: 0xff9800, nadir: 0xff5722,
    fogColor: 0xff6f00, fogDensity: 0.007,
    ambColor: 0xc2185b, ambInt: 2.8, moonInt: 0.0, sunInt: 1.8, starOp: 0.0, exposure: 1.35
  },

  // 34 – Morning (clear sky, warm light)
  {
    t: 34, zenith: 0x1565c0, horizon: 0x80cbc4, nadir: 0x4fc3f7,
    fogColor: 0xa8d8f0, fogDensity: 0.004,
    ambColor: 0xfff9e0, ambInt: 4.5, moonInt: 0.0, sunInt: 3.5, starOp: 0.0, exposure: 2.00
  },

  // 45 – Midday (deep blue zenith, white-blue horizon)
  {
    t: 45, zenith: 0x0d47a1, horizon: 0x64b5f6, nadir: 0x42a5f5,
    fogColor: 0xb8ddf5, fogDensity: 0.003,
    ambColor: 0xffffff, ambInt: 7.0, moonInt: 0.0, sunInt: 5.0, starOp: 0.0, exposure: 2.60
  },

  // 58 – Afternoon (slightly warmer, golden tone)
  {
    t: 58, zenith: 0x1565c0, horizon: 0xffd54f, nadir: 0x81d4fa,
    fogColor: 0xc8d8e8, fogDensity: 0.004,
    ambColor: 0xfff3cd, ambInt: 5.5, moonInt: 0.0, sunInt: 4.0, starOp: 0.0, exposure: 2.30
  },

  // 68 – Sunset Begins (purple zenith, orange horizon drama)
  {
    t: 68, zenith: 0x4a148c, horizon: 0xff7043, nadir: 0xff5722,
    fogColor: 0xff5722, fogDensity: 0.007,
    ambColor: 0xff7043, ambInt: 2.8, moonInt: 0.0, sunInt: 2.2, starOp: 0.0, exposure: 1.55
  },

  // 76 – Sunset Peak (ANIME! blood-red zenith, golden nadir)
  {
    t: 76, zenith: 0xb71c1c, horizon: 0xff8f00, nadir: 0xf4511e,
    fogColor: 0x8d2000, fogDensity: 0.010,
    ambColor: 0xff3d00, ambInt: 2.0, moonInt: 0.2, sunInt: 1.0, starOp: 0.05, exposure: 1.30
  },

  // 84 – Dusk / Moonrise (indigo sky, lavender horizon)
  {
    t: 84, zenith: 0x12043e, horizon: 0x6a1b9a, nadir: 0x0d0820,
    fogColor: 0x200838, fogDensity: 0.014,
    ambColor: 0x4a0e7a, ambInt: 1.3, moonInt: 1.2, sunInt: 0.0, starOp: 0.45, exposure: 1.05
  },

  // 94 – Night Settles (stars fully out)
  {
    t: 94, zenith: 0x030710, horizon: 0x0d1535, nadir: 0x050810,
    fogColor: 0x07091a, fogDensity: 0.018,
    ambColor: 0x0d1030, ambInt: 0.8, moonInt: 2.2, sunInt: 0.0, starOp: 0.95, exposure: 0.88
  },

  // 120 – Same as frame 0 (seamless loop)
  {
    t: 120, zenith: 0x020408, horizon: 0x0d1535, nadir: 0x040810,
    fogColor: 0x06081a, fogDensity: 0.020,
    ambColor: 0x0a0e30, ambInt: 0.7, moonInt: 2.4, sunInt: 0.0, starOp: 1.0, exposure: 0.85
  },
];

// Helper: linearly lerp two hex colors by t (0-1), returns THREE.Color
function lerpHexColor(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t);
}

export class NinjaRunner3D {
  constructor(container) {
    this.container = container;
    this.sfx = new SoundFX();

    // Game state
    this.score = 0;
    this.distance = 0;
    this.scrolls = 0;
    this.speed = BASE_SPEED;
    this.isCeiling = false;
    this.currentLane = 1; // 0=Left, 1=Center, 2=Right
    this.targetX = 0;
    this.targetY = FLOOR_Y;
    this.playerX = 0;
    this.playerY = FLOOR_Y;
    this.playerZ = 0;
    this.flipProgress = 1.0;
    this.gameOver = false;
    this.paused = false;
    this.clock = new THREE.Clock();

    // ── Lives system ────────────────────────────────────────────────
    this.lives = 3;
    this.maxLives = 5;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.lifePickups = [];
    this.scrollsAtLastBonus = 0;

    // ── Super Scroll system ─────────────────────────────────────────
    this.superScrollPickups = [];   // golden super-scroll items in the world
    this.scrollsAtLastSuper = 0;    // track when to spawn super scroll

    // ── Day/Night cycle state ────────────────────────────────────
    this.cycleTime = 40.0; // Start at bright morning

    // Leaderboard & High Score
    const savedLb = localStorage.getItem('hattori_3d_leaderboard');
    this.leaderboard = savedLb ? JSON.parse(savedLb) : [];
    this.highScore = this.leaderboard.length > 0 ? this.leaderboard[0].score : 0;

    // Daily Streak Logic
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('hattori_3d_lastdate');
    let savedStreak = parseInt(localStorage.getItem('hattori_3d_streak') || '0', 10);

    if (lastDate !== today) {
      if (lastDate) {
        const diffDays = Math.round((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) savedStreak++;
        else savedStreak = 1;
      } else {
        savedStreak = 1;
      }
      localStorage.setItem('hattori_3d_lastdate', today);
      localStorage.setItem('hattori_3d_streak', savedStreak.toString());
    }
    this.dailyStreak = savedStreak;

    // Load Game Settings
    const defaultSettings = { name: "Ninja", sound: true, graphics: "high", vibration: "med", fps: 120 };
    const savedSettings = JSON.parse(localStorage.getItem('hattori_3d_settings') || '{}');
    this.gameSettings = Object.assign({}, defaultSettings, savedSettings);
    if (![60, 90, 120, 'MAX'].includes(this.gameSettings.fps)) {
      this.gameSettings.fps = 120;
    }
    this.targetFPS = this.gameSettings.fps;
    this.sfx.muted = !this.gameSettings.sound;
    this.playerName = this.gameSettings.name;
    this._lastFrameTime = performance.now();
    this._fpsFrameCount = 0;
    this._fpsTimeAcc = 0;
    
    
    // For 90 degree corners
    this.trackCursor = new THREE.Vector3(0, 0, 0);
    this.trackDir = new THREE.Vector3(0, 0, -1);
    this.corners = [];
    this.targetWorldRot = 0;
    this.currentWorldRot = 0;
    this.isTurning = false;
    this.turnDirection = 0; // -1 left, 1 right

    this._initThree();
    this.worldPivot = new THREE.Group();
    this.scene.add(this.worldPivot);
    this.worldGroup = new THREE.Group();
    this.worldPivot.add(this.worldGroup);
    this._initMaterials();
    this._createAtmosphere();
    this._createCharacter();
    this._initChunks();
    this._initSakuraStorm();
    this._initControls();
    this._buildUI();

    // Apply first keyframe immediately so scene isn't black on load
    this._updateDayNightCycle(0);

    // Start loop
    this._animate = this._animate.bind(this);
    requestAnimationFrame(this._animate);
  }

  // ── Three.js Scene, Camera, Renderer ────────────────────────────
  _initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = null;   // Skydome handles background
    this.scene.fog = new THREE.FogExp2(0x06081a, 0.020); // night fog initially

    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    this.camera.position.set(0, 2.1, 5.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this._applyGraphicsSettings();
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setClearColor(0x000000, 0); // transparent clear

    // ── CSS gradient sky div (sits behind the transparent WebGL canvas) ──
    this.skyDiv = document.createElement('div');
    this.skyDiv.id = 'anime-sky';
    this.skyDiv.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'z-index:0', 'pointer-events:none',
      'background:linear-gradient(to bottom, #020408 0%, #0d1535 50%, #040810 100%)'
    ].join(';');
    this.container.style.position = 'relative';
    this.container.insertBefore(this.skyDiv, this.container.firstChild);

    // Canvas must be on top of sky div
    this.renderer.domElement.style.position = 'relative';
    this.renderer.domElement.style.zIndex = '1';
    this.container.appendChild(this.renderer.domElement);

    // Responsive resize
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  // ── Shared Materials ────────────────────────────────────────────
  _initMaterials() {
    const tl = new THREE.TextureLoader();
    const streetTex = tl.load('/assets/map/sakura_street.jpg');
    streetTex.wrapS = THREE.RepeatWrapping;
    streetTex.wrapT = THREE.RepeatWrapping;
    streetTex.repeat.set(1, 4);

    const fujiDayTex = tl.load('/assets/map/fuji_day.jpg');
    const fujiNightTex = tl.load('/assets/map/fuji_night.jpg');
    const sakuraPropsTex = tl.load('/assets/map/sakura_props.png');
    const mountainConeTex = tl.load('/assets/map/mountain_cone.jpg');
    
    // We can save textures to use later
    this.fujiDayTex = fujiDayTex;
    this.fujiNightTex = fujiNightTex;

    this.matFloor = new THREE.MeshStandardMaterial({
      map: streetTex,
      roughness: 0.85,
      metalness: 0.15,
      color: 0x999999
    });
    this.matCeil = new THREE.MeshStandardMaterial({
      map: streetTex,
      roughness: 0.90,
      metalness: 0.10,
      color: 0x555555
    });
    this.matRedWood = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Vermilion lacquer
      roughness: 0.40,
      metalness: 0.15,
      emissive: 0xff3333, // Bright red glow
      emissiveIntensity: 0.5
    });
    this.matGold = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.30,
      metalness: 0.85,
      emissive: 0xffaa00, // Brighter gold glow
      emissiveIntensity: 0.4
    });
    this.matBlackWood = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.70,
      metalness: 0.20,
      emissive: 0x334466, // Brighter blueish glow
      emissiveIntensity: 0.4
    });
    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.90,
      emissive: 0x8899aa, // Brighter steel glow
      emissiveIntensity: 0.5
    });
    this.matSpikeWood = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.80,
      emissive: 0xff5500, // Bright orange/wood glow
      emissiveIntensity: 0.4
    });
    this.matSakuraLeaves = new THREE.MeshStandardMaterial({
      map: sakuraPropsTex,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.65,
      side: THREE.DoubleSide
    });
    this.matScrollParchment = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.40,
      emissive: 0xd97706,
      emissiveIntensity: 0.45
    });
    
    // Save mountain cone tex for later
    this.mountainConeTex = mountainConeTex;
  }

  // ── Japanese Night Atmosphere (Moon, Fuji, Stars, Lights) ───────
  _createAtmosphere() {
    // 1. Ambient twilight
    const ambLight = new THREE.AmbientLight(0x282b52, 1.2);
    this.scene.add(ambLight);

    // 2. Directional silvery moonlight
    this.moonLight = new THREE.DirectionalLight(0xe0e7ff, 2.2);
    this.moonLight.position.set(25, 45, -30);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 10;
    this.moonLight.shadow.camera.far = 160;
    this.moonLight.shadow.camera.left = -15;
    this.moonLight.shadow.camera.right = 15;
    this.moonLight.shadow.camera.top = 25;
    this.moonLight.shadow.camera.bottom = -15;
    this.moonLight.shadow.bias = -0.0005;
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // 3. Giant 3D Japanese Harvest Moon
    this.moonGroup = new THREE.Group();
    const moonGeo = new THREE.SphereGeometry(18, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(moonMesh);

    // Moon golden glow halo disc
    const haloGeo = new THREE.RingGeometry(18.5, 34, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.y = Math.PI;
    this.moonGroup.add(haloMesh);

    this.moonGroup.position.set(70, 65, -320);
    this.scene.add(this.moonGroup);

    // 4. Distant 3D Mount Fuji (Majestic on the horizon, well clear of the bridge track)
    this.fujiMesh = this._createMountFuji();
    this.fujiMesh.position.set(-170, -10, -420);
    this.worldGroup.add(this.fujiMesh);

    // 5. Twinkling Starfield
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3 + 0] = (Math.random() - 0.5) * 600;
      starPos[i * 3 + 1] = Math.random() * 220 + 20;
      starPos[i * 3 + 2] = -Math.random() * 500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, transparent: true, opacity: 0.85 });
    this.stars = new THREE.Points(starGeo, starMat);
    this.worldGroup.add(this.stars);

    // 6. Sun (visible only during Day)
    this.sunGroup = new THREE.Group();
    const sunGeo = new THREE.SphereGeometry(14, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff176 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(sunMesh);

    // Sun warm glow halo
    const sunHaloGeo = new THREE.RingGeometry(15, 30, 32);
    const sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xffcc02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22
    });
    const sunHaloMesh = new THREE.Mesh(sunHaloGeo, sunHaloMat);
    sunHaloMesh.rotation.y = Math.PI;
    this.sunGroup.add(sunHaloMesh);

    this.sunGroup.position.set(-60, 70, -320);
    this.sunGroup.visible = false; // Hidden at night start
    this.scene.add(this.sunGroup);

    // 7. Daytime directional sunlight (initially off)
    this.sunLight = new THREE.DirectionalLight(0xfff9c4, 0.0);
    this.sunLight.position.set(-25, 50, -30);
    this.scene.add(this.sunLight);

    // Keep reference to ambient light for day/night lerp
    this.ambLight = ambLight;
  }

  // ── Gradient Anime Skydome (ShaderMaterial) ──────────────────────
  _createSkyDome() {
    const skyGeo = new THREE.SphereGeometry(880, 32, 20);

    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(0x020408) },
        uHorizon: { value: new THREE.Color(0x0d1535) },
        uNadir: { value: new THREE.Color(0x040810) },
      },
      vertexShader: `
        varying float vH;
        void main() {
          vH = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uZenith;
        uniform vec3 uHorizon;
        uniform vec3 uNadir;
        varying float vH;
        void main() {
          float hBand = exp(-abs(vH) * 3.5);
          vec3 base;
          if (vH >= 0.0) {
            float t = pow(vH, 0.55);
            base = mix(uHorizon, uZenith, t);
          } else {
            base = mix(uHorizon, uNadir, -vH * 2.0);
          }
          base = mix(base, uHorizon, hBand * 0.38);
          gl_FragColor = vec4(base, 1.0);
        }
      `
    });

    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.skyDome.renderOrder = -1;
    this.worldGroup.add(this.skyDome);
  }

  // ── Procedural 3D Mount Fuji Mesh ───────────────────────────────
  _createMountFuji() {
    const fujiGroup = new THREE.Group();

    // Mountain Cone Base
    const coneGeo = new THREE.ConeGeometry(95, 110, 24, 1, true);
    
    // Use the loaded texture!
    this.fujiMat = new THREE.MeshStandardMaterial({
      map: this.mountainConeTex,
      roughness: 0.95,
      metalness: 0.05
    });
    const cone = new THREE.Mesh(coneGeo, this.fujiMat);
    cone.position.y = 55;
    fujiGroup.add(cone);

    // Snow Cap Top
    const snowGeo = new THREE.ConeGeometry(38, 44, 24, 1, true);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.70,
      metalness: 0.10,
      emissive: 0x818cf8,
      emissiveIntensity: 0.12
    });
    const snow = new THREE.Mesh(snowGeo, snowMat);
    snow.position.y = 88;
    fujiGroup.add(snow);

    return fujiGroup;
  }

  // ── High-Quality Animated 3D Ninja Hattori Character ────────────
  _createCharacter() {
    this.ninja = new THREE.Group();

    // 1. Load high-res pre-aligned Ninja Hattori running textures (256x256)
    const textureLoader = new THREE.TextureLoader();
    this.runTextures = [];
    for (let i = 0; i < 5; i++) {
      const tex = textureLoader.load(`/assets/character/ninja_run${i}.png`);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      this.runTextures.push(tex);
    }
    this.runFrames = [0, 1, 2, 3, 4, 3, 2, 1]; // Smooth 8-step running cycle

    // 2. Character Plane Mesh (Facing Camera along +Z)
    // Scale: 2.6 x 2.6 units (Hero scale)
    // Floor deck is at y = 0.0, this.ninja is at FLOOR_Y = 0.5.
    // translate(0, 0.64, 0) places the feet directly onto the floor deck surface (y = 0.0) with zero gap.
    const planeGeo = new THREE.PlaneGeometry(2.6, 2.6);
    planeGeo.translate(0, 0.64, 0);

    this.ninjaMat = new THREE.MeshStandardMaterial({
      map: this.runTextures[0],
      transparent: true,
      alphaTest: 0.05,
      roughness: 0.6,
      metalness: 0.1,
      emissive: new THREE.Color(0x223344),
      emissiveIntensity: 0.22,
      side: THREE.DoubleSide
    });

    this.ninjaMesh = new THREE.Mesh(planeGeo, this.ninjaMat);
    this.ninjaMesh.castShadow = true;
    // Tilt slightly towards camera to eliminate perspective foreshortening
    this.ninjaMesh.rotation.x = -0.16;
    this.ninja.add(this.ninjaMesh);

    // 3. Dynamic Soft Circular Drop Shadows (Radial gradient feathered)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const grad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 58);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.40)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.beginPath();
    sCtx.arc(64, 64, 58, 0, Math.PI * 2);
    sCtx.fill();
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });

    this.shadowFloor = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowFloor.rotation.x = -Math.PI / 2;
    this.shadowFloor.position.y = 0.02;
    this.scene.add(this.shadowFloor);

    this.shadowCeil = new THREE.Mesh(shadowGeo, shadowMat.clone());
    this.shadowCeil.rotation.x = Math.PI / 2;
    this.shadowCeil.position.y = 5.98;
    this.scene.add(this.shadowCeil);

    this.ninja.position.set(0, FLOOR_Y, 0);
    this.scene.add(this.ninja);
  }

  // ── Modular 3D Track & Environment Chunk System ─────────────────
  _initChunks() {
    this.chunks = [];
    this.obstacles = [];
    this.collectibles = [];
    this.trackCursor.set(0, 0, 0);
    this.trackDir.set(0, 0, -1);

    for (let i = 0; i < CHUNK_COUNT; i++) {
      const isFirst = (i === 0);
      const chunk = this._createChunk(isFirst);
      this.chunks.push(chunk);
      this.worldGroup.add(chunk.group);
    }
  }

  _createChunk(isFirst) {
    const group = new THREE.Group();
    group.position.copy(this.trackCursor);
    
    let isCorner = false;
    let turnDir = 0;
    
    if (this.trackDir.x === -1) group.rotation.y = Math.PI / 2;
    else if (this.trackDir.x === 1) group.rotation.y = -Math.PI / 2;
    else if (this.trackDir.z === 1) group.rotation.y = Math.PI;
    
    // Create corners occasionally
    if (!isFirst && Math.random() > 0.85 && this.chunks && this.chunks.length > 5) {
      isCorner = true;
      turnDir = Math.random() > 0.5 ? 1 : -1;
    }
    
    const chunkData = { group, isCorner, turnDir, centerPos: this.trackCursor.clone() };

    // 1. Floor Bridge Deck (Width 8.0, Length 40.0)
    const floorGeo = new THREE.BoxGeometry(8.2, 0.6, CHUNK_LEN);
    const floor = new THREE.Mesh(floorGeo, this.matFloor);
    floor.position.set(0, -0.3, 0);
    floor.receiveShadow = true;
    group.add(floor);

    // Vermilion Lacquer Side Curbs with Golden Rivets
    [-3.9, 3.9].forEach(sideX => {
      const curbGeo = new THREE.BoxGeometry(0.35, 0.55, CHUNK_LEN);
      const curb = new THREE.Mesh(curbGeo, this.matRedWood);
      curb.position.set(sideX, 0.15, 0);
      curb.castShadow = true;
      group.add(curb);

      // Gold studs along curbs
      for (let s = -CHUNK_LEN / 2 + 3; s < CHUNK_LEN / 2; s += 6) {
        const stud = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.matGold);
        stud.position.set(sideX, 0.45, s);
        group.add(stud);
      }
    });

    // Stone Foundation Pillars into the mist
    for (let pz = -CHUNK_LEN / 2 + 10; pz < CHUNK_LEN / 2; pz += 20) {
      [-3.5, 3.5].forEach(px => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 16, 8), this.matFloor);
        pillar.position.set(px, -8.3, pz);
        group.add(pillar);
      });
    }

    // 2. Ceiling Track (Inverted Rafters at Y = 6.0)
    // Use 3 narrow planks for the 3 lanes so the beautiful sky is visible through the gaps
    LANES.forEach(lx => {
      const plankGeo = new THREE.BoxGeometry(1.6, 0.2, CHUNK_LEN);
      const plank = new THREE.Mesh(plankGeo, this.matCeil);
      plank.position.set(lx, 6.1, 0);
      plank.receiveShadow = true;
      group.add(plank);
    });

    [-3.9, 3.9].forEach(sideX => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, CHUNK_LEN), this.matRedWood);
      curb.position.set(sideX, 5.85, 0);
      group.add(curb);
    });

    // Hanging Red Chōchin Lanterns along bridge curbs (spaced away from lanes)
    for (let lz = -CHUNK_LEN / 2 + 8; lz < CHUNK_LEN / 2; lz += 14) {
      [-3.85, 3.85].forEach(lx => {
        const lantern = this._createLantern();
        lantern.position.set(lx, 5.3, lz);
        group.add(lantern);
      });
    }

    // 3. Side Scenery: Torii Gate or Pagoda or Sakura Trees
    const seed = Math.abs(Math.sin(this.trackCursor.z * 0.13));
    if (seed > 0.45 && !isFirst) {
      // Grand Torii Gate spanning across the 3 lanes
      const torii = this._createToriiGate();
      torii.position.set(0, 0, 0);
      group.add(torii);
    } else {
      // 3D Pagodas and Sakura Trees on left & right
      const pagodaL = this._createPagoda();
      pagodaL.position.set(-8.5, -0.3, -8);
      group.add(pagodaL);

      const treeR = this._createSakuraTree();
      treeR.position.set(8.2, -0.3, 8);
      group.add(treeR);
    }

    // 4. Spawn Obstacles and Collectibles (Skip starting safe chunk)
    if (!isFirst && !isCorner) {
      this._populateChunk(group, chunkData.centerPos);
    }

    
    if (isCorner) {
      // Add a visual indicator (like a big arrow or special floor)
      const arrowGeo = new THREE.PlaneGeometry(8, 8);
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5 });
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = -Math.PI/2;
      arrow.position.y = 0.05;
      group.add(arrow);
      
      this.corners.push(chunkData);
      
      this.trackCursor.add(this.trackDir.clone().multiplyScalar(CHUNK_LEN/2));
      
      if (turnDir === 1) { // right
        if (this.trackDir.z === -1) this.trackDir.set(1, 0, 0);
        else if (this.trackDir.x === 1) this.trackDir.set(0, 0, 1);
        else if (this.trackDir.z === 1) this.trackDir.set(-1, 0, 0);
        else if (this.trackDir.x === -1) this.trackDir.set(0, 0, -1);
      } else { // left
        if (this.trackDir.z === -1) this.trackDir.set(-1, 0, 0);
        else if (this.trackDir.x === -1) this.trackDir.set(0, 0, 1);
        else if (this.trackDir.z === 1) this.trackDir.set(1, 0, 0);
        else if (this.trackDir.x === 1) this.trackDir.set(0, 0, -1);
      }
      this.trackCursor.add(this.trackDir.clone().multiplyScalar(CHUNK_LEN/2));
    } else {
      this.trackCursor.add(this.trackDir.clone().multiplyScalar(CHUNK_LEN));
    }
    
    return chunkData;
  }

  // ── 3D Asset Builders ───────────────────────────────────────────
  _createToriiGate() {
    const torii = new THREE.Group();

    // Pillars (spaced comfortably outside bridge track at x = -4.2 and +4.2)
    [-4.2, 4.2].forEach(px => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 9.0, 12), this.matRedWood);
      p.position.set(px, 4.5, 0);
      p.castShadow = true;
      torii.add(p);

      // Black stone base (Kamebara)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.50, 0.60, 0.7, 12), this.matBlackWood);
      base.position.set(px, 0.35, 0);
      torii.add(base);
    });

    // Lower Beam (Nuki - elevated above ceiling track at y = 6.4)
    const nuki = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.35, 0.35), this.matRedWood);
    nuki.position.set(0, 6.4, 0);
    nuki.castShadow = true;
    torii.add(nuki);

    // Top Curved Roof Header (Kasagi & Shimaki at y = 7.8)
    const kasagi = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.45, 0.55), this.matBlackWood);
    kasagi.position.set(0, 7.8, 0);
    kasagi.castShadow = true;
    torii.add(kasagi);

    // Gold shrine plaque in center
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.60, 0.85, 0.12), this.matGold);
    plaque.position.set(0, 7.1, 0);
    torii.add(plaque);

    return torii;
  }

  _createPagoda() {
    const pagoda = new THREE.Group();
    // 3 Tiers of roofs and walls
    for (let tier = 0; tier < 3; tier++) {
      const y = tier * 3.4;
      const scale = 1.0 - tier * 0.18;

      // Wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(4.2 * scale, 2.2, 4.2 * scale), this.matFloor);
      wall.position.set(0, y + 1.1, 0);
      pagoda.add(wall);

      // Curved Eave Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8 * scale, 1.4, 4), this.matBlackWood);
      roof.position.set(0, y + 2.8, 0);
      roof.rotation.y = Math.PI / 4;
      pagoda.add(roof);
    }
    // Golden Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 3.2, 8), this.matGold);
    spire.position.y = 11.2;
    pagoda.add(spire);

    return pagoda;
  }

  _createSakuraTree() {
    const tree = new THREE.Group();
    // Curved trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 4.2, 8), this.matSpikeWood);
    trunk.position.set(0, 2.1, 0);
    trunk.rotation.z = 0.08;
    tree.add(trunk);

    // 3 Puff blossom clusters
    [[0, 4.2, 0, 1.9], [-0.9, 3.6, 0.5, 1.4], [0.9, 3.8, -0.4, 1.5]].forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), this.matSakuraLeaves);
      puff.position.set(x, y, z);
      tree.add(puff);
    });

    return tree;
  }

  _createLantern() {
    const lantern = new THREE.Group();

    // Suspension cord
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), this.matBlackWood);
    cord.position.y = 0.50;
    lantern.add(cord);

    // Black lacquer top cap
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 12), this.matBlackWood);
    topCap.position.y = 0.16;
    lantern.add(topCap);

    // Traditional Japanese crimson paper body (soft glow, no blown-out peach effect)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.35,
      roughness: 0.65,
      metalness: 0.05
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), bodyMat);
    body.scale.set(1.0, 1.3, 1.0);
    body.position.y = -0.16;
    lantern.add(body);

    // Black lacquer bottom cap
    const btmCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.20, 0.06, 12), this.matBlackWood);
    btmCap.position.y = -0.50;
    lantern.add(btmCap);

    // Golden tassel ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 12), this.matGold);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.55;
    lantern.add(ring);

    return lantern;
  }

  // ── Spawn Obstacles & Scrolls in Chunks ──────────────────────────
  _populateChunk(group, centerPos) {
    const obstacleCount = 2;
    for (let i = 0; i < obstacleCount; i++) {
      const laneIdx = Math.floor(Math.random() * 3);
      const laneX = LANES[laneIdx];
      const zOffset = (i === 0 ? -10 : 10) + (Math.random() - 0.5) * 6;
      const isFloor = Math.random() > 0.40;
      const obsY = isFloor ? FLOOR_Y + 0.6 : CEIL_Y - 0.6;

      // Obstacle Type: Shuriken (0) or Barrier (1)
      const type = Math.random() > 0.45 ? 'shuriken' : 'barrier';
      let mesh;

      if (type === 'shuriken') {
        mesh = this._createShuriken();
        mesh.position.set(laneX, obsY, zOffset);
      } else {
        mesh = this._createBarrier(isFloor);
        mesh.position.set(laneX, isFloor ? FLOOR_Y : CEIL_Y, zOffset);
      }

      group.add(mesh);
      this.obstacles.push({
        mesh,
        type,
        globalZ: 0,
        laneX,
        y: obsY,
        radius: 0.85
      });
    }

    // Golden Ninja Scroll in open lane
    const openLane = (Math.floor(Math.random() * 3) + 1) % 3;
    const scrollZ = (Math.random() - 0.5) * 16;
    const scrollY = Math.random() > 0.5 ? FLOOR_Y + 0.8 : CEIL_Y - 0.8;
    const scroll = this._createScroll();
    scroll.position.set(LANES[openLane], scrollY, scrollZ);
    group.add(scroll);

    this.collectibles.push({
      mesh: scroll,
      globalZ: 0,
      laneX: LANES[openLane],
      y: scrollY,
      collected: false
    });
  }

  _createShuriken() {
    const shuriken = new THREE.Group();
    // 4 Triangular Blades
    for (let r = 0; r < 4; r++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 3), this.matSteel);
      blade.rotation.z = (r * Math.PI) / 2;
      blade.position.set(
        Math.cos((r * Math.PI) / 2) * 0.45,
        Math.sin((r * Math.PI) / 2) * 0.45,
        0
      );
      shuriken.add(blade);
    }
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 12), this.matGold);
    center.rotation.x = Math.PI / 2;
    shuriken.add(center);
    return shuriken;
  }

  _createBarrier(isFloor) {
    const barrier = new THREE.Group();
    // Spiked timber barricade across lane
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 0.35), this.matRedWood);
    bar.position.y = isFloor ? 0.7 : -0.7;
    barrier.add(bar);

    [-0.7, 0.7].forEach(bx => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.4, 8), this.matSpikeWood);
      post.position.set(bx, isFloor ? 0.7 : -0.7, 0);
      barrier.add(post);
    });

    // 5 Pointed Spikes
    for (let sx = -0.8; sx <= 0.8; sx += 0.4) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.65, 6), this.matSteel);
      spike.position.set(sx, isFloor ? 1.05 : -1.05, 0);
      spike.rotation.x = isFloor ? 0 : Math.PI;
      barrier.add(spike);
    }
    return barrier;
  }

  _createScroll() {
    const scroll = new THREE.Group();
    // Golden parchment roll
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 16), this.matScrollParchment);
    roll.rotation.z = Math.PI / 2;
    scroll.add(roll);

    // Red ribbon in center
    const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.24, 16), this.matRedWood);
    ribbon.rotation.z = Math.PI / 2;
    scroll.add(ribbon);

    // Gold finial caps
    [-0.5, 0.5].forEach(fx => {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), this.matGold);
      cap.position.x = fx;
      scroll.add(cap);
    });

    return scroll;
  }

  // ── Floating 3D Sakura Petal Storm ──────────────────────────────
  _initSakuraStorm() {
    this.petals = [];
    const petalGeo = new THREE.PlaneGeometry(0.22, 0.14);
    const petalMat = new THREE.MeshBasicMaterial({
      color: 0xfbcfe8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 180; i++) {
      const mesh = new THREE.Mesh(petalGeo, petalMat);
      mesh.position.set(
        (Math.random() - 0.5) * 36,
        Math.random() * 12 - 2,
        -Math.random() * 90
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        vx: -(Math.random() * 2.5 + 1.2),
        vy: -(Math.random() * 1.2 + 0.6),
        vz: -(Math.random() * 2.0),
        rx: (Math.random() - 0.5) * 3,
        ry: (Math.random() - 0.5) * 3
      };
      this.worldGroup.add(mesh);
      this.petals.push(mesh);
    }
  }

  // ── User Input & Controls ───────────────────────────────────────
  _initControls() {
    const startAudio = () => {
      this.sfx.startBGM();
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);

    window.addEventListener('keydown', (e) => {
      if (this.gameOver) {
        if (e.code === 'Space') this.restart();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this._switchLane(-1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this._switchLane(1);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') this._flipGravity();
      if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
      if (e.code === 'KeyF') this._cycleFPS();
    });

    // Touch / Swipe controls
    let touchStartX = 0;
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (this.gameOver) {
        this.restart();
        return;
      }
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 35) {
        if (dx < 0) this._switchLane(-1);
        else this._switchLane(1);
      } else if (Math.abs(dy) > 35) {
        this._flipGravity();
      } else {
        // Quick tap: flip gravity
        this._flipGravity();
      }
    }, { passive: true });
  }

  _switchLane(dir) {
    // Check if we are near a corner
    if (this.corners && this.corners.length > 0) {
      const nextCorner = this.corners[0];
      // Convert playerZ to worldGroup local space? 
      // Actually, since player is at Z, and pivot is at the corner.
      // We can just check the distance to the corner.
      const dist = Math.abs(this.playerZ - nextCorner.centerPos.z);
      
      if (dist < 15) { // 15 units tolerance for swipe
        if (dir === nextCorner.turnDir) {
          // Success turn!
          this.corners.shift();
          
          // Set Pivot to corner center!
          this.worldGroup.updateMatrixWorld();
          this.worldPivot.position.copy(nextCorner.centerPos);
          this.worldPivot.updateMatrixWorld();
          
          // Keep worldGroup at same global position
          const inv = this.worldPivot.matrixWorld.clone().invert();
          this.worldGroup.matrix.copy(inv).multiply(this.worldGroup.matrixWorld);
          this.worldGroup.matrix.decompose(this.worldGroup.position, this.worldGroup.quaternion, this.worldGroup.scale);
          
          this.targetWorldRot += (dir === 1 ? -Math.PI / 2 : Math.PI / 2);
          this.isTurning = true;
          
          // Ninja spin animation
          this.ninja.rotation.y = dir === 1 ? -Math.PI*2 : Math.PI*2;
          
          this.sfx.playLane(); // Turn sound
          return;
        } else {
          // Swiped wrong way, crash!
          this._onHitObstacle();
          return;
        }
      }
    }
  
    const next = this.currentLane + dir;
    if (next >= 0 && next <= 2) {
      this.currentLane = next;
      this.targetX = LANES[this.currentLane];
      this.sfx.playLane();
    }
  }

  _flipGravity() {
    this.isCeiling = !this.isCeiling;
    this.targetY = this.isCeiling ? CEIL_Y : FLOOR_Y;
    this.flipProgress = 0.0;
    this.sfx.playFlip();

    // Update UI badge
    if (this.uiGravity) {
      this.uiGravity.innerHTML = this.isCeiling ? '⬆ CEILING' : '⬇ FLOOR';
      this.uiGravity.style.borderColor = this.isCeiling ? '#38bdf8' : '#f59e0b';
      this.uiGravity.style.color = this.isCeiling ? '#7dd3fc' : '#fde68a';
    }
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;

    // Update pause overlay
    if (this.uiPause) this.uiPause.style.display = this.paused ? 'flex' : 'none';

    // Toggle button icon: ⏸ while running, ▶ not needed (overlay takes over), reset to ⏸ on resume
    if (this.uiBtnPause) {
      this.uiBtnPause.textContent = this.paused ? '▶' : '⏸';
      this.uiBtnPause.title = this.paused ? 'Resume (P / ESC)' : 'Pause (P / ESC)';
    }

    // Snapshot score & distance into the pause modal
    if (this.paused && this.uiPauseScore && this.uiPauseDist) {
      this.uiPauseScore.textContent = this.score.toString().padStart(6, '0');
      this.uiPauseDist.textContent = this.distance.toString().padStart(4, '0') + 'm';
    }
  }

  // ── HUD and Glassmorphic UI ─────────────────────────────────────
  _buildUI() {
    const ui = document.createElement('div');
    ui.id = 'hud-overlay';
    ui.innerHTML = `
      <style>
        #hud-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          z-index: 10; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex; flex-direction: column; justify-content: space-between; padding: 24px;
        }
        .hud-top {
          display: flex; justify-content: space-between; align-items: flex-start; width: 100%;
        }
        .brand-badge {
          background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px);
          border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 12px;
          padding: 10px 18px; color: #fef08a; display: flex; flex-direction: column;
        }
        .brand-title { font-size: 18px; font-weight: 800; letter-spacing: 2px; }
        .brand-sub { font-size: 11px; color: #94a3b8; letter-spacing: 1px; }
        .stats-badge {
          display: flex; gap: 12px;
        }
        .stat-card {
          background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 12px;
          padding: 8px 16px; color: #fff; text-align: right;
        }
        .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        .stat-val { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
        /* ── Lives bar ── */
        #ui-lives {
          display: flex; gap: 5px; align-items: center; margin-top: 6px;
        }
        .heart {
          font-size: 20px; line-height: 1;
          filter: drop-shadow(0 0 4px #ff4d6d);
          transition: transform 0.2s, opacity 0.3s;
        }
        .heart.empty { opacity: 0.2; filter: none; }
        @keyframes heartPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .heart.gained { animation: heartPop 0.4s ease; }
        /* ── Invincibility flash ── */
        @keyframes invincFlash {
          0%, 100% { opacity: 1; } 50% { opacity: 0.15; }
        }
        .gravity-pill {
          background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(12px);
          border: 1.5px solid #f59e0b; border-radius: 20px;
          padding: 6px 14px; font-size: 13px; font-weight: 800; color: #fde68a;
          margin-top: 6px; display: inline-block; transition: all 0.25s ease;
        }
        .mobile-controls {
          display: flex; justify-content: space-between; width: 100%; pointer-events: auto;
          margin-bottom: 8px; opacity: 0.85;
        }
        .btn-touch {
          width: 72px; height: 72px; border-radius: 50%;
          background: rgba(30, 41, 59, 0.75); backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.25); color: #fff;
          font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center;
          cursor: pointer; -webkit-tap-highlight-color: transparent;
        }
        .btn-touch:active { transform: scale(0.92); background: rgba(245, 158, 11, 0.4); }
        .btn-flip {
          width: 90px; height: 72px; border-radius: 36px;
          background: rgba(220, 38, 38, 0.75); border-color: rgba(245, 158, 11, 0.6);
        }
        /* ── Buttons (Pause / Settings) ── */
        #btn-pause, #btn-settings {
          pointer-events: auto;
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(15, 23, 42, 0.80); backdrop-filter: blur(12px);
          border: 2px solid rgba(245, 158, 11, 0.55); color: #fde68a;
          font-size: 22px; font-weight: bold;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.2s, transform 0.15s;
          -webkit-tap-highlight-color: transparent;
          position: absolute; right: 24px;
        }
        #btn-pause { top: 24px; }
        #btn-settings { top: 86px; font-size: 18px; }
        #btn-pause:hover, #btn-settings:hover { background: rgba(245, 158, 11, 0.25); transform: scale(1.08); }
        #btn-pause:active, #btn-settings:active { transform: scale(0.93); }
        
        #gameover-screen, #pause-screen, #settings-screen {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(7, 9, 24, 0.85); backdrop-filter: blur(16px);
          display: none; flex-direction: column; align-items: center; justify-content: center;
          pointer-events: auto; z-index: 100;
        }
        .modal-card {
          background: rgba(15, 23, 42, 0.90); border: 2px solid #f59e0b;
          border-radius: 20px; padding: 36px 48px; text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.2);
          animation: modalPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes modalPop {
          from { transform: scale(0.80); opacity: 0; }
          to   { transform: scale(1.00); opacity: 1; }
        }
        .modal-title { font-size: 32px; font-weight: 900; color: #fef08a; letter-spacing: 3px; }
        .modal-score { font-size: 54px; font-weight: 900; color: #fff; margin: 16px 0; }
        .modal-sub   { font-size: 15px; color: #94a3b8; margin: 4px 0; }
        .modal-btn {
          margin-top: 20px; background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #000; font-size: 18px; font-weight: 800; border: none;
          padding: 14px 38px; border-radius: 12px; cursor: pointer; letter-spacing: 1px;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); transition: transform 0.15s;
        }
        .modal-btn:hover { transform: scale(1.05); }
        .modal-btn-ghost {
          margin-top: 12px; background: transparent;
          color: #94a3b8; font-size: 15px; font-weight: 700; border: 1.5px solid #334155;
          padding: 10px 30px; border-radius: 12px; cursor: pointer; letter-spacing: 1px;
          transition: color 0.2s, border-color 0.2s;
        }
        .modal-btn-ghost:hover { color: #f59e0b; border-color: #f59e0b; }
        
        .settings-row {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; margin-top: 16px; color: #cbd5e1; font-weight: 600; font-size: 14px;
        }
        .settings-input {
          background: rgba(0,0,0,0.5); border: 1px solid #334155; color: #fef08a;
          border-radius: 6px; padding: 6px 12px; font-size: 14px; text-align: right;
          width: 120px; font-family: inherit; font-weight: 700;
        }
        .settings-input:focus { outline: none; border-color: #f59e0b; }
        
        /* ── Responsive adjustments for mobile ── */
        @media (max-width: 800px) {
          #hud-overlay { padding: 12px; }
          .hud-top {
            flex-direction: column;
            gap: 12px;
          }
          .stats-badge {
            flex-wrap: wrap;
            gap: 8px;
            width: 100%;
          }
          .stat-card {
            padding: 4px 8px;
            flex: 1 1 calc(50% - 8px);
            text-align: left;
          }
          .stat-label { font-size: 8px; }
          .stat-val { font-size: 14px; }
          .heart { font-size: 14px; }
          .brand-badge {
            width: 100%;
            padding: 8px 12px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .brand-title { font-size: 14px; }
          .brand-sub { display: none; }
          
          #btn-pause, #btn-settings {
            width: 44px; height: 44px;
          }
          #btn-pause { top: 12px; right: 12px; font-size: 18px; }
          #btn-settings { top: 64px; right: 12px; font-size: 16px; }
          
          .mobile-controls {
            margin-bottom: 24px;
            padding: 0 12px;
          }
          .btn-touch {
            width: 60px; height: 60px;
            font-size: 20px;
          }
          .btn-flip {
            width: 80px; height: 60px;
            font-size: 16px;
          }
        }
        
        @media (min-width: 801px) {
          .mobile-controls { display: none; }
        }
      </style>
      <div class="hud-top">
        <div class="brand-badge">
          <span class="brand-title">忍者ハットリ · 3D</span>
          <span class="brand-sub">ANTI-GRAVITY RUNNER</span>
          <div style="display:flex;gap:6px;align-items:center;">
            <span id="ui-gravity" class="gravity-pill">⬇ FLOOR</span>
            <span id="ui-cycle" class="gravity-pill" style="border-color:#7dd3fc;color:#7dd3fc;">🌙 NIGHT</span>
            <span id="ui-fps" class="gravity-pill" style="border-color:#10b981;color:#6ee7b7;cursor:pointer;pointer-events:auto;" title="Target FPS: 120 (Click or press 'F' to switch)">⚡ 120 FPS</span>
          </div>
        </div>
        <div class="stats-badge">
          <div class="stat-card">
            <div class="stat-label">LIVES</div>
            <div id="ui-lives"></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">SCROLLS</div>
            <div id="ui-scrolls" class="stat-val" style="color:#fde047;">卷 0</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">DISTANCE</div>
            <div id="ui-dist" class="stat-val">0000m</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">SCORE</div>
            <div id="ui-score" class="stat-val" style="color:#38bdf8;">000000</div>
          </div>
        </div>
      </div>

      <!-- ── Buttons ── -->
      <button id="btn-pause" title="Pause (P / ESC)">⏸</button>
      <button id="btn-settings" title="Settings">⚙️</button>

      <div class="mobile-controls">
        <div id="btn-left" class="btn-touch">◀</div>
        <div id="btn-flip" class="btn-touch btn-flip">FLIP</div>
        <div id="btn-right" class="btn-touch">▶</div>
      </div>
      <div id="gameover-screen">
        <div class="modal-card">
          <div class="modal-title">MISSION OVER</div>
          <div id="modal-score" class="modal-score">000000</div>
          <div id="modal-highscore" style="color:#94a3b8; font-size:16px;">BEST: 000000</div>
          <div id="modal-rank-badge" style="margin: 8px auto 2px auto; display: none; align-items: center; justify-content: center; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; letter-spacing: 1px;"></div>
          
          <div id="modal-leaderboard" style="text-align:left; font-size:13px; color:#cbd5e1; margin:12px 0; background:rgba(0,0,0,0.4); padding:12px; border-radius:10px; border: 1px solid rgba(255,255,255,0.1);"></div>
          
          <div style="color:#fcd34d; font-size:13px; margin: 8px 0; font-weight: bold;">
            🔥 DAILY STREAK: <span id="modal-streak">0</span> DAYS
          </div>
          <div id="modal-lives-row" style="margin:10px 0; font-size:22px; letter-spacing:4px;"></div>
          <button id="btn-restart" class="modal-btn">PLAY AGAIN</button>
        </div>
      </div>
      <div id="pause-screen">
        <div class="modal-card">
          <div class="modal-title">⏸ PAUSED</div>
          <div class="modal-sub" style="margin-top:12px;">SCORE &nbsp;·&nbsp; <span id="pause-score">000000</span></div>
          <div class="modal-sub">DISTANCE &nbsp;·&nbsp; <span id="pause-dist">0000m</span></div>
          <button id="btn-resume" class="modal-btn" style="margin-top:28px;">▶ &nbsp;RESUME</button>
          <br>
          <button id="btn-restart-pause" class="modal-btn-ghost">↺ &nbsp;RESTART</button>
          <div style="color:#475569; font-size:12px; margin-top:18px;">ESC &nbsp;/&nbsp; P &nbsp;to toggle pause</div>
        </div>
      </div>
      
      <div id="settings-screen">
        <div class="modal-card" style="width: 320px;">
          <div class="modal-title" style="font-size:24px;">⚙️ SETTINGS</div>
          
          <div class="settings-row">
            <span>SOUND</span>
            <button id="btn-toggle-sound" class="modal-btn-ghost" style="margin-top:0; padding:6px 16px; font-size:12px;">ON</button>
          </div>
          
          <div class="settings-row">
            <span>VIBRATION</span>
            <button id="btn-toggle-vib" class="modal-btn-ghost" style="margin-top:0; padding:6px 16px; font-size:12px;">ON</button>
          </div>
          
          <div class="settings-row">
            <span>GRAPHICS</span>
            <button id="btn-toggle-gfx" class="modal-btn-ghost" style="margin-top:0; padding:6px 16px; font-size:12px;">HIGH</button>
          </div>
          
          <div class="settings-row">
            <span>FRAME RATE (FPS)</span>
            <button id="btn-toggle-fps" class="modal-btn-ghost" style="margin-top:0; padding:6px 16px; font-size:12px; color:#6ee7b7; border-color:#10b981;">120 FPS</button>
          </div>
          
          <div class="settings-row">
            <span>PLAYER NAME</span>
            <input type="text" id="input-player-name" class="settings-input" maxlength="15" value="Ninja">
          </div>
          
          <button id="btn-close-settings" class="modal-btn" style="margin-top:28px; width:100%;">SAVE & CLOSE</button>
        </div>
      </div>
    `;
    this.container.appendChild(ui);

    this.uiScore = document.getElementById('ui-score');
    this.uiDist = document.getElementById('ui-dist');
    this.uiScrolls = document.getElementById('ui-scrolls');
    this.uiGravity = document.getElementById('ui-gravity');
    this.uiCycleLabel = document.getElementById('ui-cycle');
    this.uiGameOver = document.getElementById('gameover-screen');
    this.uiPause = document.getElementById('pause-screen');
    this.modalScore = document.getElementById('modal-score');
    this.modalHigh = document.getElementById('modal-highscore');
    this.modalRankBadge = document.getElementById('modal-rank-badge');
    this.uiLives = document.getElementById('ui-lives');
    this.modalLivesRow = document.getElementById('modal-lives-row');
    this.modalLeaderboard = document.getElementById('modal-leaderboard');
    this.modalStreak = document.getElementById('modal-streak');
    this._renderLivesHUD();

    this.uiSettings = document.getElementById('settings-screen');

    document.getElementById('btn-restart').onclick = () => this.restart();
    document.getElementById('btn-resume').onclick = () => this.togglePause();
    document.getElementById('btn-restart-pause').onclick = () => { this.togglePause(); this.restart(); };

    // Pause button
    this.uiBtnPause = document.getElementById('btn-pause');
    this.uiBtnPause.onclick = (e) => { e.stopPropagation(); this.togglePause(); };

    // Settings logic
    this.uiBtnSettings = document.getElementById('btn-settings');
    this.uiBtnSettings.onclick = (e) => { e.stopPropagation(); this._openSettings(); };
    document.getElementById('btn-close-settings').onclick = () => this._closeSettings();

    this.btnSound = document.getElementById('btn-toggle-sound');
    this.btnVib = document.getElementById('btn-toggle-vib');
    this.btnGfx = document.getElementById('btn-toggle-gfx');
    this.btnFps = document.getElementById('btn-toggle-fps');
    this.uiFps = document.getElementById('ui-fps');
    this.inputName = document.getElementById('input-player-name');

    if (this.uiFps) {
      this.uiFps.onclick = (e) => {
        e.stopPropagation();
        this._cycleFPS();
      };
    }

    this.btnSound.onclick = () => {
      this.gameSettings.sound = !this.gameSettings.sound;
      this._updateSettingsUI();
    };
    this.btnVib.onclick = () => {
      const states = ['off', 'low', 'med', 'high'];
      let curr = this.gameSettings.vibration;
      if (curr === true) curr = 'high';
      if (curr === false) curr = 'off';
      let idx = states.indexOf(curr);
      if (idx === -1) idx = 2; // med
      this.gameSettings.vibration = states[(idx + 1) % states.length];
      this._updateSettingsUI();
    };
    this.btnGfx.onclick = () => {
      this.gameSettings.graphics = this.gameSettings.graphics === 'high' ? 'low' : 'high';
      this._updateSettingsUI();
    };
    if (this.btnFps) {
      this.btnFps.onclick = () => {
        this._cycleFPS();
      };
    }

    // Pause score/dist display refs
    this.uiPauseScore = document.getElementById('pause-score');
    this.uiPauseDist = document.getElementById('pause-dist');

    // Mobile buttons
    document.getElementById('btn-left').onclick = (e) => { e.stopPropagation(); this._switchLane(-1); };
    document.getElementById('btn-right').onclick = (e) => { e.stopPropagation(); this._switchLane(1); };
    document.getElementById('btn-flip').onclick = (e) => { e.stopPropagation(); this._flipGravity(); };

    this._updateSettingsUI();
  }

  // ── Settings Logic ──────────────────────────────────────────────
  _openSettings() {
    if (this.gameOver) return;
    this.wasPaused = this.paused;
    if (!this.paused) this.togglePause();

    // Hide pause modal if it's up, show settings
    if (this.uiPause) this.uiPause.style.display = 'none';
    this.uiSettings.style.display = 'flex';

    this.inputName.value = this.playerName;
    this._updateSettingsUI();
  }

  _closeSettings() {
    this.playerName = this.inputName.value.trim().substring(0, 15) || "Ninja";
    this.gameSettings.name = this.playerName;

    localStorage.setItem('hattori_3d_settings', JSON.stringify(this.gameSettings));

    this.sfx.muted = !this.gameSettings.sound;
    this._applyGraphicsSettings();

    this.uiSettings.style.display = 'none';
    if (!this.wasPaused) {
      this.togglePause();
    } else {
      if (this.uiPause) this.uiPause.style.display = 'flex';
    }
  }

  _updateSettingsUI() {
    this.btnSound.innerText = this.gameSettings.sound ? 'ON' : 'OFF';
    this.btnSound.style.color = this.gameSettings.sound ? '#fef08a' : '#94a3b8';
    this.btnSound.style.borderColor = this.gameSettings.sound ? '#f59e0b' : '#334155';

    let vibState = this.gameSettings.vibration;
    if (vibState === true) vibState = 'high';
    if (vibState === false) vibState = 'off';

    this.btnVib.innerText = vibState.toUpperCase();
    this.btnVib.style.color = vibState !== 'off' ? '#fef08a' : '#94a3b8';
    this.btnVib.style.borderColor = vibState !== 'off' ? '#f59e0b' : '#334155';

    this.btnGfx.innerText = this.gameSettings.graphics.toUpperCase();
    this.btnGfx.style.color = this.gameSettings.graphics === 'high' ? '#fef08a' : '#94a3b8';
    this.btnGfx.style.borderColor = this.gameSettings.graphics === 'high' ? '#f59e0b' : '#334155';

    if (this.btnFps) {
      const isHigh = this.gameSettings.fps === 120 || this.gameSettings.fps === 'MAX';
      this.btnFps.innerText = this.gameSettings.fps === 'MAX' ? 'MAX (UNCAPPED)' : `${this.gameSettings.fps} FPS`;
      this.btnFps.style.color = isHigh ? '#6ee7b7' : '#fef08a';
      this.btnFps.style.borderColor = isHigh ? '#10b981' : '#f59e0b';
    }
  }

  _cycleFPS(target) {
    const options = [60, 90, 120, 'MAX'];
    if (target !== undefined && options.includes(target)) {
      this.gameSettings.fps = target;
    } else {
      let currentIdx = options.indexOf(this.gameSettings.fps);
      if (currentIdx === -1) currentIdx = 2; // default 120 FPS
      this.gameSettings.fps = options[(currentIdx + 1) % options.length];
    }
    this.targetFPS = this.gameSettings.fps;
    localStorage.setItem('hattori_3d_settings', JSON.stringify(this.gameSettings));
    this._updateSettingsUI();
    if (this.uiFps) {
      const label = this.targetFPS === 'MAX' ? 'MAX' : `${this.targetFPS}`;
      this.uiFps.innerText = `⚡ ${label} FPS`;
    }
  }

  _applyGraphicsSettings() {
    if (!this.renderer) return;
    if (this.gameSettings.graphics === 'high') {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
    }
    // Re-trigger material/shadow updates if needed
    if (this.scene) {
      this.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = this.renderer.shadowMap.enabled;
          child.receiveShadow = this.renderer.shadowMap.enabled;
          if (child.material) child.material.needsUpdate = true;
        }
      });
    }
  }

  // ── Haptic Vibration ────────────────────────────────────────────
  _vibrate(pattern) {
    if (!navigator.vibrate || this.gameSettings.vibration === 'off' || this.gameSettings.vibration === false) return;

    let multiplier = 0.5; // 'med' is half strength (nice and cool)
    if (this.gameSettings.vibration === 'low') multiplier = 0.2;
    if (this.gameSettings.vibration === 'high' || this.gameSettings.vibration === true) multiplier = 1.0;

    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern.map(t => Math.max(1, Math.floor(t * multiplier))));
    } else {
      navigator.vibrate(Math.max(1, Math.floor(pattern * multiplier)));
    }
  }

  // ── Main Game Loop ──────────────────────────────────────────────
  _animate(timestamp) {
    requestAnimationFrame(this._animate);

    const now = (typeof timestamp === 'number' && timestamp > 0) ? timestamp : performance.now();

    // High refresh rate frame pacing / limiter (60, 90, 120, or MAX)
    if (this.targetFPS && this.targetFPS !== 'MAX' && typeof this.targetFPS === 'number') {
      const minInterval = (1000 / this.targetFPS) - 1.2;
      if (this._lastFrameTime && (now - this._lastFrameTime) < minInterval) {
        return; // throttle to match selected target FPS
      }
    }

    const frameTime = this._lastFrameTime ? (now - this._lastFrameTime) : 8.33;
    this._lastFrameTime = now;

    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Dynamic real-time rolling FPS measurement
    this._fpsFrameCount = (this._fpsFrameCount || 0) + 1;
    this._fpsTimeAcc = (this._fpsTimeAcc || 0) + (frameTime / 1000);
    if (this._fpsTimeAcc >= 0.35) {
      const measuredFps = Math.min(999, Math.round(this._fpsFrameCount / this._fpsTimeAcc));
      this._fpsFrameCount = 0;
      this._fpsTimeAcc = 0;
      if (this.uiFps) {
        if (this.targetFPS === 'MAX') {
          this.uiFps.innerText = `⚡ ${measuredFps} FPS (MAX)`;
        } else {
          this.uiFps.innerText = `⚡ ${measuredFps} FPS`;
        }
      }
    }

    if (this.gameOver || this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // 1. Advance distance and speed
    if (this.isTurning) {
      this.speed = Math.min(BASE_SPEED + (this.distance / 120), MAX_SPEED) * 0.5; // slow down during turn
      
      const turnDiff = this.targetWorldRot - this.currentWorldRot;
      const step = turnDiff * 15.0 * dt;
      if (Math.abs(turnDiff) < 0.01) {
        this.currentWorldRot = this.targetWorldRot;
        this.isTurning = false;
      } else {
        this.currentWorldRot += step;
      }
      this.worldPivot.rotation.y = this.currentWorldRot;
    } else {
      this.speed = Math.min(BASE_SPEED + (this.distance / 120), MAX_SPEED);
    }
    this.playerZ -= this.speed * dt;
    this.distance = Math.floor(Math.abs(this.playerZ));
    this.score = this.distance * 2 + this.scrolls * 100;

    // 2. Smooth Lane Interpolation (Lerp X)
    this.playerX += (this.targetX - this.playerX) * 14.0 * dt;

    // 3. Smooth Gravity Somersault Flip (Lerp Y & 3D Somersault Rotation)
    if (this.flipProgress < 1.0) {
      this.flipProgress += 3.8 * dt;
      if (this.flipProgress > 1.0) this.flipProgress = 1.0;
    }
    const t = this.flipProgress;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    this.playerY += (this.targetY - this.playerY) * 12.0 * dt;

    // 4. Update Ninja Position & Rig Rotation
    this.ninja.position.set(this.playerX, this.playerY, this.playerZ);

    // 3D Bank angle tilt & torso twist into lane changes
    const tiltZ = (this.targetX - this.playerX) * -0.22;
    const turnY = (this.targetX - this.playerX) * 0.14;
    this.ninja.rotation.z = (this.isCeiling ? Math.PI : 0) + tiltZ;
    this.ninja.rotation.y = turnY;

    // Flip somersault rotation
    if (this.flipProgress < 1.0) {
      this.ninja.rotation.x = (1.0 - ease) * Math.PI * 2 * (this.isCeiling ? 1 : -1);
    } else {
      this.ninja.rotation.x = 0;
    }

    // 5. Animated Ninja Running Cycle & Motion
    if (!this.gameOver && !this.paused && this.runTextures && this.runTextures.length > 0) {
      // Step through running frames dynamically based on distance traveled along Z
      const runDistance = Math.abs(this.playerZ) * 0.45;
      const frameIdx = Math.floor(runDistance) % this.runFrames.length;
      const activeTexture = this.runTextures[this.runFrames[frameIdx]];
      if (this.ninjaMesh && activeTexture && this.ninjaMesh.material.map !== activeTexture) {
        this.ninjaMesh.material.map = activeTexture;
      }

      // Feet stay firmly planted on the ground deck; forward sprint lean
      this.ninjaMesh.position.y = 0;
      const forwardLean = -0.04 * (this.speed / BASE_SPEED);
      this.ninjaMesh.rotation.x = -0.16 + forwardLean;
    }

    // 6. Dynamic Soft Drop Shadows tracking altitude
    this.shadowFloor.position.set(this.playerX, 0.02, this.playerZ);
    this.shadowCeil.position.set(this.playerX, 5.98, this.playerZ);

    const floorDist = Math.max(0.1, this.playerY - 0.5);
    const ceilDist = Math.max(0.1, 5.5 - this.playerY);
    this.shadowFloor.material.opacity = Math.max(0, 0.80 - floorDist * 0.15);
    this.shadowCeil.material.opacity = Math.max(0, 0.80 - ceilDist * 0.15);

    // 7. Dynamic Chase Camera (Close & cinematic 3rd-Person Follow)
    const camTargetX = this.playerX * 0.55;
    const camTargetY = this.isCeiling ? 3.4 : 2.1;
    const camTargetZ = this.playerZ + 5.0;

    this.camera.position.x += (camTargetX - this.camera.position.x) * 10.0 * dt;
    this.camera.position.y += (camTargetY - this.camera.position.y) * 8.0 * dt;
    this.camera.position.z = camTargetZ;

    // Aim camera directly at runner's back and track ahead
    this.camera.lookAt(this.playerX * 0.35, this.playerY + 0.9, this.playerZ - 10);

    // Moonlight shadow follows player along Z
    this.moonLight.position.z = this.playerZ - 30;
    this.moonLight.target.position.z = this.playerZ;

    // Distant background scenery follows player Z (never intersects or blocks the track)
    if (this.fujiMesh) this.fujiMesh.position.z = this.playerZ - 420;
    if (this.stars) this.stars.position.z = this.playerZ;
    if (this.skyDome) this.skyDome.position.z = this.playerZ;

    // 8. Recycle Track Chunks ahead
    this._recycleChunks();

    // 9. Update & Check Obstacles / Collectibles
    this._updateGameObjects(dt);

    // 10. Floating Sakura Petals
    this._updateSakuraStorm(dt);

    // 11. Day / Night Cycle
    this._updateDayNightCycle(dt);

    // 12. Update HUD
    this.uiScore.innerText = this.score.toString().padStart(6, '0');
    this.uiDist.innerText = this.distance.toString().padStart(4, '0') + 'm';
    this.uiScrolls.innerText = '卷 ' + this.scrolls;

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  // ── Anime Japan Sky: Keyframe-Interpolated Day/Night Cycle ────────
  _updateDayNightCycle(dt) {
    this.cycleTime = (this.cycleTime + dt) % CYCLE_TOTAL;
    const t = this.cycleTime;

    // Find the two surrounding keyframes
    let kA = SKY_KEYFRAMES[0], kB = SKY_KEYFRAMES[1];
    for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
      if (t >= SKY_KEYFRAMES[i].t && t < SKY_KEYFRAMES[i + 1].t) {
        kA = SKY_KEYFRAMES[i];
        kB = SKY_KEYFRAMES[i + 1];
        break;
      }
    }

    // Normalised progress between kA and kB (smooth-step for cinematic feel)
    const raw = (t - kA.t) / (kB.t - kA.t);
    const s = raw * raw * (3 - 2 * raw); // smoothstep

    // ── CSS sky gradient (zenith → horizon → nadir) ──
    if (this.skyDiv) {
      const zHex = '#' + lerpHexColor(kA.zenith, kB.zenith, s).getHexString();
      const hHex = '#' + lerpHexColor(kA.horizon, kB.horizon, s).getHexString();
      const nHex = '#' + lerpHexColor(kA.nadir, kB.nadir, s).getHexString();
      this.skyDiv.style.background =
        `linear-gradient(to bottom, ${zHex} 0%, ${hHex} 45%, ${nHex} 100%)`;
    }

    // ── Fog ──
    if (this.scene.fog) {
      this.scene.fog.color.copy(lerpHexColor(kA.fogColor, kB.fogColor, s));
      this.scene.fog.density = kA.fogDensity + (kB.fogDensity - kA.fogDensity) * s;
    }

    // ── Renderer exposure ──
    this.renderer.toneMappingExposure = kA.exposure + (kB.exposure - kA.exposure) * s;

    // ── Ambient light ──
    if (this.ambLight) {
      this.ambLight.color.copy(lerpHexColor(kA.ambColor, kB.ambColor, s));
      this.ambLight.intensity = kA.ambInt + (kB.ambInt - kA.ambInt) * s;
    }

    // ── Moonlight & moon visibility ──
    const moonInt = kA.moonInt + (kB.moonInt - kA.moonInt) * s;
    this.moonLight.intensity = moonInt;
    this.moonGroup.visible = moonInt > 0.08;

    // Moon arc: rises east (~t=84) and sets west (~t=10 next cycle)
    const moonPhase = ((t - 84 + CYCLE_TOTAL) % CYCLE_TOTAL) / CYCLE_TOTAL; // 0..1
    const moonAngle = moonPhase * Math.PI * 2;
    this.moonGroup.position.x = Math.sin(moonAngle) * 130;
    this.moonGroup.position.y = 50 + Math.cos(moonAngle) * -80;  // arc height
    this.moonGroup.position.z = this.playerZ - 320;

    // ── Stars ──
    const starOp = kA.starOp + (kB.starOp - kA.starOp) * s;
    this.stars.material.opacity = Math.max(0, starOp);

    // ── Sunlight & sun visibility ──
    const sunInt = kA.sunInt + (kB.sunInt - kA.sunInt) * s;
    this.sunLight.intensity = sunInt;
    this.sunGroup.visible = sunInt > 0.05;

    // Sun arc: rises at t=20, peaks at t=45, sets at t=76
    // Map t=20..76 → angle 0..π
    const sunT = Math.max(0, Math.min(1, (t - 20) / 56));
    const sunAngle = sunT * Math.PI;
    this.sunGroup.position.x = Math.cos(sunAngle) * 150;
    this.sunGroup.position.y = 15 + Math.sin(sunAngle) * 100; // peaks at y=115
    this.sunGroup.position.z = this.playerZ - 300;
    this.sunLight.position.set(this.sunGroup.position.x * 0.4, 50, this.playerZ - 30);
    this.sunLight.target.position.set(0, 0, this.playerZ);

    // Tint sun orange at sunrise/sunset, white at noon
    const sunNoon = Math.sin(sunT * Math.PI); // 0 at edges, 1 at noon
    const sunColor = new THREE.Color(0xff7c2a).lerp(new THREE.Color(0xfff5cc), sunNoon);
    this.sunLight.color.copy(sunColor);

    // ── HUD cycle label ──
    if (this.uiCycleLabel) {
      let label, color, border;
      if (t >= 20 && t < 30) {
        label = '🌅 SUNRISE'; color = '#fda4af'; border = '#f43f5e';
      } else if (t >= 30 && t < 62) {
        label = '☀️ DAY'; color = '#fef08a'; border = '#f59e0b';
      } else if (t >= 62 && t < 84) {
        label = '🌇 SUNSET'; color = '#fdba74'; border = '#ea580c';
      } else if (t >= 84 && t < 96) {
        label = '🌙 MOONRISE'; color = '#c4b5fd'; border = '#7c3aed';
      } else {
        label = '🌙 NIGHT'; color = '#7dd3fc'; border = '#38bdf8';
      }
      this.uiCycleLabel.textContent = label;
      this.uiCycleLabel.style.color = color;
      this.uiCycleLabel.style.borderColor = border;
    }
  }

  // ── Chunk Recycling ─────────────────────────────────────────────
  _recycleChunks() {
    this.chunks.forEach(chunk => {
      // If chunk is far behind the camera, move it to the front
      const globalPos = new THREE.Vector3();
      chunk.group.getWorldPosition(globalPos);
      if (globalPos.z > this.playerZ + CHUNK_LEN) {
        // Find frontmost chunk
        let minZ = 0;
        this.chunks.forEach(c => { if (c.group.position.z < minZ) minZ = c.group.position.z; });
        const newZ = minZ - CHUNK_LEN;
        chunk.group.position.z = newZ;
        chunk.zPos = newZ;

        // Clear old obstacles/collectibles in this chunk and repopulate
        this._repopulateChunk(chunk.group, newZ);
      }
    });
  }

  _repopulateChunk(group, zPos) {
    // Remove old dynamic children (last few items in group)
    const toRemove = [];
    group.children.forEach(child => {
      if (child.userData && child.userData.isDynamic) toRemove.push(child);
    });
    toRemove.forEach(c => group.remove(c));

    // Spawn new obstacles & scroll
    const laneIdx = Math.floor(Math.random() * 3);
    const laneX = LANES[laneIdx];
    const isFloor = Math.random() > 0.40;
    const obsY = isFloor ? FLOOR_Y + 0.6 : CEIL_Y - 0.6;
    const type = Math.random() > 0.45 ? 'shuriken' : 'barrier';

    let mesh = (type === 'shuriken') ? this._createShuriken() : this._createBarrier(isFloor);
    mesh.position.set(laneX, (type === 'shuriken') ? obsY : (isFloor ? FLOOR_Y : CEIL_Y), 0);
    mesh.userData = { isDynamic: true };
    group.add(mesh);

    this.obstacles.push({
      mesh,
      type,
      globalZ: zPos,
      laneX,
      y: obsY,
      radius: 0.85
    });

    // Scroll
    const openLane = (laneIdx + 1) % 3;
    const scroll = this._createScroll();
    const scrollY = Math.random() > 0.5 ? FLOOR_Y + 0.8 : CEIL_Y - 0.8;
    scroll.position.set(LANES[openLane], scrollY, 8);
    scroll.userData = { isDynamic: true };
    group.add(scroll);

    this.collectibles.push({
      mesh: scroll,
      globalZ: zPos + 8,
      laneX: LANES[openLane],
      y: scrollY,
      collected: false
    });
  }

  // ── Collision Detection & Object Animation ───────────────────────
  _updateGameObjects(dt) {
    const cullZ = this.playerZ + 15;

    // Invincibility countdown & flashing
    if (this.invincible) {
      this.invincibleTimer -= dt;
      this.ninja.traverse(c => {
        if (c.isMesh) {
          c.material.transparent = true;
          c.material.opacity = Math.sin(this.invincibleTimer * 24) > 0 ? 0.35 : 0.95;
        }
      });
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        // restore ninja opacity
        this.ninja.traverse(c => { if (c.isMesh) { c.material.opacity = 1; c.material.transparent = true; } });
      }
    }

    // 1. Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const globalPos = new THREE.Vector3();
      obs.mesh.getWorldPosition(globalPos);
      if (globalPos.z > cullZ) {
        this.obstacles.splice(i, 1);
        continue;
      }

      // Rotate Shurikens
      if (obs.type === 'shuriken') {
        obs.mesh.rotation.z += 12.0 * dt;
      }

      // Collision Check with Player (skip if invincible)
      if (!this.invincible) {
        const globalPos = new THREE.Vector3();
        obs.mesh.getWorldPosition(globalPos);
        const dz = Math.abs(this.playerZ - globalPos.z);
        const dx = Math.abs(this.playerX - globalPos.x);
        const dy = Math.abs(this.playerY - globalPos.y);

        if (dz < 1.1 && dx < 0.95 && dy < 1.1) {
          this._onHitObstacle();
          return;
        }
      }
    }

    // 2. Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      const globalPos = new THREE.Vector3();
      col.mesh.getWorldPosition(globalPos);
      if (globalPos.z > cullZ) {
        this.collectibles.splice(i, 1);
        continue;
      }

      if (!col.collected) {
        // Spin and bob scroll
        col.mesh.rotation.y += 3.5 * dt;
        col.mesh.position.y = col.y + Math.sin(this.clock.getElapsedTime() * 4) * 0.15;

        // Pickup check
        const globalPos = new THREE.Vector3();
        col.mesh.getWorldPosition(globalPos);
        const dz = Math.abs(this.playerZ - globalPos.z);
        const dx = Math.abs(this.playerX - globalPos.x);
        const dy = Math.abs(this.playerY - globalPos.y);

        if (dz < 1.4 && dx < 1.0 && dy < 1.4) {
          col.collected = true;
          col.mesh.visible = false;
          this.scrolls++;
          this.sfx.playScroll();
          this._vibrate(10); // light tap

          // Every 25 scrolls → spawn a Super Scroll
          if (this.scrolls > 0 && this.scrolls % 25 === 0) {
            this._spawnSuperScroll();
          }

          // Every 100 scrolls → spawn a bonus life
          if (this.scrolls > 0 && this.scrolls % 100 === 0) {
            this._spawnBonusLife();
          }
        }
      }
    }

    // 3. Super Scroll Pickups (spin fast, glow gold)
    for (let i = this.superScrollPickups.length - 1; i >= 0; i--) {
      const sp = this.superScrollPickups[i];
      const globalPos = new THREE.Vector3();
      sp.mesh.getWorldPosition(globalPos);
      if (globalPos.z > cullZ) {
        this.worldGroup.remove(sp.mesh);
        this.superScrollPickups.splice(i, 1);
        continue;
      }

      if (!sp.collected) {
        sp.mesh.rotation.y += 6.0 * dt;
        sp.mesh.rotation.z = Math.sin(this.clock.getElapsedTime() * 5) * 0.18;
        sp.mesh.position.y = sp.y + Math.sin(this.clock.getElapsedTime() * 3) * 0.28;

        const globalPos = new THREE.Vector3();
        sp.mesh.getWorldPosition(globalPos);
        const dz = Math.abs(this.playerZ - globalPos.z);
        const dx = Math.abs(this.playerX - globalPos.x);
        const dy = Math.abs(this.playerY - globalPos.y);

        if (dz < 1.6 && dx < 1.2 && dy < 1.6) {
          sp.collected = true;
          sp.mesh.visible = false;
          this.superScrollPickups.splice(i, 1);
          this._collectSuperScroll();
        }
      }
    }

    // 4. Bonus Life Pickups
    for (let i = this.lifePickups.length - 1; i >= 0; i--) {
      const lp = this.lifePickups[i];
      const globalPos = new THREE.Vector3();
      lp.mesh.getWorldPosition(globalPos);
      if (globalPos.z > cullZ) {
        this.worldGroup.remove(lp.mesh);
        this.lifePickups.splice(i, 1);
        continue;
      }

      if (!lp.collected) {
        // Spin + float
        lp.mesh.rotation.y += 4.0 * dt;
        lp.mesh.position.y = lp.y + Math.sin(this.clock.getElapsedTime() * 3.5) * 0.22;

        // Pickup check
        const globalPos = new THREE.Vector3();
        lp.mesh.getWorldPosition(globalPos);
        const dz = Math.abs(this.playerZ - globalPos.z);
        const dx = Math.abs(this.playerX - globalPos.x);
        const dy = Math.abs(this.playerY - globalPos.y);

        if (dz < 1.4 && dx < 1.0 && dy < 1.4) {
          lp.collected = true;
          lp.mesh.visible = false;
          this.lifePickups.splice(i, 1);
          this._gainLife();
        }
      }
    }
  }

  // ── Sakura Petals Wind Update ───────────────────────────────────
  _updateSakuraStorm(dt) {
    this.petals.forEach(p => {
      p.position.x += p.userData.vx * dt;
      p.position.y += p.userData.vy * dt;
      p.position.z += (p.userData.vz - this.speed * 0.4) * dt;

      p.rotation.x += p.userData.rx * dt;
      p.rotation.y += p.userData.ry * dt;

      // Wrap around player's active bubble
      if (p.position.z < this.playerZ - 80) p.position.z = this.playerZ + 15;
      if (p.position.z > this.playerZ + 20) p.position.z = this.playerZ - 75;
      if (p.position.x < -18) p.position.x = 18;
      if (p.position.y < -1) p.position.y = 11;
    });
  }

  // ── Super Scroll Spawn (every 25 regular scrolls) ─────────────────
  _spawnSuperScroll() {
    const laneIdx = Math.floor(Math.random() * 3);
    const laneX = LANES[laneIdx];
    const y = Math.random() > 0.5 ? FLOOR_Y + 1.1 : CEIL_Y - 1.1;
    const globalZ = this.playerZ - 55 - Math.random() * 35; // ahead of player

    const mesh = this._createSuperScroll();
    mesh.position.set(laneX, y, globalZ);
    this.worldGroup.add(mesh);

    this.superScrollPickups.push({ mesh, globalZ, laneX, y, collected: false });
    this._showPopup('✨ SUPER SCROLL AHEAD!', '#ffd700');
  }

  // ── Collect Super Scroll → +10 scrolls ────────────────────────────
  _collectSuperScroll() {
    this.sfx.playScroll();
    this._vibrate([30, 40, 30]); // pulsing vibrate
    // Add 10 scrolls and check milestones at each step
    for (let i = 0; i < 10; i++) {
      this.scrolls++;
      if (this.scrolls > 0 && this.scrolls % 100 === 0) {
        this._spawnBonusLife();
      }
    }
    this._showPopup('⚡ +10 SCROLLS!', '#ffd700');
  }

  // ── 3D Super Scroll Mesh (large golden glowing scroll) ────────────
  _createSuperScroll() {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700, emissive: 0xffa500, emissiveIntensity: 1.2,
      roughness: 0.15, metalness: 0.8
    });

    // Main scroll cylinder (larger than regular)
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.80, 14);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // End caps
    const capGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.10, 14);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0xffec6e, emissive: 0xffcc00, emissiveIntensity: 0.9,
      roughness: 0.1, metalness: 0.9
    });
    const capL = new THREE.Mesh(capGeo, capMat);
    capL.rotation.z = Math.PI / 2;
    capL.position.x = -0.43;
    group.add(capL);
    const capR = new THREE.Mesh(capGeo, capMat);
    capR.rotation.z = Math.PI / 2;
    capR.position.x = 0.43;
    group.add(capR);

    // Outer glow ring
    const ringGeo = new THREE.RingGeometry(0.55, 0.80, 28);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd700, side: THREE.DoubleSide, transparent: true, opacity: 0.55
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Second larger ring
    const ring2 = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.00, 28),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.30 })
    );
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    // Scale up vs regular scroll
    group.scale.setScalar(1.4);

    return group;
  }

  // ── Game Over & Restart ─────────────────────────────────────────
  _onHitObstacle() {
    this.sfx.playHit();
    this._vibrate([80, 50, 150]); // heavy crash vibrate
    this.lives = Math.max(0, this.lives - 1);
    this._renderLivesHUD();

    if (this.lives <= 0) {
      // True game over
      this.gameOver = true;

      // Manage Historical Scores and Calculate Player Rank
      const savedAll = localStorage.getItem('hattori_3d_all_scores');
      let allScores = savedAll ? JSON.parse(savedAll) : [];
      if (allScores.length === 0 && this.leaderboard.length > 0) {
        allScores = this.leaderboard.map((item, idx) => ({
          id: 'legacy_' + idx,
          name: item.name || 'Ninja',
          score: item.score || 0,
          date: Date.now() - (idx * 60000)
        }));
      }

      const currentRunId = 'run_' + Date.now();
      allScores.push({
        id: currentRunId,
        name: this.playerName || 'Ninja',
        score: this.score,
        date: Date.now()
      });
      allScores.sort((a, b) => b.score - a.score);
      // Removed max score capping to save all historical runs
      localStorage.setItem('hattori_3d_all_scores', JSON.stringify(allScores));

      // Calculate Player's Rank
      const currentRank = allScores.findIndex(s => s.id === currentRunId) + 1;
      const totalRuns = allScores.length;

      // Update Top 5 Leaderboard
      this.leaderboard = allScores.slice(0, 5);
      localStorage.setItem('hattori_3d_leaderboard', JSON.stringify(this.leaderboard));
      this.highScore = this.leaderboard[0].score;

      this.modalScore.innerText = this.score.toString().padStart(6, '0');
      this.modalHigh.innerText = `BEST: ${this.highScore.toString().padStart(6, '0')}`;
      this.modalStreak.innerText = this.dailyStreak;

      // Dynamic Rank Badge
      if (this.modalRankBadge) {
        let badgeText = '';
        let badgeBg = '';
        let badgeBorder = '';
        let badgeColor = '';

        if (currentRank === 1) {
          badgeText = '👑 RANK #1 · NEW ALL-TIME RECORD!';
          badgeBg = 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.35))';
          badgeBorder = '#f59e0b';
          badgeColor = '#fef08a';
        } else if (currentRank === 2) {
          badgeText = '🥈 RANK #2 · RUNNER UP!';
          badgeBg = 'rgba(226, 232, 240, 0.20)';
          badgeBorder = '#cbd5e1';
          badgeColor = '#f8fafc';
        } else if (currentRank === 3) {
          badgeText = '🥉 RANK #3 · PODIUM FINISH!';
          badgeBg = 'rgba(180, 83, 9, 0.25)';
          badgeBorder = '#b45309';
          badgeColor = '#fdba74';
        } else if (currentRank <= 5) {
          badgeText = `🎖️ RANK #${currentRank} · TOP 5 CLAN ELITE!`;
          badgeBg = 'rgba(56, 189, 248, 0.20)';
          badgeBorder = '#38bdf8';
          badgeColor = '#7dd3fc';
        } else {
          badgeText = `🥋 YOUR RANK: #${currentRank} (OF ${totalRuns} RUNS)`;
          badgeBg = 'rgba(148, 163, 184, 0.15)';
          badgeBorder = '#64748b';
          badgeColor = '#cbd5e1';
        }

        this.modalRankBadge.textContent = badgeText;
        this.modalRankBadge.style.background = badgeBg;
        this.modalRankBadge.style.border = `1.5px solid ${badgeBorder}`;
        this.modalRankBadge.style.color = badgeColor;
        this.modalRankBadge.style.display = 'inline-flex';
      }

      // Render Leaderboard with clear Rank & Highlight
      if (this.modalLeaderboard) {
        let lbHTML = `<div style="text-align:center; font-weight:800; margin-bottom:8px; color:#fef08a; letter-spacing:2px;">TOP NINJAS</div>`;
        
        let inTop5 = false;
        this.leaderboard.forEach((entry, i) => {
          const rank = i + 1;
          const isCurrentRun = (entry.id === currentRunId);
          if (isCurrentRun) inTop5 = true;

          const defaultColor = rank === 1 ? '#fbbf24' : (rank === 2 ? '#e2e8f0' : (rank === 3 ? '#b45309' : '#94a3b8'));
          
          if (isCurrentRun) {
            lbHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin:4px 0; font-weight:800; background:rgba(245, 158, 11, 0.22); border:1.5px solid #f59e0b; padding:4px 8px; border-radius:6px; color:#fef08a;">
              <span>${rank}. ${entry.name} <span style="font-size:10px; background:#f59e0b; color:#000; font-weight:900; padding:1px 5px; border-radius:4px; margin-left:4px;">YOU</span></span>
              <span style="font-variant-numeric:tabular-nums;">${entry.score.toString().padStart(6, '0')}</span>
            </div>`;
          } else {
            lbHTML += `<div style="display:flex; justify-content:space-between; margin:4px 0; font-weight:600; color:${defaultColor}; padding:2px 4px;">
              <span>${rank}. ${entry.name}</span>
              <span style="font-variant-numeric:tabular-nums;">${entry.score.toString().padStart(6, '0')}</span>
            </div>`;
          }
        });

        // If player's current run was NOT in top 5, render their rank row below (exactly where green arrow points)
        if (!inTop5) {
          lbHTML += `
            <div style="border-top:1px dashed rgba(255,255,255,0.25); margin:8px 0 6px 0;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; border-radius:6px; background:rgba(56,189,248,0.18); border:1.5px solid #38bdf8; color:#38bdf8; font-weight:800;">
              <span>${currentRank}. ${this.playerName || 'Ninja'} <span style="font-size:10px; background:#38bdf8; color:#000; font-weight:900; padding:1px 5px; border-radius:4px; margin-left:4px;">YOU</span></span>
              <span style="font-variant-numeric:tabular-nums;">${this.score.toString().padStart(6, '0')}</span>
            </div>
          `;
        }

        this.modalLeaderboard.innerHTML = lbHTML;
      }

      if (this.modalLivesRow) this.modalLivesRow.textContent = '💔 💔 💔';
      this.uiGameOver.style.display = 'flex';
    } else {
      // Brief invincibility (2 seconds)
      this.invincible = true;
      this.invincibleTimer = 2.0;
      // Flash ninja semi-transparent
      this.ninja.traverse(c => {
        if (c.isMesh) { c.material.transparent = true; c.material.opacity = 0.35; }
      });
      // Screen shake: quick red tint flash via HUD
      const flash = document.createElement('div');
      flash.style.cssText = 'position:absolute;inset:0;background:rgba(220,38,38,0.45);pointer-events:none;z-index:200;animation:invincFlash 0.12s ease 4';
      this.container.appendChild(flash);
      setTimeout(() => flash.remove(), 600);
    }
  }

  // ── Bonus Life Spawn (every 100 scrolls) ────────────────────────
  _spawnBonusLife() {
    const laneIdx = Math.floor(Math.random() * 3);
    const laneX = LANES[laneIdx];
    const y = Math.random() > 0.5 ? FLOOR_Y + 1.0 : CEIL_Y - 1.0;
    const globalZ = this.playerZ - 60 - Math.random() * 40; // ahead of player

    const mesh = this._createLifePickup();
    mesh.position.set(laneX, y, globalZ);
    this.worldGroup.add(mesh);

    this.lifePickups.push({ mesh, globalZ, laneX, y, collected: false });

    // Popup message
    this._showPopup('💖 BONUS LIFE SPAWNED!', '#ff4d6d');
  }

  // ── Gain a Life ─────────────────────────────────────────────────
  _gainLife() {
    if (this.lives >= this.maxLives) return;
    this.lives++;
    this._renderLivesHUD(true); // true = animate the new heart
    this.sfx.playFlip(); // reuse flip sound as life-gain chime
    this._showPopup('❤️ +1 LIFE!', '#ff4d6d');
  }

  // ── 3D Life Pickup Mesh (glowing pink heart) ────────────────────
  _createLifePickup() {
    const group = new THREE.Group();

    // Heart body: two spheres + one rotated cube
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff1a5e, emissive: 0xff0044, emissiveIntensity: 0.8,
      roughness: 0.3, metalness: 0.1
    });

    // Left lobe
    const lobeGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const lobeL = new THREE.Mesh(lobeGeo, mat);
    lobeL.position.set(-0.22, 0.22, 0);
    group.add(lobeL);

    // Right lobe
    const lobeR = new THREE.Mesh(lobeGeo, mat);
    lobeR.position.set(0.22, 0.22, 0);
    group.add(lobeR);

    // Bottom point (rotated box)
    const tipGeo = new THREE.BoxGeometry(0.46, 0.46, 0.32);
    const tip = new THREE.Mesh(tipGeo, mat);
    tip.rotation.z = Math.PI / 4;
    tip.position.set(0, -0.05, 0);
    group.add(tip);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.55, 0.75, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4d6d, side: THREE.DoubleSide, transparent: true, opacity: 0.35
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  // ── Lives HUD Renderer ──────────────────────────────────────────
  _renderLivesHUD(animateLast = false) {
    if (!this.uiLives) return;
    let html = '';
    for (let i = 0; i < this.maxLives; i++) {
      if (i < this.lives) {
        const cls = (animateLast && i === this.lives - 1) ? 'heart gained' : 'heart';
        html += `<span class="${cls}">❤️</span>`;
      } else {
        html += `<span class="heart empty">🖤</span>`;
      }
    }
    this.uiLives.innerHTML = html;
  }

  // ── Floating Popup Message ──────────────────────────────────────
  _showPopup(text, color = '#fff') {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = [
      'position:absolute', 'left:50%', 'top:40%',
      'transform:translateX(-50%)',
      `color:${color}`, 'font-weight:900', 'font-size:22px',
      'text-shadow:0 0 12px currentColor',
      'pointer-events:none', 'z-index:300',
      'animation:popupFade 1.8s ease forwards'
    ].join(';');
    this.container.appendChild(el);

    // Inject keyframe once
    if (!document.getElementById('popup-style')) {
      const s = document.createElement('style');
      s.id = 'popup-style';
      s.textContent = '@keyframes popupFade{0%{opacity:1;top:40%}100%{opacity:0;top:25%}}';
      document.head.appendChild(s);
    }
    setTimeout(() => el.remove(), 1900);
  }

  restart() {
    this.score = 0;
    this.distance = 0;
    this.scrolls = 0;
    this.speed = BASE_SPEED;
    this.isCeiling = false;
    this.currentLane = 1;
    this.targetX = 0;
    this.targetY = FLOOR_Y;
    this.playerX = 0;
    this.playerY = FLOOR_Y;
    this.playerZ = 0;
    this.flipProgress = 1.0;
    this.gameOver = false;
    this.paused = false;

    // Reset lives & items
    this.lives = 3;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.scrollsAtLastBonus = 0;
    this.scrollsAtLastSuper = 0;

    // Remove any floating life/super pickups from scene
    this.lifePickups.forEach(lp => this.scene.remove(lp.mesh));
    this.lifePickups = [];
    this.superScrollPickups.forEach(sp => this.scene.remove(sp.mesh));
    this.superScrollPickups = [];

    this._renderLivesHUD();
    // Restore ninja opacity
    this.ninja.traverse(c => { if (c.isMesh) { c.material.transparent = true; c.material.opacity = 1; } });

    // Reset Chunks & Objects
    this.obstacles = [];
    this.collectibles = [];
    this.chunks.forEach((chunk, i) => {
      const z = -i * CHUNK_LEN;
      chunk.group.position.z = z;
      chunk.zPos = z;
      this._repopulateChunk(chunk.group, z);
    });

    if (this.uiGameOver) this.uiGameOver.style.display = 'none';
    if (this.modalRankBadge) this.modalRankBadge.style.display = 'none';
    if (this.uiPause) this.uiPause.style.display = 'none';
    if (this.uiBtnPause) { this.uiBtnPause.textContent = '⏸'; this.uiBtnPause.title = 'Pause (P / ESC)'; }
    if (this.uiGravity) {
      this.uiGravity.innerHTML = '⬇ FLOOR';
      this.uiGravity.style.borderColor = '#f59e0b';
      this.uiGravity.style.color = '#fde68a';
    }
  }
}
