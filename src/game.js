/**
 * Main Game Controller: 2.5D Rendering, Game Loop, Radar, and Modern HUD Synchronization
 */

class SberDefenseGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.width = 1000;
    this.height = 580;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state
    this.gameState = 'ready'; // 'ready', 'playing', 'paused', 'victory', 'gameover'
    this.datacenterHp = 100;
    this.maxDatacenterHp = 100;
    this.score = 0;
    this.dronesDestroyed = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;

    // Subsystems
    this.player = new window.PlayerVehicle(this.width, this.height);
    this.waveManager = new window.WaveManager(this.width, this.height);
    this.enemies = [];
    this.boss = null;

    // Timing
    this.lastTime = performance.now();
    this.screenShake = 0;

    // Radar canvas
    this.radarCanvas = document.getElementById('radarCanvas');
    this.radarCtx = this.radarCanvas ? this.radarCanvas.getContext('2d') : null;

    // Banner message
    this.bannerText = '';
    this.bannerTimer = 0;
    this.bannerColor = '#10b981';

    window.gameInstance = this;
    this.bindUI();
  }

  bindUI() {
    // Start button
    const startBtn = document.getElementById('btnStartGame');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }

    // Restart buttons
    const restartBtns = document.querySelectorAll('.btn-restart');
    restartBtns.forEach(btn => {
      btn.addEventListener('click', () => this.restartGame());
    });

    // Mute button
    const muteBtn = document.getElementById('btnMute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = window.soundEngine.toggleMute();
        muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('opacity-50', isMuted);
      });
    }

    // Pause toggle (Escape or P)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (this.gameState === 'playing') {
          this.pauseGame();
        } else if (this.gameState === 'paused') {
          this.resumeGame();
        }
      }
    });

    const resumeBtn = document.getElementById('btnResume');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => this.resumeGame());
    }
  }

  startGame() {
    window.soundEngine.init();
    document.getElementById('startModal').classList.add('hidden');
    this.gameState = 'playing';
    this.waveManager.start();
    this.showBanner('ОБОРОНА ЦОД СБЕРБАНКА НАЧАЛАСЬ! ВОЛНА 1', 3.0, '#10b981');
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  pauseGame() {
    this.gameState = 'paused';
    document.getElementById('pauseModal').classList.remove('hidden');
  }

  resumeGame() {
    this.gameState = 'playing';
    document.getElementById('pauseModal').classList.add('hidden');
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  restartGame() {
    window.soundEngine.stopMilitarySiren();
    document.getElementById('victoryModal').classList.add('hidden');
    document.getElementById('gameOverModal').classList.add('hidden');
    document.getElementById('pauseModal').classList.add('hidden');

    this.datacenterHp = 100;
    this.score = 0;
    this.dronesDestroyed = 0;
    this.enemies = [];
    this.boss = null;
    this.player = new window.PlayerVehicle(this.width, this.height);
    this.waveManager = new window.WaveManager(this.width, this.height);
    window.weaponSystem.mg.currentAmmo = 150;
    window.weaponSystem.missiles.currentCount = 5;
    window.weaponSystem.missiles.projectiles = [];

    this.startGame();
  }

  showBanner(text, duration = 3.0, color = '#10b981') {
    this.bannerText = text;
    this.bannerTimer = duration;
    this.bannerColor = color;
  }

  damageDatacenter(amount) {
    this.datacenterHp = Math.max(0, this.datacenterHp - amount);
    this.addScreenShake(8);
    if (this.datacenterHp <= 0) {
      this.gameOver();
    }
  }

  addScreenShake(intensity) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  onBossDefeated() {
    this.score += 2500;
    this.showBanner('БАЛЛИСТИЧЕСКАЯ РАКЕТА ФЛАМИНГО УНИЧТОЖЕНА!', 4.0, '#10b981');
    setTimeout(() => {
      this.victory();
    }, 2500);
  }

  onBossImpact() {
    if (this.datacenterHp > 0) {
      this.showBanner('КРИТИЧЕСКОЕ ПОПАДАНИЕ ПО ЦОД СБЕРБАНКА!', 3.0, '#ef4444');
    }
  }

  victory() {
    this.gameState = 'victory';
    window.soundEngine.stopMilitarySiren();
    window.soundEngine.playVictory();

    document.getElementById('victoryScore').innerText = this.score;
    document.getElementById('victoryDrones').innerText = this.dronesDestroyed;
    document.getElementById('victoryDcHp').innerText = `${Math.round(this.datacenterHp)}%`;
    document.getElementById('victoryModal').classList.remove('hidden');
  }

  gameOver() {
    this.gameState = 'gameover';
    window.soundEngine.stopMilitarySiren();
    window.soundEngine.playDefeat();

    document.getElementById('gameOverScore').innerText = this.score;
    document.getElementById('gameOverWaves').innerText = `${this.waveManager.currentWave} / 5`;
    document.getElementById('gameOverModal').classList.remove('hidden');
  }

  // Main Loop
  loop(currentTime) {
    if (this.gameState !== 'playing') return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    // 1. Update Screen Shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 20 * dt);
    }

    // 2. Update Banner Timer
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = '';
      }
    }

    // 3. Update Player
    this.player.update(dt, this.enemies, this.boss);

    // 4. Update Particle System
    window.particleSystem.update(dt);

    // 5. Update Wave Manager
    this.waveManager.update(
      dt,
      this.enemies,
      (clearedWave) => {
        this.score += clearedWave * 500;
        this.showBanner(`ВОЛНА ${clearedWave} ОТРАЖЕНА!`, 2.5, '#10b981');
      },
      (spawnedBoss) => {
        this.boss = spawnedBoss;
        this.showBanner('ТРЕВОГА! ВЫЛЕТЕЛА БАЛЛИСТИЧЕСКАЯ РАКЕТА ФЛАМИНГО!', 5.0, '#ef4444');
      }
    );

    // 6. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, { x: this.width / 2, y: 450 });
      if (!e.isAlive) {
        if (e.hp <= 0) {
          this.score += e.score;
          this.dronesDestroyed++;
        }
        this.enemies.splice(i, 1);
      }
    }

    // 7. Update Boss
    if (this.boss && this.boss.isAlive) {
      this.boss.update(dt);
    }

    // 8. Vikhr-1 Missiles Proximity & Splash Detonation Check
    const missiles = window.weaponSystem.missiles.projectiles;
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      let detonated = false;

      // Check proximity to enemies
      for (const e of this.enemies) {
        if (!e.isAlive) continue;
        const dist = Math.hypot(e.x - m.x, e.y - m.y);
        if (dist <= 30) {
          detonated = true;
          break;
        }
      }

      // Check proximity to boss
      if (!detonated && this.boss && this.boss.isAlive) {
        const dist = Math.hypot(this.boss.x - m.x, this.boss.y - m.y);
        if (dist <= 40) {
          detonated = true;
        }
      }

      if (detonated) {
        window.particleSystem.addExplosion(m.x, m.y, true);
        window.soundEngine.playExplosion(true);
        this.addScreenShake(6);

        // Apply area splash damage
        const radius = window.weaponSystem.missiles.blastRadius;
        const dmg = window.weaponSystem.missiles.damage;

        // Damage drones in radius
        for (const e of this.enemies) {
          if (!e.isAlive) continue;
          const dist = Math.hypot(e.x - m.x, e.y - m.y);
          if (dist <= radius) {
            const falloff = 1 - (dist / radius) * 0.4;
            e.takeDamage(dmg * falloff, 'missile');
          }
        }

        // Damage boss if in radius
        if (this.boss && this.boss.isAlive) {
          const dist = Math.hypot(this.boss.x - m.x, this.boss.y - m.y);
          if (dist <= radius + 20) {
            const falloff = 1 - (dist / (radius + 20)) * 0.3;
            this.boss.takeDamage(dmg * falloff, 'missile');
          }
        }

        missiles.splice(i, 1);
      }
    }

    // 9. Synchronize Modern UI elements
    this.updateUI();
  }

  updateUI() {
    // Sber DC HP Bar
    const hpBar = document.getElementById('dcHpBar');
    const hpText = document.getElementById('dcHpText');
    if (hpBar && hpText) {
      const pct = Math.max(0, Math.round(this.datacenterHp));
      hpBar.style.width = `${pct}%`;
      hpText.innerText = `${pct}%`;

      if (pct > 50) {
        hpBar.className = 'h-full bg-emerald-500 transition-all duration-300';
      } else if (pct > 25) {
        hpBar.className = 'h-full bg-amber-500 transition-all duration-300';
      } else {
        hpBar.className = 'h-full bg-red-500 transition-all duration-300 animate-pulse';
      }
    }

    // Machine gun ammo
    const mgAmmo = document.getElementById('mgAmmoCount');
    const mgBar = document.getElementById('mgAmmoBar');
    const mgReload = document.getElementById('mgReloadStatus');
    if (mgAmmo && mgBar) {
      const cur = window.weaponSystem.mg.currentAmmo;
      const max = window.weaponSystem.mg.maxClip;
      mgAmmo.innerText = cur;
      mgBar.style.width = `${(cur / max) * 100}%`;

      if (window.weaponSystem.mg.isReloading) {
        const rPct = Math.round((window.weaponSystem.mg.reloadProgress / window.weaponSystem.mg.reloadTime) * 100);
        mgReload.innerText = `ПЕРЕЗАРЯДКА... ${rPct}%`;
        mgReload.classList.remove('hidden');
      } else {
        mgReload.classList.add('hidden');
      }
    }

    // Vikhr-1 missiles
    const missileCount = document.getElementById('missileCount');
    const missileTimer = document.getElementById('missileRegenTimer');
    const missilePips = document.getElementById('missilePips');
    if (missileCount && missileTimer && missilePips) {
      const cur = window.weaponSystem.missiles.currentCount;
      const max = window.weaponSystem.missiles.maxCount;
      missileCount.innerText = `${cur}/${max}`;

      // Pips
      let pipsHtml = '';
      for (let i = 0; i < max; i++) {
        const active = i < cur;
        pipsHtml += `<div class="w-2.5 h-6 rounded-sm ${active ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-slate-700'} transition-all"></div>`;
      }
      missilePips.innerHTML = pipsHtml;

      if (cur < max) {
        const sec = Math.ceil(window.weaponSystem.missiles.regenTimer);
        missileTimer.innerText = `+1 ракета через: ${sec}с`;
      } else {
        missileTimer.innerText = `БОЕКОМПЛЕКТ ПОЛОН`;
      }
    }

    // Active weapon highlight
    const cardMg = document.getElementById('cardWeaponMg');
    const cardMissile = document.getElementById('cardWeaponMissile');
    if (cardMg && cardMissile) {
      const isMg = window.weaponSystem.activeWeapon === 1;
      cardMg.classList.toggle('border-emerald-500', isMg);
      cardMg.classList.toggle('bg-slate-800/90', isMg);
      cardMg.classList.toggle('border-slate-700', !isMg);
      cardMg.classList.toggle('bg-slate-900/60', !isMg);

      cardMissile.classList.toggle('border-amber-500', !isMg);
      cardMissile.classList.toggle('bg-slate-800/90', !isMg);
      cardMissile.classList.toggle('border-slate-700', isMg);
      cardMissile.classList.toggle('bg-slate-900/60', isMg);
    }

    // Wave indicator
    const waveEl = document.getElementById('currentWaveText');
    const waveProg = document.getElementById('waveProgressBar');
    if (waveEl && waveProg) {
      if (this.waveManager.waveState === 'boss_active' || this.waveManager.waveState === 'boss_alert') {
        waveEl.innerText = 'БОСС: ФЛАМИНГО';
        waveEl.className = 'text-red-400 font-black animate-pulse';
        if (this.boss) {
          const bossHpPct = Math.max(0, Math.round((this.boss.hp / this.boss.maxHp) * 100));
          waveProg.style.width = `${bossHpPct}%`;
          waveProg.className = 'h-full bg-red-600 transition-all';
        }
      } else {
        waveEl.innerText = `ВОЛНА ${this.waveManager.currentWave} / ${this.waveManager.maxWaves}`;
        waveEl.className = 'text-emerald-400 font-bold';
        const spawned = this.waveManager.dronesSpawnedInWave;
        const total = this.waveManager.totalDronesInWave || 1;
        waveProg.style.width = `${Math.min(100, (spawned / total) * 100)}%`;
        waveProg.className = 'h-full bg-emerald-500 transition-all';
      }
    }

    // Threat Banner
    const bannerEl = document.getElementById('threatBanner');
    const bannerTextEl = document.getElementById('threatBannerText');
    if (bannerEl && bannerTextEl) {
      if (this.bannerText) {
        bannerTextEl.innerText = this.bannerText;
        bannerEl.style.borderColor = this.bannerColor;
        bannerEl.classList.remove('hidden');
      } else {
        bannerEl.classList.add('hidden');
      }
    }

    // Score & kills
    const scoreEl = document.getElementById('hudScore');
    const killsEl = document.getElementById('hudKills');
    if (scoreEl) scoreEl.innerText = this.score;
    if (killsEl) killsEl.innerText = this.dronesDestroyed;

    // Draw Radar
    this.drawRadar();
  }

  // Draw Tactical Mini-Radar
  drawRadar() {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 4;

    ctx.clearRect(0, 0, w, h);

    // Radar background circle
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Range rings
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.66, 0, Math.PI * 2);
    ctx.arc(cx, cy, r * 0.33, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Rotating radar sweep line
    const sweepAngle = (performance.now() * 0.003) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * r, cy + Math.sin(sweepAngle) * r);
    ctx.stroke();

    // Player blip (center bottom)
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 2, cy + r * 0.65 - 2, 4, 4);

    // Plot Drones on radar
    for (const e of this.enemies) {
      if (!e.isAlive) continue;
      const rx = cx + ((e.x - this.width / 2) / (this.width / 2)) * (r * 0.85);
      const ry = cy + ((e.y - 250) / 300) * (r * 0.75);

      ctx.fillStyle = e.type === 'heavy' ? '#ef4444' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(rx, ry, e.type === 'heavy' ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Plot Flamingo Boss
    if (this.boss && this.boss.isAlive) {
      const rx = cx + ((this.boss.x - this.width / 2) / (this.width / 2)) * (r * 0.85);
      const ry = cy + ((this.boss.y - 250) / 300) * (r * 0.75);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(rx, ry, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
  }

  // 2.5D Rendering
  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake offset
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // Zoom Mode (PKM Aim)
    const zoom = window.weaponSystem.aimZoomFactor;
    if (zoom > 1.01) {
      // Zoom centered around player aim area
      const focusX = this.player.mouseX;
      const focusY = this.player.mouseY;
      ctx.translate(focusX, focusY);
      ctx.scale(zoom, zoom);
      ctx.translate(-focusX, -focusY);
    }

    // 1. Sky Gradient (2.5D Atmosphere)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 420);
    if (this.waveManager.waveState === 'boss_active' || this.waveManager.waveState === 'boss_alert') {
      // Menacing twilight sky during Flamingo alert
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#1e1b4b');
      skyGrad.addColorStop(1, '#450a0a');
    } else {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.45, '#1e293b');
      skyGrad.addColorStop(0.85, '#064e3b'); // Sber green ambient horizon
      skyGrad.addColorStop(1, '#065f46');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 440);

    // 2. Background Clouds
    window.particleSystem.drawClouds(ctx);

    // 3. Distant City / Mountains Silhouette (Parallax horizon)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    for (let x = 0; x <= this.width; x += 40) {
      const h = Math.sin(x * 0.02) * 15 + Math.cos(x * 0.05) * 8;
      ctx.lineTo(x, 340 + h);
    }
    ctx.lineTo(this.width, 420);
    ctx.lineTo(0, 420);
    ctx.closePath();
    ctx.fill();

    // 4. SBERBANK DATA CENTER (Midground Complex)
    const dcSprite = window.spriteEngine.sprites.datacenter;
    const dcX = this.width / 2 - dcSprite.width / 2;
    const dcY = 240;
    ctx.drawImage(dcSprite, dcX, dcY);

    // 5. 2.5D Ground & Road Perimeter
    this.renderGround(ctx);

    // 6. Draw UAV Drones in Sky
    for (const e of this.enemies) {
      e.draw(ctx);
    }

    // 7. Draw Flamingo Mini-Boss
    if (this.boss && this.boss.isAlive) {
      this.boss.draw(ctx);
    }

    // 8. Draw Vikhr-1 In-Flight Guided Missiles
    window.weaponSystem.drawMissiles(ctx);

    // 9. Draw MOG Combat Vehicle (Player)
    this.player.draw(ctx);

    // 10. Draw Particles, Bullet Tracers & Explosions
    window.particleSystem.draw(ctx);

    ctx.restore();

    // 11. Tactical Reticle / Crosshair Overlay (Screen Space)
    this.renderCrosshair(ctx);
  }

  // Draw 2.5D Ground Road
  renderGround(ctx) {
    // Road asphalt polygon
    const groundGrad = ctx.createLinearGradient(0, 430, 0, this.height);
    groundGrad.addColorStop(0, '#1e293b');
    groundGrad.addColorStop(0.2, '#0f172a');
    groundGrad.addColorStop(1, '#020617');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, 430, this.width, this.height - 430);

    // Guard rails / boundary lines
    ctx.fillStyle = '#059669';
    ctx.fillRect(0, 430, this.width, 3);

    // Road dashed lane markings with 2.5D perspective
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    for (let x = 20; x < this.width; x += 70) {
      ctx.fillRect(x, 475, 35, 4);
    }

    // Perimeter warning curb stripes (yellow/black)
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 565, this.width, 15);
    for (let x = 0; x < this.width; x += 30) {
      ctx.fillStyle = (Math.floor(x / 30) % 2 === 0) ? '#f59e0b' : '#0f172a';
      ctx.fillRect(x, 567, 15, 11);
    }
  }

  // Render Modern Tactical Reticle & PKM Zoom HUD
  renderCrosshair(ctx) {
    const mx = this.player.mouseX;
    const my = this.player.mouseY;
    const isAiming = window.weaponSystem.isAiming;

    ctx.save();

    if (isAiming) {
      // Green night-vision / FLIR tactical vignette
      const vig = ctx.createRadialGradient(mx, my, 80, mx, my, 400);
      vig.addColorStop(0, 'rgba(16, 185, 129, 0)');
      vig.addColorStop(1, 'rgba(6, 78, 59, 0.35)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, this.width, this.height);

      // Precision sniper rings
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, 35, 0, Math.PI * 2);
      ctx.arc(mx, my, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Lead brackets & mil-dots
      ctx.beginPath();
      // Horizontal
      ctx.moveTo(mx - 90, my); ctx.lineTo(mx - 40, my);
      ctx.moveTo(mx + 40, my); ctx.lineTo(mx + 90, my);
      // Vertical
      ctx.moveTo(mx, my - 90); ctx.lineTo(mx, my - 40);
      ctx.moveTo(mx, my + 40); ctx.lineTo(mx, my + 90);
      ctx.stroke();

      // Digital rangefinder telemetry
      ctx.fillStyle = '#34d399';
      ctx.font = '10px monospace';
      ctx.fillText(`ДИСТАНЦИЯ: ${Math.round(850 - my * 1.2)}М`, mx + 42, my - 12);
      ctx.fillText(`АФАР: АКТИВЕН [ZOOM 1.6X]`, mx + 42, my + 4);
    } else {
      // Standard combat crosshair
      ctx.strokeStyle = window.weaponSystem.activeWeapon === 1 ? '#34d399' : '#fbbf24';
      ctx.lineWidth = 1.5;

      // Center dot
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);

      // 4 tick lines
      ctx.beginPath();
      ctx.moveTo(mx - 14, my); ctx.lineTo(mx - 6, my);
      ctx.moveTo(mx + 6, my); ctx.lineTo(mx + 14, my);
      ctx.moveTo(mx, my - 14); ctx.lineTo(mx, my - 6);
      ctx.moveTo(mx, my + 6); ctx.lineTo(mx, my + 14);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
  new SberDefenseGame();
});
