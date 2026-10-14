/**
 * Web Audio API Sound Synthesizer for Sberbank Data Center Defense
 * Synthesizes all sounds procedurally (no external assets needed).
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.7;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isSirenPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startEngineHum();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      if (this.sirenGain) this.sirenGain.gain.setValueAtTime(0, this.ctx.currentTime);
    } else {
      if (this.engineGain) this.engineGain.gain.setValueAtTime(0.04 * this.masterVolume, this.ctx.currentTime);
      if (this.isSirenPlaying && this.sirenGain) {
        this.sirenGain.gain.setValueAtTime(0.4 * this.masterVolume, this.ctx.currentTime);
      }
    }
    return this.isMuted;
  }

  // Heavy Machine Gun Shot (punchy crack + low end thud)
  playMachineGunShot() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Noise burst for gunshot transient
    const bufferSize = this.ctx.sampleRate * 0.08;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, t);
    noiseFilter.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);

    // Punchy low-frequency oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);

    oscGain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Gun empty click
  playEmptyClick() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.15 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Reload sound (tactical mechanical slide clack)
  playReload() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Stage 1: Magazine release
    this.createClack(t, 600, 0.08);
    // Stage 2: Heavy mag insert
    this.createClack(t + 0.9, 450, 0.12);
    // Stage 3: Bolt rack
    this.createClack(t + 1.6, 950, 0.1);
  }

  createClack(time, freq, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + dur);
    gain.gain.setValueAtTime(0.2 * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  // Vikhr-1 missile launch whoosh & propulsion ignition
  playMissileLaunch() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Rocket booster roar (noise + low sweep)
    const dur = 0.6;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(600, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.45 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);

    // High whoosh whistle
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(500, t + dur);
    oscGain.gain.setValueAtTime(0.2 * this.masterVolume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  // Missile guided target lock beep
  playLockBeep() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  // Missile restored +1 notification chime
  playMissileRestored() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.22);
    });
  }

  // Explosion sound (drone or missile impact)
  playExplosion(isBig = false) {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = isBig ? 1.2 : 0.6;

    // Heavy low noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (isBig ? 0.35 : 0.15)));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isBig ? 450 : 700, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime((isBig ? 0.8 : 0.45) * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);

    // Deep sub-bass drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(isBig ? 110 : 150, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + (isBig ? 0.5 : 0.3));
    subGain.gain.setValueAtTime((isBig ? 0.5 : 0.25) * this.masterVolume, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + (isBig ? 0.5 : 0.3));
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + (isBig ? 0.55 : 0.35));
  }

  // Hit marker tick
  playHitMarker() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, t);
    gain.gain.setValueAtTime(0.12 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Weapon switch sound
  playWeaponSwitch() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1000, t + 0.06);
    gain.gain.setValueAtTime(0.18 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // MILITARY SIREN / AIR RAID ALARM
  // Mandatory requirement: "Когда вылетает ракета - идет звук военной тревоги"
  startMilitarySiren() {
    if (this.isSirenPlaying) return;
    if (!this.ctx) this.init();
    this.isSirenPlaying = true;

    try {
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = 'sawtooth';
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);

      const t = this.ctx.currentTime;
      this.sirenOsc.frequency.setValueAtTime(440, t);

      // Oscillating siren pitch cycle (~3.2 seconds cycle: rises from 400 to 750, then drops)
      const cycleTime = 2.8;
      const scheduleCycle = (startTime) => {
        if (!this.isSirenPlaying || !this.sirenOsc) return;
        const now = startTime;
        this.sirenOsc.frequency.cancelScheduledValues(now);
        this.sirenOsc.frequency.setValueAtTime(420, now);
        this.sirenOsc.frequency.linearRampToValueAtTime(820, now + 1.4);
        this.sirenOsc.frequency.linearRampToValueAtTime(420, now + cycleTime);
      };

      scheduleCycle(t);
      this.sirenInterval = setInterval(() => {
        if (this.isSirenPlaying && this.ctx && this.sirenOsc) {
          scheduleCycle(this.ctx.currentTime);
        }
      }, cycleTime * 1000);

      this.sirenGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35 * this.masterVolume, t);

      this.sirenOsc.connect(filter);
      filter.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start(t);
    } catch (e) {
      console.warn("Siren start error:", e);
    }
  }

  stopMilitarySiren() {
    if (!this.isSirenPlaying) return;
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.sirenGain.gain.setValueAtTime(this.sirenGain.gain.value, t);
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        setTimeout(() => {
          if (this.sirenOsc) {
            try { this.sirenOsc.stop(); } catch (_) {}
            this.sirenOsc.disconnect();
            this.sirenOsc = null;
          }
        }, 550);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // Low engine hum for MOG vehicle
  startEngineHum() {
    if (this.engineOsc || !this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'triangle';
      this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04 * this.masterVolume, this.ctx.currentTime);
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch (e) {
      console.warn("Engine start error:", e);
    }
  }

  setEngineSpeed(isMoving) {
    if (!this.engineOsc || !this.ctx) return;
    const targetFreq = isMoving ? 85 : 55;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
  }

  // Victory fanfare
  playVictory() {
    if (this.isMuted || !this.ctx) return;
    const notes = [
      { f: 523.25, d: 0.2 }, // C5
      { f: 659.25, d: 0.2 }, // E5
      { f: 783.99, d: 0.25 }, // G5
      { f: 1046.50, d: 0.6 } // C6
    ];
    let start = this.ctx.currentTime + 0.1;
    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);
      gain.gain.setValueAtTime(0.3 * this.masterVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + n.d + 0.05);
      start += n.d;
    });
  }

  // Defeat tone
  playDefeat() {
    if (this.isMuted || !this.ctx) return;
    const notes = [
      { f: 440.0, d: 0.3 },
      { f: 415.3, d: 0.3 },
      { f: 392.0, d: 0.4 },
      { f: 349.2, d: 0.8 }
    ];
    let start = this.ctx.currentTime + 0.1;
    notes.forEach((n) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, start);
      gain.gain.setValueAtTime(0.25 * this.masterVolume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + n.d + 0.05);
      start += n.d;
    });
  }
}

window.soundEngine = new SoundEngine();
