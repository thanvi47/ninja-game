import Phaser from 'phaser';
import { audio } from '../services/audio';
import { leaderboardService } from '../services/firebase';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalScrolls = data.scrolls || 0;
    this.finalDistance = data.distance || 0;
  }

  create() {
    const { width, height } = this.scale;

    // Dark dramatic background
    this.add.tileSprite(width / 2, height / 2, width, height, 'bg_sky').setAlpha(0.6);
    this.add.rectangle(width / 2, height / 2, width, height, 0x070b12, 0.85);

    // Sakura blossoms falling
    this.createSakuraParticles();

    // Game Over Title
    this.add.text(width / 2, 70, 'GAME OVER', {
      fontFamily: "'Shojumaru', 'Outfit', sans-serif",
      fontSize: '44px',
      color: '#ff1744',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 0, offsetY: 4, color: '#d50000', blur: 12, fill: true }
    }).setOrigin(0.5);

    // Score Summary Card
    const cardY = 175;
    const card = this.add.rectangle(width / 2, cardY, 520, 110, 0x111927, 0.9)
      .setStrokeStyle(1.5, 0x00e5ff, 0.6);

    // Stats Grid
    this.add.text(width / 2 - 160, cardY - 24, 'FINAL SCORE', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '13px',
      color: '#90a4ae'
    }).setOrigin(0.5);
    this.add.text(width / 2 - 160, cardY + 12, `${this.finalScore.toLocaleString()}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '28px',
      fontWeight: '900',
      color: '#00e5ff'
    }).setOrigin(0.5);

    this.add.text(width / 2, cardY - 24, 'SCROLLS', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '13px',
      color: '#90a4ae'
    }).setOrigin(0.5);
    this.add.text(width / 2, cardY + 12, `📜 ${this.finalScrolls}`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffd54f'
    }).setOrigin(0.5);

    this.add.text(width / 2 + 160, cardY - 24, 'DISTANCE', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '13px',
      color: '#90a4ae'
    }).setOrigin(0.5);
    this.add.text(width / 2 + 160, cardY + 12, `${this.finalDistance}m`, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '28px',
      fontWeight: '900',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Name input & Leaderboard Submission
    this.createLeaderboardSection(width / 2, 290);

    // Buttons Container
    const playAgainBtn = this.createButton(width / 2 - 130, height - 55, '🔄 PLAY AGAIN', '#1e88e5', () => {
      audio.startBGM();
      this.scene.start('GameScene');
    });

    const menuBtn = this.createButton(width / 2 + 130, height - 55, '🏯 MAIN MENU', '#37474f', () => {
      this.scene.start('MenuScene');
    });

    // Spacebar to restart
    this.input.keyboard.on('keydown-SPACE', () => {
      audio.startBGM();
      this.scene.start('GameScene');
    });
  }

  createLeaderboardSection(x, y) {
    const savedName = localStorage.getItem('ninja_player_name') || 'Hattori';
    this.playerName = savedName;

    // Leaderboard Mini Table
    const lbContainer = this.add.container(x, y);

    const title = this.add.text(0, -30, '🏆 CLAN RANKINGS', {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '15px',
      fontWeight: '800',
      color: '#ffd700'
    }).setOrigin(0.5);

    lbContainer.add(title);

    // Auto-save player score to local and Firebase
    leaderboardService.saveScore(this.playerName, this.finalScore, this.finalScrolls, this.finalDistance)
      .then(() => this.renderTopScores(lbContainer));
  }

  async renderTopScores(container) {
    const scores = await leaderboardService.getTopScores(4);

    scores.forEach((entry, i) => {
      const rowY = 5 + i * 28;
      const isCurrentPlayer = (entry.score === this.finalScore && entry.scrolls === this.finalScrolls);
      const color = isCurrentPlayer ? '#00e5ff' : '#cfd8dc';

      const rank = this.add.text(-180, rowY, `#${i + 1}`, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '14px',
        fontWeight: 'bold',
        color: i === 0 ? '#ffd700' : color
      });

      const name = this.add.text(-130, rowY, entry.name, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '14px',
        fontWeight: isCurrentPlayer ? 'bold' : 'normal',
        color: color
      });

      const score = this.add.text(180, rowY, `${entry.score.toLocaleString()} pts`, {
        fontFamily: "'Outfit', sans-serif",
        fontSize: '14px',
        fontWeight: 'bold',
        color: isCurrentPlayer ? '#00e5ff' : '#ffb300'
      }).setOrigin(1, 0);

      container.add([rank, name, score]);
    });
  }

  createButton(x, y, text, bgColor, onClick) {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 210, 44, Phaser.Display.Color.HexStringToColor(bgColor).color, 0.9)
      .setStrokeStyle(1.5, 0xffffff, 0.8)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(0, 0, text, {
      fontFamily: "'Outfit', sans-serif",
      fontSize: '17px',
      fontWeight: '800',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, btnText]);

    bg.on('pointerover', () => {
      bg.setScale(1.05);
      btnText.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setScale(1.0);
      btnText.setScale(1.0);
    });

    bg.on('pointerdown', () => {
      audio.playFlip();
      onClick();
    });

    return container;
  }

  createSakuraParticles() {
    this.add.particles(this.scale.width, 0, 'particle_sakura', {
      x: { min: 0, max: this.scale.width + 100 },
      y: -20,
      lifespan: 5000,
      speedX: { min: -100, max: -30 },
      speedY: { min: 40, max: 90 },
      scale: { min: 0.4, max: 0.8 },
      alpha: { start: 0.6, end: 0.1 },
      frequency: 350
    });
  }
}
