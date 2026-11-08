// Injected into a copy of ../../index.html by extract.py, just before boot().
// It runs inside the game's closure, so it can see every const. It exposes the
// data the pack needs and a few helpers that turn procedural art and audio into files.
window.__HB = {
  data: () => ({
    LEVEL, LOGS_LEVEL, ASSET_NAMES, ETYPE, DIFF, WH, PWH, DWH, AMB, ZTHEME,
    T, GEO, DOORCH, ENCH, PICKCH, DECCH, KILLQ, SECRETQ, TAGQ, WNAME, DECKS,
    LOCKMSG, BEACON, VOKEYS: Object.keys(VO), LOGKEYS: Object.keys(LOGVO),
  }),
  vo: k => VO[k],
  logvo: k => LOGVO[k],
  // A texture is {px:Uint32 (r|g<<8|b<<16), em:Uint8}; a sprite adds w,h and an alpha mask.
  png(img, w, h, which) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), id = g.createImageData(w, h), d = id.data;
    for (let i = 0; i < w * h; i++) {
      if (which === 'em') { const v = img.em[i] ? 255 : 0; d[i*4] = d[i*4+1] = d[i*4+2] = v; d[i*4+3] = 255; continue; }
      const p = img.px[i]; d[i*4] = p & 255; d[i*4+1] = (p >> 8) & 255; d[i*4+2] = (p >> 16) & 255;
      d[i*4+3] = img.a ? (img.a[i] ? 255 : 0) : 255;
    }
    g.putImageData(id, 0, 0); return c.toDataURL('image/png').split(',')[1];
  },
  art() {
    const out = { textures: {}, floors: [], ceilings: [], sprites: {} };
    const hasEm = t => t.em && t.em.some(v => v);
    for (const [name, idx] of Object.entries(T)) {
      const t = TEX[idx]; if (!t) continue;
      out.textures[name] = { id: idx, png: this.png(t, TS, TS), em: hasEm(t) ? this.png(t, TS, TS, 'em') : null };
    }
    out.cracks = {};  // secret-door versions of each wall: the same panel with a crack drawn in
    for (const [name, idx] of Object.entries(T)) {
      if (!TEX[idx]) continue; const c = TEX[crackTex(idx)];
      out.cracks[name] = { png: this.png(c, TS, TS), em: hasEm(c) ? this.png(c, TS, TS, 'em') : null };
    }
    FLO.forEach((t, i) => out.floors[i] = { png: this.png(t, TS, TS) });
    CEI.forEach((t, i) => out.ceilings[i] = { png: this.png(t, TS, TS) });
    for (const [name, im] of Object.entries(IMG)) {
      if (!im || !im.px) continue;
      out.sprites[name] = { w: im.w, h: im.h, png: this.png(im, im.w, im.h), em: hasEm(im) ? this.png(im, im.w, im.h, 'em') : null,
        allEm: im.em.every((v, i) => v || !im.a[i]) };
    }
    return out;
  },
  // Render one procedural sound offline. Returns mono float32 samples, base64.
  async sfx(name, args, dur) {
    const sr = 44100, oc = new OfflineAudioContext(1, Math.ceil(sr * dur), sr);
    Object.defineProperty(oc, 'state', { get: () => 'running' });
    const prev = { c: A.c, sfx: A.sfx, nb: A.nb, curve: A.curve, mus: A.mus, amb: A.amb };
    A.c = oc; A.sfx = oc.createGain(); A.sfx.connect(oc.destination);
    A.mus = oc.createGain(); A.mus.connect(oc.destination); A.amb = oc.createGain(); A.amb.connect(oc.destination);
    const len = sr * 2, b = oc.createBuffer(1, len, sr), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; A.nb = b;
    const n = 1024, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + 60) * x / (1 + 60 * Math.abs(x)); } A.curve = curve;
    if (name === '@ambient') startAmbient();
    else if (name === '@music') { const spb = 60 / MUS.bpm / 2; for (let k = 0; k < 64; k++) playNote(k % 32, .001 + k * spb); }
    else S[name](...args);
    const buf = await oc.startRendering();
    Object.assign(A, prev);
    const u8 = new Uint8Array(buf.getChannelData(0).buffer); let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  },
};
