/**
 * =========================================================================
 * Ninja Hattori: Anti-Gravity Runner
 * Engine: Phaser.js (Arcade Physics)
 * Resolution: 1280x720 Landscape (Responsive)
 * =========================================================================
 */

// --- AUDIO SYNTHESIS (Zero External Audio Dependencies) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Anti-gravity flip swoosh
  playFlip() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.16);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Shimmering chime for collecting scrolls
  playScrollCollect() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [659.25, 880, 1174.66, 1318.51]; // E5, A5, D6, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      gain.gain.setValueAtTime(0.18, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.25);
    });
  }

  // Impact crash on shuriken collision
  playHit() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }
}

const sfx = new SoundEffects();

// --- PROCEDURAL TEXTURE GENERATOR (Generates Hattori Sprites, Shurikens, Scrolls & Parallax) ---
function createGameTextures(scene) {
  // 1. Ninja Hattori Running Frames (6-frame running cycle matching the sprite sheet)
  for (let frame = 0; frame < 6; frame++) {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    const cycle = frame / 6;
    const legAngle = Math.sin(cycle * Math.PI * 2);
    const bobY = Math.abs(Math.sin(cycle * Math.PI * 2)) * -4;
    const scarfWave = Math.sin(cycle * Math.PI * 2) * 6;

    ctx.save();
    ctx.translate(40, 42 + bobY);

    // Trailing Scarf / Headband Ribbons (Fluttering behind)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-16, -18);
    ctx.quadraticCurveTo(-26, -15 + scarfWave, -38, -20);
    ctx.lineTo(-35, -14);
    ctx.quadraticCurveTo(-24, -11 + scarfWave, -16, -14);
    ctx.closePath();
    ctx.fill();

    // Yellow Backpack / Ninja Roll
    ctx.fillStyle = '#e6c343';
    ctx.beginPath();
    ctx.ellipse(-14, 4, 7, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b89419';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Back Leg
    ctx.save();
    ctx.translate(-4, 14);
    ctx.rotate(-legAngle * 0.7);
    ctx.fillStyle = '#1b4ba1';
    ctx.fillRect(-5, 0, 10, 16);
    // Foot / Waraji sandal
    ctx.fillStyle = '#c4a36f';
    ctx.fillRect(-4, 16, 11, 4);
    ctx.restore();

    // Torso / Blue Ninja Suit
    ctx.fillStyle = '#235bbd';
    ctx.beginPath();
    ctx.ellipse(0, 4, 14, 16, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // White Collar / Cross Straps
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-8, -6);
    ctx.lineTo(6, 6);
    ctx.moveTo(8, -6);
    ctx.lineTo(-6, 6);
    ctx.stroke();

    // Red Belt (Obi) with Front Knot
    ctx.fillStyle = '#d82f3a';
    ctx.fillRect(-12, 8, 24, 5);
    ctx.beginPath();
    ctx.arc(-2, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Front Leg
    ctx.save();
    ctx.translate(4, 14);
    ctx.rotate(legAngle * 0.7);
    ctx.fillStyle = '#235bbd';
    ctx.fillRect(-5, 0, 10, 16);
    // Foot / Waraji sandal
    ctx.fillStyle = '#c4a36f';
    ctx.fillRect(-3, 16, 11, 4);
    ctx.restore();

    // Front Arm & Hand
    ctx.save();
    ctx.translate(-2, 4);
    ctx.rotate(-legAngle * 0.5);
    ctx.fillStyle = '#235bbd';
    ctx.fillRect(0, -3, 14, 6);
    // Netting sleeve
    ctx.fillStyle = '#fedcb1';
    ctx.fillRect(10, -3, 5, 6);
    ctx.restore();

    // Head / Hood
    ctx.fillStyle = '#235bbd';
    ctx.beginPath();
    ctx.arc(3, -12, 16, 0, Math.PI * 2);
    ctx.fill();

    // Face (Skin tone)
    ctx.fillStyle = '#fedcb1';
    ctx.beginPath();
    ctx.ellipse(7, -10, 10, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iconic Rosy Spiral Cheeks
    ctx.fillStyle = '#ff4d61';
    ctx.beginPath();
    ctx.arc(7, -5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8090';
    ctx.beginPath();
    ctx.arc(7, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (Determined anime look)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(10, -12, 2.5, 3.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(11, -13, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // White Headband (Hachimaki) & Silver Ninja Crest
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-11, -21, 26, 5);
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(3, -22, 7, 7);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(5, -20.5, 3, 4);

    ctx.restore();

    scene.textures.addCanvas(`hattori_${frame}`, canvas);
  }

  // 2. Spinning Metallic Shuriken
  const shurikenCanvas = document.createElement('canvas');
  shurikenCanvas.width = 48;
  shurikenCanvas.height = 48;
  const sCtx = shurikenCanvas.getContext('2d');
  sCtx.translate(24, 24);

  const blades = 4;
  const outerR = 22;
  const innerR = 7;

  sCtx.fillStyle = '#1c2833';
  sCtx.beginPath();
  for (let i = 0; i < blades * 2; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = (i * Math.PI) / blades;
    sCtx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  sCtx.closePath();
  sCtx.fill();

  for (let i = 0; i < blades; i++) {
    const a = (i * Math.PI * 2) / blades;
    const nextA = a + Math.PI / blades;

    sCtx.fillStyle = (i % 2 === 0) ? '#e0e6ed' : '#b8c2cc';
    sCtx.beginPath();
    sCtx.moveTo(0, 0);
    sCtx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
    sCtx.lineTo(Math.cos(nextA) * innerR, Math.sin(nextA) * innerR);
    sCtx.closePath();
    sCtx.fill();

    sCtx.fillStyle = (i % 2 === 0) ? '#8795a1' : '#606f7b';
    sCtx.beginPath();
    sCtx.moveTo(0, 0);
    sCtx.lineTo(Math.cos(nextA) * innerR, Math.sin(nextA) * innerR);
    sCtx.lineTo(Math.cos(a + (Math.PI * 2) / blades) * outerR, Math.sin(a + (Math.PI * 2) / blades) * outerR);
    sCtx.closePath();
    sCtx.fill();
  }

  // Gold core ring
  sCtx.fillStyle = '#ffd13b';
  sCtx.beginPath();
  sCtx.arc(0, 0, 6, 0, Math.PI * 2);
  sCtx.fill();
  sCtx.fillStyle = '#0b1017';
  sCtx.beginPath();
  sCtx.arc(0, 0, 3, 0, Math.PI * 2);
  sCtx.fill();
  scene.textures.addCanvas('shuriken', shurikenCanvas);

  // 3. Ancient Collectible Ninja Scroll (Makimono with '忍')
  const scrollCanvas = document.createElement('canvas');
  scrollCanvas.width = 54;
  scrollCanvas.height = 54;
  const scCtx = scrollCanvas.getContext('2d');
  scCtx.translate(27, 27);

  const glow = scCtx.createRadialGradient(0, 0, 4, 0, 0, 24);
  glow.addColorStop(0, 'rgba(255, 215, 0, 0.7)');
  glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
  scCtx.fillStyle = glow;
  scCtx.beginPath();
  scCtx.arc(0, 0, 24, 0, Math.PI * 2);
  scCtx.fill();

  scCtx.fillStyle = '#3e2723';
  scCtx.fillRect(-22, -16, 6, 32);
  scCtx.fillRect(16, -16, 6, 32);

  scCtx.fillStyle = '#ffd54f';
  scCtx.fillRect(-23, -18, 8, 4);
  scCtx.fillRect(-23, 14, 8, 4);
  scCtx.fillRect(15, -18, 8, 4);
  scCtx.fillRect(15, 14, 8, 4);

  const paperGrad = scCtx.createLinearGradient(0, -14, 0, 14);
  paperGrad.addColorStop(0, '#fff9c4');
  paperGrad.addColorStop(0.5, '#fffde7');
  paperGrad.addColorStop(1, '#ffe082');
  scCtx.fillStyle = paperGrad;
  scCtx.fillRect(-16, -14, 32, 28);
  scCtx.strokeStyle = '#d7ccc8';
  scCtx.strokeRect(-16, -14, 32, 28);

  scCtx.fillStyle = '#d32f2f';
  scCtx.fillRect(-16, -3, 32, 4);

  scCtx.fillStyle = '#212121';
  scCtx.font = 'bold 15px serif';
  scCtx.textAlign = 'center';
  scCtx.textBaseline = 'middle';
  scCtx.fillText('忍', 0, 0);
  scene.textures.addCanvas('scroll', scrollCanvas);

  // 4. Solid Japanese Platforms (Kawara Tiles)
  const platCanvas = document.createElement('canvas');
  platCanvas.width = 160;
  platCanvas.height = 70;
  const pCtx = platCanvas.getContext('2d');
  pCtx.fillStyle = '#1c1511';
  pCtx.fillRect(0, 22, 160, 48);

  pCtx.fillStyle = '#2b1d16';
  for (let x = 0; x < 160; x += 32) {
    pCtx.fillRect(x + 2, 24, 28, 46);
  }

  pCtx.fillStyle = '#263238';
  for (let x = 0; x < 160; x += 16) {
    pCtx.beginPath();
    pCtx.arc(x + 8, 20, 9, Math.PI, 0);
    pCtx.fill();
  }

  pCtx.fillStyle = '#455a64';
  pCtx.fillRect(0, 11, 160, 4);
  pCtx.fillStyle = '#00e5ff';
  pCtx.fillRect(0, 8, 160, 3);
  scene.textures.addCanvas('platform_floor', platCanvas);

  // Ceiling Platform
  const ceilCanvas = document.createElement('canvas');
  ceilCanvas.width = 160;
  ceilCanvas.height = 70;
  const cCtx = ceilCanvas.getContext('2d');
  cCtx.translate(0, 70);
  cCtx.scale(1, -1);
  cCtx.drawImage(platCanvas, 0, 0);
  scene.textures.addCanvas('platform_ceiling', ceilCanvas);

  // 5. Parallax Background Layers
  // Sky Layer
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 1280;
  skyCanvas.height = 720;
  const skyCtx = skyCanvas.getContext('2d');

  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 720);
  skyGrad.addColorStop(0, '#090e1a');
  skyGrad.addColorStop(0.5, '#131e33');
  skyGrad.addColorStop(1, '#1e2d4a');
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 1280, 720);

  const moonGlow = skyCtx.createRadialGradient(1040, 160, 20, 1040, 160, 110);
  moonGlow.addColorStop(0, 'rgba(255, 255, 240, 0.9)');
  moonGlow.addColorStop(0.4, 'rgba(255, 240, 190, 0.3)');
  moonGlow.addColorStop(1, 'rgba(255, 240, 190, 0)');
  skyCtx.fillStyle = moonGlow;
  skyCtx.beginPath();
  skyCtx.arc(1040, 160, 110, 0, Math.PI * 2);
  skyCtx.fill();

  skyCtx.fillStyle = '#fffde7';
  skyCtx.beginPath();
  skyCtx.arc(1040, 160, 42, 0, Math.PI * 2);
  skyCtx.fill();

  skyCtx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    const sx = (i * 137) % 1280;
    const sy = (i * 61) % 520;
    skyCtx.globalAlpha = 0.3 + (i % 5) * 0.15;
    skyCtx.beginPath();
    skyCtx.arc(sx, sy, (i % 2 === 0 ? 1.5 : 1), 0, Math.PI * 2);
    skyCtx.fill();
  }
  skyCtx.globalAlpha = 1.0;
  scene.textures.addCanvas('bg_sky', skyCanvas);

  // Mount Fuji Layer
  const fujiCanvas = document.createElement('canvas');
  fujiCanvas.width = 1280;
  fujiCanvas.height = 720;
  const fujiCtx = fujiCanvas.getContext('2d');

  fujiCtx.fillStyle = '#162238';
  fujiCtx.beginPath();
  fujiCtx.moveTo(420, 650);
  fujiCtx.lineTo(620, 310);
  fujiCtx.lineTo(660, 310);
  fujiCtx.lineTo(860, 650);
  fujiCtx.closePath();
  fujiCtx.fill();

  fujiCtx.fillStyle = 'rgba(235, 240, 255, 0.85)';
  fujiCtx.beginPath();
  fujiCtx.moveTo(580, 370);
  fujiCtx.lineTo(620, 310);
  fujiCtx.lineTo(660, 310);
  fujiCtx.lineTo(700, 370);
  fujiCtx.lineTo(670, 385);
  fujiCtx.lineTo(640, 365);
  fujiCtx.lineTo(610, 385);
  fujiCtx.closePath();
  fujiCtx.fill();
  scene.textures.addCanvas('bg_fuji', fujiCanvas);

  // Distant Trees Layer
  const treeCanvas = document.createElement('canvas');
  treeCanvas.width = 1280;
  treeCanvas.height = 720;
  const treeCtx = treeCanvas.getContext('2d');
  treeCtx.fillStyle = '#101726';
  for (let x = 50; x < 1280; x += 180) {
    treeCtx.fillRect(x - 3, 600, 6, 50);
    treeCtx.beginPath();
    treeCtx.arc(x - 12, 605, 16, 0, Math.PI * 2);
    treeCtx.arc(x + 12, 598, 18, 0, Math.PI * 2);
    treeCtx.arc(x - 4, 582, 16, 0, Math.PI * 2);
    treeCtx.arc(x + 6, 572, 13, 0, Math.PI * 2);
    treeCtx.fill();
  }
  scene.textures.addCanvas('bg_trees', treeCanvas);

  // Particles
  const p1 = document.createElement('canvas');
  p1.width = 16;
  p1.height = 16;
  const p1Ctx = p1.getContext('2d');
  const pGlow = p1Ctx.createRadialGradient(8, 8, 2, 8, 8, 8);
  pGlow.addColorStop(0, '#00e5ff');
  pGlow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  p1Ctx.fillStyle = pGlow;
  p1Ctx.beginPath();
  p1Ctx.arc(8, 8, 8, 0, Math.PI * 2);
  p1Ctx.fill();
  scene.textures.addCanvas('particle_gravity', p1);

  const p2 = document.createElement('canvas');
  p2.width = 16;
  p2.height = 16;
  const p2Ctx = p2.getContext('2d');
  p2Ctx.fillStyle = '#ffd700';
  p2Ctx.fillRect(7, 2, 2, 12);
  p2Ctx.fillRect(2, 7, 12, 2);
  p2Ctx.fillStyle = '#ffffff';
  p2Ctx.fillRect(6, 6, 4, 4);
  scene.textures.addCanvas('particle_sparkle', p2);
}

// --- MAIN GAME SCENE ---
class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // ── Character Assets ─────────────────────────────────────────────
    for (let i = 0; i <= 5; i++) {
      this.load.image(`floor_${i}`, `assets/character/floor_${i}.png`);
    }
    for (let i = 0; i <= 4; i++) {
      this.load.image(`ceil_${i}`, `assets/character/ceil_${i}.png`);
    }

    // ── Map & Environment Assets ─────────────────────────────────────
    this.load.image('env', 'assets/map/image_6.png');
    this.load.image('bg_assets', 'assets/map/bg-assets.png');

    // Generate procedural fallback textures
    createGameTextures(this);

    // Register 6-frame running cycle animation
    const animFrames = [];
    for (let i = 0; i < 6; i++) {
      animFrames.push({ key: `hattori_${i}` });
    }
    this.anims.create({
      key: 'hattori_run',
      frames: animFrames,
      frameRate: 12,
      repeat: -1
    });
  }

  create() {
    const { width, height } = this.scale;

    // Reset game state
    this.score = 0;
    this.scrolls = 0;
    this.gameSpeed = 380;
    this.isGameOver = false;
    this.isAntiGravity = false; // false = Floor (downward), true = Ceiling (upward)

    // 1. Initial downward gravity configuration
    this.physics.world.gravity.y = 850;

    // Constrain player movement between ceiling (70) and floor (height - 70)
    this.physics.world.setBounds(0, 70, width, height - 140);

    // 2. Parallax Scrolling Backgrounds
    this.bgSky = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_sky').setScrollFactor(0);
    this.bgFuji = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_fuji').setScrollFactor(0);
    this.bgTrees = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_trees').setScrollFactor(0);

    // 3. Solid Platforms (Top Ceiling & Bottom Floor)
    this.ceilingPlatform = this.add.tileSprite(width / 2, 35, width, 70, 'platform_ceiling').setDepth(10);
    this.floorPlatform = this.add.tileSprite(width / 2, height - 35, width, 70, 'platform_floor').setDepth(10);

    // 4. Ninja Hattori Player Sprite
    this.player = this.physics.add.sprite(200, height - 70 - 40, 'hattori_0')
      .setDepth(20)
      .play('hattori_run');

    this.player.body.setSize(38, 62);
    this.player.body.setOffset(22, 10);
    this.player.setCollideWorldBounds(true);
    this.player.body.onWorldBounds = true;

    // Resume running animation upon landing on floor or ceiling
    this.physics.world.on('worldbounds', (body, up, down) => {
      if (body.gameObject === this.player) {
        if ((up && this.isAntiGravity) || (down && !this.isAntiGravity)) {
          if (this.player.anims.currentAnim?.key !== 'hattori_run') {
            this.player.play('hattori_run');
          }
        }
      }
    });

    // 5. Obstacle (Shurikens) & Collectible (Scrolls) Groups
    this.shurikens = this.physics.add.group();
    this.scrollsGroup = this.physics.add.group();

    this.physics.add.overlap(this.player, this.shurikens, this.handleHitShuriken, null, this);
    this.physics.add.overlap(this.player, this.scrollsGroup, this.handleCollectScroll, null, this);

    // 6. Particle Emitters
    this.gravityEmitter = this.add.particles(0, 0, 'particle_gravity', {
      speed: { min: 80, max: 200 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 320,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(25);

    this.sparkleEmitter = this.add.particles(0, 0, 'particle_sparkle', {
      speed: { min: 60, max: 180 },
      scale: { start: 1.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(25);

    // 7. Gravity-Flip Controls: Touch/Click anywhere on screen & Spacebar
    this.input.on('pointerdown', () => this.flipGravity());
    this.input.keyboard.on('keydown-SPACE', () => this.flipGravity());

    // 8. Timers for dynamic obstacle & collectible spawning
    this.nextShurikenTime = 1200;
    this.nextScrollTime = 1500;

    // 9. UI / HUD
    this.createHUD();
  }

  /**
   * CORE SPECIFICATION 2: Anti-Gravity Flip
   * Inverts physics gravity and vertically flips the player sprite
   */
  flipGravity() {
    if (this.isGameOver) return;

    // Toggle gravity direction
    this.isAntiGravity = !this.isAntiGravity;

    // Invert physics world gravity:
    // When false: +850 (pulls down to floor)
    // When true:  -850 (pulls up to ceiling)
    this.physics.world.gravity.y = this.isAntiGravity ? -850 : 850;

    // Flip Hattori sprite vertically so he runs upside down on the ceiling
    this.player.setFlipY(this.isAntiGravity);

    // Adjust collision box offset for smooth surface contact
    this.player.body.setOffset(22, this.isAntiGravity ? 4 : 10);

    // Apply snappy vertical impulse in direction of gravity
    this.player.setVelocityY(this.isAntiGravity ? -240 : 240);

    // Play synthesized sound & burst cyan chakra particles
    sfx.playFlip();
    this.gravityEmitter.explode(16, this.player.x, this.player.y);

    // Camera nudge
    this.cameras.main.shake(90, 0.003);

    // Update Gravity Badge
    this.updateGravityHUD();
  }

  handleCollectScroll(player, scroll) {
    if (this.isGameOver) return;

    this.scrolls++;
    this.score += 150;
    sfx.playScrollCollect();

    // Golden sparkle explosion
    this.sparkleEmitter.explode(18, scroll.x, scroll.y);

    // Floating score popup
    const popup = this.add.text(scroll.x, scroll.y, '+150 📜', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '24px',
      fontWeight: '900',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: popup,
      y: scroll.y - 50,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });

    scroll.destroy();
  }

  handleHitShuriken(player, shuriken) {
    if (this.isGameOver) return;

    this.isGameOver = true;
    sfx.playHit();

    // Pause physics
    this.physics.pause();

    // Red screen impact flash & shake
    this.cameras.main.flash(200, 255, 30, 30);
    this.cameras.main.shake(400, 0.03);

    // Death rotation
    this.tweens.add({
      targets: player,
      angle: this.isAntiGravity ? -180 : 180,
      scaleX: 0.7,
      scaleY: 0.7,
      alpha: 0.3,
      duration: 600,
      ease: 'Power2'
    });

    // Display Game Over overlay
    this.time.delayedCall(700, () => this.showGameOverScreen());
  }

  spawnShuriken() {
    if (this.isGameOver) return;

    const { width, height } = this.scale;
    const x = width + 50;

    // 3 spawn heights: Floor (force ceiling flip), Ceiling (force floor flip), Mid-air
    const pattern = Phaser.Math.Between(0, 2);
    let y;
    if (pattern === 0) {
      y = height - 70 - 30; // Floor height
    } else if (pattern === 1) {
      y = 70 + 30;          // Ceiling height
    } else {
      y = height / 2 + Phaser.Math.Between(-50, 50);
    }

    const shuriken = this.shurikens.create(x, y, 'shuriken');
    shuriken.setDepth(15);
    shuriken.body.setCircle(16, 8, 8);
    shuriken.body.setAllowGravity(false);
    shuriken.body.setVelocityX(-this.gameSpeed * 1.1);
    shuriken.spinSpeed = 18;
  }

  spawnScroll() {
    if (this.isGameOver) return;

    const { width, height } = this.scale;
    const x = width + 50;
    const positions = [height - 70 - 45, 70 + 45, height / 2];
    const y = Phaser.Utils.Array.GetRandom(positions);

    const scroll = this.scrollsGroup.create(x, y, 'scroll');
    scroll.setDepth(15);
    scroll.body.setSize(36, 32);
    scroll.body.setAllowGravity(false);
    scroll.body.setVelocityX(-this.gameSpeed);

    scroll.baseY = y;
    scroll.floatTimer = Math.random() * Math.PI * 2;
  }

  createHUD() {
    const { width } = this.scale;

    // Score display
    this.scoreText = this.add.text(32, 22, 'SCORE: 0', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '26px',
      fontWeight: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setDepth(50);

    // Scrolls display
    this.scrollsText = this.add.text(260, 22, '📜 0', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '24px',
      fontWeight: '800',
      color: '#ffd54f',
      stroke: '#000000',
      strokeThickness: 4
    }).setDepth(50);

    // Gravity indicator badge
    this.gravityBadge = this.add.container(width / 2, 35).setDepth(50);
    this.badgeBg = this.add.rectangle(0, 0, 220, 32, 0x000000, 0.75)
      .setStrokeStyle(1.5, 0x00e5ff);
    this.badgeText = this.add.text(0, 0, '▼ GRAVITY: FLOOR', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '14px',
      fontWeight: '800',
      color: '#00e5ff'
    }).setOrigin(0.5);
    this.gravityBadge.add([this.badgeBg, this.badgeText]);

    // Initial controls tutorial hint
    this.hintText = this.add.text(width / 2, 120, '⚡ TAP SCREEN OR PRESS SPACEBAR TO FLIP GRAVITY ⚡', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: '800',
      color: '#ffffff',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      padding: { left: 16, right: 16, top: 8, bottom: 8 }
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: this.hintText,
      alpha: 0,
      delay: 3500,
      duration: 800,
      onComplete: () => this.hintText.destroy()
    });
  }

  updateGravityHUD() {
    if (this.isAntiGravity) {
      this.badgeText.setText('▲ GRAVITY: CEILING');
      this.badgeText.setColor('#ff4081');
      this.badgeBg.setStrokeStyle(1.5, 0xff4081);
    } else {
      this.badgeText.setText('▼ GRAVITY: FLOOR');
      this.badgeText.setColor('#00e5ff');
      this.badgeBg.setStrokeStyle(1.5, 0x00e5ff);
    }
  }

  showGameOverScreen() {
    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2).setDepth(100);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);

    const title = this.add.text(0, -90, 'GAME OVER', {
      fontFamily: "'Shojumaru', 'Outfit', sans-serif",
      fontSize: '52px',
      color: '#ff1744',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    const scoreInfo = this.add.text(0, -10, `FINAL SCORE: ${Math.floor(this.score)}   |   SCROLLS: 📜 ${this.scrolls}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '22px',
      fontWeight: 'bold',
      color: '#ffd54f'
    }).setOrigin(0.5);

    const retryBtn = this.add.rectangle(0, 70, 260, 52, 0x1e88e5)
      .setStrokeStyle(2, 0xffffff)
      .setInteractive({ useHandCursor: true });

    const retryText = this.add.text(0, 70, '🔄 TAP TO RETRY', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '20px',
      fontWeight: '800',
      color: '#ffffff'
    }).setOrigin(0.5);

    modal.add([overlay, title, scoreInfo, retryBtn, retryText]);

    retryBtn.on('pointerdown', () => this.scene.restart());
    this.input.keyboard.once('keydown-SPACE', () => this.scene.restart());
  }

  update(time, delta) {
    if (this.isGameOver) return;

    const dt = delta / 1000;

    // Gradually ramp up speed
    if (this.gameSpeed < 750) {
      this.gameSpeed += 4.5 * dt;
    }

    // SPECIFICATION 3: Parallax scrolling (Sky, Mount Fuji, Distant Trees, Platforms)
    this.bgSky.tilePositionX += this.gameSpeed * 0.05 * dt;
    this.bgFuji.tilePositionX += this.gameSpeed * 0.18 * dt;
    this.bgTrees.tilePositionX += this.gameSpeed * 0.45 * dt;
    this.floorPlatform.tilePositionX += this.gameSpeed * dt;
    this.ceilingPlatform.tilePositionX += this.gameSpeed * dt;

    // Continuous running score
    this.score += this.gameSpeed * 0.12 * dt;
    this.scoreText.setText(`SCORE: ${Math.floor(this.score)}`);
    this.scrollsText.setText(`📜 ${this.scrolls}`);

    // Rotate shurikens & cleanup offscreen
    this.shurikens.getChildren().forEach(shuriken => {
      shuriken.angle += shuriken.spinSpeed || 15;
      if (shuriken.x < -60) shuriken.destroy();
    });

    // Floating bobbing motion for scrolls
    this.scrollsGroup.getChildren().forEach(scroll => {
      scroll.floatTimer += dt * 4;
      scroll.y = scroll.baseY + Math.sin(scroll.floatTimer) * 8;
      if (scroll.x < -60) scroll.destroy();
    });

    // Spawning intervals
    this.nextShurikenTime -= delta;
    if (this.nextShurikenTime <= 0) {
      this.spawnShuriken();
      this.nextShurikenTime = Phaser.Math.Between(1000, 1800);
    }

    this.nextScrollTime -= delta;
    if (this.nextScrollTime <= 0) {
      this.spawnScroll();
      this.nextScrollTime = Phaser.Math.Between(1300, 2200);
    }
  }
}

// SPECIFICATION 1: 1280x720 Canvas, Landscape, Responsive
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#090e1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 850 },
      debug: false
    }
  },
  scene: [MainScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
