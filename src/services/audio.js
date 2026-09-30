// Procedural Web Audio API sound effects & BGM
class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmTimer = null;
    this.bgmPlaying = false;
    this.bgmStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.bgmPlaying) {
      this.stopBGM();
      this.bgmPlaying = true; // remember preference
    } else if (!this.isMuted && this.bgmPlaying) {
      this.startBGM();
    }
    return this.isMuted;
  }

  // Anti-gravity flip sound: swift air slice + energy whoosh
  playFlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(250, t + 0.18);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);

    // Subtle white noise swoosh layer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, t + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Scroll collected: shimmering Japanese chime / pentatonic arpeggio
  playScrollCollect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [659.25, 880, 987.77, 1318.51]; // E5, A5, B5, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.2, t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.28);
    });
  }

  // Obstacle hit impact
  playHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Low sub hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    // Harsh metallic crash
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
  }

  // Traditional gong / taiko defeat sound
  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [110, 164.81, 220, 329.63];
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, t + 1.2);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.2);
    });
  }

  // Ninja Runner Chiptune Pentatonic BGM
  startBGM() {
    if (this.bgmTimer) return;
    this.bgmPlaying = true;
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // Japanese Hirajoshi/Yo pentatonic scale: D, Eb, G, A, Bb
    const melody = [
      293.66, 0, 329.63, 392.00, 440.00, 0, 392.00, 329.63,
      293.66, 329.63, 392.00, 0, 440.00, 523.25, 440.00, 392.00,
      329.63, 0, 392.00, 440.00, 587.33, 0, 523.25, 440.00,
      392.00, 329.63, 293.66, 0, 261.63, 293.66, 0, 0
    ];

    const bass = [
      146.83, 146.83, 146.83, 146.83,
      174.61, 174.61, 196.00, 196.00,
      146.83, 146.83, 146.83, 146.83,
      130.81, 130.81, 146.83, 146.83
    ];

    const tempo = 145; // BPM
    const stepDuration = 60 / tempo / 2; // eighth notes

    let step = 0;
    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Lead melody
      const freq = melody[step % melody.length];
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);

        gain.gain.setValueAtTime(0.045, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + stepDuration * 0.85);
      }

      // Bass note every 2 steps
      if (step % 2 === 0) {
        const bassFreq = bass[Math.floor(step / 2) % bass.length];
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'triangle';
        bOsc.frequency.setValueAtTime(bassFreq / 2, t);

        bGain.gain.setValueAtTime(0.09, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);

        bOsc.connect(bGain);
        bGain.connect(this.ctx.destination);

        bOsc.start(t);
        bOsc.stop(t + stepDuration * 1.5);
      }

      // Hi-hat / taiko tap on every step
      if (step % 2 === 1) {
        const hhBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
        const hhData = hhBuf.getChannelData(0);
        for (let i = 0; i < hhData.length; i++) {
          hhData[i] = (Math.random() * 2 - 1) * (1 - i / hhData.length);
        }
        const hhSrc = this.ctx.createBufferSource();
        hhSrc.buffer = hhBuf;
        const hhFilter = this.ctx.createBiquadFilter();
        hhFilter.type = 'highpass';
        hhFilter.frequency.setValueAtTime(7000, t);
        const hhGain = this.ctx.createGain();
        hhGain.gain.setValueAtTime(0.02, t);
        hhGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        hhSrc.connect(hhFilter);
        hhFilter.connect(hhGain);
        hhGain.connect(this.ctx.destination);
        hhSrc.start(t);
      }

      step++;
    }, stepDuration * 1000);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const audio = new AudioManager();
