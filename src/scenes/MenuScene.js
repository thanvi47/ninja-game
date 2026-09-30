import Phaser from 'phaser';
import { CONFIG } from '../config';
import { audio } from '../services/audio';
import { leaderboardService } from '../services/firebase';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Background Sky & Village
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg_sky');
    this.villageBg = this.add.tileSprite(width / 2, height / 2, width, height, 'bg_village');

    // Sakura petals drifting
    this.createSakuraParticles();

    // Floor and Ceiling border visuals
    this.add.tileSprite(width / 2, 24, width, 48, 'platform_ceiling');
    this.add.tileSprite(width / 2, height - 24, width, 48, 'platform_floor');

    // Title Japanese Kanji Banner
    const kanjiText = this.add.text(width / 2, 85, '忍者ハットリくん • 反重力', {
      fontFamily: "'Yuji Boku', serif",
      fontSize: '22px',
      color: '#ffb300',
      letterSpacing: 4
    }).setOrigin(0.5);

    // Main Game Title
    const title = this.add.text(width / 2, 135, 'NINJA HATTORI', {
      fontFamily: "'Shojumaru', 'Outfit', sans-serif",
      fontSize: '54px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#0d47a1',
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 6, color: '#000000', blur: 10, fill: true }
    }).setOrigin(0.5);

    // Subtitle Badge
    const subtitle = this.add.text(width / 2, 185, '⚡ ANTI-GRAVITY RUNNER ⚡', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '18px',
      fontWeight: '800',
      color: '#00e5ff',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: { left: 16, right: 16, top: 6, bottom: 6 }
    }).setOrigin(0.5);

    // Animated Preview Hattori in Center
    this.previewHattori = this.add.sprite(width / 2, height / 2 + 10, 'hattori_run_0')
      .setScale(1.8)
      .play('hattori-run');

    this.isCeilingPreview = false;
    this.add.text(width / 2, height / 2 + 65, '💡 Tip: Tap screen or press SPACE to flip between floor and ceiling!', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '14px',
      color: '#ffd54f'
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.createButton(width / 2, height - 130, '⚡ START RUN ⚡', '#1e88e5', () => {
      audio.init();
      audio.startBGM();
      this.scene.start('GameScene');
    });

    // Leaderboard Button
    const lbBtn = this.createButton(width / 2, height - 75, '🏆 LEADERBOARD', '#37474f', () => {
      this.showLeaderboardModal();
    }, 180, 36, '14px');

    // Sound toggle button (top right)
    this.createSoundButton(width - 50, 48);

    // Interactive Demo: Clicking canvas flips preview Hattori!
    this.input.on('pointerdown', (pointer) => {
      // Avoid triggering when clicking buttons
      if (pointer.y > height - 160) return;
      this.flipPreviewHattori();
    });

    // Spacebar to start
    this.input.keyboard.on('keydown-SPACE', () => {
      audio.init();
      audio.startBGM();
      this.scene.start('GameScene');
    });

    // Periodic preview flip
    this.time.addEvent({
      delay: 2400,
      callback: () => this.flipPreviewHattori(),
      loop: true
    });
  }

  flipPreviewHattori() {
    this.isCeilingPreview = !this.isCeilingPreview;
    audio.playFlip();

    const targetY = this.isCeilingPreview ? this.scale.height / 2 - 40 : this.scale.height / 2 + 10;
    this.previewHattori.setTexture('hattori_flip');

    this.tweens.add({
      targets: this.previewHattori,
      y: targetY,
      duration: 320,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.previewHattori.setFlipY(this.isCeilingPreview);
        this.previewHattori.play('hattori-run');
      }
    });

    // Burst energy particles
    const emitter = this.add.particles(this.previewHattori.x, this.previewHattori.y, 'particle_gravity', {
      speed: { min: 40, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 350,
      quantity: 8,
      blendMode: 'ADD'
    });
    this.time.delayedCall(400, () => emitter.destroy());
  }

  createButton(x, y, text, bgColor, onClick, width = 240, height = 48, fontSize = '20px') {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, width, height, Phaser.Display.Color.HexStringToColor(bgColor).color, 0.9)
      .setStrokeStyle(2, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(0, 0, text, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: fontSize,
      fontWeight: '800',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, btnText]);

    bg.on('pointerover', () => {
      bg.setScale(1.05);
      btnText.setScale(1.05);
      bg.setAlpha(1.0);
    });

    bg.on('pointerout', () => {
      bg.setScale(1.0);
      btnText.setScale(1.0);
      bg.setAlpha(0.9);
    });

    bg.on('pointerdown', () => {
      audio.playFlip();
      onClick();
    });

    // Pulsing animation for main start button
    if (bgColor === '#1e88e5') {
      this.tweens.add({
        targets: container,
        scaleX: 1.04,
        scaleY: 1.04,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    return container;
  }

  createSoundButton(x, y) {
    const btn = this.add.container(x, y);
    const bg = this.add.circle(0, 0, 18, 0x1b263b, 0.8)
      .setStrokeStyle(1.5, 0x00e5ff)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.text(0, 0, audio.isMuted ? '🔇' : '🔊', { fontSize: '16px' }).setOrigin(0.5);
    btn.add([bg, icon]);

    bg.on('pointerdown', () => {
      const muted = audio.toggleMute();
      icon.setText(muted ? '🔇' : '🔊');
    });
  }

  createSakuraParticles() {
    this.add.particles(this.scale.width, 0, 'particle_sakura', {
      x: { min: 0, max: this.scale.width + 100 },
      y: -20,
      lifespan: 5000,
      speedX: { min: -120, max: -40 },
      speedY: { min: 60, max: 140 },
      scale: { min: 0.5, max: 1.1 },
      alpha: { start: 0.8, end: 0.2 },
      rotate: { start: 0, end: 360 },
      frequency: 250
    });
  }

  async showLeaderboardModal() {
    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2).setDepth(100);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75)
      .setInteractive();

    const panel = this.add.rectangle(0, 0, 480, 380, 0x111927, 0.95)
      .setStrokeStyle(2, 0x00e5ff, 0.8);

    const title = this.add.text(0, -150, '🏆 CLAN LEADERBOARD', {
      fontFamily: "'Shojumaru', 'Outfit', sans-serif",
      fontSize: '22px',
      color: '#ffd700'
    }).setOrigin(0.5);

    const statusNote = this.add.text(0, -122, leaderboardService.isConfigured() ? '⚡ Connected to Firebase Firestore' : '💾 Local Clan Hall (Firebase ready)', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '12px',
      color: leaderboardService.isConfigured() ? '#00e676' : '#90a4ae'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(210, -165, '✕', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '22px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => modal.destroy());
    overlay.on('pointerdown', () => modal.destroy());

    modal.add([overlay, panel, title, statusNote, closeBtn]);

    // Loading indicator
    const loadingText = this.add.text(0, 0, 'Fetching ninja records...', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '16px',
      color: '#b0bec5'
    }).setOrigin(0.5);
    modal.add(loadingText);

    const scores = await leaderboardService.getTopScores(6);
    loadingText.destroy();

    scores.forEach((entry, i) => {
      const y = -85 + i * 36;
      const rankColor = i === 0 ? '#ffd700' : (i === 1 ? '#cfd8dc' : (i === 2 ? '#cd7f32' : '#ffffff'));

      const rank = this.add.text(-200, y, `#${i + 1}`, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '16px',
        fontWeight: 'bold',
        color: rankColor
      });

      const name = this.add.text(-150, y, entry.name || 'Ninja', {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '16px',
        color: '#ffffff'
      });

      const scrolls = this.add.text(50, y, `📜 ${entry.scrolls || 0}`, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '14px',
        color: '#ffb300'
      });

      const score = this.add.text(190, y, `${entry.score.toLocaleString()} pts`, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#00e5ff'
      }).setOrigin(1, 0);

      modal.add([rank, name, scrolls, score]);
    });
  }

  update(time, delta) {
    if (this.villageBg) {
      this.villageBg.tilePositionX += 0.5;
    }
  }
}
