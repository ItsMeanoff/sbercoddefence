/**
 * Particle and Visual Effects System
 * Handles explosions, smoke trails, bullet tracers, shell casings, and atmospheric debris.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.tracers = [];
    this.casings = [];
    this.clouds = [];
    this.initClouds();
  }

  initClouds() {
    // Generate gentle background pixel clouds
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random() * 1200,
        y: 30 + Math.random() * 140,
        w: 60 + Math.random() * 80,
        h: 16 + Math.random() * 20,
        speed: 0.15 + Math.random() * 0.25,
        alpha: 0.25 + Math.random() * 0.35
      });
    }
  }

  update(dt) {
    // 1. Update Clouds
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > 1400) {
        c.x = -c.w - 50;
        c.y = 30 + Math.random() * 140;
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.size += (p.growth || 0) * dt;
    }

    // 3. Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.tracers.splice(i, 1);
      }
    }

    // 4. Update Shell Casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.casings.splice(i, 1);
        continue;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 320 * dt; // gravity
      c.angle += c.vRot * dt;
      if (c.y > c.groundY) {
        c.y = c.groundY;
        c.vy = -c.vy * 0.4;
        c.vx *= 0.6;
      }
    }
  }

  // Add bullet tracer beam
  addTracer(x1, y1, x2, y2, color = '#fbbf24') {
    this.tracers.push({
      x1, y1, x2, y2,
      color,
      maxLife: 0.08,
      life: 0.08,
      width: 2.5
    });
  }

  // Add ejecting brass shell casing
  addShellCasing(x, y, groundY) {
    this.casings.push({
      x, y,
      groundY: groundY || y + 25,
      vx: -40 - Math.random() * 50,
      vy: -90 - Math.random() * 60,
      angle: Math.random() * Math.PI,
      vRot: (Math.random() - 0.5) * 15,
      life: 1.5,
      maxLife: 1.5
    });
  }

  // Rocket exhaust puff / trail
  addRocketPlume(x, y, isBoss = false) {
    const count = isBoss ? 4 : 2;
    for (let i = 0; i < count; i++) {
      // Fire / orange core
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        size: isBoss ? 6 : 3.5,
        growth: -1.5,
        life: 0.25,
        maxLife: 0.25,
        color: (Math.random() > 0.4) ? '#f97316' : '#ef4444'
      });
      // Trailing white/gray smoke
      this.particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 20,
        size: isBoss ? 5 : 3,
        growth: isBoss ? 16 : 8,
        life: isBoss ? 1.4 : 0.8,
        maxLife: isBoss ? 1.4 : 0.8,
        color: 'rgba(203, 213, 225, 0.45)'
      });
    }
  }

  // Explosion with fireball, shockwave, smoke, and burning debris
  addExplosion(x, y, isBig = false) {
    const numFire = isBig ? 35 : 18;
    const numDebris = isBig ? 24 : 12;

    // Shockwave ring
    this.particles.push({
      x, y,
      vx: 0, vy: 0,
      size: 6,
      growth: isBig ? 180 : 90,
      life: 0.22,
      maxLife: 0.22,
      isRing: true,
      color: '#fef08a'
    });

    // Fireball sparks
    for (let i = 0; i < numFire; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isBig ? 80 : 50) + Math.random() * (isBig ? 180 : 110);
      const colors = ['#fef08a', '#f97316', '#ef4444', '#dc2626'];
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 40,
        size: (isBig ? 5 : 3) + Math.random() * 4,
        growth: -2,
        life: 0.35 + Math.random() * 0.3,
        maxLife: 0.65,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    // Heavy black/gray smoke puffs
    const numSmoke = isBig ? 20 : 10;
    for (let i = 0; i < numSmoke; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * (isBig ? 60 : 40);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: (isBig ? 8 : 5) + Math.random() * 5,
        growth: (isBig ? 18 : 10),
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        color: (Math.random() > 0.5) ? 'rgba(71, 85, 105, 0.7)' : 'rgba(30, 41, 59, 0.8)'
      });
    }

    // Debris fragments (falling pixel chunks)
    for (let i = 0; i < numDebris; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (isBig ? 160 : 90);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 240,
        size: 2 + Math.random() * 3,
        growth: 0,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        color: (Math.random() > 0.3) ? '#1e293b' : '#ef4444'
      });
    }
  }

  // Hit sparks when bullet hits target
  addHitSparks(x, y) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 70;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 60,
        size: 2,
        growth: -1.5,
        life: 0.18,
        maxLife: 0.18,
        color: '#fef08a'
      });
    }
  }

  // Tire dust when MOG moves
  addTireDust(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 15 - 20,
      vy: -5 - Math.random() * 10,
      size: 2.5 + Math.random() * 2,
      growth: 4,
      life: 0.35,
      maxLife: 0.35,
      color: 'rgba(148, 163, 184, 0.35)'
    });
  }

  // Draw background clouds
  drawClouds(ctx) {
    for (const c of this.clouds) {
      ctx.fillStyle = `rgba(226, 232, 240, ${c.alpha})`;
      // Rounded pixel cloud
      ctx.fillRect(c.x, c.y + 4, c.w, c.h - 8);
      ctx.fillRect(c.x + 8, c.y, c.w - 16, c.h);
      ctx.fillRect(c.x + 16, c.y - 4, c.w - 32, c.h + 8);
    }
  }

  // Render all active particles
  draw(ctx) {
    // 1. Draw bullet tracers
    for (const t of this.tracers) {
      const progress = t.life / t.maxLife;
      ctx.save();
      ctx.strokeStyle = t.color;
      ctx.lineWidth = t.width * progress;
      ctx.globalAlpha = progress;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw shell casings
    for (const c of this.casings) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2, -1, 4, 2);
      ctx.restore();
    }

    // 3. Draw particles
    for (const p of this.particles) {
      const progress = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, progress));

      if (p.isRing) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        const s = Math.max(1, p.size);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.restore();
    }
  }
}

window.particleSystem = new ParticleSystem();
