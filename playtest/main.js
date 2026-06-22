(() => {
  "use strict";

  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("game"));
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

  const W = canvas.width;
  const H = canvas.height;

  // ---------- Assets ----------
  const assets = {
    kaguyaSheet: new Image(),
    kaguyaReady: false,
    kaguyaExpr: new Image(),
    kaguyaExprReady: false,
    energyHenSheet: new Image(),
    energyHenReady: false,
    octopusSheet: new Image(),
    octopusReady: false,
    pufferSheet: new Image(),
    pufferReady: false,
    starfishSheet: new Image(),
    starfishReady: false,
    raijinSheet: new Image(),
    raijinReady: false,
    bossPrinceSheet: new Image(),
    bossPrinceReady: false,
    bossRichSheet: new Image(),
    bossRichReady: false,
    bossShogunSheet: new Image(),
    bossShogunReady: false,
    // Stage backgrounds (White Prince)
    bgStage: new Image(),
    bgStageReady: false,
    bgStageStorm: new Image(),
    bgStageStormReady: false,
    cloudClear: new Image(),
    cloudClearReady: false,
    cloudWindy: new Image(),
    cloudWindyReady: false,
    cloudStorm: new Image(),
    cloudStormReady: false,
  };
  assets.kaguyaSheet.onload = () => (assets.kaguyaReady = true);
  assets.kaguyaSheet.src =
    "./assets/sprites/player/BambooKaguya/sheets/bamboo_kaguya_keyed_v2_4x2_256.png";
  assets.kaguyaExpr.onload = () => (assets.kaguyaExprReady = true);
  assets.kaguyaExpr.src =
    "./assets/sprites/player/BambooKaguya/sheets/bamboo_kaguya_expressions_keyed_v2_3x1_256.png";
  assets.energyHenSheet.onload = () => (assets.energyHenReady = true);
  assets.energyHenSheet.src =
    "./assets/sprites/enemies/energy-hen/sheet_keyed_4x1_256.png";

  assets.octopusSheet.onload = () => (assets.octopusReady = true);
  assets.octopusSheet.src =
    "./assets/sprites/enemies/cute-minions/winged-octopus/sheet_keyed_4x1_256.png";
  assets.pufferSheet.onload = () => (assets.pufferReady = true);
  assets.pufferSheet.src =
    "./assets/sprites/enemies/cute-minions/angry-puffer/sheet_keyed_4x1_256.png";
  assets.starfishSheet.onload = () => (assets.starfishReady = true);
  assets.starfishSheet.src =
    "./assets/sprites/enemies/cute-minions/flying-starfish/sheet_keyed_4x1_256.png";

  assets.raijinSheet.onload = () => (assets.raijinReady = true);
  assets.raijinSheet.src =
    "./assets/sprites/bosses/midboss-raijin-girl/sheet_keyed_4x1_256.png";
  assets.bossPrinceSheet.onload = () => (assets.bossPrinceReady = true);
  assets.bossPrinceSheet.src =
    "./assets/sprites/bosses/bigboss-prince/sheet_keyed_4x1_256.png";
  assets.bossRichSheet.onload = () => (assets.bossRichReady = true);
  assets.bossRichSheet.src =
    "./assets/sprites/bosses/bigboss-richman/sheet_keyed_4x1_256.png";
  assets.bossShogunSheet.onload = () => (assets.bossShogunReady = true);
  assets.bossShogunSheet.src =
    "./assets/sprites/bosses/bigboss-shogun/sheet_keyed_4x1_256.png";

  // Custom stage base tile (user-provided). If missing, we fall back to procedural backgrounds.
  assets.bgStage.onload = () => (assets.bgStageReady = true);
  assets.bgStage.src =
    "./assets/stages/white-prince/custom/layer0_custom_tile_1024.png";
  // Optional storm variant tile
  assets.bgStageStorm.onload = () => (assets.bgStageStormReady = true);
  assets.bgStageStorm.src =
    "./assets/stages/white-prince/custom/layer0_custom_tile_1024.png";

  assets.cloudClear.onload = () => (assets.cloudClearReady = true);
  assets.cloudClear.src =
    "./assets/stages/white-prince/01_bamboo-grove/layer2_clouds_clear_keyed_1024x512.png";
  assets.cloudWindy.onload = () => (assets.cloudWindyReady = true);
  assets.cloudWindy.src =
    "./assets/stages/white-prince/02_seaside-island/layer2_clouds_windy_keyed_1024x512.png";
  assets.cloudStorm.onload = () => (assets.cloudStormReady = true);
  assets.cloudStorm.src =
    "./assets/stages/white-prince/03_open-sea-storm/layer2_clouds_storm_keyed_1024x512.png";

  function drawFrameImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  // ---------- Utilities ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;

  function roundRectPath(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function easeOutCubic(t) {
    const u = 1 - t;
    return 1 - u * u * u;
  }

  // ---------- Input ----------
  const keys = new Set();
  const pressed = new Set();
  window.addEventListener("keydown", (e) => {
    keys.add(e.code);
    pressed.add(e.code);
    // Start audio (BGM) after first user gesture.
    ensureAudio();
    // prevent scroll
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code) ||
      (e.code.startsWith("Key") && ["W", "A", "S", "D"].includes(e.code.slice(3)))
    ) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  canvas.addEventListener("pointerdown", () => ensureAudio());

  const isDown = (code) => keys.has(code);
  const isPressed = (code) => pressed.has(code);

  // ---------- Audio (BGM + simple SFX) ----------
  const bgm = new Audio("./assets/audio/bgm/Ascent_of_the_Bamboo_Grove.mp3");
  bgm.loop = true;
  bgm.volume = 0.35;
  let bgmStarted = false;
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    if (!bgmStarted) {
      bgmStarted = true;
      bgm.play().catch(() => {
        bgmStarted = false;
      });
    }
  }
  function beep({ freq = 880, dur = 0.1, type = "sine", gain = 0.05 } = {}) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  function noiseBurst({ dur = 0.15, gain = 0.03 } = {}) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const bufferSize = Math.floor(audioCtx.sampleRate * dur);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(g).connect(audioCtx.destination);
    src.start(t0);
  }

  // ---------- Game State ----------
  const GameMode = Object.freeze({
    DEMO: "demo",
    STAGE: "stage",
    BOSS_WARNING: "boss_warning",
    BOSS: "boss",
    RESULT: "result",
    END: "end",
  });

  const WeaponType = Object.freeze({
    BULLET: "bullet",
    TRISHOT: "trishot",
    CANNON: "cannon",
    MISSILES: "missiles",
  });

  const WeatherType = Object.freeze({
    CLEAR: "clear",
    WINDY: "windy",
    RAIN: "rain",
  });

  const StageBiome = Object.freeze({
    LAND: "land",
    OCEAN: "ocean",
    ATMOS: "atmos",
    SPACE: "space",
    MOON: "moon",
  });

  const config = {
    stageDuration: 60, // seconds
    bossStartTime: 50, // seconds (boss warning starts here)
    bossWarningDuration: 3.0,
    bossPassThreshold: 0.7,
  };

  const state = {
    t: 0,
    dt: 0,
    demoT: 0,
    mode: GameMode.STAGE,
    modeT: 0,
    stageT: 0,
    biome: StageBiome.LAND,
    score: 0,
    subtitle: "",
    subtitleT: 0,
    flashRedT: 0,
    lives: 3,
    hp: 100,
    hpMax: 100,
    gameOver: false,
    boss: null, // {hp,hpMax, damageTaken}
    hurtT: 0,
    bossesDefeated: 0,
    endT: 0,
  };

  // ---------- Weather / Wind ----------
  function windVectorFromDir(dir) {
    // dir: radians, 0 is +x, -pi/2 is up
    return { x: Math.cos(dir), y: Math.sin(dir) };
  }

  function makeWeather(type) {
    const dir = rand(-Math.PI, Math.PI);
    const strength = type === WeatherType.CLEAR ? 0.15 : type === WeatherType.WINDY ? 0.7 : 0.45;
    const v = windVectorFromDir(dir);
    return {
      type,
      dir,
      strength,
      // move impact scalars
      // forward is -y (up)
      forward: -v.y * strength,
      side: v.x * strength,
    };
  }

  const weather = {
    now: makeWeather(WeatherType.CLEAR),
    next: makeWeather(WeatherType.WINDY),
    changeTimer: 0,
    forecastLead: 30,
  };

  function stepWeather(dt) {
    weather.changeTimer += dt;
    // change "now" every 30s, and maintain 30s-ahead forecast
    if (weather.changeTimer >= weather.forecastLead) {
      weather.changeTimer -= weather.forecastLead;
      weather.now = weather.next;
      const roll = Math.random();
      const nextType =
        roll < 0.52 ? WeatherType.CLEAR : roll < 0.82 ? WeatherType.WINDY : WeatherType.RAIN;
      weather.next = makeWeather(nextType);
    }
  }

  // ---------- Entities ----------
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,r:number,damage:number,kind:string,color?:string,homing?:boolean,owner?:string}[]} */
  const bullets = [];
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,r:number,damage:number,owner?:string,turn:number,noise:number,targetId?:number}[]} */
  const missiles = [];
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,r:number,damage:number,kind:"ebullet"|"cruise",owner?:string,turn?:number,noise?:number,homing?:number}[]} */
  const enemyShots = [];
  /** @type {{x:number,y:number,vx:number,vy:number,hp:number,hpMax:number,r:number,kind:string,tag?:string,id:number,drop?:string,hurtT?:number,shotT?:number,laughT?:number,bossVariant?:string}[]} */
  const enemies = [];
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,kind:string,size:number}[]} */
  const particles = [];
  /** @type {{x:number,y:number,vx:number,vy:number,life:number,kind:"weapon"|"power"|"hp",value:any,homing?:boolean}[]} */
  const pickups = [];

  let nextEnemyId = 1;

  const player = {
    x: W * 0.5,
    y: H * 0.78,
    vx: 0,
    vy: 0,
    layerZ: 0.5, // 0..1 between mid/back layer for parallax feel
    invuln: 0,
    weapon: WeaponType.BULLET,
    power: 1, // 1..5
    shootT: 0,
    cannonT: 0,
    laserHeat: 0,
    laserTickT: 0,
    missileT: 0,
    missileLevel: 0, // support missiles (M) that coexist with any weapon
    sfxT: 0,
  };

  function resetRun({ keepScore = false } = {}) {
    state.mode = GameMode.STAGE;
    state.modeT = 0;
    state.stageT = 0;
    state.demoT = 0;
    state.endT = 0;
    state.bossesDefeated = 0;
    state.biome = StageBiome.LAND;
    if (!keepScore) state.score = 0;
    state.subtitle = "";
    state.subtitleT = 0;
    state.flashRedT = 0;
    state.lives = 3;
    state.hp = state.hpMax;
    state.gameOver = false;
    state.boss = null;
    bullets.length = 0;
    missiles.length = 0;
    enemyShots.length = 0;
    enemies.length = 0;
    particles.length = 0;
    pickups.length = 0;
    player.x = W * 0.5;
    player.y = H * 0.78;
    player.vx = 0;
    player.vy = 0;
    player.layerZ = 0.5;
    player.invuln = 1.5;
    player.weapon = WeaponType.BULLET;
    player.power = 1;
    player.shootT = 0;
    player.cannonT = 0;
    player.laserHeat = 0;
    player.laserTickT = 0;
    player.missileT = 0;
    player.missileLevel = 0;
    player.sfxT = 0;
    weather.now = makeWeather(WeatherType.CLEAR);
    weather.next = makeWeather(WeatherType.WINDY);
    weather.changeTimer = 0;
    spawnEnemy("energy", W * 0.5, -36, { drop: "power" });
  }

  const LS_HAS_PLAYED = "spacefighter_has_played_v1";
  function startDemo() {
    resetRun({ keepScore: false });
    state.mode = GameMode.DEMO;
    state.demoT = 0;
    // Make demo forgiving and stable.
    state.lives = 99;
    state.hp = state.hpMax;
    player.invuln = 999;
    // Seed a bit of action.
    for (let i = 0; i < 5; i++) spawnEnemy("grunt_down", rand(60, W - 60), -rand(40, 280));
  }

  function startPlay() {
    try {
      localStorage.setItem(LS_HAS_PLAYED, "1");
    } catch {}
    resetRun({ keepScore: false });
    state.mode = GameMode.STAGE;
    // fullscreen when actually playing
    const el = canvas;
    if (document.fullscreenElement == null && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }

  // ---------- Spawning ----------
  function spawnParticleBurst(x, y, color, n = 14, base = 140) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, Math.PI);
      const sp = rand(base * 0.25, base);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.25, 0.65),
        kind: color,
        size: rand(1.2, 2.8),
      });
    }
  }

  function spawnEnemy(kind, x, y, opts = {}) {
    const base = {
      id: nextEnemyId++,
      x,
      y,
      vx: 0,
      vy: 80,
      r: 14,
      hp: 18,
      hpMax: 18,
      kind,
      tag: opts.tag,
      drop: opts.drop,
    };

    if (kind === "grunt_down") {
      base.r = 12;
      base.hp = base.hpMax = 1;
      base.vy = rand(80, 120);
      base.vx = rand(-20, 20);
      base.fireT = rand(1.0, 2.1);
      base.pattern = "triple";
    } else if (kind === "grunt_swarm") {
      base.r = 11;
      base.hp = base.hpMax = 1;
      base.vy = rand(30, 70);
      base.vx = rand(-90, 90);
      base.fireT = rand(1.2, 2.4);
      base.pattern = "slow";
      base.swarmPhase = rand(0, TAU);
      base.side = opts.side || (Math.random() < 0.5 ? -1 : 1); // -1 left, 1 right
      base.targetOrbit = rand(80, 140);
    } else if (kind === "grunt_cruise") {
      base.r = 12;
      base.hp = base.hpMax = 1;
      base.vy = rand(60, 95);
      base.vx = rand(-40, 40);
      base.fireT = rand(2.4, 4.0);
      base.pattern = "cruise";
    } else if (kind === "energy") {
      base.r = 13;
      base.hp = base.hpMax = 10;
      base.vy = rand(80, 120);
    } else if (kind === "midboss") {
      base.r = 26;
      base.hp = base.hpMax = 20;
      base.vy = 40;
      base.fireT = 1.1;
      base.pattern = "mix";
    } else if (kind === "boss") {
      base.r = 44;
      base.hp = base.hpMax = 1000;
      base.vy = 28;
      base.fireT = 1.4;
      base.spawnT = 6.0;
      base.pattern = "summon";
    }

    enemies.push(base);
    return base;
  }

  function dropFromEnemy(e) {
    if (!e.drop) return;
    if (e.drop === "hp") {
      pickups.push({
        x: e.x,
        y: e.y,
        vx: rand(-30, 30),
        vy: rand(40, 80),
        life: 12,
        kind: "hp",
        value: 18,
        homing: false,
      });
      return;
    }
    if (e.drop === "power") {
      // Power-up follows the player after the carrier is hit
      pickups.push({
        x: e.x,
        y: e.y,
        vx: rand(-40, 40),
        vy: rand(60, 110),
        life: 14,
        kind: "power",
        value: 1,
        homing: true,
      });
      return;
    }
    // Weapon bonus follows the player after the carrier is hit (until collected or exits the screen)
    pickups.push({
      x: e.x,
      y: e.y,
      vx: rand(-40, 40),
      vy: rand(60, 110),
      life: 14,
      kind: "weapon",
      value: e.drop,
      homing: true,
    });
  }

  // ---------- Collision ----------
  function circleHit(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  }

  // ---------- Weapons ----------
  function weaponName(type) {
    switch (type) {
      case WeaponType.BULLET:
        return "Speed Shot";
      case WeaponType.TRISHOT:
        return "Tri-Shot";
      case WeaponType.CANNON:
        return "Cannon";
      case WeaponType.MISSILES:
        return "Missiles";
      default:
        return "Unknown";
    }
  }

  function tryShoot(dt) {
    player.shootT += dt;
    player.cannonT += dt;
    player.missileT += dt;
    player.laserTickT += dt;
    player.sfxT += dt;

    // Support missiles (M) are full-auto and coexist with any weapon.
    tryAutoMissiles(dt);

    // Legacy laser heat is unused.
    player.laserHeat = 0;
    player.laserTickT = 0;

    const slow = isDown("ShiftLeft") || isDown("ShiftRight");
    const fire = isDown("Space");
    if (!fire) {
      return;
    }

    ensureAudio();

    const p = player.power;

    const baseBullet = player.weapon === WeaponType.BULLET;

    if (baseBullet) {
      // bullet fire rate scales with power: 1x 6/s -> 5x 16/s
      const rate = lerp(6, 16, (p - 1) / 4);
      const interval = 1 / rate;
      let fired = 0;
      while (player.shootT >= interval) {
        player.shootT -= interval;
        fired++;
        bullets.push({
          x: player.x,
          y: player.y - 16,
          vx: 0,
          // Speed Shot: projectile speed increases with power.
          vy: -lerp(560, 820, (p - 1) / 4),
          life: 1.6,
          r: 3.5,
          damage: 8,
          kind: "pbullet",
        });
      }
      if (fired > 0 && !slow && player.sfxT >= 0.05) {
        player.sfxT = 0;
        beep({ freq: 980, dur: 0.03, type: "square", gain: 0.02 });
      }
    } else if (player.weapon === WeaponType.TRISHOT) {
      const rate = lerp(5, 12, (p - 1) / 4);
      const interval = 1 / rate;
      let fired = 0;
      while (player.shootT >= interval) {
        player.shootT -= interval;
        fired++;
        const spread = 0.28;
        for (const a of [-spread, 0, spread]) {
          bullets.push({
            x: player.x,
            y: player.y - 16,
            vx: Math.sin(a) * 140,
            vy: -500 * Math.cos(a),
            life: 1.7,
            r: 3.2,
            damage: 7,
            kind: "pbullet",
          });
        }
      }
      if (fired > 0 && !slow && player.sfxT >= 0.06) {
        player.sfxT = 0;
        beep({ freq: 900, dur: 0.03, type: "square", gain: 0.02 });
      }
    } else if (player.weapon === WeaponType.CANNON) {
      // Cannon: discrete shots with decreasing interval as power increases.
      // 1x: 2.0s interval, 5x: 0.35s interval
      const interval = lerp(2.0, 0.35, (p - 1) / 4);
      while (player.cannonT >= interval) {
        player.cannonT = 0;
        spawnCannonShot();
      }
    }
  }

  function tryAutoMissiles(dt) {
    // Full-auto homing support missiles (M) that coexist with any weapon.
    const lvl = player.missileLevel | 0;
    if (lvl <= 0) return;
    const count = Math.round(lerp(1, 10, (lvl - 1) / 4));
    // slower salvos early to reduce clutter; power increases count instead of raw fire rate
    const interval = 1.05;
    if (player.missileT < interval) return;
    player.missileT = 0;
    ensureAudio();
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 6;
      missiles.push({
        x: player.x + off,
        y: player.y - 10,
        vx: rand(-40, 40),
        vy: -260,
        life: 3.2,
        r: 5,
        damage: 16,
        owner: "player",
        turn: 6.5,
        noise: 0.25,
      });
    }
    beep({ freq: 520, dur: 0.06, type: "triangle", gain: 0.018 });
  }

  function spawnCannonShot() {
    ensureAudio();
    bullets.push({
      x: player.x,
      y: player.y - 18,
      vx: 0,
      vy: -420,
      life: 2.2,
      r: 16,
      damage: 70,
      kind: "cannon",
      pwr: player.power,
    });
    noiseBurst({ dur: 0.08, gain: 0.02 });
  }

  // (Net weapon removed)

  // ---------- Enemy Attacks ----------
  function fireTripleDown(e) {
    ensureAudio();
    const speed = 210;
    const spread = 0.22;
    for (const a of [-spread, 0, spread]) {
      enemyShots.push({
        x: e.x,
        y: e.y + e.r + 6,
        vx: Math.sin(a) * 60,
        vy: Math.cos(a) * speed,
        life: 4.0,
        r: 3.8,
        damage: 10,
        kind: "ebullet",
      });
    }
    beep({ freq: 360, dur: 0.05, type: "square", gain: 0.012 });
  }

  function fireSlowAtPlayer(e, count = 1) {
    ensureAudio();
    const baseSpeed = 190;
    for (let i = 0; i < count; i++) {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const nx = dx / dist;
      const ny = dy / dist;
      const jitter = 0.12;
      const tx = nx + rand(-jitter, jitter);
      const ty = ny + rand(-jitter, jitter);
      const mag = Math.hypot(tx, ty) || 1;
      const ux = tx / mag;
      const uy = ty / mag;
      enemyShots.push({
        x: e.x + rand(-4, 4),
        y: e.y + e.r + 5,
        vx: ux * baseSpeed,
        vy: uy * baseSpeed,
        life: 4.2,
        r: 3.6,
        damage: 9,
        kind: "ebullet",
      });
    }
    beep({ freq: 320, dur: 0.05, type: "square", gain: 0.01 });
  }

  function fireCruiseMissile(e) {
    ensureAudio();
    enemyShots.push({
      x: e.x,
      y: e.y + e.r + 8,
      vx: rand(-40, 40),
      vy: 120,
      life: 5.6,
      r: 6.5,
      damage: 9999,
      kind: "cruise",
      // nerf: weaker turning + slower, still inaccurate
      turn: 1.55,
      noise: 1.25,
      homing: 0.7, // only try to home briefly
    });
    beep({ freq: 220, dur: 0.08, type: "triangle", gain: 0.018 });
  }

  function fireMidBossScatter(e, bulletsCount = 11) {
    ensureAudio();
    const baseSpeed = 220;
    for (let i = 0; i < bulletsCount; i++) {
      const a = rand(-Math.PI * 0.95, Math.PI * 0.95);
      // bias downward
      const downBias = 0.55;
      const vx = Math.cos(a) * baseSpeed;
      const vy = Math.abs(Math.sin(a)) * baseSpeed * (0.65 + downBias);
      enemyShots.push({
        x: e.x + rand(-8, 8),
        y: e.y + rand(8, 16),
        vx,
        vy,
        life: 4.6,
        r: 4.2,
        damage: e.kind === "midboss" ? 14 : 16,
        kind: "ebullet",
      });
    }
    noiseBurst({ dur: 0.06, gain: 0.012 });
  }

  function fireMidBossMissiles(e, count = 4) {
    ensureAudio();
    for (let i = 0; i < count; i++) {
      enemyShots.push({
        x: e.x + (i - (count - 1) / 2) * 10,
        y: e.y + 16,
        vx: rand(-40, 40),
        vy: 120,
        life: 6.2,
        r: 6.2,
        damage: e.kind === "midboss" ? 22 : 24,
        kind: "cruise",
        turn: 1.7,
        noise: 0.95,
        homing: 0.9, // brief assist, then mostly miss
      });
    }
    beep({ freq: 180, dur: 0.12, type: "sawtooth", gain: 0.016 });
  }

  function bossSummonAdds(boss) {
    // spawn either a midboss or a small group near top
    ensureAudio();
    if (Math.random() < 0.35 && !enemies.some((e) => e.kind === "midboss")) {
      spawnEnemy("midboss", rand(W * 0.25, W * 0.75), -50, { drop: "power" });
      state.subtitle = "Boss summon: mid boss incoming!";
      state.subtitleT = 1.6;
      beep({ freq: 140, dur: 0.14, type: "square", gain: 0.02 });
      return;
    }
    // otherwise: mix of small enemies
    const pack = 6 + Math.floor(rand(0, 4));
    for (let i = 0; i < pack; i++) {
      const roll = Math.random();
      const kind = roll < 0.55 ? "grunt_down" : roll < 0.82 ? "grunt_cruise" : "grunt_swarm";
      const x = kind === "grunt_swarm" ? (Math.random() < 0.5 ? -40 : W + 40) : rand(40, W - 40);
      const y = -rand(40, 180);
      spawnEnemy(kind, x, y, { side: x < 0 ? -1 : 1, drop: null });
    }
    state.subtitle = "Boss summon: reinforcements incoming!";
    state.subtitleT = 1.4;
    noiseBurst({ dur: 0.08, gain: 0.01 });
  }

  // ---------- Stage / Waves ----------
  function biomeAt(stageT) {
    const t = stageT / config.stageDuration;
    if (t < 0.2) return StageBiome.LAND;
    if (t < 0.4) return StageBiome.OCEAN;
    if (t < 0.6) return StageBiome.ATMOS;
    if (t < 0.82) return StageBiome.SPACE;
    return StageBiome.MOON;
  }

  function stageSpawns(dt) {
    // simple timed spawns
    const t = state.stageT;
    // grunts wave
    // Slow start for early achievement, ramps slightly later
    const waveEvery = t < 22 ? 5.4 : t < 40 ? 4.2 : 3.6;
    if (Math.floor((t - dt) / waveEvery) !== Math.floor(t / waveEvery)) {
      const baseN = t < 18 ? 2 : t < 40 ? 3 : 4;
      const n = baseN + Math.floor(Math.min(2, t / 28));
      for (let i = 0; i < n; i++) {
        const roll = Math.random();
        // cruise type is rarer early
        const kind =
          roll < 0.62 ? "grunt_down" : roll < (t < 20 ? 0.76 : 0.84) ? "grunt_swarm" : "grunt_cruise";
        spawnEnemy(kind, rand(40, W - 40), -rand(20, 180), { drop: Math.random() < 0.06 ? "hp" : null });
      }
      // side swarm (5) sometimes
      if (t > 14 && Math.random() < (t < 30 ? 0.08 : 0.14)) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const y0 = rand(120, 320);
        for (let i = 0; i < 5; i++) {
          spawnEnemy("grunt_swarm", side < 0 ? -40 - i * 14 : W + 40 + i * 14, y0 + i * 18, { side });
        }
      }
      if (Math.random() < 0.38) {
        const dropRoll = Math.random();
        const drop =
          dropRoll < 0.25
            ? "power"
            : dropRoll < 0.45
              ? WeaponType.TRISHOT
              : dropRoll < 0.65
                ? WeaponType.BULLET
                : dropRoll < 0.82
                  ? WeaponType.CANNON
                  : WeaponType.MISSILES;
        spawnEnemy("energy", rand(50, W - 50), -40, { drop });
      }
    }

    // midboss around 30s if not already
    if (t > 29 && t < 31 && !enemies.some((e) => e.kind === "midboss") && state.mode === GameMode.STAGE) {
      spawnEnemy("midboss", W * 0.5, -60, { drop: "power" });
    }
  }

  function startBossSequence() {
    state.mode = GameMode.BOSS_WARNING;
    state.modeT = 0;
    state.flashRedT = config.bossWarningDuration;
    state.subtitle = "Warning! Boss incoming!";
    state.subtitleT = 2.4;
    ensureAudio();
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        beep({ freq: 160, dur: 0.18, type: "sawtooth", gain: 0.03 });
        beep({ freq: 90, dur: 0.18, type: "square", gain: 0.02 });
      }, i * 250);
    }
  }

  function spawnBoss() {
    const variants = ["prince", "richman", "shogun"];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    const b = spawnEnemy("boss", W * 0.5, -90, { tag: "boss" });
    b.bossVariant = variant;
    state.boss = {
      hpMax: b.hpMax,
      damageTaken: 0,
    };
  }

  function bossProgress() {
    if (!state.boss) return 0;
    return clamp(state.boss.damageTaken / state.boss.hpMax, 0, 1);
  }

  // ---------- Update ----------
  function update(dt) {
    state.t += dt;
    state.dt = dt;

    if (state.mode === GameMode.DEMO) {
      state.demoT += dt;
      // Press Enter to start immediately.
      if (isPressed("Enter")) {
        startPlay();
        return;
      }
      // Loop the demo every 15s until user starts.
      if (state.demoT >= 15) {
        state.demoT = 0;
        // soft reset the action without switching mode
        enemies.length = 0;
        bullets.length = 0;
        missiles.length = 0;
        pickups.length = 0;
        state.stageT = 0;
        state.modeT = 0;
        state.boss = null;
        state.biome = StageBiome.LAND;
        state.hp = state.hpMax;
        player.invuln = 999;
        for (let i = 0; i < 5; i++) spawnEnemy("grunt_down", rand(60, W - 60), -rand(40, 280));
      }
      // Demo autopilot: gentle movement + auto fire.
      const tx = W * 0.5 + Math.sin(state.t * 0.65) * (W * 0.22);
      const ty = H * 0.72 + Math.sin(state.t * 0.9) * (H * 0.05);
      player.x = lerp(player.x, tx, 1 - Math.pow(0.0005, dt));
      player.y = lerp(player.y, ty, 1 - Math.pow(0.0005, dt));
      player.x = clamp(player.x, 22, W - 22);
      player.y = clamp(player.y, 70, H - 26);
      state.stageT += dt;
      state.biome = biomeAt(state.stageT);
      stageSpawns(dt);
      // Fake "fire": hold Space behavior for bullet/cannon and laser already auto.
      keys.add("Space");
    }

    if (state.subtitleT > 0) {
      state.subtitleT -= dt;
      if (state.subtitleT <= 0) state.subtitle = "";
    }
    if (state.flashRedT > 0) state.flashRedT -= dt;
    if (state.hurtT > 0) state.hurtT -= dt;

    stepWeather(dt);

    if (state.gameOver) {
      if (isPressed("Enter")) startPlay();
      return;
    }

    if (state.mode === GameMode.END) {
      state.endT += dt;
      if (isPressed("Enter")) startPlay();
      return;
    }

    if (state.mode === GameMode.STAGE) {
      state.stageT += dt;
      state.biome = biomeAt(state.stageT);
      stageSpawns(dt);
      if (state.stageT >= config.bossStartTime) {
        startBossSequence();
      }
    } else if (state.mode === GameMode.BOSS_WARNING) {
      state.modeT += dt;
      if (state.modeT >= config.bossWarningDuration) {
        state.mode = GameMode.BOSS;
        state.modeT = 0;
        spawnBoss();
      }
    } else if (state.mode === GameMode.BOSS) {
      state.modeT += dt;
      // If boss is dead, end stage quickly.
      if (!enemies.some((e) => e.kind === "boss")) {
        state.bossesDefeated += 1;
        if (state.bossesDefeated >= 3) {
          state.mode = GameMode.END;
          state.endT = 0;
          state.subtitle = "";
          state.subtitleT = 0;
          enemies.length = 0;
          bullets.length = 0;
          missiles.length = 0;
          enemyShots.length = 0;
          pickups.length = 0;
          particles.length = 0;
        } else {
          state.mode = GameMode.RESULT;
          state.modeT = 0;
          state.subtitle = "Boss defeated!";
          state.subtitleT = 2.2;
        }
      }
      // hard timeout at 30s for boss fight then evaluate progress
      if (state.modeT >= 30) {
        const progress = bossProgress();
        if (progress < config.bossPassThreshold) {
          state.subtitle = `Boss progress ${(progress * 100).toFixed(0)}% < 70%: retry stage`;
          state.subtitleT = 3.2;
          // reset stage portion but keep score/lives/hp and keep weapon
          state.mode = GameMode.STAGE;
          state.modeT = 0;
          state.stageT = 0;
          state.biome = StageBiome.LAND;
          state.boss = null;
          // clear boss/enemy projectiles/large threats
          for (let i = enemies.length - 1; i >= 0; i--) enemies.splice(i, 1);
          for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].kind !== "pbullet" && bullets[i].kind !== "cannon") bullets.splice(i, 1);
          missiles.length = 0;
        } else {
          state.mode = GameMode.RESULT;
          state.modeT = 0;
          state.subtitle = "Progress over 70%: stage clear";
          state.subtitleT = 3.0;
        }
      }
    } else if (state.mode === GameMode.RESULT) {
      state.modeT += dt;
      if (state.modeT >= 3.2) {
        // loop playtest: go back to stage
        state.mode = GameMode.STAGE;
        state.modeT = 0;
        state.stageT = 0;
        state.biome = StageBiome.LAND;
        state.boss = null;
        enemies.length = 0;
        bullets.length = 0;
        missiles.length = 0;
        pickups.length = 0;
        player.invuln = 1.1;
      }
    }

    // weapon quick switch for testing
    if (isPressed("Digit1")) player.weapon = WeaponType.BULLET;
    if (isPressed("Digit2")) player.weapon = WeaponType.TRISHOT;
    if (isPressed("Digit3")) player.weapon = WeaponType.BULLET;
    if (isPressed("Digit4")) player.weapon = WeaponType.CANNON;
    // MISSILES is a support (M) system now; keep weapon selection to the four main types.
    if (isPressed("Digit5")) player.weapon = WeaponType.BULLET;

    // Player movement (wind affects)
    const slow = isDown("ShiftLeft") || isDown("ShiftRight");
    const ax = (isDown("ArrowLeft") || isDown("KeyA") ? -1 : 0) + (isDown("ArrowRight") || isDown("KeyD") ? 1 : 0);
    const ay = (isDown("ArrowUp") || isDown("KeyW") ? -1 : 0) + (isDown("ArrowDown") || isDown("KeyS") ? 1 : 0);

    // base speed
    let baseSpeed = slow ? 210 : 320;
    // forward wind: positive forward means faster upward (negative y)
    // Weather no longer affects gameplay movement (visual-only).
    const sideDrift = 0;
    const controlX = baseSpeed * 1.02;

    player.vx = lerp(player.vx, ax * controlX + sideDrift, 1 - Math.pow(0.001, dt));
    player.vy = lerp(player.vy, ay * baseSpeed, 1 - Math.pow(0.001, dt));

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    player.x = clamp(player.x, 22, W - 22);
    player.y = clamp(player.y, 70, H - 26);

    // Depth movement (between layer 1 and 2) mapped to up/down input slightly
    player.layerZ = clamp(player.layerZ + (-ay) * dt * 0.35, 0, 1);

    if (player.invuln > 0) player.invuln -= dt;

    tryShoot(dt);

    // In demo, release the fake fire key after simulation step.
    if (state.mode === GameMode.DEMO) keys.delete("Space");

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.kind === "cannon") {
        // cannon slowly grows, then explodes on timeout or hit
        b.r += dt * 8;
      }
      if (b.life <= 0 || b.y < -80 || b.y > H + 120 || b.x < -120 || b.x > W + 120) bullets.splice(i, 1);
    }

    // Update missiles (homing)
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.life -= dt;
      // acquire target
      let target = null;
      let best = 1e9;
      for (const e of enemies) {
        if (e.kind === "energy") continue;
        const dx = e.x - m.x;
        const dy = e.y - m.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) {
          best = d2;
          target = e;
        }
      }
      if (target) {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        // add noise (rain makes worse)
        const n = m.noise;
        const tx = nx + rand(-n, n) * 0.25;
        const ty = ny + rand(-n, n) * 0.25;
        const mag = Math.hypot(tx, ty) || 1;
        const ux = tx / mag;
        const uy = ty / mag;
        const desiredVx = ux * 360;
        const desiredVy = uy * 360;
        const tturn = m.turn;
        m.vx = lerp(m.vx, desiredVx, 1 - Math.pow(0.00001, dt * tturn));
        m.vy = lerp(m.vy, desiredVy, 1 - Math.pow(0.00001, dt * tturn));
      } else {
        m.vy -= 40 * dt;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.life <= 0 || m.y < -120 || m.y > H + 140 || m.x < -140 || m.x > W + 140) missiles.splice(i, 1);
    }

    // Update enemy shots
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const s = enemyShots[i];
      s.life -= dt;
      if (s.kind === "cruise") {
        // inaccurate cruise missile: only homes briefly, then becomes mostly ballistic.
        if ((s.homing ?? 0) > 0) {
          s.homing -= dt;
          const dx = player.x - s.x;
          const dy = player.y - s.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const nx = dx / dist;
          const ny = dy / dist;
          const n = s.noise ?? 0.9;
          // very low accuracy: large directional noise
          const tx = nx + rand(-n, n) * 0.55;
          const ty = ny + rand(-n, n) * 0.55;
          const mag = Math.hypot(tx, ty) || 1;
          const ux = tx / mag;
          const uy = ty / mag;
          const desiredVx = ux * 185;
          const desiredVy = uy * 185;
          const tturn = s.turn ?? 1.6;
          s.vx = lerp(s.vx, desiredVx, 1 - Math.pow(0.00001, dt * tturn));
          s.vy = lerp(s.vy, desiredVy, 1 - Math.pow(0.00001, dt * tturn));
        } else {
          // drift a bit; does not correct toward player
          s.vx += rand(-18, 18) * dt;
          s.vy += rand(-12, 12) * dt;
          const max = 220;
          s.vx = clamp(s.vx, -max, max);
          s.vy = clamp(s.vy, 40, max);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y < -160 || s.y > H + 180 || s.x < -180 || s.x > W + 180) enemyShots.splice(i, 1);
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (typeof e.hurtT === "number" && e.hurtT > 0) e.hurtT -= dt;
      if (typeof e.shotT === "number" && e.shotT > 0) e.shotT -= dt;
      if (typeof e.laughT === "number" && e.laughT > 0) e.laughT -= dt;
      // (Net weapon removed)
      // boss hover
      if (e.kind === "boss") {
        e.vy = e.y < 140 ? 70 : 0;
        e.vx = Math.sin(state.t * 0.8) * 34;
      } else if (e.kind === "midboss") {
        e.vy = e.y < 160 ? 60 : 10;
        e.vx = Math.sin(state.t * 1.3) * 42;
      } else if (e.kind === "grunt_down") {
        e.vx += Math.sin((state.t + e.id) * 1.2) * 10 * dt;
      } else if (e.kind === "grunt_swarm") {
        // come from sides, then orbit-ish to surround player
        const side = e.side ?? (e.x < W / 2 ? -1 : 1);
        const enterX = side < 0 ? 80 : W - 80;
        const enterT = clamp((e.y + 60) / 260, 0, 1);
        const desiredX = lerp(enterX, player.x + Math.cos(state.t * 0.9 + e.swarmPhase) * (e.targetOrbit ?? 110), enterT);
        const desiredY = lerp(e.y, player.y + Math.sin(state.t * 0.9 + e.swarmPhase) * 90 - 110, enterT);
        const dx = desiredX - e.x;
        const dy = desiredY - e.y;
        e.vx = lerp(e.vx, clamp(dx * 2.2, -180, 180), 1 - Math.pow(0.0001, dt));
        e.vy = lerp(e.vy, clamp(dy * 2.2, -140, 140), 1 - Math.pow(0.0001, dt));
        // prevent too deep behind player
        if (e.y > player.y + 120) e.vy -= 120 * dt;
      } else if (e.kind === "grunt_cruise") {
        e.vx += Math.sin((state.t + e.id) * 1.4) * 8 * dt;
      } else if (e.kind === "energy") {
        e.vx = Math.sin((state.t + e.id) * 1.2) * 26;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.x = clamp(e.x, 22, W - 22);

      // enemy attacks (slow bullets; some missiles)
      if (typeof e.fireT === "number") {
        e.fireT -= dt;
        if (e.fireT <= 0) {
          if (e.kind === "grunt_down") {
            fireTripleDown(e);
            e.fireT = rand(1.8, 2.8);
            e.shotT = 0.22;
          } else if (e.kind === "grunt_swarm") {
            fireSlowAtPlayer(e, 1);
            e.fireT = rand(2.2, 3.4);
            e.shotT = 0.22;
          } else if (e.kind === "grunt_cruise") {
            fireCruiseMissile(e);
            e.fireT = rand(3.2, 4.6);
            e.shotT = 0.28;
          } else if (e.kind === "midboss") {
            if (Math.random() < 0.55) fireMidBossScatter(e);
            else fireMidBossMissiles(e);
            e.fireT = rand(1.05, 1.7);
            e.shotT = 0.22;
          } else if (e.kind === "boss") {
            // boss shoots + summons
            if (Math.random() < 0.65) fireMidBossScatter(e, 9);
            else fireMidBossMissiles(e, 6);
            e.fireT = rand(0.95, 1.45);
            e.shotT = 0.18;
          }
        }
      }

      if (e.kind === "boss") {
        e.spawnT -= dt;
        if (e.spawnT <= 0) {
          e.spawnT = rand(4.2, 7.0);
          bossSummonAdds(e);
        }
      }

      if (e.y > H + 120) enemies.splice(i, 1);
    }

    // Update pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      p.life -= dt;
      if (p.homing) {
        // chase the player, but not perfectly (can overshoot and leave the screen)
        const dx = player.x - p.x;
        const dy = player.y - p.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const nx = dx / dist;
        const ny = dy / dist;
        const accel = 380;
        p.vx += nx * accel * dt;
        p.vy += ny * accel * dt;
        // add mild wobble so it can miss / drift off if player avoids
        p.vx += Math.sin(state.t * 5 + p.x * 0.02) * 18 * dt;
        p.vy += Math.cos(state.t * 4 + p.y * 0.02) * 10 * dt;
        const maxSp = 260;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSp) {
          p.vx = (p.vx / sp) * maxSp;
          p.vy = (p.vy / sp) * maxSp;
        }
      } else {
        p.vy += 18 * dt;
        p.vx *= Math.pow(0.2, dt);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || p.y > H + 120 || p.x < -120 || p.x > W + 120 || p.y < -140) pickups.splice(i, 1);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.1, dt);
      p.vy *= Math.pow(0.1, dt);
      if (p.life <= 0) particles.splice(i, 1);
    }

  // Collisions: player bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    // Cannon blast: explode on hit
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (b.kind !== "pbullet" && b.kind !== "cannon") continue;
      if (circleHit(b.x, b.y, b.r, e.x, e.y, e.r)) {
        if (e.kind === "energy") {
          // energy ship gives power/weapon
          state.score += 120;
          dropFromEnemy(e);
          spawnParticleBurst(e.x, e.y, "energy", 14, 110);
          enemies.splice(i, 1);
        } else {
          let dmg = b.damage;
          if (b.kind === "cannon") {
              // explode area damage
              const pwr = b.pwr || player.power;
              // Power scaling: radius increases and at 5x everything in radius dies.
              // 5x max radius roughly equals a midboss "size" on screen (about 52px diameter).
              const blastR = lerp(28, 52, (pwr - 1) / 4);
              for (const ee of enemies) {
                if (ee.kind === "energy") continue;
                const d = Math.hypot(ee.x - b.x, ee.y - b.y);
                if (d <= blastR) {
                  if (pwr >= 5) {
                    const dd = 9999;
                    ee.hp -= dd;
                    if (state.boss && ee.kind === "boss") state.boss.damageTaken += dd;
                  } else {
                    const fall = 1 - d / blastR;
                    const dd = dmg * (0.65 + 0.35 * fall);
                    ee.hp -= dd;
                    if (state.boss && ee.kind === "boss") state.boss.damageTaken += dd;
                  }
                }
              }
              spawnParticleBurst(b.x, b.y, "boom", 20, 180);
              noiseBurst({ dur: 0.09, gain: 0.02 });
              bullets.splice(j, 1);
            } else {
              e.hp -= dmg;
              e.hurtT = 0.16;
              bullets.splice(j, 1);
              spawnParticleBurst(e.x, e.y, "hit", 6, 70);
              if (state.boss && e.kind === "boss") state.boss.damageTaken += dmg;
            }

            if (e.hp <= 0) {
              state.score += e.kind === "boss" ? 4000 : e.kind === "midboss" ? 1200 : 100;
              dropFromEnemy(e);
              spawnParticleBurst(e.x, e.y, e.kind === "boss" ? "boss" : "boom", e.kind === "boss" ? 42 : 18, e.kind === "boss" ? 240 : 160);
              enemies.splice(i, 1);
              beep({ freq: e.kind === "boss" ? 110 : 220, dur: 0.12, type: "sawtooth", gain: 0.02 });
            }
          }
          break;
        }
      }
    }

    // Player bullets can shoot down enemy cruise missiles
    for (let i = enemyShots.length - 1; i >= 0; i--) {
      const s = enemyShots[i];
      if (s.kind !== "cruise") continue;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (b.kind !== "pbullet" && b.kind !== "cannon") continue;
        if (!circleHit(b.x, b.y, b.r, s.x, s.y, s.r)) continue;
        // cannon explodes anyway; regular bullet just deletes missile
        enemyShots.splice(i, 1);
        if (b.kind !== "cannon") bullets.splice(j, 1);
        state.score += 40;
        spawnParticleBurst(s.x, s.y, "boom", 12, 150);
        beep({ freq: 420, dur: 0.06, type: "triangle", gain: 0.012 });
        break;
      }
    }

    // Missiles vs enemies
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (e.kind === "energy") continue;
        if (circleHit(m.x, m.y, m.r, e.x, e.y, e.r)) {
          e.hp -= m.damage;
          e.hurtT = 0.16;
          if (state.boss && e.kind === "boss") state.boss.damageTaken += m.damage;
          spawnParticleBurst(m.x, m.y, "hit", 8, 90);
          missiles.splice(i, 1);
          if (e.hp <= 0) {
            state.score += e.kind === "boss" ? 4000 : e.kind === "midboss" ? 1200 : 100;
            dropFromEnemy(e);
            spawnParticleBurst(e.x, e.y, "boom", 18, 170);
            enemies.splice(j, 1);
          }
          break;
        }
      }
    }

    // Player collects pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      if (circleHit(player.x, player.y, 14, p.x, p.y, 10)) {
        if (p.kind === "hp") {
          state.hp = clamp(state.hp + p.value, 0, state.hpMax);
        } else if (p.kind === "power") {
          const add = p.value || 1;
          // When power would exceed 5x, convert overflow into score.
          if (player.power >= 5) {
            state.score += 200 * add;
            state.subtitle = `Power max! +${200 * add}`;
            state.subtitleT = 1.2;
          } else {
            player.power = clamp(player.power + add, 1, 5);
          }
        }
        else if (p.kind === "weapon") {
          if (p.value === WeaponType.MISSILES) {
            if (player.missileLevel >= 5) {
              state.score += 200;
              state.subtitle = "Missiles max! +200";
              state.subtitleT = 1.2;
            } else {
              player.missileLevel = clamp(player.missileLevel + 1, 0, 5);
              state.subtitle = `Missiles (M) Lv.${player.missileLevel}`;
              state.subtitleT = 1.4;
            }
          } else {
            player.weapon = p.value;
          }
        }
        state.score += 80;
        pickups.splice(i, 1);
        beep({ freq: 740, dur: 0.06, type: "triangle", gain: 0.02 });
      }
    }

    // Enemy hits player (contact only in this playtest)
    if (player.invuln <= 0) {
      for (const e of enemies) {
        if (e.kind === "energy") continue;
        if (circleHit(player.x, player.y, 12, e.x, e.y, e.r)) {
          damagePlayer(e.kind === "boss" ? 46 : e.kind === "midboss" ? 28 : 18);
          spawnParticleBurst(player.x, player.y, "hurt", 16, 150);
          break;
        }
      }
    }

    // Enemy shots hit player
    if (player.invuln <= 0) {
      for (let i = enemyShots.length - 1; i >= 0; i--) {
        const s = enemyShots[i];
        if (circleHit(player.x, player.y, 11, s.x, s.y, s.r)) {
          if (s.kind === "cruise") {
            // instant death
            state.hp = 1;
            damagePlayer(9999);
          } else {
            damagePlayer(s.damage);
          }
          spawnParticleBurst(player.x, player.y, "hurt", 16, 170);
          enemyShots.splice(i, 1);
          break;
        }
      }
    }

    // clear pressed
    pressed.clear();
  }

  function damagePlayer(dmg) {
    state.hurtT = 0.35;
    state.hp -= dmg;
    // If we get hit while a midboss/boss is present, let them emote (laugh) briefly.
    for (const e of enemies) {
      if (e.kind === "midboss" || e.kind === "boss") e.laughT = 0.45;
    }
    ensureAudio();
    noiseBurst({ dur: 0.08, gain: 0.03 });
    if (state.hp <= 0) {
      state.lives -= 1;
      state.hp = state.hpMax;
      player.invuln = 2.0;
      player.power = Math.max(1, player.power - 1);
      spawnParticleBurst(player.x, player.y, "boom", 26, 220);
      if (state.lives < 0) {
        state.gameOver = true;
        state.subtitle = "GAME OVER (press Enter)";
        state.subtitleT = 999;
      } else {
        state.subtitle = "Crashed! Lost 1 life";
        state.subtitleT = 2.0;
      }
    } else {
      player.invuln = 0.45;
    }
  }

  // ---------- Rendering ----------
  function drawBackground(dt) {
    // base gradient
    ctx.fillStyle = "#02030a";
    ctx.fillRect(0, 0, W, H);

    // Layer 0: biome ground/ocean/space
    drawBiome(state.biome);

    // Layer 1: mid particles/stars
    drawMidParallax(dt);

    // Layer 2: translucent clouds (weather-driven)
    drawCloudLayer(dt);

    // Layer 3: near haze for depth
    drawForegroundFog(dt);
  }

  const bg = {
    starY: 0,
    starY2: 0,
    cloudY: 0,
    layer0Y: 0,
    fogY: 0,
    stageScrollInit: false,
    cloudSeed: Array.from({ length: 20 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      s: rand(0.6, 1.5),
      a: rand(0, TAU),
    })),
  };

  function stageSubName() {
    const t = state.mode === GameMode.STAGE ? state.stageT : config.stageDuration;
    // Keep legacy sub names for cloud tuning / scroll speed heuristics.
    // Background map progression is handled separately by `stageScrollProgress01()`.
    return t < config.stageDuration * 0.6 ? "bamboo" : t < config.stageDuration * 0.82 ? "seaside" : "openSea";
  }

  function scrollSpeedPxPerSec({ layer, sub, isStorm }) {
    // Layered speeds to create depth: base map fastest, fog mid, clouds slowest.
    // Keep it subtle so motion doesn't feel jittery.
    // Make the map feel very long/ancient: extremely slow base scroll.
    // Clouds/fog still move a bit more to preserve depth cues.
    const slowMap = 0.10;
    const slowOther = 0.18;
    const base =
      sub === "bamboo"
        ? 92
        : sub === "seaside"
          ? 98
          : 104;
    const stormBoost = isStorm ? 22 : 0;
    const v = base + stormBoost;
    if (layer === "map") return v * slowMap;
    if (layer === "fog") return v * 0.66 * slowOther;
    if (layer === "clouds") return v * 0.23 * slowOther;
    return v * slowOther;
  }

  function drawTiledImage(img, yOffset, alpha = 1) {
    const ih = img.height;
    const iw = img.width;
    const scale = W / iw;
    const dh = ih * scale;
    const y0 = -((yOffset % dh) + dh) % dh;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let y = y0; y < H + dh; y += dh) {
      ctx.drawImage(img, 0, 0, iw, ih, 0, y, W, dh);
    }
    ctx.restore();
  }

  function drawTiledImageCrop(img, sy, sh, yOffset, alpha = 1) {
    const iw = img.width;
    const scale = W / iw;
    const dh = sh * scale;
    const y0 = -((yOffset % dh) + dh) % dh;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let y = y0; y < H + dh; y += dh) {
      ctx.drawImage(img, 0, sy, iw, sh, 0, y, W, dh);
    }
    ctx.restore();
  }

  function atlasInfo(img) {
    // Support "one long image" exported as a vertical atlas:
    // 1024x4096 = [bamboo, seaside, openSea, storm] stacked top-to-bottom.
    if (!img || !img.width || !img.height) return null;
    if (img.height <= img.width * 1.2) return null;
    // Prefer square segments (height is multiple of width)
    const seg = img.width;
    const countSq = Math.floor(img.height / seg);
    if (countSq >= 2 && Math.abs(img.height / seg - countSq) <= 0.02) {
      return { segH: seg, count: countSq };
    }
    // Fallback: accept 4-stack atlas even if not square (e.g. screenshots)
    const count4 = 4;
    const segH4 = img.height / count4;
    if (segH4 >= img.width * 0.7) {
      return { segH: segH4, count: count4, nonInteger: true };
    }
    return null;
  }

  function drawStageImageScroll(img, progress01) {
    // Scroll a single tall background image from bottom->top (progress 0..1).
    // Clamp at ends and avoid tiling; this matches "start from bottom, slowly go up".
    const iw = img.width;
    const ih = img.height;
    const scale = W / iw;
    const viewHInSrc = H / scale;

    const maxScroll = Math.max(0, ih - viewHInSrc);
    const sy = maxScroll * (1 - clamp(progress01, 0, 1)); // 0=bottom, 1=top

    ctx.drawImage(img, 0, sy, iw, viewHInSrc, 0, 0, W, H);
  }

  function stageScrollProgress01() {
    // Non-linear progression so bamboo stays longer, then slowly shifts to seaside and sea.
    // Boss phase locks to storm (top).
    if (state.mode === GameMode.BOSS || state.mode === GameMode.BOSS_WARNING) return 1;
    const t = clamp(state.stageT / config.stageDuration, 0, 1);
    // Hold longer at the start: map 0..1 -> 0..1 with slow start, slightly faster late.
    // Two-stage curve: ease-in + extra hold.
    const hold = 0.55; // portion of time mostly staying near bottom
    if (t < hold) return easeOutCubic(t / hold) * 0.18; // only move 18% through the image
    const u = (t - hold) / (1 - hold);
    return 0.18 + easeOutCubic(u) * (0.92 - 0.18); // up to 92% by stage end (before boss)
  }

  function drawBiome(biome) {
    // White Prince stage: use authored scrolling backgrounds when loaded.
    const isStorm = state.mode === GameMode.BOSS || state.mode === GameMode.BOSS_WARNING;
    const sub = stageSubName();
    if (isStorm && assets.bgStageStormReady) {
      bg.layer0Y += scrollSpeedPxPerSec({ layer: "map", sub, isStorm }) * state.dt;
      drawTiledImage(assets.bgStageStorm, bg.layer0Y, 1);
      return;
    }
    if (assets.bgStageReady) {
      const atlas = atlasInfo(assets.bgStage);
      // If it's a tall atlas/screenshot, treat it as a continuous scroll from bottom->top.
      // This supports "bamboo -> seaside -> ocean, then boss locks on storm ocean".
      if (atlas || assets.bgStage.height > assets.bgStage.width * 1.2) {
        drawStageImageScroll(assets.bgStage, stageScrollProgress01());
        return;
      }

      // Otherwise (a true tile), keep old tiled behavior.
      bg.layer0Y += scrollSpeedPxPerSec({ layer: "map", sub, isStorm }) * state.dt;
      drawTiledImage(assets.bgStage, bg.layer0Y, 1);
      return;
    }

    if (biome === StageBiome.LAND) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#06112b");
      g.addColorStop(0.55, "#081522");
      g.addColorStop(1, "#0b2a1f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // terrain hints
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#2dbb7d";
      for (let i = 0; i < 8; i++) ctx.fillRect(((i * 73) % W) - 40, H - 120 - (i % 3) * 30, 120, 16);
      ctx.globalAlpha = 1;
      return;
    }
    if (biome === StageBiome.OCEAN) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#04102a");
      g.addColorStop(0.6, "#02122a");
      g.addColorStop(1, "#012242");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#31c7ff";
      for (let i = 0; i < 14; i++) ctx.fillRect(((i * 47) % W) - 20, H - 220 - (i % 4) * 22, 90, 10);
      ctx.globalAlpha = 1;
      return;
    }
    if (biome === StageBiome.ATMOS) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#05153a");
      g.addColorStop(0.6, "#0a1b3d");
      g.addColorStop(1, "#1b2b6b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (biome === StageBiome.SPACE) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#02030a");
      g.addColorStop(0.7, "#01020a");
      g.addColorStop(1, "#00010a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return;
    }
    // moon
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#02030a");
    g.addColorStop(0.72, "#03040a");
    g.addColorStop(1, "#17171e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#b9bbc6";
    ctx.beginPath();
    ctx.arc(W * 0.7, H * 0.8, 240, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMidParallax(dt) {
    // starfields in space/atmos
    const speedBase = 40 + (state.mode === GameMode.BOSS ? 10 : 0);
    const speed = speedBase * (1 + weather.now.forward * 0.15);
    bg.starY = (bg.starY + speed * dt) % H;
    bg.starY2 = (bg.starY2 + speed * 1.65 * dt) % H;

    const starAlpha = state.biome === StageBiome.SPACE || state.biome === StageBiome.MOON ? 1 : state.biome === StageBiome.ATMOS ? 0.55 : 0.22;
    ctx.globalAlpha = 0.35 * starAlpha;
    ctx.fillStyle = "#d8e6ff";
    for (let i = 0; i < 70; i++) {
      const x = ((i * 73.27) % W) + ((i % 7) - 3) * 2;
      const y = (bg.starY + (i * 29.71) % H) % H;
      const r = (i % 11 === 0 ? 1.8 : 1.2) * (0.8 + (i % 3) * 0.2);
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 0.22 * starAlpha;
    ctx.fillStyle = "#9fc6ff";
    for (let i = 0; i < 55; i++) {
      const x = ((i * 89.17) % W) + ((i % 5) - 2) * 2;
      const y = (bg.starY2 + (i * 41.11) % H) % H;
      ctx.fillRect(x, y, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;
  }

  function cloudParams() {
    const w = weather.now;
    const density = w.type === WeatherType.CLEAR ? 0.12 : w.type === WeatherType.WINDY ? 0.22 : 0.3;
    const speed = 20 + w.strength * 55;
    const drift = w.side * 30;
    const softness = w.type === WeatherType.RAIN ? 0.72 : 0.6;
    return { density, speed, drift, softness };
  }

  function drawCloudLayer(dt) {
    const isStorm = state.mode === GameMode.BOSS || state.mode === GameMode.BOSS_WARNING;
    const sub = stageSubName();

    // visual-only wind drift
    const windDrift = Math.sin(state.t * 0.35) * (sub === "seaside" ? 18 : 10);
    // Clouds drift top->bottom (same direction as enemies), but slower to imply depth.
    bg.cloudY -= scrollSpeedPxPerSec({ layer: "clouds", sub, isStorm }) * dt;

    if (isStorm && assets.cloudStormReady) {
      ctx.save();
      ctx.translate(windDrift, 0);
      drawTiledImage(assets.cloudStorm, bg.cloudY, 0.32);
      ctx.restore();
      return;
    }
    if (sub === "bamboo" && assets.cloudClearReady) {
      ctx.save();
      ctx.translate(windDrift, 0);
      drawTiledImage(assets.cloudClear, bg.cloudY, 0.18);
      ctx.restore();
      return;
    }
    if (sub === "seaside" && assets.cloudWindyReady) {
      ctx.save();
      ctx.translate(windDrift, 0);
      drawTiledImage(assets.cloudWindy, bg.cloudY, 0.24);
      ctx.restore();
      return;
    }
    if (sub === "openSea" && assets.cloudWindyReady) {
      ctx.save();
      ctx.translate(windDrift * 0.85, 0);
      drawTiledImage(assets.cloudWindy, bg.cloudY, 0.20);
      ctx.restore();
      return;
    }

    // fallback procedural
    const { density, speed, drift, softness } = cloudParams();
    bg.cloudY = (bg.cloudY + speed * dt) % H;
    ctx.save();
    ctx.globalAlpha = density;
    ctx.fillStyle = "#eaf2ff";
    ctx.translate(drift, 0);
    for (let i = 0; i < bg.cloudSeed.length; i++) {
      const s = bg.cloudSeed[i];
      const px = (s.x + Math.sin(state.t * 0.35 + s.a) * 18) % (W + 120);
      const py = (s.y + bg.cloudY * (0.6 + s.s * 0.25)) % (H + 140);
      const r = 44 * s.s;
      ctx.beginPath();
      ctx.ellipse(px - 60, py - 70, r * 1.6, r, 0, 0, TAU);
      ctx.ellipse(px - 10, py - 76, r * 1.9, r * 1.1, 0, 0, TAU);
      ctx.ellipse(px + 54, py - 64, r * 1.5, r * 0.95, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = density * softness;
    ctx.fillStyle = "#d4e6ff";
    ctx.translate(-drift * 0.4, 0);
    for (let i = 0; i < 10; i++) ctx.fillRect(((i * 97) % W) - 40, ((bg.cloudY * 0.6 + i * 83) % H) - 40, 220, 10);
    ctx.restore();
  }

  function drawForegroundFog(dt) {
    // A subtle near-layer haze that scrolls faster than clouds but slower than the map,
    // to strengthen depth without gameplay impact.
    const isStorm = state.mode === GameMode.BOSS || state.mode === GameMode.BOSS_WARNING;
    const sub = stageSubName();
    bg.fogY += scrollSpeedPxPerSec({ layer: "fog", sub, isStorm }) * dt;

    const y = ((bg.fogY % H) + H) % H;
    ctx.save();
    ctx.globalAlpha = isStorm ? 0.22 : 0.14;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.25, "rgba(255,255,255,0.05)");
    g.addColorStop(0.6, "rgba(255,255,255,0.08)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    // moving bands
    ctx.translate(0, -y);
    ctx.fillRect(0, 0, W, H);
    ctx.translate(0, H);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawPlayer() {
    const blink = player.invuln > 0 && Math.floor(state.t * 18) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.5;

    const z = player.layerZ;
    const glow = 0.28 + z * 0.32;
    // depth glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = glow;
    ctx.fillStyle = "#63b3ff";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 18, 26 + z * 10, 8 + z * 4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (!assets.kaguyaReady) {
      // fallback simple marker while loading
      ctx.fillStyle = "#d9ecff";
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    // Choose animation based on wind
    const side = weather.now.side;
    const forward = weather.now.forward;
    let col = 0;
    let row = 0;
    let cols = 4;
    let mirror = false;

    if (Math.abs(side) > 0.32) {
      // sidewind: row 1 col 0-1 (right-wind); mirror for left wind
      row = 1;
      col = Math.floor((state.t / 0.18) % 2);
      mirror = side < 0;
    } else if (forward < -0.28) {
      // headwind: row 1 col 2-3
      row = 1;
      col = 2 + Math.floor((state.t / 0.18) % 2);
    } else {
      // forward flight: row 0 col 0-3 (includes blink frame)
      row = 0;
      col = Math.floor((state.t / 0.14) % 4);
    }

    const fw = 256;
    const fh = 256;
    const sx = col * fw;
    const sy = row * fh;
    // Draw the full 256x256 frame at a small ratio so the authored storyboard frame stays intact.
    const scale = 0.34;
    const dw = fw * scale;
    const dh = fh * scale;

    ctx.save();
    ctx.translate(player.x, player.y);
    // slight banking by lateral speed
    const bank = clamp(player.vx / 520, -0.25, 0.25);
    ctx.rotate(bank);
    if (mirror) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    if (assets.kaguyaExprReady && state.hurtT > 0) {
      drawFrameImage(assets.kaguyaExpr, 2 * fw, 0, fw, fh, -dw / 2, -dh / 2, dw, dh);
    } else {
      drawFrameImage(assets.kaguyaSheet, sx, sy, fw, fh, -dw / 2, -dh / 2, dw, dh);
    }
    ctx.restore();

    ctx.globalAlpha = 1;
  }

  function drawEnemies() {
    function drawMinionSprite(e, sheet, ready) {
      if (!ready) return false;
      const fw = 256;
      const fh = 256;
      // frames: 0 laugh, 1 hurt, 2 blink, 3 serious_missile
      let col = 0;
      if ((e.hurtT ?? 0) > 0) col = 1;
      else if ((e.shotT ?? 0) > 0) col = 3;
      else {
        const p = (state.t * 1.9 + e.id * 0.37) % 6;
        col = p < 0.25 ? 2 : 0;
      }
      const scale = 0.24;
      const dw = fw * scale;
      const dh = fh * scale;
      drawFrameImage(sheet, col * fw, 0, fw, fh, e.x - dw / 2, e.y - dh / 2, dw, dh);
      return true;
    }

    for (const e of enemies) {
      if (e.kind === "grunt_down") {
        if (drawMinionSprite(e, assets.octopusSheet, assets.octopusReady)) continue;
        // fallback
        ctx.fillStyle = "#ff5d7a";
        ctx.strokeStyle = "rgba(255,255,255,0.22)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y - e.r - 3);
        ctx.lineTo(e.x - e.r - 2, e.y + e.r);
        ctx.lineTo(e.x, e.y + e.r - 6);
        ctx.lineTo(e.x + e.r + 2, e.y + e.r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (e.kind === "grunt_swarm") {
        if (drawMinionSprite(e, assets.pufferSheet, assets.pufferReady)) continue;
        // fallback
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#7ad6ff";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 2.2, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (e.kind === "grunt_cruise") {
        if (drawMinionSprite(e, assets.starfishSheet, assets.starfishReady)) continue;
        // fallback
        ctx.fillStyle = "#ffb16b";
        ctx.strokeStyle = "rgba(255,255,255,0.20)";
        ctx.lineWidth = 2;
        roundRectPath(ctx, e.x - (e.r + 6), e.y - (e.r - 2), (e.r + 6) * 2, (e.r - 2) * 2, 10);
        ctx.fill();
        ctx.stroke();
      } else if (e.kind === "energy") {
        if (assets.energyHenReady) {
          const fw = 256;
          const fh = 256;
          const frame = Math.floor((state.t * 4 + e.id) % 3);
          const col = frame === 2 ? 2 : frame;
          const scale = 0.26;
          const dw = fw * scale;
          const dh = fh * scale;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = "#65ffd1";
          ctx.beginPath();
          ctx.arc(e.x, e.y, 24, 0, TAU);
          ctx.fill();
          ctx.restore();
          drawFrameImage(assets.energyHenSheet, col * fw, 0, fw, fh, e.x - dw / 2, e.y - dh / 2, dw, dh);
        } else {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = "#3dffb9";
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = "#9bffe0";
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r * 1.8, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      } else if (e.kind === "midboss") {
        if (assets.raijinReady) {
          const fw = 256;
          const fh = 256;
          let col = Math.floor((state.t * 6) % 2); // drum left/right
          const p = (state.t + e.id * 0.17) % 5;
          if ((e.hurtT ?? 0) > 0) col = 3;
          else if ((e.laughT ?? 0) > 0) col = 3;
          else if (p < 0.2) col = 2;
          const scale = 0.42;
          const dw = fw * scale;
          const dh = fh * scale;
          drawFrameImage(assets.raijinSheet, col * fw, 0, fw, fh, e.x - dw / 2, e.y - dh / 2, dw, dh);
          drawHpBar(e.x, e.y - 58, 120, 7, e.hp / e.hpMax, "#ffb16b");
        } else {
          ctx.fillStyle = "#ff9a4a";
          ctx.strokeStyle = "#ffd2a1";
          ctx.lineWidth = 2;
          roundRectPath(ctx, e.x - 34, e.y - 18, 68, 36, 10);
          ctx.fill();
          ctx.stroke();
          drawHpBar(e.x, e.y - 30, 70, 6, e.hp / e.hpMax, "#ffb16b");
        }
      } else if (e.kind === "boss") {
        const variant = e.bossVariant || "prince";
        const fw = 256;
        const fh = 256;
        let sheet = assets.bossPrinceSheet;
        let ready = assets.bossPrinceReady;
        if (variant === "richman") {
          sheet = assets.bossRichSheet;
          ready = assets.bossRichReady;
        } else if (variant === "shogun") {
          sheet = assets.bossShogunSheet;
          ready = assets.bossShogunReady;
        }
        if (ready) {
          let col = 0;
          const p = (state.t + e.id * 0.11) % 6;
          if ((e.hurtT ?? 0) > 0) col = 3;
          else if ((e.laughT ?? 0) > 0) col = 2;
          else if ((e.shotT ?? 0) > 0) col = 0;
          else col = p < 0.2 ? 1 : 0;
          const scale = 0.62;
          const dw = fw * scale;
          const dh = fh * scale;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#ff2b3a";
          ctx.beginPath();
          ctx.arc(e.x, e.y, 92, 0, TAU);
          ctx.fill();
          ctx.restore();
          drawFrameImage(sheet, col * fw, 0, fw, fh, e.x - dw / 2, e.y - dh / 2, dw, dh);
          drawHpBar(e.x, e.y - 92, 210, 9, e.hp / e.hpMax, "#ff4c62");
        } else {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.24;
          ctx.fillStyle = "#ff2b3a";
          ctx.beginPath();
          ctx.arc(e.x, e.y, 82, 0, TAU);
          ctx.fill();
          ctx.restore();
          ctx.fillStyle = "#ff2b3a";
          ctx.strokeStyle = "#ffd9de";
          ctx.lineWidth = 3;
          roundRectPath(ctx, e.x - 62, e.y - 30, 124, 60, 14);
          ctx.fill();
          ctx.stroke();
          drawHpBar(e.x, e.y - 52, 140, 8, e.hp / e.hpMax, "#ff4c62");
        }
      }
    }
  }

  function drawHpBar(cx, cy, w, h, t, color) {
    ctx.save();
    ctx.translate(cx - w / 2, cy);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, Math.max(0, w * clamp(t, 0, 1)), h);
    ctx.restore();
  }

  function drawProjectiles() {
    // bullets
    for (const b of bullets) {
      if (b.kind === "cannon") {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#ffd08a";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 2.1, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#ffcc76";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = "#b8dbff";
        ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10);
      }
    }
    // missiles
    for (const m of missiles) {
      ctx.save();
      ctx.translate(m.x, m.y);
      const a = Math.atan2(m.vy, m.vx);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = "#dfe9ff";
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#ffb14a";
      ctx.fillRect(-1.5, 8, 3, 6);
      ctx.restore();
    }

    // enemy shots
    for (const s of enemyShots) {
      if (s.kind === "cruise") {
        ctx.save();
        ctx.translate(s.x, s.y);
        const a = Math.atan2(s.vy, s.vx);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = "#ffd9de";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-5, 10);
        ctx.lineTo(5, 10);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#ff4c62";
        ctx.fillRect(-1.5, 10, 3, 7);
        ctx.restore();
      } else {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#ff8aa0";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // (Net weapon removed)

  function drawPickups() {
    for (const p of pickups) {
      const pulse = 0.75 + 0.25 * Math.sin(state.t * 6 + p.x * 0.02);
      if (p.kind === "hp") {
        ctx.fillStyle = `rgba(120,255,170,${0.9 * pulse})`;
        roundRectPath(ctx, p.x - 10, p.y - 10, 20, 20, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(p.x - 2, p.y - 6, 4, 12);
        ctx.fillRect(p.x - 6, p.y - 2, 12, 4);
      } else if (p.kind === "power") {
        ctx.fillStyle = `rgba(255,210,120,${0.9 * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillText("P", p.x - 3, p.y + 4);
      } else {
        ctx.fillStyle = `rgba(120,190,255,${0.9 * pulse})`;
        roundRectPath(ctx, p.x - 12, p.y - 10, 24, 20, 6);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        const letter = (() => {
          switch (p.value) {
            case WeaponType.BULLET:
              return "B";
            case WeaponType.TRISHOT:
              return "T";
            case WeaponType.CANNON:
              return "C";
            case WeaponType.MISSILES:
              return "M";
            default:
              return "W";
          }
        })();
        ctx.fillText(letter, p.x - 4, p.y + 4);
      }
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const t = clamp(p.life, 0, 1);
      const a = clamp(t / 0.65, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle =
        p.kind === "boom"
          ? "#ffcc76"
          : p.kind === "boss"
            ? "#ff4c62"
            : p.kind === "energy"
              ? "#3dffb9"
              : p.kind === "laser"
                ? "#7ad6ff"
                : p.kind === "hurt"
                  ? "#ff6b78"
                  : "#cfe4ff";
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    // top HUD bar
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, 56);
    ctx.globalAlpha = 1;

    // HUD text
    ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "#e8eefc";
    ctx.textBaseline = "middle";

    ctx.fillText(`Lives: ${Math.max(0, state.lives)}`, 14, 18);
    ctx.fillText(`Weapon: ${weaponName(player.weapon)} ${player.power}x`, 14, 40);

    // HP bar
    const hpT = clamp(state.hp / state.hpMax, 0, 1);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(170, 14, 160, 12);
    ctx.fillStyle = hpT > 0.35 ? "#47e39c" : "#ff6b78";
    ctx.fillRect(170, 14, 160 * hpT, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.strokeRect(170, 14, 160, 12);
    ctx.fillStyle = "#e8eefc";
    ctx.fillText(`HP ${Math.ceil(state.hp)}/${state.hpMax}`, 170, 40);

    // Score and stage time
    const stageLeft =
      state.mode === GameMode.STAGE
        ? Math.max(0, config.stageDuration - state.stageT)
        : state.mode === GameMode.BOSS
          ? Math.max(0, 30 - state.modeT)
          : 0;
    ctx.textAlign = "right";
    ctx.fillText(`Score ${state.score}`, W - 14, 18);
    ctx.fillText(
      state.mode === GameMode.BOSS ? `Boss ${bossProgress() * 100 | 0}%` : `Time ${stageLeft.toFixed(0)}s`,
      W - 14,
      40,
    );

    // Subtitle (center)
    if (state.subtitle) {
      ctx.textAlign = "center";
      ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(W * 0.12, 60, W * 0.76, 30);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(state.subtitle, W / 2, 75);
    }

    ctx.restore();

    // Weather forecast icon removed (weather is visual-only).
  }

  function drawForecastIcon() {
    const x = 14;
    const y = H - 54;
    const w = 148;
    const h = 40;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.globalAlpha = 1;

    // icon
    const wx = x + 20;
    const wy = y + 20;
    const next = weather.next;
    // wind arrow
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(next.dir);
    ctx.fillStyle = "rgba(232,238,252,0.9)";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // weather glyph
    ctx.globalAlpha = 0.95;
    if (next.type === WeatherType.CLEAR) {
      ctx.fillStyle = "#ffd08a";
      ctx.beginPath();
      ctx.arc(x + 54, y + 20, 7, 0, TAU);
      ctx.fill();
    } else if (next.type === WeatherType.WINDY) {
      ctx.strokeStyle = "#b8dbff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 46, y + 16);
      ctx.quadraticCurveTo(x + 58, y + 8, x + 70, y + 16);
      ctx.moveTo(x + 44, y + 24);
      ctx.quadraticCurveTo(x + 60, y + 32, x + 76, y + 24);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#cfe4ff";
      ctx.beginPath();
      ctx.arc(x + 56, y + 18, 7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#7ad6ff";
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 50 + i * 6, y + 26);
        ctx.lineTo(x + 48 + i * 6, y + 34);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // labels
    ctx.font = "12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillStyle = "rgba(232,238,252,0.95)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const weatherTxt = next.type === WeatherType.CLEAR ? "Clear" : next.type === WeatherType.WINDY ? "Wind" : "Rain";
    ctx.fillText(`T+30s ${weatherTxt}`, x + 82, y + 14);
    ctx.fillStyle = "rgba(232,238,252,0.75)";
    const windTxt = describeWind(next);
    ctx.fillText(windTxt, x + 82, y + 28);
    ctx.restore();
  }

  function describeWind(w) {
    // translate direction into up/down/left/right relative to screen:
    // wind vector points to (cos, sin); forward is -y
    const vx = Math.cos(w.dir);
    const vy = Math.sin(w.dir);
    const forward = -vy;
    const side = vx;
    const f = forward > 0.18 ? "Tailwind" : forward < -0.18 ? "Headwind" : "No forward wind";
    const s = side > 0.28 ? "Right crosswind" : side < -0.28 ? "Left crosswind" : "No crosswind";
    return `${f} / ${s}`;
  }

  function drawBossWarningFlash() {
    if (state.flashRedT <= 0) return;
    const t = state.flashRedT / config.bossWarningDuration;
    const p = 1 - t;
    const blink = (Math.floor(state.t * 8) % 2) === 0 ? 1 : 0.2;
    ctx.save();
    ctx.globalAlpha = easeOutCubic(p) * 0.35 * blink;
    ctx.fillStyle = "#ff0018";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function render() {
    drawBackground(state.dt);
    drawPickups();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawHUD();
    drawBossWarningFlash();

    if (state.mode === GameMode.END) {
      drawEndCrawl();
      return;
    }

    // demo overlay
    if (state.mode === GameMode.DEMO) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "26px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("ENTER TO PLAY", W / 2, H / 2 - 6);
      ctx.font = "13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Demo mode (15s loop)", W / 2, H / 2 + 22);
      ctx.restore();
    }

    // game over overlay
    if (state.gameOver) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 16);
      ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Press Enter to play", W / 2, H / 2 + 18);
      ctx.restore();
    }
  }

  const END_TEXT = [
    "《竹取公主篇 直向軸射擊遊戲概念導引學生創作教學》",
    "",
    "創作中遇到的問題：",
    "1. codex 免費版並不支援生圖，老師必須在課堂間先導引學生使用 Gemini 生成圖片。",
    "2. 遊戲生成有涉及到「角色動作分鏡」的概念，如果老師沒有這個概念，遊戲一定不會活潑好玩。",
    "3. 音樂生成的部份必須運用到 Suno，必須橫跨到第三個人工智慧生成；雖然可以免費使用，但很吃操作者的指令知識（建議老師把套裝指令先做好給學生改）。",
    "4. codex 非常吃 tokens：免費之下建議老師使用 5.2 中低速版；學生可能沒有耐性等待，而走高速與 5.5 模式，大概三下就吃光一週額度。",
    "5. 操作這類遊戲生成，更精髓的部份可能會是修程式的自然對談。",
    "",
    "這個遊戲一開始只是我與一位朋友對談間，隨手做的東西。",
    "然後我覺得這個遊戲應該可以繼續發展，所以週五我以一天的時間把遊戲作到差不多（tokens 一日五小時燒光兩次）。",
    "接著周一兩小時，今天兩小時，最後作到的狀態，就跟各位想像的差不多，是一個很完整的直軸射擊遊戲。",
    "",
    "那，問題也隨之而生：",
    "1. 我們老師自己做這個的目的是什麼？",
    "2. 如何導引學生運用正確的邏輯與人工智慧對談？",
    "3. 學生的對談過程有沒有辦法給予指導？",
    "4. 如何讓學生的對談與生成更精緻、接近學生的預設結果？",
    "5. 讓學生生成的結果呈現出來，然後多樣性的比對！",
    "",
    "接著的問題也來了：",
    "1. 在免費的情形下使用這些人工智慧，其實限制相當大。",
    "2. 與人工智慧對談的經驗，來自於學生自身的閱讀、生活、遊戲與課程經驗；如果他連基本能力都沒有，那指導者一定是自找苦吃（我昨天就遇到一個）。",
    "3. 以 codex 在執行就會需要更長時間；那不是一節課 40 分鐘的事情，而是大約要四小時時段的問題！經費與時間不允許之下，很難盡善盡美。",
    "4. 以現在我所花費的人工智慧租賃費用，大概就吃了我將近一萬五的費用；在沒有挹注之下，其他新進教師要投注在這種教學思維上，簡直要命。",
    "5. 現在的線上講師很多都浮濫。真的有本事的講師，老實說你請不到、也請不起，所以你只能聽那些隨便生成的圖片、影音生成。",
    "",
    "是的，回歸原點思考：",
    "＃我希望我的學生真的好好學與人工智慧對談的耐性",
    "＃學生的基本能力必須有一定素養才能達成",
    "＃codex",
    "#education",
    "貓老師",
    "唐宇新",
    "",
    "Press Enter to restart",
  ];

  function wrapLines(lines, maxWidthPx, font) {
    ctx.save();
    ctx.font = font;
    const out = [];
    for (const raw of lines) {
      if (!raw) {
        out.push("");
        continue;
      }
      const words = raw.split(" ");
      let line = "";
      for (const w of words) {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width <= maxWidthPx) {
          line = t;
        } else {
          if (line) out.push(line);
          line = w;
        }
      }
      if (line) out.push(line);
    }
    ctx.restore();
    return out;
  }

  function drawEndCrawl() {
    // Star-Wars-like crawl: perspective + upward scroll.
    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // fade stars behind
    ctx.globalAlpha = 0.22;
    drawMidParallax(state.dt);
    ctx.globalAlpha = 1;

    const font = "18px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const lines = wrapLines(END_TEXT, W * 0.86, font);
    const lineH = 26;
    const scroll = state.endT * 42; // px/sec

    // tilt and perspective-ish scaling
    ctx.translate(W / 2, H * 0.92);
    ctx.rotate(-0.26);

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      const y = i * lineH - scroll;
      const depth = clamp(1 - (y / (H * 1.4)), 0.05, 1);
      const scale = depth * depth;
      const alpha = clamp((y + 120) / 220, 0, 1) * clamp((H * 1.2 - y) / 260, 0, 1);
      if (alpha <= 0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.scale(scale, scale * 0.85);
      ctx.font = font;
      ctx.fillStyle = "#ffd86b";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, -y);
      ctx.restore();
    }

    ctx.restore();
  }

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const raw = (now - last) / 1000;
    last = now;
    const dt = clamp(raw, 0, 1 / 30);
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // Start (first-time users see demo)
  let hasPlayed = false;
  try {
    hasPlayed = localStorage.getItem(LS_HAS_PLAYED) === "1";
  } catch {}
  if (hasPlayed) startPlay();
  else startDemo();
  requestAnimationFrame(frame);
})();
