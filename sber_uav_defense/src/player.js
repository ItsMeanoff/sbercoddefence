/**
 * MOG Combat Vehicle & Player Controller
 * Handles WASD 2.5D driving, turret aiming, and weapon firing.
 */
class PlayerVehicle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // 2.5D Position on the road perimeter
    this.x = canvasWidth / 2;
    this.y = 480; // Road strip range: 450 to 520
    this.vx = 0;
    this.vy = 0;
    this.speed = 220; // driving speed
    this.depthScale = 1.0;

    // Health
    this.maxHp = 100;
    this.hp = 100;

    // Controls state
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false
    };

    this.mouseX = canvasWidth / 2;
    this.mouseY = 200;
    this.isFiring = false;

    // Turret angle (in radians)
    this.turretAngle = -Math.PI / 2; // pointing straight up initially

    // Setup input listeners
    this.bindInputs();
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'ц') this.keys.w = true;
      if (k === 'a' || k === 'ф') this.keys.a = true;
      if (k === 's' || k === 'ы') this.keys.s = true;
      if (k === 'd' || k === 'в') this.keys.d = true;

      // Weapon selection
      if (e.key === '1') window.weaponSystem.selectWeapon(1);
      if (e.key === '2') window.weaponSystem.selectWeapon(2);
      if (k === 'q' || k === 'й') window.weaponSystem.toggleWeapon();
      if (k === 'r' || k === 'к') window.weaponSystem.reload();
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'ц') this.keys.w = false;
      if (k === 'a' || k === 'ф') this.keys.a = false;
      if (k === 's' || k === 'ы') this.keys.s = false;
      if (k === 'd' || k === 'в') this.keys.d = false;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      const canvas = document.getElementById('gameCanvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });

    // Mouse firing (LKM) & Aiming (PKM)
    this.lkmJustPressed = false;
    this.facing = 1; // 1 = right, -1 = left

    window.addEventListener('mousedown', (e) => {
      window.soundEngine.init();

      if (e.button === 0) { // Left click
        this.isFiring = true;
        this.lkmJustPressed = true;
      } else if (e.button === 2) { // Right click: Aim / Zoom
        e.preventDefault();
        window.weaponSystem.isAiming = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isFiring = false;
        this.lkmJustPressed = false;
      } else if (e.button === 2) {
        e.preventDefault();
        window.weaponSystem.isAiming = false;
      }
    });

    // Prevent context menu on right click
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Mouse wheel weapon switch
    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        window.weaponSystem.selectWeapon(2);
      } else if (e.deltaY < 0) {
        window.weaponSystem.selectWeapon(1);
      }
    }, { passive: true });
  }

  update(dt, enemies, boss) {
    // 1. WASD Movement Physics
    let moveX = 0;
    let moveY = 0;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;
    if (this.keys.w) moveY -= 1;
    if (this.keys.s) moveY += 1;

    if (moveX < 0) this.facing = -1;
    if (moveX > 0) this.facing = 1;

    // Normalize diagonal
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.7071;
      moveY *= 0.7071;
    }

    const accel = 1400;
    const friction = 12;

    this.vx += moveX * accel * dt;
    this.vy += moveY * accel * dt;

    this.vx -= this.vx * friction * dt;
    this.vy -= this.vy * friction * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Bounds checking (road perimeter)
    const margin = 50;
    if (this.x < margin) { this.x = margin; this.vx = 0; }
    if (this.x > this.canvasWidth - margin) { this.x = this.canvasWidth - margin; this.vx = 0; }
    if (this.y < 450) { this.y = 450; this.vy = 0; }
    if (this.y > 520) { this.y = 520; this.vy = 0; }

    // 2.5D Perspective scale based on road depth
    this.depthScale = 0.88 + ((this.y - 450) / 70) * 0.24; // 0.88 to 1.12

    // Audio & Particles for driving
    const isMoving = Math.abs(this.vx) > 15 || Math.abs(this.vy) > 15;
    window.soundEngine.setEngineSpeed(isMoving);
    if (isMoving && Math.random() < 0.4) {
      window.particleSystem.addTireDust(this.x - 25, this.y + 12);
      window.particleSystem.addTireDust(this.x + 25, this.y + 12);
    }

    // 2. Turret Aiming towards Mouse
    // Turret mount center relative to vehicle
    const turretPivotX = this.x - 12 * this.depthScale;
    const turretPivotY = this.y - 14 * this.depthScale;

    // Desired turret angle
    const targetAngle = Math.atan2(this.mouseY - turretPivotY, this.mouseX - turretPivotX);
    this.turretAngle = targetAngle;

    // Muzzle position in world space
    const barrelLength = 34 * this.depthScale;
    const muzzleX = turretPivotX + Math.cos(this.turretAngle) * barrelLength;
    const muzzleY = turretPivotY + Math.sin(this.turretAngle) * barrelLength;

    // 3. Firing
    const wantsToFire = (window.weaponSystem.activeWeapon === 1 && this.isFiring) ||
                        (window.weaponSystem.activeWeapon === 2 && this.lkmJustPressed);

    if (wantsToFire) {
      const fired = window.weaponSystem.fire(
        muzzleX,
        muzzleY,
        this.mouseX,
        this.mouseY,
        enemies,
        boss
      );
      if (fired) {
        if (window.weaponSystem.activeWeapon === 1) {
          window.particleSystem.addShellCasing(turretPivotX, turretPivotY, this.y + 18);
        } else if (window.weaponSystem.activeWeapon === 2) {
          this.lkmJustPressed = false; // consume trigger for missile
        }
      }
    }

    // 4. Update Weapon System
    window.weaponSystem.update(dt, this.x, this.y, this.mouseX, this.mouseY);
  }

  draw(ctx) {
    const chassis = window.spriteEngine.sprites.mogChassis;
    const turret = window.spriteEngine.sprites.mogTurret;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.depthScale * this.facing, this.depthScale);

    // Vehicle Shadow on the asphalt
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draw MOG Chassis centered
    ctx.drawImage(chassis, -chassis.width / 2, -chassis.height / 2);

    ctx.restore();

    // 2. Draw Turret (rotates dynamically towards mouse)
    ctx.save();
    const turretPivotX = this.x - (12 * this.facing) * this.depthScale;
    const turretPivotY = this.y - 14 * this.depthScale;

    ctx.translate(turretPivotX, turretPivotY);
    ctx.scale(this.depthScale, this.depthScale);
    ctx.rotate(this.turretAngle);

    // Turret pivot is around (15, 18) inside sprite
    ctx.drawImage(turret, -15, -18);

    ctx.restore();
  }
}

window.PlayerVehicle = PlayerVehicle;
