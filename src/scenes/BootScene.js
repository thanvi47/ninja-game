import Phaser from 'phaser';
import { generateGameTextures } from '../utils/textureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
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
  }

  create() {
    // Generate procedural canvas textures for all game elements
    generateGameTextures(this);

    // Create player animations
    this.anims.create({
      key: 'hattori-run',
      frames: [
        { key: 'hattori_run_0' },
        { key: 'hattori_run_1' },
        { key: 'hattori_run_2' },
        { key: 'hattori_run_3' }
      ],
      frameRate: 11,
      repeat: -1
    });

    this.anims.create({
      key: 'hattori-flip',
      frames: [{ key: 'hattori_flip' }],
      frameRate: 1
    });

    // Launch MenuScene
    this.scene.start('MenuScene');
  }
}
