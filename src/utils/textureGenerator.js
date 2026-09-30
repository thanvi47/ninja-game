// Procedural texture generator for Ninja Hattori and game assets
export function generateGameTextures(scene) {
  generateHattoriTextures(scene);
  generateShurikenTexture(scene);
  generateScrollTexture(scene);
  generatePlatformTextures(scene);
  generateBackgroundTextures(scene);
  generateParticleTextures(scene);
}

// 1. Ninja Hattori Running & Flipping Textures
function generateHattoriTextures(scene) {
  const width = 64;
  const height = 64;

  // 4 running frames
  for (let frame = 0; frame < 4; frame++) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const legOffset = (frame % 2 === 0 ? 1 : -1) * (frame === 1 || frame === 3 ? 10 : 5);
    const armOffset = -legOffset * 0.7;
    const bobY = (frame === 1 || frame === 3) ? -3 : 0;
    const scarfWave = Math.sin(frame * Math.PI / 2) * 5;

    ctx.save();
    ctx.translate(28, 30 + bobY);

    // Trailing ninja scarf (red)
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.moveTo(-10, 4);
    ctx.quadraticCurveTo(-22, 6 + scarfWave, -32, 2 - scarfWave);
    ctx.lineTo(-30, 10 - scarfWave);
    ctx.quadraticCurveTo(-20, 12 + scarfWave, -8, 8);
    ctx.closePath();
    ctx.fill();

    // Back Arm
    ctx.fillStyle = '#1548a6';
    ctx.beginPath();
    ctx.arc(armOffset * 0.8, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    // Back Leg
    ctx.fillStyle = '#103984';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-legOffset * 0.8, 22);
    ctx.stroke();

    // Body (Blue ninja suit)
    ctx.fillStyle = '#1e5ad7';
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 14, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Red Belt (Obi)
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-10, 8, 20, 5);
    // Belt knot
    ctx.beginPath();
    ctx.arc(-2, 12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Front Leg
    ctx.strokeStyle = '#1e5ad7';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(legOffset, 22);
    ctx.stroke();

    // Feet / Tabi boots
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.ellipse(legOffset + 2, 22, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Front Arm (Ninja running lean)
    ctx.strokeStyle = '#1e5ad7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.lineTo(10 - armOffset * 0.5, 8);
    ctx.stroke();

    // Hands
    ctx.fillStyle = '#ffe0b2';
    ctx.beginPath();
    ctx.arc(10 - armOffset * 0.5, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Head / Mask (Classic blue hood)
    ctx.fillStyle = '#1e5ad7';
    ctx.beginPath();
    ctx.arc(2, -10, 13, 0, Math.PI * 2);
    ctx.fill();

    // Face opening (skin tone)
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.ellipse(5, -9, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ninja Hattori's Iconic Spiral Cheeks (Rosy red swirl cheeks)
    ctx.fillStyle = '#ff5252';
    ctx.beginPath();
    ctx.arc(4, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a80';
    ctx.beginPath();
    ctx.arc(4, -5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (determined ninja gaze)
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(7, -11, 2.2, 3.2, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -12, 1, 0, Math.PI * 2);
    ctx.fill();

    // White Headband (Hachimaki)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-10, -18, 22, 4.5);
    // Silver metal ninja crest
    ctx.fillStyle = '#cfd8dc';
    ctx.fillRect(1, -18.5, 6, 5.5);
    ctx.fillStyle = '#37474f';
    ctx.fillRect(3, -17, 2, 2.5);

    // Headband ribbons fluttering behind
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-9, -16);
    ctx.quadraticCurveTo(-18, -14 + scarfWave, -26, -17);
    ctx.lineTo(-24, -14);
    ctx.quadraticCurveTo(-17, -11 + scarfWave, -9, -13);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const textureKey = `hattori_run_${frame}`;
    if (scene.textures.exists(textureKey)) {
      scene.textures.remove(textureKey);
    }
    scene.textures.addCanvas(textureKey, canvas);
  }

  // Flip / Tuck Roll Texture (Acrobatic somersault)
  const flipCanvas = document.createElement('canvas');
  flipCanvas.width = width;
  flipCanvas.height = height;
  const fCtx = flipCanvas.getContext('2d');

  fCtx.save();
  fCtx.translate(32, 32);

  // Outer gravity chakra glow
  const glow = fCtx.createRadialGradient(0, 0, 8, 0, 0, 26);
  glow.addColorStop(0, 'rgba(0, 229, 255, 0.6)');
  glow.addColorStop(1, 'rgba(0, 229, 255, 0)');
  fCtx.fillStyle = glow;
  fCtx.beginPath();
  fCtx.arc(0, 0, 26, 0, Math.PI * 2);
  fCtx.fill();

  // Curled ninja body
  fCtx.fillStyle = '#1e5ad7';
  fCtx.beginPath();
  fCtx.arc(0, 0, 16, 0, Math.PI * 2);
  fCtx.fill();

  // Curled face
  fCtx.fillStyle = '#ffcc80';
  fCtx.beginPath();
  fCtx.arc(4, -4, 9, 0, Math.PI * 2);
  fCtx.fill();

  // Cheeks
  fCtx.fillStyle = '#ff5252';
  fCtx.beginPath();
  fCtx.arc(4, -1, 3, 0, Math.PI * 2);
  fCtx.fill();

  // White Headband
  fCtx.fillStyle = '#ffffff';
  fCtx.fillRect(-7, -11, 15, 3.5);

  // Red scarf wrapping around roll
  fCtx.strokeStyle = '#ff1744';
  fCtx.lineWidth = 4;
  fCtx.beginPath();
  fCtx.arc(0, 0, 19, -0.6, 2.5);
  fCtx.stroke();

  fCtx.restore();

  if (scene.textures.exists('hattori_flip')) {
    scene.textures.remove('hattori_flip');
  }
  scene.textures.addCanvas('hattori_flip', flipCanvas);
}

// 2. Spinning Metallic Shuriken
function generateShurikenTexture(scene) {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(size / 2, size / 2);

  // 4-pointed ninja star blades
  const points = 4;
  const outerR = 21;
  const innerR = 7;

  // Blade shadow
  ctx.fillStyle = '#263238';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = (i % 2 === 0) ? outerR : innerR;
    const a = (i * Math.PI) / points;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  // Silver beveled blade facets
  for (let i = 0; i < points; i++) {
    const a = (i * Math.PI * 2) / points;
    const nextA = a + Math.PI / points;

    // Highlighted facet
    ctx.fillStyle = (i % 2 === 0) ? '#eceff1' : '#b0bec5';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * outerR, Math.sin(a) * outerR);
    ctx.lineTo(Math.cos(nextA) * innerR, Math.sin(nextA) * innerR);
    ctx.closePath();
    ctx.fill();

    // Darker facet
    ctx.fillStyle = (i % 2 === 0) ? '#90a4ae' : '#78909c';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(nextA) * innerR, Math.sin(nextA) * innerR);
    ctx.lineTo(Math.cos(a + (Math.PI * 2) / points) * outerR, Math.sin(a + (Math.PI * 2) / points) * outerR);
    ctx.closePath();
    ctx.fill();
  }

  // Center golden ring
  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  // Center hole
  ctx.fillStyle = '#0b0e14';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (scene.textures.exists('shuriken')) {
    scene.textures.remove('shuriken');
  }
  scene.textures.addCanvas('shuriken', canvas);
}

// 3. Ancient Ninja Scroll (Makimono)
function generateScrollTexture(scene) {
  const w = 48;
  const h = 48;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.translate(w / 2, h / 2);

  // Golden glow behind scroll
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
  glow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
  glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  // Wooden scroll roller spindles
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(-18, -14, 6, 28);
  ctx.fillRect(12, -14, 6, 28);
  // Gold roller caps
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(-19, -16, 8, 4);
  ctx.fillRect(-19, 12, 8, 4);
  ctx.fillRect(11, -16, 8, 4);
  ctx.fillRect(11, 12, 8, 4);

  // Parchment paper body
  const grad = ctx.createLinearGradient(0, -12, 0, 12);
  grad.addColorStop(0, '#fff9c4');
  grad.addColorStop(0.5, '#fffde7');
  grad.addColorStop(1, '#ffe082');
  ctx.fillStyle = grad;
  ctx.fillRect(-13, -12, 26, 24);

  // Red tying ribbon
  ctx.fillStyle = '#d32f2f';
  ctx.fillRect(-13, -2, 26, 4);

  // Kanji '忍' (Ninja / Endurance) symbol
  ctx.fillStyle = '#212121';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('忍', 0, 0);

  ctx.restore();

  if (scene.textures.exists('scroll')) {
    scene.textures.remove('scroll');
  }
  scene.textures.addCanvas('scroll', canvas);
}

// 4. Floor & Ceiling Japanese Pagoda Roof Platform
function generatePlatformTextures(scene) {
  const w = 128;
  const h = 64;

  // Floor platform
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = w;
  floorCanvas.height = h;
  const fCtx = floorCanvas.getContext('2d');

  // Solid wooden beam base
  fCtx.fillStyle = '#1c1511';
  fCtx.fillRect(0, 20, w, 44);

  // Dark timber pattern
  fCtx.fillStyle = '#2d221c';
  for (let x = 0; x < w; x += 32) {
    fCtx.fillRect(x, 22, 30, 42);
    // Gold rivets
    fCtx.fillStyle = '#ffb300';
    fCtx.beginPath();
    fCtx.arc(x + 15, 30, 2, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.fillStyle = '#2d221c';
  }

  // Japanese Kawara roof tiles along the top running edge
  fCtx.fillStyle = '#37474f';
  for (let x = 0; x < w; x += 16) {
    fCtx.beginPath();
    fCtx.arc(x + 8, 18, 9, Math.PI, 0);
    fCtx.fill();
  }
  // Top ridge trim
  fCtx.fillStyle = '#78909c';
  fCtx.fillRect(0, 10, w, 3);
  fCtx.fillStyle = '#263238';
  fCtx.fillRect(0, 13, w, 3);

  // Neon glowing guideline for anti-gravity boundary
  fCtx.fillStyle = '#00e5ff';
  fCtx.fillRect(0, 8, w, 2);

  if (scene.textures.exists('platform_floor')) {
    scene.textures.remove('platform_floor');
  }
  scene.textures.addCanvas('platform_floor', floorCanvas);

  // Ceiling platform (inverted orientation)
  const ceilCanvas = document.createElement('canvas');
  ceilCanvas.width = w;
  ceilCanvas.height = h;
  const cCtx = ceilCanvas.getContext('2d');

  cCtx.save();
  cCtx.translate(0, h);
  cCtx.scale(1, -1);
  cCtx.drawImage(floorCanvas, 0, 0);
  cCtx.restore();

  if (scene.textures.exists('platform_ceiling')) {
    scene.textures.remove('platform_ceiling');
  }
  scene.textures.addCanvas('platform_ceiling', ceilCanvas);
}

// 5. Parallax Background Textures
function generateBackgroundTextures(scene) {
  // Layer 1: Sky with Moon & Mt. Fuji
  const skyW = 960;
  const skyH = 540;
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = skyW;
  skyCanvas.height = skyH;
  const sCtx = skyCanvas.getContext('2d');

  // Midnight gradient
  const sGrad = sCtx.createLinearGradient(0, 0, 0, skyH);
  sGrad.addColorStop(0, '#090d16');
  sGrad.addColorStop(0.5, '#121c2e');
  sGrad.addColorStop(1, '#1b2a47');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, skyW, skyH);

  // Stars
  sCtx.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    const sx = (i * 97) % skyW;
    const sy = (i * 53) % (skyH * 0.7);
    const r = (i % 3 === 0) ? 1.5 : 0.8;
    sCtx.globalAlpha = 0.4 + (i % 5) * 0.12;
    sCtx.beginPath();
    sCtx.arc(sx, sy, r, 0, Math.PI * 2);
    sCtx.fill();
  }
  sCtx.globalAlpha = 1.0;

  // Luminous Full Moon
  const moonX = 760;
  const moonY = 120;
  const moonGlow = sCtx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 90);
  moonGlow.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
  moonGlow.addColorStop(0.4, 'rgba(255, 240, 180, 0.4)');
  moonGlow.addColorStop(1, 'rgba(255, 240, 180, 0)');
  sCtx.fillStyle = moonGlow;
  sCtx.beginPath();
  sCtx.arc(moonX, moonY, 90, 0, Math.PI * 2);
  sCtx.fill();

  sCtx.fillStyle = '#fffde7';
  sCtx.beginPath();
  sCtx.arc(moonX, moonY, 36, 0, Math.PI * 2);
  sCtx.fill();

  // Mount Fuji Silhouette
  sCtx.fillStyle = '#162035';
  sCtx.beginPath();
  sCtx.moveTo(250, skyH - 50);
  sCtx.lineTo(440, 240);
  sCtx.lineTo(480, 240);
  sCtx.lineTo(670, skyH - 50);
  sCtx.closePath();
  sCtx.fill();

  // Fuji Snowcap
  sCtx.fillStyle = 'rgba(238, 242, 255, 0.85)';
  sCtx.beginPath();
  sCtx.moveTo(410, 280);
  sCtx.lineTo(440, 240);
  sCtx.lineTo(480, 240);
  sCtx.lineTo(510, 280);
  sCtx.lineTo(485, 290);
  sCtx.lineTo(460, 275);
  sCtx.lineTo(435, 290);
  sCtx.closePath();
  sCtx.fill();

  if (scene.textures.exists('bg_sky')) {
    scene.textures.remove('bg_sky');
  }
  scene.textures.addCanvas('bg_sky', skyCanvas);

  // Layer 2: Feudal Pagodas & Torii Gates (Midground)
  const midW = 960;
  const midH = 540;
  const midCanvas = document.createElement('canvas');
  midCanvas.width = midW;
  midCanvas.height = midH;
  const mCtx = midCanvas.getContext('2d');

  mCtx.fillStyle = '#121a29';

  // Draw Pagoda 1
  drawPagoda(mCtx, 150, 420, 0.85);
  // Draw Torii Gate
  drawTorii(mCtx, 460, 430, 0.9);
  // Draw Pagoda 2
  drawPagoda(mCtx, 750, 410, 1.0);

  // Pine tree silhouettes
  drawPineTree(mCtx, 80, 430, 0.8);
  drawPineTree(mCtx, 340, 435, 1.1);
  drawPineTree(mCtx, 630, 430, 0.9);
  drawPineTree(mCtx, 900, 435, 1.0);

  if (scene.textures.exists('bg_village')) {
    scene.textures.remove('bg_village');
  }
  scene.textures.addCanvas('bg_village', midCanvas);
}

function drawPagoda(ctx, x, groundY, scale) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  // Base
  ctx.fillRect(-22, -20, 44, 20);

  // Tier 1
  drawTier(ctx, 0, -20, 60, 14);
  // Tier 2
  drawTier(ctx, 0, -45, 52, 13);
  // Tier 3
  drawTier(ctx, 0, -70, 44, 12);
  // Tier 4
  drawTier(ctx, 0, -94, 36, 11);
  // Spire (Sorin)
  ctx.fillRect(-2, -120, 4, 26);
  ctx.beginPath();
  ctx.arc(0, -122, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTier(ctx, x, y, width, height) {
  // Tower pillar
  ctx.fillRect(x - width * 0.3, y - height, width * 0.6, height);
  // Curved pagoda eave
  ctx.beginPath();
  ctx.moveTo(x - width * 0.55, y);
  ctx.quadraticCurveTo(x, y - height * 0.5, x + width * 0.55, y);
  ctx.lineTo(x + width * 0.45, y - height * 0.7);
  ctx.quadraticCurveTo(x, y - height * 0.8, x - width * 0.45, y - height * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawTorii(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Pillars
  ctx.fillRect(-30, -65, 8, 65);
  ctx.fillRect(22, -65, 8, 65);
  // Cross beam 1 (Nuki)
  ctx.fillRect(-38, -50, 76, 7);
  // Top curved beam (Kasagi)
  ctx.beginPath();
  ctx.moveTo(-45, -72);
  ctx.quadraticCurveTo(0, -66, 45, -72);
  ctx.lineTo(48, -78);
  ctx.quadraticCurveTo(0, -74, -48, -78);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawPineTree(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Trunk
  ctx.fillRect(-3, -35, 6, 35);
  // Foliage tufts
  ctx.beginPath();
  ctx.arc(-10, -32, 12, 0, Math.PI * 2);
  ctx.arc(10, -38, 14, 0, Math.PI * 2);
  ctx.arc(-4, -48, 13, 0, Math.PI * 2);
  ctx.arc(6, -55, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 6. Particle Textures
function generateParticleTextures(scene) {
  // Anti-gravity blue energy particle
  const p1 = document.createElement('canvas');
  p1.width = 16;
  p1.height = 16;
  const p1Ctx = p1.getContext('2d');
  const g1 = p1Ctx.createRadialGradient(8, 8, 2, 8, 8, 8);
  g1.addColorStop(0, '#00e5ff');
  g1.addColorStop(0.5, '#2979ff');
  g1.addColorStop(1, 'rgba(41, 121, 255, 0)');
  p1Ctx.fillStyle = g1;
  p1Ctx.beginPath();
  p1Ctx.arc(8, 8, 8, 0, Math.PI * 2);
  p1Ctx.fill();
  scene.textures.addCanvas('particle_gravity', p1);

  // Sakura petal (cherry blossom)
  const p2 = document.createElement('canvas');
  p2.width = 16;
  p2.height = 16;
  const p2Ctx = p2.getContext('2d');
  p2Ctx.fillStyle = '#ff80ab';
  p2Ctx.beginPath();
  p2Ctx.ellipse(8, 8, 6, 3.5, 0.4, 0, Math.PI * 2);
  p2Ctx.fill();
  scene.textures.addCanvas('particle_sakura', p2);

  // Smoke dust puff
  const p3 = document.createElement('canvas');
  p3.width = 16;
  p3.height = 16;
  const p3Ctx = p3.getContext('2d');
  p3Ctx.fillStyle = 'rgba(200, 215, 230, 0.6)';
  p3Ctx.beginPath();
  p3Ctx.arc(8, 8, 7, 0, Math.PI * 2);
  p3Ctx.fill();
  scene.textures.addCanvas('particle_smoke', p3);

  // Gold sparkle
  const p4 = document.createElement('canvas');
  p4.width = 16;
  p4.height = 16;
  const p4Ctx = p4.getContext('2d');
  p4Ctx.fillStyle = '#ffd700';
  p4Ctx.fillRect(7, 2, 2, 12);
  p4Ctx.fillRect(2, 7, 12, 2);
  p4Ctx.fillStyle = '#ffffff';
  p4Ctx.fillRect(6, 6, 4, 4);
  scene.textures.addCanvas('particle_sparkle', p4);
}
