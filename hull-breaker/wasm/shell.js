// Hull Breaker, WebAssembly beta: the browser shell around the Swift engine (hb.js + HullBreakerWeb.wasm).
// The engine simulates and draws the 320x180 frame. This file loads and verifies packs, reads input,
// plays audio, draws the HUD (matching the Apple apps' HUDView) and runs the menus.
import { HB, W, H, FIRE, RUN, MENU } from './hb.js';

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
// where the packs are: ?packs=, else the page's <meta name="hb-packs">, else the site's engine 1.5 folder
const PACKS = new URL(params.get('packs') || document.querySelector('meta[name="hb-packs"]')?.content || '../packs-1.5/', location.href).href;
const WASM = new URL('hullbreaker.wasm', import.meta.url).href;
// Saves and achievements are kept apart from the JavaScript game's hb- keys while this is a beta.
const KEY = (k) => 'hbw-' + k;
const store = {
  get(k) { try { return localStorage.getItem(KEY(k)); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(KEY(k)) : localStorage.setItem(KEY(k), v); } catch {} },
};
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pad2 = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------- layout
const box = $('#box'), cv = $('#c'), ctx = cv.getContext('2d', { alpha: false }), hudCv = $('#hud'), hg = hudCv.getContext('2d');
const img = ctx.createImageData(W, H);
let BW = 960, BH = 540, DPR = 1;
function layout() {
  const vw = innerWidth, vh = innerHeight;
  BW = Math.min(vw, vh * 16 / 9); BH = BW * 9 / 16;
  box.style.width = BW + 'px'; box.style.height = BH + 'px';
  box.style.left = (vw - BW) / 2 + 'px'; box.style.top = (vh - BH) / 2 + 'px';
  document.documentElement.style.setProperty('--h', BH + 'px');
  DPR = Math.min(2, devicePixelRatio || 1);
  hudCv.width = Math.round(BW * DPR); hudCv.height = Math.round(BH * DPR);
}
addEventListener('resize', layout); layout();

// ---------------------------------------------------------------- loading
async function sha256(buf) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
}
const isAudio = (p) => /\.(wav|mp3|m4a|ogg)$/.test(p);
const audioBytes = new Map();   // "pack/path" -> ArrayBuffer (decoded on first use)
let catalog = null, hb = null;

async function fetchVerified(url, want) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  const buf = await r.arrayBuffer();
  if (want && (await sha256(buf)) !== want) throw new Error(`${url}: checksum mismatch`);
  return buf;
}

async function loadAll() {
  const setLoad = (t, f) => { $('#loadText').textContent = t; if (f != null) $('#loadBar').style.width = (f * 100).toFixed(1) + '%'; };
  setLoad('Loading the engine…', 0);
  const wasmBuf = await (await fetch(WASM)).arrayBuffer();
  const mod = await WebAssembly.compile(wasmBuf);
  hb = await HB.load(mod);
  catalog = JSON.parse(new TextDecoder().decode(await fetchVerified(PACKS + 'catalog.json')));
  const packs = catalog.packs.filter((p) => p.kind === 'core' || p.kind === 'deck');
  const manifests = [];
  for (const p of packs) {
    const buf = await fetchVerified(PACKS + p.manifest, p.manifestSha256);
    hb.put(`${p.id}/manifest.json`, new Uint8Array(buf));
    manifests.push([p, JSON.parse(new TextDecoder().decode(buf))]);
  }
  const jobs = manifests.flatMap(([p, m]) => m.files.map((f) => ({ pack: p.id, f })));
  const total = jobs.reduce((a, j) => a + j.f.bytes, 0);
  let done = 0, next = 0;
  async function worker() {
    while (next < jobs.length) {
      const { pack, f } = jobs[next++];
      const buf = await fetchVerified(`${PACKS}${pack}/${f.path}`, f.sha256);
      if (isAudio(f.path)) audioBytes.set(`${pack}/${f.path}`, buf); else hb.put(`${pack}/${f.path}`, new Uint8Array(buf));
      if (pack === 'core' && f.path === 'sfx.json') hbFiles.set('core/sfx.json', new Uint8Array(buf));
      done += f.bytes;
      setLoad(`Downloading the decks… ${(done / 1048576).toFixed(1)} of ${(total / 1048576).toFixed(1)} MB`, done / total);
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  setLoad('Ready.', 1);
  await document.fonts.load('20px Silkscreen').catch(() => {});
  await document.fonts.load('20px VT323').catch(() => {});
  await document.fonts.load('bold 20px Teko').catch(() => {});
}

// ---------------------------------------------------------------- audio (mirrors AudioOutput.swift)
const audio = {
  ac: null, out: null, low: null, sounds: {}, buffers: {}, music: null, ambient: null,
  musicTarget: 0, musicLevel: 0, ambientLevel: 0, voice: null, log: null, decoded: new Map(),
  unlock() {
    if (!this.ac) {
      const ac = this.ac = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
      this.low = ac.createBiquadFilter(); this.low.type = 'lowpass'; this.low.frequency.value = 20000;
      this.out = ac.createGain(); this.out.gain.value = 0.9;
      this.out.connect(this.low); this.low.connect(comp); comp.connect(ac.destination);
      this.sounds = JSON.parse(new TextDecoder().decode(this.raw('core/sfx.json'))).sounds;
      this.decodeSfx();
    }
    if (this.ac.state !== 'running') this.ac.resume().catch(() => {});
  },
  raw(path) { return hbFiles.get(path); },
  async decodeSfx() {
    for (const [id, s] of Object.entries(this.sounds)) {
      const bytes = audioBytes.get('core/' + s.file);
      if (!bytes) continue;
      try { this.buffers[id] = await this.ac.decodeAudioData(bytes.slice(0)); } catch {}
    }
    for (const id of ['music', 'ambient']) {
      const b = this.buffers[id]; if (!b) continue;
      const src = this.ac.createBufferSource(); src.buffer = b; src.loop = true;
      const g = this.ac.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(this.out); src.start();
      this[id] = { src, g };
    }
  },
  sfx(id, pan, vol) {
    const b = this.buffers[id], s = this.sounds[id]; if (!b || !this.ac) return;
    const src = this.ac.createBufferSource(); src.buffer = b;
    const g = this.ac.createGain(); g.gain.value = vol * (s.gain || 1);
    const p = this.ac.createStereoPanner ? this.ac.createStereoPanner() : null;
    if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); src.connect(g); g.connect(p); p.connect(this.out); } else { src.connect(g); g.connect(this.out); }
    src.start();
  },
  async clip(key) {
    if (this.decoded.has(key)) return this.decoded.get(key);
    const bytes = audioBytes.get(key); if (!bytes) return null;
    const b = await this.ac.decodeAudioData(bytes.slice(0)).catch(() => null);
    this.decoded.set(key, b); return b;
  },
  stop(which) { const v = this[which]; if (v) { v.stopped = true; try { v.src.stop(); } catch {} } this[which] = null; },
  async play(which, key, vol) {
    if (!this.ac) return;
    this.stop(which);
    const token = {}; this[which + 'Token'] = token;
    const b = await this.clip(key);
    if (!b || this[which + 'Token'] !== token) return;
    const src = this.ac.createBufferSource(); src.buffer = b;
    const g = this.ac.createGain(); g.gain.value = vol;
    src.connect(g); g.connect(this.out);
    const v = { src, playing: true }; src.onended = () => { v.playing = false; };
    this[which] = v; src.start();
  },
  handle(events, dt) {
    if (!this.ac) return;
    for (const e of events) {
      switch (e.t) {
        case 'sfx': this.sfx(e.id, e.pan, e.vol); break;
        case 'voice': this.play('voice', `${e.pack}/${e.file}`, 1); break;
        case 'log': this.play('log', `${e.pack}/${e.file}`, 0.95); break;
        case 'stopVoice': this.stop('voice'); this.stop('log'); break;
        case 'music': this.musicTarget = e.v; break;
        case 'ambient': this.ambientLevel = e.v; break;
        case 'muffle': this.low.frequency.setTargetAtTime(e.on ? 600 : 20000, this.ac.currentTime, 0.03); break;
      }
    }
    this.musicLevel += (this.musicTarget - this.musicLevel) * Math.min(1, dt * 2);
    const duck = this.voice?.playing ? 0.4 : this.log?.playing ? 0.5 : 1;
    if (this.music) this.music.g.gain.value = this.musicLevel * 0.42 * duck;
    if (this.ambient) this.ambient.g.gain.value = this.ambientLevel;
  },
  tick() { this.sfx('tick', 0, 1); },
  pause(on) { if (!this.ac) return; on ? this.ac.suspend() : this.ac.resume(); },
};
// the non-audio files the shell itself reads (sfx.json)
const hbFiles = new Map();

// ---------------------------------------------------------------- input
const keys = new Set();
const tapped = new Set();          // pressed since the last frame, so a quick tap is never lost between frames
const menuEdges = [];
let mouseDX = 0, mouseDY = 0, lmb = false, rmbEdge = false, scheme = 'keyboard';
const MENU_KEYS = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Enter: 'confirm', Space: 'confirm', KeyE: 'confirm', Escape: 'back', Backspace: 'back', KeyP: 'back' };
addEventListener('keydown', (e) => {
  audio.unlock();
  if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'Backspace') e.preventDefault();
  if (!e.repeat && MENU_KEYS[e.code]) menuEdges.push(MENU_KEYS[e.code]);
  keys.add(e.code); tapped.add(e.code); setScheme('keyboard');
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => { keys.clear(); lmb = false; if (mode === 'play') openPause(); });
// a pointer-lock click must not also count as a menu tap or a shot
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') openPause(); });
// Pointer lock can be refused (embedded previews, some browsers): then dragging with the left button looks.
let lockOK = true;
function lockPointer() {
  try { const r = cv.requestPointerLock?.(); if (r && r.catch) r.catch(() => { lockOK = false; }); } catch { lockOK = false; }
}
document.addEventListener('pointerlockerror', () => { lockOK = false; });
cv.addEventListener('mousedown', (e) => {
  audio.unlock();
  if (mode !== 'play') return;
  if (document.pointerLockElement !== cv && lockOK) { lockPointer(); return; }
  if (e.button === 0 && document.pointerLockElement === cv) lmb = true; if (e.button === 2) rmbEdge = true;
  setScheme('keyboard');
});
addEventListener('mouseup', (e) => { if (e.button === 0) lmb = false; });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === cv || (!lockOK && mode === 'play' && (e.buttons & 1))) { mouseDX += e.movementX; mouseDY += e.movementY; }
});
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && mode === 'play') openPause(); });
function setScheme(s) { if (s !== scheme) { scheme = s; hb?.scheme(s); if (s !== 'touch') touchRelease?.(); } }

// gamepad (standard mapping), as the web game's pollPad
const pad = { prev: [], on: false, ax: [0, 0, 0, 0], rt: false, pay: 0 };
function pollPad(down) {
  const gp = [...(navigator.getGamepads?.() || [])].find((g) => g && g.connected);
  if (!gp) { pad.on = false; return; }
  pad.on = true;
  const b = gp.buttons.map((x) => x && (x.pressed || x.value > 0.5));
  const edge = (i, n) => { if (b[i] && !pad.prev[i]) { menuEdges.push(n); setScheme('controller'); audio.unlock(); } };
  edge(0, 'confirm'); edge(1, 'back'); edge(9, 'back'); edge(12, 'up'); edge(13, 'down'); edge(14, 'left'); edge(15, 'right');
  const held = (i, n) => { if (b[i]) down.push('@' + n); };
  held(0, 'use'); held(1, 'kick'); held(2, 'kick'); held(4, 'kick'); held(6, 'kick'); held(3, 'swap'); held(5, 'swap');
  held(9, 'pause'); held(8, 'map'); held(10, 'guide'); held(11, 'guide'); held(14, 'prev'); held(15, 'next');
  const dz = (v) => Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82;
  pad.ax = [0, 1, 2, 3].map((i) => dz(gp.axes[i] || 0)); pad.rt = !!b[7];
  const ay = gp.axes[1] || 0;
  if (ay < -0.6 && pad.pay >= -0.6) menuEdges.push('up'); if (ay > 0.6 && pad.pay <= 0.6) menuEdges.push('down');
  pad.pay = ay;
  if (Math.abs(pad.ax[0]) + Math.abs(pad.ax[1]) + Math.abs(pad.ax[2]) + Math.abs(pad.ax[3]) > 0.3 || b.some(Boolean)) setScheme('controller');
  pad.prev = b;
}


// ---------------------------------------------------------------- touch (mirrors TouchControls.swift)
// A floating stick in the left 45% of the screen (50-point reach, runs past 90%), drag-to-look in the
// right 55% (0.0068 radians and 0.5 pitch pixels per point), and the web game's buttons. On phones the
// frame has side bars, so MAP and PATH sit in the top of the left bar, pause in the top of the right
// bar, and the thumb cluster tucks toward the right edge. Every touch is tracked on its own.
const tcv = $('#touch'), tg = tcv.getContext('2d');
const T = {
  moveX: 0, moveY: 0, run: false, lookDX: 0, lookDY: 0, fireHeld: false, fireTapped: false,
  held: new Set(), tapped: new Set(), lookSpeed: 1, bars: false,
  roles: new Map(), stick: null, stickOrigin: null, stickPos: null, look: null,
  buttons: [
    { a: 'fire', t: 'FIRE', size: 94, font: 13, fire: true }, { a: 'kick', t: 'KICK', size: 62, font: 11 },
    { a: 'use', t: 'USE', size: 54, font: 11 }, { a: 'swap', t: 'SWAP', size: 54, font: 11 },
    { a: 'map', t: 'MAP', size: 42, font: 10 }, { a: 'pause', t: 'II', size: 42, font: 12 }, { a: 'guide', t: 'PATH', size: 42, font: 9 },
  ],
};
for (const b of T.buttons) { b.base = b.size; b.down = false; }
function touchLayout() {
  const W = innerWidth, H = innerHeight, d = Math.min(2, devicePixelRatio || 1);
  tcv.width = Math.round(W * d); tcv.height = Math.round(H * d);
  const bar = (W - BW) / 2;
  T.bars = bar >= 56;
  const right = T.bars ? 8 : 0, bottom = 6;
  const B = (a) => T.buttons.find((b) => b.a === a);
  for (const b of T.buttons) b.size = T.bars && b.base === 42 ? 38 : b.base;
  const place = (a, x, y) => { const b = B(a); b.x = x; b.y = y; };
  place('fire', W - right - 22 - 47, H - bottom - 26 - 47);
  place('kick', W - right - 130 - 31, H - bottom - 20 - 31);
  place('use', W - right - 138 - 27, H - bottom - 96 - 27);
  place('swap', W - right - 42 - 27, H - bottom - 132 - 27);
  if (T.bars) { const x = Math.max(25, bar / 2); place('map', x, 27); place('guide', x, 69); place('pause', W - x, 27); }
  else { const y = 8 + 21; place('map', W / 2 - 49, y); place('pause', W / 2, y); place('guide', W / 2 + 49, y); }
}
addEventListener('resize', touchLayout);
function touchLive() { return mode === 'play' && scheme === 'touch'; }
function touchRelease() {
  for (const b of T.buttons) b.down = false;
  T.roles.clear(); T.stick = T.look = null; T.moveX = T.moveY = 0; T.run = false;
  T.fireHeld = false; T.fireTapped = false; T.held.clear(); T.tapped.clear(); T.lookDX = T.lookDY = 0;
}
const isTouchDevice = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
function onTouchStart(e) {
  audio.unlock();
  if (mode !== 'play') return;
  e.preventDefault();
  setScheme('touch');
  for (const t of e.changedTouches) {
    const x = t.clientX, y = t.clientY;
    if (last?.hud?.cutOn) { T.tapped.add('use'); continue; }      // a tap anywhere skips a cut scene
    const b = T.buttons.find((b) => Math.hypot(x - b.x, y - b.y) <= b.size / 2 + 8);
    if (b) {
      T.roles.set(t.identifier, { r: 'button', a: b.a }); b.down = true;
      if (b.a === 'fire') { T.fireHeld = true; T.fireTapped = true; } else { T.held.add(b.a); T.tapped.add(b.a); }
      if (b.a === 'kick' && navigator.vibrate) navigator.vibrate(12);
    } else if (x < innerWidth * 0.45 && T.stick == null) {
      T.roles.set(t.identifier, { r: 'stick' }); T.stick = t.identifier; T.stickOrigin = T.stickPos = { x, y };
    } else if (x >= innerWidth * 0.45 && T.look == null) {
      T.roles.set(t.identifier, { r: 'look', x, y }); T.look = t.identifier;
    }
  }
}
function onTouchMove(e) {
  if (mode !== 'play') return;
  e.preventDefault();
  for (const t of e.changedTouches) {
    const role = T.roles.get(t.identifier); if (!role) continue;
    const x = t.clientX, y = t.clientY;
    if (role.r === 'stick') {
      let dx = x - T.stickOrigin.x, dy = y - T.stickOrigin.y; const l = Math.hypot(dx, dy), mx = 50;
      if (l > mx) { dx *= mx / l; dy *= mx / l; }
      T.moveX = dx / mx; T.moveY = -dy / mx; T.run = Math.hypot(dx / mx, dy / mx) > 0.9;
      T.stickPos = { x: T.stickOrigin.x + dx, y: T.stickOrigin.y + dy };
    } else if (role.r === 'look') {
      T.lookDX += x - role.x; T.lookDY += y - role.y; role.x = x; role.y = y;
    }
  }
}
function onTouchEnd(e) {
  for (const t of e.changedTouches) {
    const role = T.roles.get(t.identifier); if (!role) continue;
    T.roles.delete(t.identifier);
    if (role.r === 'stick') { T.stick = null; T.moveX = T.moveY = 0; T.run = false; }
    else if (role.r === 'look') T.look = null;
    else { const b = T.buttons.find((b) => b.a === role.a); if (b) b.down = false; if (role.a === 'fire') T.fireHeld = false; else T.held.delete(role.a); }
  }
}
tcv.addEventListener('touchstart', onTouchStart, { passive: false });
tcv.addEventListener('touchmove', onTouchMove, { passive: false });
tcv.addEventListener('touchend', onTouchEnd); tcv.addEventListener('touchcancel', onTouchEnd);
// the first touch anywhere (title, menus) switches the prompts to touch
addEventListener('touchstart', () => { audio.unlock(); if (scheme !== 'touch') setScheme('touch'); }, { passive: true, capture: true });
addEventListener('touchend', () => audio.unlock(), { passive: true, capture: true });

// this frame's touch input into the engine's input (a tap between frames still counts once)
function drainTouch(i, down) {
  i.moveX += T.moveX; i.moveY += T.moveY; if (T.run) i.flags |= RUN;
  i.lookX += T.lookDX * 0.0068 * T.lookSpeed; i.lookY += -T.lookDY * 0.5 * T.lookSpeed; T.lookDX = T.lookDY = 0;
  if (T.fireHeld || T.fireTapped) i.flags |= FIRE; T.fireTapped = false;
  for (const a of T.held) down.push('@' + a); for (const a of T.tapped) down.push('@' + a); T.tapped.clear();
}

function drawTouch() {
  const d = tcv.width / innerWidth;
  tg.setTransform(d, 0, 0, d, 0, 0); tg.clearRect(0, 0, innerWidth, innerHeight);
  const live = touchLive() && !last?.hud?.cutOn;
  tcv.classList.toggle('live', mode === 'play' && scheme === 'touch');
  if (!live) return;
  for (const b of T.buttons) {
    tg.beginPath(); tg.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
    tg.fillStyle = b.down ? 'rgba(232,237,241,.25)' : b.fire ? 'rgba(208,20,47,.22)' : 'rgba(17,22,27,.5)'; tg.fill();
    tg.lineWidth = 2; tg.strokeStyle = b.fire ? 'rgba(208,20,47,.85)' : 'rgba(139,152,165,.55)'; tg.stroke();
    tg.font = `${b.font}px Silkscreen`; tg.fillStyle = C.ink; tg.textAlign = 'center'; tg.textBaseline = 'middle';
    tg.fillText(b.t, b.x, b.y + 1);
  }
  if (T.stick != null) {
    const o = T.stickOrigin, k = T.stickPos;
    tg.beginPath(); tg.arc(o.x, o.y, 60, 0, Math.PI * 2); tg.fillStyle = 'rgba(63,224,197,.07)'; tg.fill(); tg.lineWidth = 2; tg.strokeStyle = 'rgba(63,224,197,.4)'; tg.stroke();
    tg.beginPath(); tg.arc(k.x, k.y, 27, 0, Math.PI * 2); tg.fillStyle = 'rgba(63,224,197,.35)'; tg.fill(); tg.strokeStyle = 'rgba(63,224,197,.7)'; tg.stroke();
  }
}

// phones and tablets play in landscape: say so in portrait
function checkRotate() { $('#rotate').style.display = isTouchDevice && innerHeight > innerWidth ? 'flex' : 'none'; }
addEventListener('resize', checkRotate);

// ---------------------------------------------------------------- menus
let mode = 'load';                 // load, title, play, menu
let menu = null;                   // { kind, items: [{label, act}], sel }
let info = null;                   // the open deck (hb.info())
let difficulty = +(store.get('difficulty') ?? 2), deckChoice = 'deck-01';

function showPanel(id) { for (const p of ['#load', '#title', '#menu']) $(p).classList.toggle('on', p === id); $('#beta').style.display = id ? '' : 'none'; }   // the beta tag hides during play (it sat under FIRE)
function renderItems(el, items, sel) {
  el.innerHTML = '';
  items.forEach((it, i) => {
    const d = document.createElement('div');
    d.className = 'item' + (i === sel ? ' sel' : ''); d.textContent = it.label.toUpperCase();
    d.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.unlock(); menu.sel = i; audio.tick(); it.act(); refreshMenu(); });
    el.appendChild(d);
  });
}
function refreshMenu() {
  if (!menu) return;
  renderItems(menu.kind === 'title' ? $('#titleItems') : $('#menuItems'), menu.items, menu.sel);
}
function menuInput() {
  if (!menu) { menuEdges.length = 0; return; }
  if (!menuEdges.length) return;      // redraw the rows only when something changed
  for (const e of menuEdges.splice(0)) {
    const it = menu.items[menu.sel];
    if (e === 'up') { menu.sel = (menu.sel - 1 + menu.items.length) % menu.items.length; audio.tick(); }
    else if (e === 'down') { menu.sel = (menu.sel + 1) % menu.items.length; audio.tick(); }
    else if ((e === 'left' || e === 'right') && it.step) { it.step(e === 'left' ? -1 : 1); audio.tick(); }
    else if (e === 'confirm') { audio.tick(); it.act(); }
    else if (e === 'back' && menu.back) { menu.back(); }
    if (!menu) return;
  }
  refreshMenu();
}

function deckList() { return catalog.packs.filter((p) => p.kind === 'deck').map((p) => ({ id: p.id, n: p.deck, title: catalog.decks.find((d) => d.deck === p.deck)?.title || p.id })); }
function diffNames() { return info?.difficulties?.map((d) => d.name) || ['Very Easy', 'Easy', 'Normal', 'Hard', 'Nightmare']; }
function savedFor(deck) { try { return JSON.parse(store.get('save-' + deck) || 'null'); } catch { return null; } }

function openTitle() {
  touchRelease(); tcv.classList.remove('live'); tg.clearRect(0, 0, tcv.width, tcv.height);
  if (document.pointerLockElement) document.exitPointerLock();
  mode = 'title'; showPanel('#title');
  const decks = deckList();
  const d = () => decks.find((x) => x.id === deckChoice) || decks[0];
  menu = { kind: 'title', sel: 0, items: [] };
  const build = () => {
    const s = savedFor(d().id);
    menu.items = [
      { label: `Deck ${pad2(d().n)}: ${d().title}  ‹ ›`, step: (k) => { const i = decks.indexOf(d()); deckChoice = decks[(i + k + decks.length) % decks.length].id; build(); }, act: () => menu.items[0].step(1) },
      { label: `Difficulty: ${diffNames()[difficulty]}  ‹ ›`, step: (k) => { difficulty = (difficulty + k + 5) % 5; store.set('difficulty', difficulty); build(); }, act: () => menu.items[1].step(1) },
      ...(s ? [{ label: `Continue (${diffNames()[s.difficulty]})`, act: () => startDeck(d().id, s.difficulty, unb64(s.data)) }] : []),
      { label: 'New Run', act: () => startDeck(d().id, difficulty) },
    ];
    $('#titleNote').textContent = isTouchDevice
      ? 'Touch: left thumb moves (push far to run), drag on the right to look, FIRE, KICK, USE and SWAP on the right, MAP, PATH and II (pause) at the top. Tap to skip a cut scene. Controllers work too.'
      : 'Keyboard: WASD move, mouse look (click to capture), Space or click fire, E use, F or right-click kick, Q swap, M map, G path, Esc pause. Controllers work too.';
    refreshMenu();
  };
  build();
}

// Carry-over (as the Apple app): clearing a deck stores Buck's loadout for the next one; starting a deck
// fresh uses that, or the engine's assumed loadout; Restart Deck starts with the same carry again.
let currentCarry = null;
function storedCarry(deck) { try { return JSON.parse(store.get('carry-' + deck) || 'null'); } catch { return null; } }
function startDeck(deck, diff, resume = null, carry = undefined) {
  audio.unlock();
  const ach = store.get('achievements');
  if (!resume) currentCarry = carry !== undefined ? carry : storedCarry(deck);
  hb.open(deck, diff, 0, ach ? unb64(ach) : null, resume ? 'none' : currentCarry);
  hb.scheme(scheme);
  info = hb.info();
  deckChoice = deck;
  if (resume && !hb.restore(resume)) console.warn('save did not load');
  menu = null; mode = 'play'; showPanel(null);
  faceCache.clear();
  if (scheme === 'touch') { try { document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {}); } catch {} }
  else lockPointer();
}

function openMenu(kind, title, bodyHTML, items, back, tint = '#04060ad1') {
  touchRelease(); drawTouch();
  if (document.pointerLockElement) document.exitPointerLock();
  mode = 'menu'; showPanel('#menu');
  $('#menu').style.background = tint;
  $('#menuTitle').textContent = title; $('#menuTitle').style.color = kind === 'depart' ? 'var(--amber)' : 'var(--ink)';
  $('#menuBody').innerHTML = bodyHTML;
  menu = { kind, sel: 0, items, back };
  menuEdges.length = 0;
  refreshMenu();
}
function closeMenu() { menu = null; mode = 'play'; showPanel(null); audio.pause(false); if (scheme !== 'touch') lockPointer(); }

function openPause() {
  if (mode !== 'play') return;
  audio.pause(true);
  const s = savedFor(deckChoice);
  openMenu('pause', 'PAUSED', `<div class="sub">Objective: ${esc(last?.hud.objective || '')}</div>`, [
    { label: 'Resume', act: closeMenu },
    { label: 'Restart Deck', act: () => { audio.pause(false); startDeck(deckChoice, info.difficulty, null, currentCarry); } },
    ...(s && s.difficulty === info.difficulty ? [{ label: 'Load Last Save', act: () => { audio.pause(false); startDeck(deckChoice, s.difficulty, unb64(s.data)); } }] : []),
    { label: 'Quit to Title', act: () => { audio.pause(false); audio.stop('voice'); audio.stop('log'); openTitle(); } },
  ], closeMenu);
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function openDepart(d) {
  const rows = [['KILLS', d.kills, d.killTotal], ['SECRETS', d.secrets, d.secretTotal], ['AUDIO LOGS', d.logs, d.logTotal], ['ASSETS TAGGED', d.assets, d.assetTotal]];
  const done = d.percent >= 100;
  const body = `<div class="sub">${done ? `Depart Deck ${pad2(d.deck)}?` : 'Outstanding items stay on the ship.'}</div>
    <div class="grid" style="margin:calc(var(--h)*.02) auto">${rows.map(([n, a, b]) => `<div style="color:var(--steel)">${n}</div><div class="n" style="color:${a >= b ? 'var(--rig)' : 'var(--blood)'}">${a} / ${b}</div>`).join('')}</div>
    <div style="font-size:calc(var(--h)*.026);color:var(--steel)">TIME ${clock(d.time)}</div>
    <div class="title" style="font-size:calc(var(--h)*.07);color:var(--amber)">${d.percent}% COMPLETE</div>`;
  const stay = () => { hb.stay(); closeMenu(); };
  openMenu('depart', done ? 'ACCOUNT CLOSED IN FULL' : `DEPART DECK ${pad2(d.deck)}?`, body,
    [{ label: 'Stay', act: stay }, { label: 'Depart', act: () => { hb.depart(); closeMenu(); } }], stay, '#04060ad6');
}

function openDead() {
  const s = savedFor(deckChoice);
  openMenu('dead', 'REPOSSESSED', `<div class="sub">Gorgon Consolidated thanks you for your service. Your estate has been invoiced.</div>`, [
    ...(s && s.difficulty === info.difficulty ? [{ label: 'Load Last Save', act: () => startDeck(deckChoice, s.difficulty, unb64(s.data)) }] : []),
    { label: 'Restart Deck', act: () => startDeck(deckChoice, info.difficulty, null, currentCarry) },
    { label: 'Quit to Title', act: openTitle },
  ], null, '#d0142fd1');
}

function openWon(r) {
  store.set('save-' + deckChoice, null);
  const lines = [info.outroBody, `${r.percent}% COMPLETE · ${r.rank}`,
    `KILLS ${r.kills}/${r.killTotal}   SECRETS ${r.secrets}/${r.secretTotal}   LOGS ${r.logs}/${r.logTotal}   ASSETS ${r.assets}/${r.assetTotal}`,
    `TIME ${clock(r.time)}`];
  const decks = deckList(), i = decks.findIndex((x) => x.id === deckChoice);
  const out = hb.loadout(), next = i >= 0 && i + 1 < decks.length ? decks[i + 1] : null;
  // what Buck carries out goes to the next deck (also when it is started later from the title)
  const nextId = next?.id || `deck-${pad2(info.deck + 1)}`;
  store.set('carry-' + nextId, JSON.stringify(out));
  openMenu('won', info.outroHeading, lines.map((l) => `<div class="sub">${esc(l)}</div>`).join(''), [
    ...(next ? [{ label: 'Next Deck', act: () => startDeck(next.id, info.difficulty, null, out) }] : []),
    { label: 'Back to Title', act: openTitle },
  ], null);
}

// ---------------------------------------------------------------- HUD (matches Apps/Shared/HUDView.swift)
const C = { void: '#04060a', steel: '#8b98a5', ink: '#e8edf1', rig: '#3fe0c5', amber: '#ffb627', blood: '#d0142f', term: '#6dff9a', cyan: '#5ff6ff' };
const WEAPONS = ['CUTTER', 'BOOMSTICK', 'RIVET DRIVER', 'CHARGES'], AMMO = ['cells', 'shells', 'rivets', 'bombs'];
let last = null;
const face = { mood: 0, look: 0, t: 0 };
const faceCache = new Map();

function font(u, kind = 'p') {
  const px = Math.max(kind === 't' ? 10 : 8, u * BH / 100) * DPR;
  return kind === 't' ? `${px}px VT323` : kind === 'd' ? `bold ${px}px Teko` : `${px}px Silkscreen`;
}
function wrap(text, maxW) {
  const out = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (hg.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function rect(x, y, w, h, c) { hg.fillStyle = c; hg.fillRect(x, y, w, h); }
function text(t, x, y, c, align = 'left', base = 'top') { hg.fillStyle = c; hg.textAlign = align; hg.textBaseline = base; hg.fillText(t, x, y); }
function alpha(a, fn) { hg.save(); hg.globalAlpha = Math.max(0, Math.min(1, a)); fn(); hg.restore(); }

// a box of wrapped text, placed by an anchor; returns its rect
function textBox({ lines, fontSpec, color, x, y, maxW, padX, padY, bg, bar, barSide = 'left', anchor = 'tl', lineGap = 1.15, align = 'left', prefix }) {
  hg.font = fontSpec;
  // the label (OBJECTIVE:, BUCK:) wraps with the text, so the first line never runs past the box
  const ls = wrap((prefix ? prefix.text : '') + lines, maxW - padX * 2);
  if (prefix) ls[0] = ls[0].slice(prefix.text.length);
  const lh = parseFloat(fontSpec.match(/([\d.]+)px/)[1]) * lineGap;
  const pw0 = prefix ? hg.measureText(prefix.text).width : 0;
  const w = Math.min(maxW, Math.max(...ls.map((l, i) => hg.measureText(l).width + (i === 0 ? pw0 : 0))) + padX * 2);
  const h = ls.length * lh + padY * 2;
  let bx = anchor.includes('r') ? x - w : anchor.includes('c') ? x - w / 2 : x;
  let by = anchor.includes('b') ? y - h : y;
  if (bg) rect(bx, by, w, h, bg);
  if (bar) rect(barSide === 'left' ? bx : bx + w - 3 * DPR, by, 3 * DPR, h, bar);
  ls.forEach((l, i) => {
    let tx = align === 'center' ? bx + w / 2 : bx + padX, ty = by + padY + i * lh;
    if (prefix && i === 0) {
      const pw = hg.measureText(prefix.text).width;
      if (align === 'center') { const lw = pw + hg.measureText(l).width; tx = bx + (w - lw) / 2; text(prefix.text, tx, ty, prefix.color); text(l, tx + pw, ty, color); return; }
      text(prefix.text, tx, ty, prefix.color); text(l, tx + pw, ty, color); return;
    }
    text(l, tx, ty, color, align === 'center' ? 'center' : 'left');
  });
  return { x: bx, y: by, w, h };
}

function drawHUD(s, dt) {
  const w = hudCv.width, h = hudCv.height, u = h / 180, hud = s.hud, p = s.player;
  hg.clearRect(0, 0, w, h);
  if (!s.hud) return;
  const cx = w / 2, cy = h / 2, playing = mode === 'play';
  const touch = scheme === 'touch', bars = touch && T.bars;
  // combat layer: crosshair, damage numbers, hurt tint, pickup flash, low-HP vignette
  if (!p.dead && playing && !hud.cutOn) {
    const c = hud.hit > 0 ? 'rgb(255,48,71)' : 'rgba(95,245,255,.9)';
    const px = (x, y, a, b) => rect(cx + x * u, cy + y * u, a * u, b * u, c);
    if (p.wpn === 0) { px(-10, 0, 6, 1); px(5, 0, 6, 1); px(0, -3, 1, 2); px(0, 2, 1, 2); }
    else if (p.wpn === 1) for (const [a, b] of [[-5, 0], [5, 0], [0, -5], [0, 5], [-4, -3], [4, -3], [-4, 3], [4, 3]]) px(a, b, 1, 1);
    else if (p.wpn === 2) { px(-4, 0, 3, 1); px(2, 0, 3, 1); px(0, -4, 1, 3); px(0, 2, 1, 3); }
    else px(-1, -1, 3, 3);
  }
  for (const pop of hud.pops) { hg.font = `${8 * u}px Silkscreen`; text(pop.text, cx, cy + (-12 - (1 - pop.life) * 14) * u, pop.color, 'center'); }
  if (hud.hurt > 0) {
    rect(0, 0, w, h, `rgba(170,0,18,${hud.hurt * 0.45})`);
    const a = hud.hurtDir - Math.PI / 2;
    hg.strokeStyle = `rgba(255,41,61,${Math.min(1, hud.hurt)})`; hg.lineWidth = 3 * u;
    hg.beginPath(); hg.arc(cx, cy, 34 * u, a - 0.45, a + 0.45); hg.stroke();
  }
  if (hud.pickFlash > 0) rect(0, 0, w, h, `rgba(255,182,39,${hud.pickFlash * 0.35})`);
  if (p.hp < 30 && !p.dead) {
    const pulse = 0.25 + 0.2 * Math.sin(s.clock * 6);
    const g = hg.createRadialGradient(cx, cy, 54 * u, cx, cy, 224 * u);
    g.addColorStop(0, 'rgba(120,0,10,0)'); g.addColorStop(1, `rgba(120,0,10,${pulse})`);
    hg.fillStyle = g; hg.fillRect(0, 0, w, h);
  }

  // messages, top left
  hg.font = font(2.6);
  const mx = touch ? w * 6 / 320 : w * 0.05, my = touch ? h * 26 / 180 : h * 0.06;
  hud.messages.forEach((m, i) => alpha(m.life * 2, () => { text(m.text, mx + 2 * DPR, my + i * h * 0.035 + 2 * DPR, '#000'); text(m.text, mx, my + i * h * 0.035, C.ink); }));

  if (hud.bannerT > 0) alpha(Math.min(hud.bannerT * 1.5, (3.2 - hud.bannerT) * 4), () => {
    hg.font = font(2); text(`DECK ${pad2(info.deck)}`, cx, h * 0.3, C.steel, 'center');
    hg.font = font(3.6); text(hud.banner, cx, h * 0.3 + h * 0.03, C.ink, 'center');
  });
  if (hud.objectiveT > 0 && hud.objective && !hud.mapOn) alpha(hud.objectiveT, () => textBox({
    lines: hud.objective.toUpperCase(), prefix: { text: 'OBJECTIVE: ', color: C.amber }, fontSpec: font(2.2), color: C.ink,
    x: bars ? cx : w - w * 0.04, y: touch && !bars ? h * 0.3 : h * 0.04, maxW: w * 0.38, padX: h * 0.015, padY: h * 0.01,
    bg: 'rgba(0,0,0,.62)', bar: C.amber, anchor: bars ? 'tc' : 'tr' }));
  if (hud.roomTagT > 0 && hud.bannerT <= 0 && hud.objectiveT <= 0) alpha(hud.roomTagT * 2, () => textBox({
    lines: hud.roomTag, fontSpec: font(2.4), color: C.ink, x: touch ? w * 6 / 320 : w - w * 0.05, y: touch ? h - h * 0.025 : h * 0.06,
    maxW: w * 0.5, padX: h * 0.015, padY: h * 0.006, bg: 'rgba(4,6,10,.7)', bar: C.rig, barSide: 'right', anchor: touch ? 'bl' : 'tr' }));
  if (hud.logOpen) {
    const shown = hud.logText.slice(0, Math.floor(hud.logT * 42));
    hg.font = font(3.6, 't');
    const bw = w * 0.42, pad = h * 0.025, inner = bw - pad * 2;
    const ls = wrap(shown, inner), lh = 3.6 * h / 100 * 1.1;
    const bh = pad * 2 + h * 0.034 + Math.max(1, ls.length) * lh + lh * 0.25;
    const bx = w - w * 0.05 - bw, by = cy - bh / 2;
    rect(bx, by, bw, bh, 'rgba(0,0,0,.78)'); hg.strokeStyle = 'rgba(109,255,154,.4)'; hg.lineWidth = DPR; hg.strokeRect(bx, by, bw, bh);
    hg.font = font(2.2); text(hud.logHeader, bx + pad, by + pad, C.term);
    hg.font = font(3.6, 't'); ls.forEach((l, i) => text(l, bx + pad, by + pad + h * 0.034 + i * lh, C.ink));
  }
  if (hud.hintT > 0 && !hud.mapOn) alpha(hud.hintT * 2, () => textBox({
    lines: hud.hint, fontSpec: font(2.6), color: C.cyan, x: cx, y: h * 0.56, maxW: w * 0.6, padX: h * 0.02, padY: h * 0.012, bg: 'rgba(0,0,0,.7)', bar: C.cyan, anchor: 'tc', align: 'center' }));
  if (hud.breath < 1) {
    const bw = h * 0.3, y = touch ? h * 0.12 : h * 0.045;
    hg.font = font(1.8); const tw = hg.measureText('AIR ').width;
    const x0 = cx - (tw + bw) / 2;
    text('AIR', x0, y, C.steel); rect(x0 + tw, y, bw, h * 0.02, 'rgba(0,0,0,.7)'); rect(x0 + tw, y, bw * hud.breath, h * 0.02, hud.breath > 0.3 ? C.cyan : C.blood);
  }
  if (hud.bossName) {
    const bw = w * 0.5, y = h - (touch ? h * 0.08 : h * 0.19) - h * 0.014;
    hg.font = font(2); text(hud.bossName, cx, y - h * 0.006, C.blood, 'center', 'bottom');
    rect(cx - bw / 2, y, bw, h * 0.014, 'rgba(0,0,0,.75)'); rect(cx - bw / 2, y, bw * hud.bossHealth, h * 0.014, C.blood);
  }
  if (hud.subtitleT > 0) {
    const sc = hud.speaker === 'MOSS' ? '#ff9a3c' : hud.speaker === 'DISPATCH' ? '#8fd8ff' : C.amber;
    textBox({ lines: hud.subtitle, prefix: { text: hud.speaker + ': ', color: sc }, fontSpec: font(2.8), color: C.ink, x: cx, y: h - h * 0.16,
      maxW: w * 0.8, padX: h * 0.02, padY: h * 0.01, bg: 'rgba(0,0,0,.6)', anchor: 'bc', align: 'center' });
  }
  if (!hud.cutOn) (touch ? drawTouchStatus : drawStatus)(s, w, h, u, dt);
  if (hud.sceneOn) drawScene(hud, w, h);
  if (hud.cutOn) drawCut(hud, w, h);
  if (hud.mapOn && playing) drawAutomap(w, h);
  if (hud.toastT > 0) {
    const a = Math.min(hud.toastT * 2, (4 - hud.toastT) * 5), off = -h * 0.04 * Math.max(0, 1 - (4 - hud.toastT) * 5);
    alpha(a, () => drawToast(hud, cx, (touch ? (bars ? h * 0.14 : h * 0.53) : h * 0.04) + off, h));
  }
}

function drawStatus(s, w, h, u, dt) {
  const p = s.player, bh = 21 * u, y0 = h - bh;
  rect(0, y0, w, bh, 'rgba(10,12,15,.9)'); rect(0, y0, w, Math.max(1, u), 'rgb(56,66,77)');
  const hc = p.hp > 60 ? C.rig : p.hp > 30 ? C.amber : C.blood, pips = Math.ceil(p.hp / 10), mid = y0 + bh / 2;
  hg.font = `${8.9 * u}px Silkscreen`; text(String(Math.ceil(p.hp)), 8 * u, mid, hc, 'left', 'middle');
  const ax = 8 * u + 32 * u + 8 * u;
  hg.font = `${4.4 * u}px Silkscreen`; text(`ARMOR ${Math.floor(p.armor)}`, ax, mid - 1 * u, C.steel, 'left', 'bottom');
  for (let i = 0; i < 10; i++) rect(ax + i * 5 * u, mid + 1 * u, 4 * u, 4 * u, i < pips ? hc : 'rgb(31,38,46)');
  hg.font = `${8.9 * u}px Silkscreen`; text(String(p.ammo[AMMO[p.wpn]] ?? 0), w - 8 * u, mid, C.amber, 'right', 'middle');
  const rx = w - 8 * u - 32 * u - 8 * u;
  hg.font = `${4.4 * u}px Silkscreen`;
  text(WEAPONS[p.wpn], rx, p.weapons[3] && p.wpn !== 3 ? mid - 1 * u : mid, C.steel, 'right', p.weapons[3] && p.wpn !== 3 ? 'bottom' : 'middle');
  if (p.weapons[3] && p.wpn !== 3) text(`CHG ${p.ammo.bombs ?? 0}`, rx, mid + 1 * u, C.steel, 'right', 'top');
  // Buck's face, at true center, with keys and boots to its right
  face.t -= dt;
  if (face.t <= 0) { face.t = 1.2 + Math.random() * 2; face.look = [-1, 0, 0, 1][Math.floor(Math.random() * 4)]; }
  face.mood = s.hud.hurt > 0.3 ? 2 : s.hud.hit > 0 ? 1 : 0;
  const fs = 24 * u, fx = w / 2 - fs / 2 - 2 * u, fy = mid - 6 * u - fs / 2 - 2 * u;
  rect(fx, fy, fs + 4 * u, fs + 4 * u, 'rgb(10,12,15)'); hg.strokeStyle = 'rgb(56,66,77)'; hg.lineWidth = Math.max(1, u); hg.strokeRect(fx, fy, fs + 4 * u, fs + 4 * u);
  const fk = `${Math.round(p.hp)}|${face.mood}|${face.look}`;
  if (!faceCache.has(fk)) { if (faceCache.size > 300) faceCache.clear(); faceCache.set(fk, hb.face(p.hp, face.mood, face.look)); }
  const k = fs / 16;
  for (const [x, y, cw, ch, col] of faceCache.get(fk)) rect(fx + 2 * u + x * k, fy + 2 * u + y * k, cw * k, ch * k, col);
  let kx = fx + fs + 4 * u + 6 * u;
  for (const [id, col] of Object.entries(info.keyColors)) {
    const has = s.keys.includes(id);
    if (has) rect(kx, mid - 2 * u - 6 * u, 6 * u, 4 * u, col); else { hg.strokeStyle = 'rgba(139,152,165,.4)'; hg.lineWidth = DPR; hg.strokeRect(kx, mid - 2 * u - 6 * u, 6 * u, 4 * u); }
    kx += 8 * u;
  }
  if (p.boots) { rect(kx, mid - 9 * u, 6 * u, 5 * u, '#5a4632'); rect(kx, mid - 5 * u, 11 * u, 2 * u, '#3a2a1c'); }
}

// the automap: draw commands from the engine (hb_automap), in 320x180 frame units
function drawAutomap(w, h) {
  const m = hb.automap(scheme), s = Math.min(w / 320, h / 180);
  const fills = m.pal.map((c) => { const [hex, a] = c.split('@'); if (a == null) return hex; const v = parseInt(hex.slice(1), 16); return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${a})`; });
  const b = m.b;
  for (let i = 0; i < b.length; i += 5) { hg.fillStyle = fills[b[i + 4]]; hg.fillRect(b[i] / 10 * s, b[i + 1] / 10 * s, b[i + 2] / 10 * s, b[i + 3] / 10 * s); }
  if (m.r.length > 2) {
    hg.save(); hg.strokeStyle = 'rgba(95,245,255,.9)'; hg.lineWidth = 1.5 * s; hg.setLineDash([3 * s, 2 * s]);
    hg.beginPath(); hg.moveTo(m.r[0] * s, m.r[1] * s); for (let i = 2; i < m.r.length; i += 2) hg.lineTo(m.r[i] * s, m.r[i + 1] * s); hg.stroke(); hg.restore();
    const ex = m.r[m.r.length - 2], ey = m.r[m.r.length - 1]; rect((ex - 2) * s, (ey - 2) * s, 4 * s, 4 * s, m.re);
  }
  const [ax, ay, a] = m.a;
  hg.fillStyle = C.amber; hg.beginPath();
  hg.moveTo((ax + Math.cos(a) * 5) * s, (ay + Math.sin(a) * 5) * s);
  hg.lineTo((ax + Math.cos(a + 2.5) * 3.5) * s, (ay + Math.sin(a + 2.5) * 3.5) * s);
  hg.lineTo((ax + Math.cos(a - 2.5) * 3.5) * s, (ay + Math.sin(a - 2.5) * 3.5) * s);
  hg.closePath(); hg.fill();
  hg.font = `${8 * s}px Silkscreen`;
  for (const [t, x, y, c, an] of m.l) text(t, x * s, y * s, c, an === 'tr' ? 'right' : an === 'c' ? 'center' : 'left', an === 'c' ? 'middle' : 'top');
}

// touch mode: health and armor top left, ammo, weapon and keys top right, no bottom bar (TouchStatus)
function drawTouchStatus(s, w, h) {
  const p = s.player, k = h / 180, RW = w / k;
  const t = (str, x, y, c, px, align = 'left') => { hg.font = `${px * k}px Silkscreen`; text(str, (x + 1) * k, (y + 1) * k, 'rgba(0,0,0,.8)', align); text(str, x * k, y * k, c, align); };
  const hc = p.hp > 60 ? C.rig : p.hp > 30 ? C.amber : C.blood, pips = Math.ceil(p.hp / 10);
  t(String(Math.ceil(p.hp)), 8, 6, hc, 16);
  t(`ARM ${Math.floor(p.armor)}`, 50, 6, C.steel, 8);
  for (let i = 0; i < 10; i++) rect((50 + i * 4) * k, 16 * k, 3 * k, 3 * k, i < pips ? hc : 'rgb(31,38,46)');
  t(String(p.ammo[AMMO[p.wpn]] ?? 0), RW - 8, 20, C.amber, 16, 'right');
  t(WEAPONS[p.wpn], RW - 8, 36, C.steel, 8, 'right');
  if (p.weapons[3] && p.wpn !== 3) t(`CHG ${p.ammo.bombs ?? 0}`, RW - 8, 44, C.steel, 8, 'right');
  let kx = RW - 40;
  for (const [id, col] of Object.entries(info.keyColors)) {
    if (s.keys.includes(id)) rect(kx * k, 55 * k, 6 * k, 4 * k, col);
    else { hg.strokeStyle = 'rgba(139,152,165,.4)'; hg.lineWidth = DPR; hg.strokeRect(kx * k, 55 * k, 6 * k, 4 * k); }
    kx += 8;
  }
  if (p.boots) { const bx = (RW - 52) * k, by = 54 * k; rect(bx, by, 6 * k, 5 * k, '#5a4632'); rect(bx, by + 4 * k, 11 * k, 2 * k, '#3a2a1c'); }
}

function drawScene(hud, w, h) {
  const s = Math.min(w / 320, h / 180), r = (x, y, a, b, c) => rect(x * s, y * s, a * s, b * s, c);
  const RW = 320, RH = 180, hx = RW / 2 + hud.sceneBootX * RW;
  const y = hud.sceneBootDown ? RH * 0.55 : RH * (1.05 - hud.sceneBoot * 0.55), x = hx - RW * 0.11;
  if (hud.sceneBoot > 0 || hud.sceneBootDown) {
    r(x, y, RW * 0.22, RH * 0.5, 'rgb(41,31,23)'); r(x - RW * 0.02, y + RH * 0.22, RW * 0.28, RH * 0.12, 'rgb(59,41,31)');
    r(x - RW * 0.02, y + RH * 0.32, RW * 0.28, RH * 0.04, 'rgb(138,150,161)'); r(x + RW * 0.02, y + RH * 0.05, RW * 0.16, 3, '#c9a227');
  }
  if (hud.stamp) {
    const k = Math.min(1, hud.stampT * 6), sc = 1 + (1 - k) * 1.5;
    hg.save(); hg.translate(RW / 2 * s, RH * 0.42 * s); hg.rotate(-0.18); hg.scale(sc, sc); hg.globalAlpha = Math.min(1, k * 1.2);
    hg.strokeStyle = '#d0142f'; hg.lineWidth = 3 * s; hg.strokeRect(-70 * s, -14 * s, 140 * s, 28 * s);
    hg.font = `${16 * s}px Silkscreen`; text(hud.stamp, 0, 0, '#d0142f', 'center', 'middle'); hg.restore();
  }
  r(0, 0, RW, RH * 0.08, '#000'); r(0, RH * 0.92, RW, RH * 0.08, '#000');
}

function drawCut(hud, w, h) {
  if (hud.cutBlack) rect(0, 0, w, h, '#000');
  if (hud.cutCard) {
    const shown = hud.cutCard.slice(0, Math.floor(hud.cutCardT * 42));
    hg.font = font(2.8);
    const maxW = w * 0.7, pad = h * 0.03, ls = wrap(shown || ' ', maxW - pad * 2), lh = 2.8 * h / 100 * 1.25;
    const full = wrap(hud.cutCard, maxW - pad * 2);   // size the card for the whole text so it doesn't grow while typing
    const bw = Math.max(...full.map((l) => hg.measureText(l).width)) + pad * 2;
    const head = hud.cutSpeaker ? h * 0.034 : 0, bh = pad * 2 + head + full.length * lh;
    const bx = w / 2 - bw / 2, by = h / 2 - bh / 2;
    if (!hud.cutBlack) rect(bx, by, bw, bh, 'rgba(0,0,0,.7)');
    if (hud.cutSpeaker) { hg.font = font(2.2); text(hud.cutSpeaker, bx + pad, by + pad, C.amber); }
    hg.font = font(2.8); ls.forEach((l, i) => text(l, bx + pad, by + pad + head + i * lh, C.ink));
  }
  rect(0, 0, w, h * 0.08, '#000'); rect(0, h - h * 0.08, w, h * 0.08, '#000');
}

function drawToast(hud, cx, top, h) {
  const pad = h * 0.025;
  hg.font = font(3); const tw = hg.measureText(hud.toastTitle).width;
  hg.font = font(3, 't'); const xw = hud.toast ? hg.measureText(hud.toast).width : 0;
  hg.font = font(3.2); const pw = hg.measureText('PAID').width + h * 0.024;
  const inner = Math.max(tw, xw, h * 0.2), bw = pad * 2 + pw + h * 0.02 + inner, bh = h * 0.03 + h * 0.018 + h * 0.006 + (hud.toast ? h * 0.035 : 0) + h * 0.03;
  const bx = cx - bw / 2;
  rect(bx, top, bw, bh, 'rgba(18,15,13,.92)'); hg.strokeStyle = 'rgba(255,182,39,.6)'; hg.lineWidth = DPR; hg.strokeRect(bx, top, bw, bh);
  hg.save(); hg.translate(bx + pad + pw / 2, top + bh / 2); hg.rotate(-8 * Math.PI / 180);
  hg.font = font(3.2); text('PAID', 0, 0, C.blood, 'center', 'middle');
  hg.strokeStyle = C.blood; hg.lineWidth = Math.max(2, h * 0.004); hg.strokeRect(-pw / 2, -h * 0.025, pw, h * 0.05); hg.restore();
  const tx = bx + pad + pw + h * 0.02; let ty = top + h * 0.015;
  hg.font = font(1.8); text('LINE ITEM SETTLED', tx, ty, C.steel); ty += h * 0.024;
  hg.font = font(3); text(hud.toastTitle, tx, ty, C.ink); ty += h * 0.036;
  if (hud.toast) { hg.font = font(3, 't'); text(hud.toast, tx, ty, C.amber); }
}

// ---------------------------------------------------------------- loop
let prevT = 0;
function frame(t) {
  requestAnimationFrame(frame);
  const dt = prevT ? Math.min(0.05, (t - prevT) / 1000) : 1 / 60; prevT = t;
  const down = [];
  pollPad(down);
  if (mode === 'title') { menuInput(); return; }
  if (mode !== 'play' && mode !== 'menu' && mode !== 'dying') return;
  // a frame that began in a menu gives the game no input, so the press that closes a menu
  // (Esc, Enter, E) is not also read as pause or use
  const wasMenu = mode === 'menu';
  if (wasMenu) menuInput(); else menuEdges.length = 0;   // presses during play must not reach the next menu
  // engine input: held keys plus one-shot actions from the mouse and gamepad
  if (rmbEdge) { down.push('@kick'); rmbEdge = false; }
  let flags = 0;
  if (lmb || pad.rt) flags |= FIRE;
  const i = { moveX: 0, moveY: 0, turn: 0, pitch: 0, lookX: mouseDX * 0.0026, lookY: -mouseDY * 0.55, flags };
  mouseDX = mouseDY = 0;
  if (mode === 'play') drainTouch(i, down);
  if (pad.on) { i.moveX += pad.ax[0]; i.moveY += -pad.ax[1]; i.turn = pad.ax[2] * 1.15; i.pitch = -pad.ax[3]; if (Math.hypot(pad.ax[0], pad.ax[1]) > 0.93) i.flags |= RUN; }
  if (wasMenu ? !menu || menu.kind === 'pause' || menu.kind === 'depart' : false) i.flags |= MENU;
  const held = new Set([...keys, ...tapped]); tapped.clear();
  const keyList = mode === 'play' ? [...held, ...down] : mode === 'dying' ? [] : [...held];
  hb.tick(dt, keyList.join(','), i);
  const s = hb.state(); last = s;
  const px = hb.render();
  if (px) { img.data.set(px); ctx.putImageData(img, 0, 0); }
  if (mode === 'play') audio.handle(s.audio, dt); else audio.handle(s.audio.filter((e) => e.t !== 'sfx' || menu?.kind === 'dead' || menu?.kind === 'won'), dt);
  if (s.achievements.length) store.set('achievements', b64(hb.achievements()));
  if (s.wantsSave) store.set('save-' + deckChoice, JSON.stringify({ difficulty: info.difficulty, data: b64(hb.snapshot()) }));
  drawHUD(s, dt);
  drawTouch();
  if (mode === 'play' && !wasMenu) {
    if (s.menu.pause) { openPause(); return; }
    if (s.depart) { openDepart(s.depart); return; }
    if (s.status === 'dead') { mode = 'dying'; deathT = 0; if (document.pointerLockElement) document.exitPointerLock(); return; }
    if (s.status === 'won') { openWon(s.result); return; }
  }
  // the death fall plays for a moment before the menu
  if (mode === 'dying' && (deathT += dt) > 1.2) openDead();
}
let deathT = 0;

// ---------------------------------------------------------------- boot
(async () => {
  try {
    touchLayout(); checkRotate();
    await loadAll();
    openTitle();
    requestAnimationFrame(frame);
  } catch (e) {
    console.error(e);
    $('#loadText').textContent = 'Could not start: ' + e.message;
  }
})();
