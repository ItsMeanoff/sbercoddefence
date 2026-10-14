/**
 * Enemies Engine: Drone AI, Spawn Patterns, and Mini-Boss "Flamingo" Ballistic Missile
 */

class Drone {
  constructor(type, x, y, speed, targetDC) {
    this.type = type; // 'delta', 'hex', 'heavy', 'swarm'
    this.x = x;
    this.y = y;
    this.baseSpeed = speed;
    this.vx = speed;
    this.vy = 0;
    this.targetDC = targetDC;
    this.isAlive = true;
    this.time = Math.random() * 10;
    this.hitRadius = 18;

    // Type specifics
    if (type === 'delta') {
      this.hp = 80;
      this.maxHp = 80;
      this.hitRadius = 18;
      this.sprite = window.spriteEngine.sprites.droneDelta;
      this.score = 150;
    } else if (type === 'hex') {
      this.hp = 60;
      this.maxHp = 60;
      this.hitRadius = 16;
      this.sprite = window.spriteEngine.sprites.droneHex;
      this.score = 120;
    } else if (type === 'heavy') {
      this.hp = 160;
      this.maxHp = 160;
      this.hitRadius = 24;
      this.sprite = window.spriteEngine.sprites.droneHeavy;
      this.score = 250;
    } else { // swarm
      this.hp = 45;
      this.maxHp = 45;
      this.hitRadius = 14;
      this.sprite = window.spriteEngine.sprites.droneDelta;
      this.score = 100;
    }

    // Direction (flying left to right or right to left across sky)
    this.dir = x < 400 ? 1 : -1;
    this.vx = this.dir * Math.abs(speed);
  }

  update(dt, dcCenter) {
    if (!this.isAlive) return;
    this.time += dt;

    // Flight trajectories by type
    if (this.type === 'delta') {
      // Sweeping descent towards Sberbank DC
      this.x += this.vx * dt;
      this.y += Math.sin(this.time * 2.5) * 18 * dt + 12 * dt;
    } else if (this.type === 'hex') {
      // Agile evasive bobbing
      this.x += this.vx * dt;
      this.y += Math.sin(this.time * 4) * 35 * dt + 8 * dt;
    } else if (this.type === 'heavy') {
      // Slow, steady high-altitude pass
      this.x += this.vx * 0.75 * dt;
      this.y += Math.sin(this.time * 1.5) * 10 * dt + 6 * dt;
    } else {
      // Swarm fast dive
      this.x += this.vx * 1.3 * dt;
      this.y += Math.cos(this.time * 3) * 25 * dt + 15 * dt;
    }

    // If drone gets close to ground or datacenter perimeter (Y > 440), it strikes!
    if (this.y >= 430) {
      this.detonateOnDC();
    }
  }

  takeDamage(amount, source) {
    if (!this.isAlive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    window.particleSystem.addExplosion(this.x, this.y, this.type === 'heavy');
    window.soundEngine.playExplosion(this.type === 'heavy');
  }

  detonateOnDC() {
    this.isAlive = false;
    window.particleSystem.addExplosion(this.x, this.y, true);
    window.soundEngine.playExplosion(true);
    // Damage Sberbank Data Center integrity
    const dcDamage = this.type === 'heavy' ? 20 : (this.type === 'delta' ? 12 : 8);
    if (window.gameInstance) {
      window.gameInstance.damageDatacenter(dcDamage);
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Flip if moving left
    if (this.dir < 0) {
      ctx.scale(-1, 1);
    }

    // Subtle bank angle based on vertical movement
    const bank = (this.dir * this.vy * 0.015);
    ctx.rotate(bank);

    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);

    // Health bar above drone
    if (this.hp < this.maxHp) {
      const barW = 28;
      const barH = 3;
      const hpRatio = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(-barW / 2 - 1, -this.sprite.height / 2 - 8, barW + 2, barH + 2);
      ctx.fillStyle = hpRatio > 0.5 ? '#10b981' : (hpRatio > 0.25 ? '#f59e0b' : '#ef4444');
      ctx.fillRect(-barW / 2, -this.sprite.height / 2 - 7, barW * hpRatio, barH);
    }

    ctx.restore();
  }
}

/**
 * Mini-Boss: Ballistic Missile "FLAMINGO"
 * Appears every 5 waves.
 * Requires 2x normal damage to shoot down.
 * Triggers military air raid siren on appearance.
 */
class FlamingoBoss {
  constructor(startX, startY, targetX, targetY) {
    this.isBoss = true;
    this.name = 'ФЛАМИНГО';
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;

    // Requirement: "Чтобы ее сбить нужно х2 урона нанести"
    // Normal heavy drone is 160 HP; standard drone is 80 HP.
    // Flamingo has an armored hull: 500 HP (effectively takes >2x to 3x full damage volley)
    this.maxHp = 520;
    this.hp = 520;
    this.hitRadius = 32;
    this.isAlive = true;
    this.speed = 135; // Ballistic descent velocity
    this.angle = Math.atan2(targetY - startY, targetX - startX);
    this.sprite = window.spriteEngine.sprites.flamingo;
    this.plumeTimer = 0;
    this.sirenTriggered = false;
  }

  start() {
    // Military air raid siren begins!
    if (!this.sirenTriggered) {
      window.soundEngine.startMilitarySiren();
      this.sirenTriggered = true;
    }
  }

  update(dt) {
    if (!this.isAlive) return;

    // Ensure siren is sounding
    if (!this.sirenTriggered) {
      this.start();
    }

    // Ballistic descent trajectory
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Accelerate as it enters lower atmosphere
    this.speed += 15 * dt;

    // Rocket thruster plume emission
    this.plumeTimer += dt;
    if (this.plumeTimer >= 0.02) {
      this.plumeTimer = 0;
      const tailX = this.x - Math.cos(this.angle) * 32;
      const tailY = this.y - Math.sin(this.angle) * 32;
      window.particleSystem.addRocketPlume(tailX, tailY, true);
    }

    // Impact on Sberbank Data Center
    if (this.y >= 430) {
      this.impactDC();
    }
  }

  takeDamage(amount, source) {
    if (!this.isAlive) return;

    // Armored outer ballistic shell takes incoming fire
    this.hp -= amount;
    window.soundEngine.playHitMarker();

    if (this.hp <= 0) {
      this.destroy();
    }
  }

  destroy() {
    this.isAlive = false;
    window.soundEngine.stopMilitarySiren();

    // Massive catastrophic chain explosion
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ox = (Math.random() - 0.5) * 60;
        const oy = (Math.random() - 0.5) * 40;
        window.particleSystem.addExplosion(this.x + ox, this.y + oy, true);
        window.soundEngine.playExplosion(true);
      }, i * 90);
    }

    // Notify game instance of boss kill & victory
    if (window.gameInstance) {
      window.gameInstance.onBossDefeated();
    }
  }

  impactDC() {
    this.isAlive = false;
    window.soundEngine.stopMilitarySiren();

    // Devastating impact
    window.particleSystem.addExplosion(this.x, this.y, true);
    window.soundEngine.playExplosion(true);

    if (window.gameInstance) {
      window.gameInstance.damageDatacenter(50);
      window.gameInstance.onBossImpact();
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Draw Flamingo missile sprite centered
    ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);

    // Glowing thruster flame
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-this.sprite.width / 2 - 10, -3, 10, 6);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-this.sprite.width / 2 - 6, -2, 6, 4);

    ctx.restore();
  }
}

window.Drone = Drone;
window.FlamingoBoss = FlamingoBoss;
