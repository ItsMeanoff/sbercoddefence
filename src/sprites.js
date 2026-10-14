/**
 * Pixel Art Generator and Sprite Engine
 * Generates procedural retro pixel sprites for Sberbank DC, MOG vehicle, drones, and missile.
 */
class SpriteEngine {
  constructor() {
    this.sprites = {};
    this.init();
  }

  init() {
    this.generateSberDatacenter();
    this.generateMogVehicle();
    this.generateDrones();
    this.generateFlamingoMissile();
    this.generateVikhrMissile();
  }

  createPixelCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx };
  }

  // Generate Sberbank Data Center backdrop
  generateSberDatacenter() {
    const w = 480;
    const h = 200;
    const { canvas, ctx } = this.createPixelCanvas(w, h);

    // Main complex structure (modular server halls)
    // Wall gradient / panels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 60, 400, 140);

    // Concrete base / foundation
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 150, 440, 50);

    // Architectural emerald/green accents (Sber signature colors)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(40, 56, 400, 4);
    ctx.fillRect(40, 148, 400, 3);

    // Server room windows with glowing server racks
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 12; c++) {
        const rx = 60 + c * 30;
        const ry = 72 + r * 18;
        // Window frame
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(rx, ry, 22, 14);
        // Server rack inside
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(rx + 2, ry + 2, 18, 10);
        // Blinking LED dots (Sber green, teal, amber)
        ctx.fillStyle = '#34d399';
        ctx.fillRect(rx + 4, ry + 4, 3, 2);
        ctx.fillRect(rx + 4, ry + 8, 3, 2);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(rx + 10, ry + 4, 3, 2);
        ctx.fillStyle = (c % 3 === 0) ? '#fbbf24' : '#059669';
        ctx.fillRect(rx + 15, ry + 6, 2, 2);
      }
    }

    // Cooling Towers / HVAC units on the roof
    for (let i = 0; i < 4; i++) {
      const cx = 80 + i * 90;
      ctx.fillStyle = '#334155';
      ctx.fillRect(cx, 38, 36, 20);
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx + 4, 34, 28, 6);
      // Fan grill
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx + 8, 36, 20, 3);
    }

    // High-gain Satellite Uplink Dish (Center Left)
    const dishX = 170;
    const dishY = 32;
    ctx.fillStyle = '#64748b';
    ctx.fillRect(dishX + 12, dishY + 12, 6, 16); // support pole
    ctx.fillStyle = '#94a3b8';
    // Dish arc
    ctx.beginPath();
    ctx.arc(dishX + 15, dishY + 8, 16, Math.PI * 0.8, Math.PI * 1.9, false);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();
    // Dish center feedhorn
    ctx.fillStyle = '#10b981';
    ctx.fillRect(dishX + 13, dishY - 2, 4, 4);

    // Communications / Radar Tower (Center Right)
    const towerX = 330;
    ctx.fillStyle = '#475569';
    // Lattice tower
    for (let l = 0; l < 8; l++) {
      const ty = 60 - l * 6;
      ctx.fillRect(towerX - 6 + l * 0.5, ty, 2, 6);
      ctx.fillRect(towerX + 6 - l * 0.5, ty, 2, 6);
      if (l % 2 === 0) {
        ctx.fillRect(towerX - 6 + l * 0.5, ty, 12 - l, 2);
      }
    }
    // Radar dome on top
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(towerX, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Red beacon light
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(towerX - 1, 0, 3, 3);

    // SBER LOGO & Signboard Banner on front
    const logoX = 200;
    const logoY = 162;
    // Glowing signboard background
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(logoX - 10, logoY - 8, 160, 24);
    ctx.fillStyle = '#10b981';
    ctx.strokeRect(logoX - 10, logoY - 8, 160, 24);

    // Sber green circle checkmark logo
    ctx.beginPath();
    ctx.arc(logoX + 4, logoY + 4, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    // Checkmark
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(logoX + 1, logoY + 4);
    ctx.lineTo(logoX + 3.5, logoY + 7);
    ctx.lineTo(logoX + 8, logoY + 1);
    ctx.stroke();

    // SBERBANK DATA CENTER text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('СБЕР ЦОД-1', logoX + 18, logoY + 7);

    // Perimeter Security Fence in front
    ctx.fillStyle = 'rgba(71, 85, 105, 0.7)';
    for (let f = 10; f < 470; f += 8) {
      ctx.fillRect(f, 185, 2, 15);
      ctx.fillRect(f, 188, 8, 1);
      ctx.fillRect(f, 194, 8, 1);
    }

    this.sprites.datacenter = canvas;
  }

  // Generate MOG combat vehicle (chassis and separate turret for rotation)
  generateMogVehicle() {
    // 1. Vehicle Chassis (Armored combat pickup / technical)
    const cw = 110;
    const ch = 52;
    const { canvas: chassis, ctx: cctx } = this.createPixelCanvas(cw, ch);

    // Main hull body (Military olive drab & digital camo)
    cctx.fillStyle = '#2d3a24'; // dark olive
    cctx.fillRect(15, 18, 75, 18);
    // Camo patches
    cctx.fillStyle = '#3f4f34';
    cctx.fillRect(25, 20, 18, 10);
    cctx.fillRect(55, 22, 20, 8);
    cctx.fillStyle = '#1e2617';
    cctx.fillRect(40, 24, 12, 8);

    // Armored Cab & windshield
    cctx.fillStyle = '#26321f';
    cctx.beginPath();
    cctx.moveTo(48, 18);
    cctx.lineTo(58, 8);
    cctx.lineTo(82, 8);
    cctx.lineTo(88, 18);
    cctx.closePath();
    cctx.fill();

    // Bulletproof tinted glass
    cctx.fillStyle = '#38bdf8';
    cctx.fillRect(66, 10, 14, 7);
    cctx.fillStyle = '#0284c7';
    cctx.fillRect(58, 11, 7, 6);

    // Heavy Front Bumper & Bullbar
    cctx.fillStyle = '#0f172a';
    cctx.fillRect(88, 22, 10, 12);
    cctx.fillStyle = '#475569';
    cctx.fillRect(96, 20, 4, 14);
    // Headlights
    cctx.fillStyle = '#fef08a';
    cctx.fillRect(92, 23, 4, 3);
    cctx.fillStyle = '#f59e0b';
    cctx.fillRect(92, 28, 4, 2);

    // Rear cargo bed where turret mounts
    cctx.fillStyle = '#1e293b';
    cctx.fillRect(16, 12, 32, 8);
    cctx.fillStyle = '#334155';
    cctx.fillRect(28, 10, 12, 4); // Turret ring pedestal

    // Wheels (4 big offroad military tires with rim details)
    const drawWheel = (wx, wy) => {
      // Outer tire
      cctx.fillStyle = '#090d16';
      cctx.fillRect(wx - 9, wy - 9, 18, 18);
      // Tread corners
      cctx.clearRect(wx - 9, wy - 9, 2, 2);
      cctx.clearRect(wx + 7, wy - 9, 2, 2);
      cctx.clearRect(wx - 9, wy + 7, 2, 2);
      cctx.clearRect(wx + 7, wy + 7, 2, 2);
      // Rim
      cctx.fillStyle = '#475569';
      cctx.fillRect(wx - 5, wy - 5, 10, 10);
      cctx.fillStyle = '#1e293b';
      cctx.fillRect(wx - 2, wy - 2, 4, 4);
      // Lug bolts
      cctx.fillStyle = '#94a3b8';
      cctx.fillRect(wx - 1, wy - 1, 2, 2);
    };

    drawWheel(30, 36);
    drawWheel(76, 36);

    // Antenna with blinking comms tip
    cctx.fillStyle = '#64748b';
    cctx.fillRect(18, 2, 2, 16);
    cctx.fillStyle = '#22c55e'; // Green comms light
    cctx.fillRect(17, 0, 4, 3);

    // MOG identification marking on door
    cctx.fillStyle = '#e2e8f0';
    cctx.font = 'bold 7px monospace';
    cctx.fillText('МОГ-1', 48, 28);

    this.sprites.mogChassis = chassis;

    // 2. Turret: Heavy MG + Vikhr-1 Launcher Box
    const tw = 60;
    const th = 34;
    const { canvas: turret, ctx: tctx } = this.createPixelCanvas(tw, th);

    // Turret pivot is around (15, 18)
    // Turret Armored Pod / Body
    tctx.fillStyle = '#334155';
    tctx.fillRect(10, 10, 20, 14);
    tctx.fillStyle = '#1e293b';
    tctx.fillRect(12, 12, 16, 10);

    // Heavy Machine Gun Barrels (dual 12.7mm extended forward)
    tctx.fillStyle = '#0f172a';
    tctx.fillRect(28, 12, 24, 3);
    tctx.fillRect(28, 17, 24, 3);
    // Muzzle flash suppressors
    tctx.fillStyle = '#475569';
    tctx.fillRect(49, 11, 4, 5);
    tctx.fillRect(49, 16, 4, 5);

    // Drum / Ammo Cassette (Box magazine for 150 rounds)
    tctx.fillStyle = '#065f46'; // Dark green ammo box
    tctx.fillRect(6, 15, 10, 9);
    tctx.fillStyle = '#10b981';
    tctx.fillRect(8, 17, 6, 2); // green marking

    // Vikhr-1 Missile Pod (mounted on top of turret)
    tctx.fillStyle = '#475569';
    tctx.fillRect(14, 3, 22, 8);
    tctx.fillStyle = '#0f172a';
    // 2 missile launch tube caps
    tctx.fillRect(34, 4, 3, 3);
    tctx.fillRect(34, 7, 3, 3);
    // Missile tips (red/yellow)
    tctx.fillStyle = '#ef4444';
    tctx.fillRect(35, 5, 2, 2);
    tctx.fillRect(35, 8, 2, 2);

    this.sprites.mogTurret = turret;
  }

  // Generate UAV / Drone sprites
  generateDrones() {
    // 1. Delta-wing Kamikaze (Шахед / Крыло)
    const { canvas: delta, ctx: dctx } = this.createPixelCanvas(38, 22);
    // Triangular swept-back wings
    dctx.fillStyle = '#334155';
    dctx.beginPath();
    dctx.moveTo(34, 11); // nose
    dctx.lineTo(4, 2);   // wingtip top
    dctx.lineTo(8, 11);  // fuselage center
    dctx.lineTo(4, 20);  // wingtip bottom
    dctx.closePath();
    dctx.fill();

    // Darker panel lining
    dctx.fillStyle = '#1e293b';
    dctx.fillRect(12, 9, 18, 4);
    // Wingtip vertical winglets
    dctx.fillStyle = '#0f172a';
    dctx.fillRect(2, 0, 4, 4);
    dctx.fillRect(2, 18, 4, 4);
    // Warhead nose tip
    dctx.fillStyle = '#ef4444';
    dctx.fillRect(32, 10, 4, 2);
    // Pusher propeller at tail
    dctx.fillStyle = '#94a3b8';
    dctx.fillRect(4, 9, 3, 4);

    this.sprites.droneDelta = delta;

    // 2. Recon Hexacopter / Quadcopter ("Око")
    const { canvas: hex, ctx: hctx } = this.createPixelCanvas(32, 24);
    // Central pod
    hctx.fillStyle = '#1e293b';
    hctx.beginPath();
    hctx.arc(16, 12, 6, 0, Math.PI * 2);
    hctx.fill();
    // Recon camera sensor (glowing cyan optical dome)
    hctx.fillStyle = '#06b6d4';
    hctx.fillRect(15, 14, 3, 3);
    // 4 rotor booms
    hctx.strokeStyle = '#475569';
    hctx.lineWidth = 2;
    hctx.beginPath();
    hctx.moveTo(8, 6);
    hctx.lineTo(24, 18);
    hctx.moveTo(8, 18);
    hctx.lineTo(24, 6);
    hctx.stroke();
    // Rotor blades (spinning blur circles)
    hctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    hctx.fillRect(4, 4, 8, 3);
    hctx.fillRect(20, 4, 8, 3);
    hctx.fillRect(4, 17, 8, 3);
    hctx.fillRect(20, 17, 8, 3);
    // Red/green navigation LEDs
    hctx.fillStyle = '#ef4444';
    hctx.fillRect(6, 5, 2, 2);
    hctx.fillStyle = '#22c55e';
    hctx.fillRect(24, 5, 2, 2);

    this.sprites.droneHex = hex;

    // 3. Heavy Attack UAV ("Альбатрос")
    const { canvas: heavy, ctx: actx } = this.createPixelCanvas(46, 26);
    // Fuselage
    actx.fillStyle = '#1e293b';
    actx.fillRect(10, 10, 32, 6);
    // Nose radome
    actx.fillStyle = '#475569';
    actx.fillRect(38, 9, 6, 8);
    // Long high-aspect wings
    actx.fillStyle = '#334155';
    actx.fillRect(20, 2, 10, 22);
    actx.fillStyle = '#0f172a';
    actx.fillRect(22, 0, 6, 26);
    // Twin boom tails
    actx.fillStyle = '#475569';
    actx.fillRect(4, 4, 16, 3);
    actx.fillRect(4, 19, 16, 3);
    // Inverted V-tail
    actx.fillRect(0, 3, 4, 20);
    // Underwing payload pylons (bombs/missiles)
    actx.fillStyle = '#dc2626';
    actx.fillRect(22, 4, 5, 2);
    actx.fillRect(22, 20, 5, 2);

    this.sprites.droneHeavy = heavy;
  }

  // Generate Mini-Boss: Ballistic Missile "ФЛАМИНГО"
  generateFlamingoMissile() {
    const w = 72;
    const h = 26;
    const { canvas, ctx } = this.createPixelCanvas(w, h);

    // Aerodynamic missile body (Heavy ballistic weapon)
    // Main fuselage tube
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(14, 8, 44, 10);
    // Shading
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(14, 14, 44, 4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(14, 16, 44, 2);

    // Conical warhead nosecone
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(58, 8);
    ctx.lineTo(70, 13);
    ctx.lineTo(58, 18);
    ctx.closePath();
    ctx.fill();
    // Armored penetrator tip
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(67, 12, 4, 2);

    // Characteristic "ФЛАМИНГО" identification red-pink warning bands
    ctx.fillStyle = '#ec4899'; // Flamingo bright pink-red
    ctx.fillRect(38, 8, 8, 10);
    ctx.fillStyle = '#be185d';
    ctx.fillRect(48, 8, 4, 10);

    // Stabilizing guidance fins at tail
    ctx.fillStyle = '#334155';
    // Top fin
    ctx.beginPath();
    ctx.moveTo(14, 8);
    ctx.lineTo(6, 2);
    ctx.lineTo(12, 2);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(14, 18);
    ctx.lineTo(6, 24);
    ctx.lineTo(12, 24);
    ctx.lineTo(20, 18);
    ctx.closePath();
    ctx.fill();

    // Rocket nozzle
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, 9, 6, 8);

    this.sprites.flamingo = canvas;
  }

  // Generate Vikhr-1 missile
  generateVikhrMissile() {
    const { canvas, ctx } = this.createPixelCanvas(24, 10);
    // Cylinder body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(4, 3, 14, 4);
    // Nose seeker
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 4, 4, 2);
    // Steering canards and tail fins
    ctx.fillStyle = '#334155';
    ctx.fillRect(14, 1, 2, 8);
    ctx.fillRect(3, 1, 3, 8);
    // Rocket motor nozzle
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, 4, 4, 2);

    this.sprites.vikhr = canvas;
  }
}

window.spriteEngine = new SpriteEngine();
