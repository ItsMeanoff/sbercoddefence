/**
 * Weapons System: Heavy Machine Gun & "Vikhr-1" Guided Missiles
 */
class WeaponSystem {
  constructor() {
    // Weapon 1: Heavy Machine Gun (ТКП-12.7)
    this.mg = {
      maxClip: 150,
      currentAmmo: 150,
      fireRate: 0.085, // ~11.7 shots per second
      lastShotTime: 0,
      isReloading: false,
      reloadTime: 2.0,
      reloadProgress: 0,
      damage: 28, // 4-5 hits to kill regular drone (100 HP)
      range: 1200,
      spread: 0.035 // slight realistic tracer dispersion
    };

    // Weapon 2: Guided Missiles "Вихрь-1" (9К121)
    this.missiles = {
      maxCount: 5,
      currentCount: 5,
      regenInterval: 30.0, // +1 missile every 30 seconds
      regenTimer: 30.0,
      fireCooldown: 0.6,
      lastFireTime: 0,
      damage: 220, // High direct and splash damage
      blastRadius: 65,
      projectiles: []
    };

    // Active weapon: 1 = MG, 2 = Vikhr-1
    this.activeWeapon = 1;

    // Zoom / Aim state (Right Mouse Button)
    this.isAiming = false;
    this.aimZoomFactor = 1.0;
  }

  selectWeapon(slot) {
    if (slot === 1 || slot === 2) {
      if (this.activeWeapon !== slot) {
        this.activeWeapon = slot;
        window.soundEngine.playWeaponSwitch();
      }
    }
  }

  toggleWeapon() {
    this.selectWeapon(this.activeWeapon === 1 ? 2 : 1);
  }

  update(dt, playerX, playerY, mouseX, mouseY) {
    // 1. Machine Gun Reload Progress
    if (this.mg.isReloading) {
      this.mg.reloadProgress += dt;
      if (this.mg.reloadProgress >= this.mg.reloadTime) {
        this.mg.currentAmmo = this.mg.maxClip;
        this.mg.isReloading = false;
        this.mg.reloadProgress = 0;
      }
    }

    // 2. Vikhr-1 Missile Regeneration (+1 every 30s up to max 5)
    if (this.missiles.currentCount < this.missiles.maxCount) {
      this.missiles.regenTimer -= dt;
      if (this.missiles.regenTimer <= 0) {
        this.missiles.currentCount++;
        this.missiles.regenTimer = this.missiles.regenInterval;
        window.soundEngine.playMissileRestored();
      }
    } else {
      this.missiles.regenTimer = this.missiles.regenInterval;
    }

    // 3. Smooth Zoom Transition for PKM Aim
    const targetZoom = this.isAiming ? 1.55 : 1.0;
    this.aimZoomFactor += (targetZoom - this.aimZoomFactor) * (1 - Math.exp(-12 * dt));

    // 4. Update In-Flight Guided Missiles
    for (let i = this.missiles.projectiles.length - 1; i >= 0; i--) {
      const m = this.missiles.projectiles[i];
      m.life += dt;

      // Rocket steering towards current mouse position (guided laser tracking)
      const targetAngle = Math.atan2(mouseY - m.y, mouseX - m.x);
      let angleDiff = targetAngle - m.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Steering turn rate
      const turnRate = 4.5 * dt;
      if (Math.abs(angleDiff) < turnRate) {
        m.angle = targetAngle;
      } else {
        m.angle += Math.sign(angleDiff) * turnRate;
      }

      // Acceleration
      m.speed = Math.min(650, m.speed + 400 * dt);
      m.x += Math.cos(m.angle) * m.speed * dt;
      m.y += Math.sin(m.angle) * m.speed * dt;

      // Rocket plume particles
      const tailX = m.x - Math.cos(m.angle) * 12;
      const tailY = m.y - Math.sin(m.angle) * 12;
      window.particleSystem.addRocketPlume(tailX, tailY, false);

      // Timeout if flying off-screen or too long
      if (m.life > 4.5 || m.y < -150 || m.x < -200 || m.x > 2000) {
        window.particleSystem.addExplosion(m.x, m.y, false);
        window.soundEngine.playExplosion(false);
        this.missiles.projectiles.splice(i, 1);
      }
    }
  }

  // Trigger manual reload
  reload() {
    if (this.mg.isReloading || this.mg.currentAmmo === this.mg.maxClip) return;
    this.mg.isReloading = true;
    this.mg.reloadProgress = 0;
    window.soundEngine.playReload();
  }

  // Attempt to fire weapon at target
  fire(muzzleX, muzzleY, targetX, targetY, enemies, boss) {
    const now = performance.now() / 1000;

    if (this.activeWeapon === 1) {
      // Machine Gun
      if (this.mg.isReloading) {
        window.soundEngine.playEmptyClick();
        return false;
      }
      if (this.mg.currentAmmo <= 0) {
        this.reload();
        return false;
      }
      if (now - this.mg.lastShotTime < this.mg.fireRate) {
        return false;
      }

      this.mg.lastShotTime = now;
      this.mg.currentAmmo--;

      // Calculate ballistic angle with dispersion
      const baseAngle = Math.atan2(targetY - muzzleY, targetX - muzzleX);
      const spread = (Math.random() - 0.5) * this.mg.spread;
      const angle = baseAngle + spread;

      // Raycast / line trace into sky
      const maxDist = this.mg.range;
      const endX = muzzleX + Math.cos(angle) * maxDist;
      const endY = muzzleY + Math.sin(angle) * maxDist;

      // Check hit against enemies or boss along ray
      let hitEntity = null;
      let hitDist = maxDist;
      let hitPt = { x: endX, y: endY };

      // Helper to check line vs circle/rect
      const checkHit = (entity) => {
        if (!entity.isAlive) return;
        // Distance from point to ray
        const px = entity.x;
        const py = entity.y;
        const radius = entity.hitRadius || 20;

        // Vector math: project entity onto ray
        const vx = px - muzzleX;
        const vy = py - muzzleY;
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        const proj = vx * dirX + vy * dirY;

        if (proj > 0 && proj < hitDist) {
          const closestX = muzzleX + dirX * proj;
          const closestY = muzzleY + dirY * proj;
          const distSq = (px - closestX) ** 2 + (py - closestY) ** 2;
          if (distSq <= radius ** 2) {
            hitDist = proj;
            hitPt = { x: closestX, y: closestY };
            hitEntity = entity;
          }
        }
      };

      // Check all active drones
      for (const e of enemies) checkHit(e);
      // Check boss
      if (boss && boss.isAlive) checkHit(boss);

      // Create visual tracer
      const tracerColor = (this.mg.currentAmmo % 4 === 0) ? '#fef08a' : '#f59e0b'; // Tracers
      window.particleSystem.addTracer(muzzleX, muzzleY, hitPt.x, hitPt.y, tracerColor);

      // Sound
      window.soundEngine.playMachineGunShot();

      // Apply damage if hit
      if (hitEntity) {
        hitEntity.takeDamage(this.mg.damage, 'bullet');
        window.particleSystem.addHitSparks(hitPt.x, hitPt.y);
        window.soundEngine.playHitMarker();
      }

      // Auto-reload when mag empty
      if (this.mg.currentAmmo <= 0) {
        this.reload();
      }

      return true;

    } else if (this.activeWeapon === 2) {
      // Vikhr-1 Guided Missile
      if (this.missiles.currentCount <= 0) {
        window.soundEngine.playEmptyClick();
        return false;
      }
      if (now - this.missiles.lastFireTime < this.missiles.fireCooldown) {
        return false;
      }

      this.missiles.lastFireTime = now;
      this.missiles.currentCount--;

      // Initial launch angle towards sky / target
      const angle = Math.atan2(targetY - muzzleY, targetX - muzzleX);

      this.missiles.projectiles.push({
        x: muzzleX,
        y: muzzleY,
        angle: angle,
        speed: 240, // initial speed, accelerates
        life: 0
      });

      window.soundEngine.playMissileLaunch();
      return true;
    }

    return false;
  }

  // Draw in-flight Vikhr-1 missiles
  drawMissiles(ctx) {
    const sprite = window.spriteEngine.sprites.vikhr;
    for (const m of this.missiles.projectiles) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      // Draw Vikhr sprite centered
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
      ctx.restore();
    }
  }
}

window.weaponSystem = new WeaponSystem();
