import Phaser from 'phaser';
import { CONFIG } from '../config';
import { audio } from '../services/audio';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Reset game state
    this.score = 0;
    this.scrolls = 0;
    this.distance = 0;
    this.currentSpeed = CONFIG.BASE_SPEED;
    this.isGameOver = false;
    this.isCeiling = false; // false = Floor, true = Ceiling

    // Phase 3: Gravity Vector - Set initial downward gravity value
    this.physics.world.gravity.y = CONFIG.GRAVITY_Y;

    // Configure physics world bounds between floor and ceiling platforms
    this.physics.world.setBounds(
      0,
      CONFIG.CEILING_HEIGHT,
      width,
      height - CONFIG.CEILING_HEIGHT - CONFIG.FLOOR_HEIGHT
    );

    // Background Layers (Parallax)
    this.bgSky = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_sky').setScrollFactor(0);
    this.bgVillage = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_village').setScrollFactor(0);

    // Sakura blossoms drifting
    this.createSakuraEmitter();

    // Floor and Ceiling Visual Platform Tiles
    this.ceilingTile = this.add.tileSprite(width / 2, CONFIG.CEILING_HEIGHT / 2, width, CONFIG.CEILING_HEIGHT, 'platform_ceiling')
      .setDepth(10);
    this.floorTile = this.add.tileSprite(width / 2, height - CONFIG.FLOOR_HEIGHT / 2, width, CONFIG.FLOOR_HEIGHT, 'platform_floor')
      .setDepth(10);

    // Ninja Hattori Player Sprite
    const startY = height - CONFIG.FLOOR_HEIGHT - 32;
    this.player = this.physics.add.sprite(CONFIG.PLAYER.X, startY, 'hattori_run_0')
      .setDepth(20)
      .play('hattori-run');

    this.player.body.setSize(CONFIG.PLAYER.WIDTH, CONFIG.PLAYER.HEIGHT);
    this.player.body.setOffset(10, 6);
    this.player.setCollideWorldBounds(true);
    this.player.body.onWorldBounds = true;

    // Listen to world bounds collisions for landing effects
    this.physics.world.on('worldbounds', (body, up, down) => {
      if (body.gameObject === this.player) {
        if ((up && this.isCeiling) || (down && !this.isCeiling)) {
          this.handleLandOnSurface();
        }
      }
    });

    // Groups for Obstacles (Shurikens) and Collectibles (Scrolls)
    this.shurikens = this.physics.add.group();
    this.scrollsGroup = this.physics.add.group();

    // Overlaps
    this.physics.add.overlap(this.player, this.shurikens, this.handleHitShuriken, null, this);
    this.physics.add.overlap(this.player, this.scrollsGroup, this.handleCollectScroll, null, this);

    // Particle Emitters
    this.createParticleEmitters();

    // Phase 3: The Flip Trigger - Pointer (Touch / Click) & Keyboard input
    this.setupFlipInput();

    // Spawning Timers
    this.nextObstacleTime = 1100;
    this.nextScrollTime = 1500;

    // HUD UI
    this.createHUD();

    // Floating Intro Instruction Guide
    this.showTutorialHint();
  }

  // Phase 3 Core: Input listener that triggers gravity inversion and sprite flip
  setupFlipInput() {
    // 1. Touch or Click anywhere on the game screen
    this.input.on('pointerdown', (pointer) => {
      // Don't flip if clicking HUD sound button
      if (pointer.x > this.scale.width - 70 && pointer.y < 70) return;
      this.flipGravity();
    });

    // 2. Keyboard Spacebar, ArrowUp, ArrowDown, W, S
    const flipKeys = ['SPACE', 'UP', 'DOWN', 'W', 'S'];
    flipKeys.forEach(key => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        this.flipGravity();
      });
    });
  }

  // Phase 3: Invert gravity value and flip Hattori sprite upside down
  flipGravity() {
    if (this.isGameOver) return;

    // Invert the gravity state
    this.isCeiling = !this.isCeiling;

    // Phase 3 requirement: Invert the physics gravity value (multiplying by -1)
    this.physics.world.gravity.y = this.isCeiling ? -CONFIG.GRAVITY_Y : CONFIG.GRAVITY_Y;

    // Phase 3 requirement: Flip the Hattori sprite upside down
    this.player.setFlipY(this.isCeiling);

    // Responsive physics snap: give vertical impulse in direction of gravity
    const impulse = this.isCeiling ? -CONFIG.PLAYER.FLIP_IMPULSE : CONFIG.PLAYER.FLIP_IMPULSE;
    this.player.setVelocityY(impulse);

    // Mid-air flip tucked roll pose
    this.player.setTexture('hattori_flip');

    // Play anti-gravity sound effect
    audio.playFlip();

    // Spawn cyan anti-gravity chakra energy burst at Hattori's position
    this.gravityEmitter.explode(14, this.player.x, this.player.y);

    // Small camera nudge for physical impact
    this.cameras.main.shake(100, 0.004);

    // Update Gravity Indicator in HUD
    this.updateGravityHUD();
  }

  handleLandOnSurface() {
    if (this.isGameOver) return;

    // Resume running animation flush against surface
    if (this.player.anims.currentAnim?.key !== 'hattori-run') {
      this.player.play('hattori-run');
    }
    this.player.setFlipY(this.isCeiling);

    // Landing dust puff
    const contactY = this.isCeiling ? CONFIG.CEILING_HEIGHT + 4 : this.scale.height - CONFIG.FLOOR_HEIGHT - 4;
    this.smokeEmitter.explode(6, this.player.x, contactY);
  }

  handleHitShuriken(player, shuriken) {
    if (this.isGameOver) return;

    this.isGameOver = true;
    audio.playHit();
    audio.playGameOver();

    // Disable physics
    this.physics.pause();

    // Camera impact effects
    this.cameras.main.flash(250, 255, 30, 30);
    this.cameras.main.shake(450, 0.035);

    // Smoke and spark explosion at Hattori
    this.smokeEmitter.explode(25, player.x, player.y);
    this.gravityEmitter.explode(20, player.x, player.y);

    // Knockback death rotation
    this.tweens.add({
      targets: player,
      angle: this.isCeiling ? -180 : 180,
      scaleX: 0.6,
      scaleY: 0.6,
      alpha: 0.2,
      duration: 700,
      ease: 'Power2'
    });

    // Stop BGM and transition to GameOverScene after dramatic pause
    audio.stopBGM();
    this.time.delayedCall(950, () => {
      this.scene.start('GameOverScene', {
        score: Math.floor(this.score),
        scrolls: this.scrolls,
        distance: Math.floor(this.distance)
      });
    });
  }

  handleCollectScroll(player, scroll) {
    if (this.isGameOver) return;

    // Collect sound
    audio.playScrollCollect();

    // Score bonus
    this.scrolls++;
    const scrollBonus = CONFIG.SCROLLS.VALUE;
    this.score += scrollBonus;

    // Golden sparkle particles
    this.sparkleEmitter.explode(16, scroll.x, scroll.y);

    // Floating floating score popup text
    const popup = this.add.text(scroll.x, scroll.y, `+${scrollBonus} 📜`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: popup,
      y: scroll.y - 45,
      alpha: 0,
      scale: 1.3,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });

    // Remove scroll
    scroll.destroy();

    // Flash scrolls HUD icon
    this.tweens.add({
      targets: this.scrollIcon,
      scale: 1.5,
      duration: 150,
      yoyo: true
    });
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    const { width, height } = this.scale;
    const x = width + 40;

    // Choose spawn pattern:
    // 0 = Floor level shuriken (forces player to flip to ceiling)
    // 1 = Ceiling level shuriken (forces player to flip to floor)
    // 2 = Mid-air shuriken (forces precision timing)
    const pattern = Phaser.Math.Between(0, 2);

    let y;
    if (pattern === 0) {
      // Floor height
      y = height - CONFIG.FLOOR_HEIGHT - 28;
    } else if (pattern === 1) {
      // Ceiling height
      y = CONFIG.CEILING_HEIGHT + 28;
    } else {
      // Mid air
      y = height / 2 + Phaser.Math.Between(-35, 35);
    }

    const shuriken = this.shurikens.create(x, y, 'shuriken');
    shuriken.setDepth(15);
    shuriken.body.setCircle(14, 10, 10);
    shuriken.body.setAllowGravity(false);
    shuriken.body.setVelocityX(-this.currentSpeed * 1.05);

    shuriken.spinSpeed = 16;
  }

  spawnScroll() {
    if (this.isGameOver) return;

    const { width, height } = this.scale;
    const x = width + 40;

    // Spawn either near floor, near ceiling, or in mid-air
    const locations = [
      height - CONFIG.FLOOR_HEIGHT - 32,
      CONFIG.CEILING_HEIGHT + 32,
      height / 2
    ];
    const y = Phaser.Utils.Array.GetRandom(locations);

    const scroll = this.scrollsGroup.create(x, y, 'scroll');
    scroll.setDepth(15);
    scroll.body.setSize(32, 28);
    scroll.body.setOffset(8, 10);
    scroll.body.setAllowGravity(false);
    scroll.body.setVelocityX(-this.currentSpeed);

    // Gentle floating bob
    scroll.baseY = y;
    scroll.floatOffset = Math.random() * Math.PI * 2;
  }

  createParticleEmitters() {
    // Cyan Anti-Gravity Energy Emitter
    this.gravityEmitter = this.add.particles(0, 0, 'particle_gravity', {
      speed: { min: 60, max: 180 },
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(18);

    // Smoke landing emitter
    this.smokeEmitter = this.add.particles(0, 0, 'particle_smoke', {
      speed: { min: 20, max: 70 },
      scale: { start: 0.9, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 400,
      emitting: false
    }).setDepth(18);

    // Golden Sparkle Emitter
    this.sparkleEmitter = this.add.particles(0, 0, 'particle_sparkle', {
      speed: { min: 50, max: 160 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 450,
      blendMode: 'ADD',
      emitting: false
    }).setDepth(25);
  }

  createSakuraEmitter() {
    this.sakuraEmitter = this.add.particles(this.scale.width, 0, 'particle_sakura', {
      x: { min: 0, max: this.scale.width + 120 },
      y: -20,
      lifespan: 6000,
      speedX: { min: -140, max: -50 },
      speedY: { min: 50, max: 130 },
      scale: { min: 0.5, max: 1.0 },
      alpha: { start: 0.8, end: 0.15 },
      rotate: { start: 0, end: 360 },
      frequency: 220
    }).setDepth(8);
  }

  createHUD() {
    const { width } = this.scale;

    // Top HUD Bar Container
    this.hudContainer = this.add.container(0, 0).setDepth(50);

    // Score text
    this.scoreText = this.add.text(28, 18, 'SCORE: 0', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '22px',
      fontWeight: '900',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    });

    // Distance text
    this.distText = this.add.text(220, 20, '0m', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: '600',
      color: '#00e5ff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Scrolls text & Icon
    this.scrollIcon = this.add.text(320, 20, '📜', { fontSize: '18px' });
    this.scrollText = this.add.text(348, 20, '0', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#ffd54f',
      stroke: '#000000',
      strokeThickness: 3
    });

    // Gravity State Badge (Indicates floor / ceiling)
    this.gravityBadgeBg = this.add.rectangle(width / 2, 28, 180, 28, 0x000000, 0.75)
      .setStrokeStyle(1.5, 0x00e5ff);
    this.gravityBadgeText = this.add.text(width / 2, 28, '▼ GRAVITY: FLOOR', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '13px',
      fontWeight: '800',
      color: '#00e5ff'
    }).setOrigin(0.5);

    // Sound toggle button (top right)
    this.soundBtnBg = this.add.circle(width - 36, 28, 16, 0x1b263b, 0.8)
      .setStrokeStyle(1.5, 0x00e5ff)
      .setInteractive({ useHandCursor: true });
    this.soundIcon = this.add.text(width - 36, 28, audio.isMuted ? '🔇' : '🔊', { fontSize: '14px' })
      .setOrigin(0.5);

    this.soundBtnBg.on('pointerdown', () => {
      const muted = audio.toggleMute();
      this.soundIcon.setText(muted ? '🔇' : '🔊');
    });

    this.hudContainer.add([
      this.scoreText,
      this.distText,
      this.scrollIcon,
      this.scrollText,
      this.gravityBadgeBg,
      this.gravityBadgeText,
      this.soundBtnBg,
      this.soundIcon
    ]);
  }

  updateGravityHUD() {
    if (this.isCeiling) {
      this.gravityBadgeText.setText('▲ GRAVITY: CEILING');
      this.gravityBadgeText.setColor('#ff4081');
      this.gravityBadgeBg.setStrokeStyle(1.5, 0xff4081);
    } else {
      this.gravityBadgeText.setText('▼ GRAVITY: FLOOR');
      this.gravityBadgeText.setColor('#00e5ff');
      this.gravityBadgeBg.setStrokeStyle(1.5, 0x00e5ff);
    }

    // Pulse animation on the badge
    this.tweens.add({
      targets: [this.gravityBadgeBg, this.gravityBadgeText],
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 120,
      yoyo: true
    });
  }

  showTutorialHint() {
    const hint = this.add.container(this.scale.width / 2, this.scale.height / 2).setDepth(45);
    const bg = this.add.rectangle(0, 0, 360, 48, 0x000000, 0.8)
      .setStrokeStyle(2, 0x00e5ff);
    const text = this.add.text(0, 0, '⚡ TAP ANYWHERE TO FLIP GRAVITY ⚡', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '16px',
      fontWeight: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    hint.add([bg, text]);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 2400,
      duration: 600,
      onComplete: () => hint.destroy()
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;

    const dt = delta / 1000;

    // 1. Accelerate game speed smoothly over time
    if (this.currentSpeed < CONFIG.MAX_SPEED) {
      this.currentSpeed += CONFIG.SPEED_ACCEL * dt;
    }

    // 2. Parallax scrolling backgrounds
    this.bgSky.tilePositionX += this.currentSpeed * 0.06 * dt;
    this.bgVillage.tilePositionX += this.currentSpeed * 0.28 * dt;
    this.floorTile.tilePositionX += this.currentSpeed * dt;
    this.ceilingTile.tilePositionX += this.currentSpeed * dt;

    // 3. Distance & Base Running Score
    this.distance += (this.currentSpeed * dt) * 0.05;
    this.score += (this.currentSpeed * dt) * 0.15;

    // Update HUD
    this.scoreText.setText(`SCORE: ${Math.floor(this.score)}`);
    this.distText.setText(`${Math.floor(this.distance)}m`);
    this.scrollText.setText(`${this.scrolls}`);

    // Check if player has touched floor or ceiling while in flip pose
    if (this.player.anims.currentAnim?.key !== 'hattori-run') {
      if ((this.isCeiling && this.player.body.blocked.up) || (!this.isCeiling && this.player.body.blocked.down)) {
        this.handleLandOnSurface();
      }
    }

    // 4. Spin and update Shurikens
    this.shurikens.getChildren().forEach(shuriken => {
      shuriken.angle += shuriken.spinSpeed || 15;
      if (shuriken.x < -60) {
        shuriken.destroy();
      }
    });

    // 5. Update Scrolls floating sine motion
    this.scrollsGroup.getChildren().forEach(scroll => {
      scroll.floatOffset += dt * 3.5;
      scroll.y = scroll.baseY + Math.sin(scroll.floatOffset) * 6;
      if (scroll.x < -60) {
        scroll.destroy();
      }
    });

    // 6. Spawn timers
    this.nextObstacleTime -= delta;
    if (this.nextObstacleTime <= 0) {
      this.spawnObstacle();
      const factor = 1 - (this.currentSpeed - CONFIG.BASE_SPEED) / (CONFIG.MAX_SPEED - CONFIG.BASE_SPEED) * 0.45;
      this.nextObstacleTime = Phaser.Math.Between(
        CONFIG.OBSTACLES.SPAWN_INTERVAL_MIN * factor,
        CONFIG.OBSTACLES.SPAWN_INTERVAL_MAX * factor
      );
    }

    this.nextScrollTime -= delta;
    if (this.nextScrollTime <= 0) {
      this.spawnScroll();
      this.nextScrollTime = Phaser.Math.Between(
        CONFIG.SCROLLS.SPAWN_INTERVAL_MIN,
        CONFIG.SCROLLS.SPAWN_INTERVAL_MAX
      );
    }
  }
}
