/**
 * Wave Manager: 5 Waves of UAVs + Flamingo Ballistic Missile Mini-Boss
 */
class WaveManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.currentWave = 1;
    this.maxWaves = 5;
    this.waveState = 'intro'; // 'intro', 'spawning', 'active', 'wave_cleared', 'boss_alert', 'boss_active', 'victory'
    this.stateTimer = 2.5;

    this.enemiesToSpawn = [];
    this.spawnTimer = 0;
    this.spawnInterval = 1.8;

    this.boss = null;
    this.dronesKilled = 0;
    this.totalDronesInWave = 0;
    this.dronesSpawnedInWave = 0;
  }

  start() {
    this.setupWave(1);
  }

  setupWave(waveNum) {
    this.currentWave = waveNum;
    this.waveState = 'intro';
    this.stateTimer = 2.5;
    this.enemiesToSpawn = [];
    this.spawnTimer = 0.5;

    // Define drone composition per wave
    let count = 5 + (waveNum - 1) * 3; // 5, 8, 11, 14, 17
    if (waveNum === 5) count = 20;

    this.totalDronesInWave = count;
    this.dronesSpawnedInWave = 0;

    for (let i = 0; i < count; i++) {
      let type = 'delta';
      const r = Math.random();

      if (waveNum === 1) {
        type = r < 0.6 ? 'delta' : 'hex';
      } else if (waveNum === 2) {
        type = r < 0.4 ? 'delta' : (r < 0.75 ? 'hex' : 'swarm');
      } else if (waveNum === 3) {
        type = r < 0.3 ? 'delta' : (r < 0.6 ? 'hex' : (r < 0.85 ? 'heavy' : 'swarm'));
      } else if (waveNum === 4) {
        type = r < 0.3 ? 'heavy' : (r < 0.6 ? 'delta' : (r < 0.85 ? 'swarm' : 'hex'));
      } else {
        type = r < 0.35 ? 'heavy' : (r < 0.7 ? 'delta' : 'swarm');
      }

      this.enemiesToSpawn.push(type);
    }
  }

  update(dt, activeEnemies, onWaveClear, onBossSpawn) {
    this.stateTimer -= dt;

    if (this.waveState === 'intro') {
      if (this.stateTimer <= 0) {
        this.waveState = 'spawning';
        this.spawnInterval = Math.max(0.9, 2.2 - this.currentWave * 0.25);
      }
    } else if (this.waveState === 'spawning') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.enemiesToSpawn.length > 0) {
        const type = this.enemiesToSpawn.shift();
        this.spawnDrone(type, activeEnemies);
        this.dronesSpawnedInWave++;
        this.spawnTimer = this.spawnInterval;
      }

      if (this.enemiesToSpawn.length === 0) {
        this.waveState = 'active';
      }
    } else if (this.waveState === 'active') {
      // Check if all drones in this wave are cleared
      const remainingAlive = activeEnemies.filter(e => e.isAlive).length;
      if (remainingAlive === 0 && this.enemiesToSpawn.length === 0) {
        this.waveState = 'wave_cleared';
        this.stateTimer = 2.5;
        onWaveClear(this.currentWave);
      }
    } else if (this.waveState === 'wave_cleared') {
      if (this.stateTimer <= 0) {
        if (this.currentWave < this.maxWaves) {
          this.setupWave(this.currentWave + 1);
        } else {
          // All 5 waves cleared! Trigger Flamingo Mini-Boss!
          this.waveState = 'boss_alert';
          this.stateTimer = 3.0;
        }
      }
    } else if (this.waveState === 'boss_alert') {
      if (this.stateTimer <= 0) {
        this.waveState = 'boss_active';
        this.spawnFlamingoBoss(onBossSpawn);
      }
    }
  }

  spawnDrone(type, activeEnemies) {
    // Altitude range: 60 to 220 in sky
    const y = 60 + Math.random() * 160;
    const startFromLeft = Math.random() > 0.5;
    const x = startFromLeft ? -40 : this.canvasWidth + 40;
    const speed = (startFromLeft ? 1 : -1) * (50 + Math.random() * 50);

    const drone = new window.Drone(type, x, y, speed, { x: this.canvasWidth / 2, y: 450 });
    activeEnemies.push(drone);
  }

  spawnFlamingoBoss(onBossSpawn) {
    // Launch Flamingo from stratosphere
    const startX = 150 + Math.random() * (this.canvasWidth - 300);
    const startY = -60;
    const targetX = this.canvasWidth / 2 + (Math.random() - 0.5) * 150;
    const targetY = 460;

    this.boss = new window.FlamingoBoss(startX, startY, targetX, targetY);
    this.boss.start(); // starts military alarm siren!
    onBossSpawn(this.boss);
  }
}

window.WaveManager = WaveManager;
