// Hull Breaker engine (Swift, compiled to WebAssembly) and the small WASI layer it needs.
// Runs in browsers and in Node (for the smoke tests). No dependencies.
//
//   const hb = await HB.load(wasmBytes)
//   hb.put('core/art.json', bytes) ...      every verified pack file
//   hb.open('deck-01', difficulty, seed, achievementsBytes)
//   hb.tick(dt, keysString, {moveX, moveY, turn, pitch, lookX, lookY, flags})
//   hb.render()  -> Uint8ClampedArray view, 320x180 RGBA
//   hb.state()   -> object (HUD, player, status, audio and achievement events)

const ENOSYS = 52, EBADF = 8, SUCCESS = 0;
export const W = 320, H = 180;
export const FIRE = 1, RUN = 2, MENU = 4;

class ExitError extends Error { constructor(code) { super('exit ' + code); this.code = code; } }

function wasiImports(getMem, log) {
  const view = () => new DataView(getMem().buffer);
  const u8 = () => new Uint8Array(getMem().buffer);
  const zeroSizes = (a, b) => { const v = view(); v.setUint32(a, 0, true); v.setUint32(b, 0, true); return SUCCESS; };
  let line = { 1: '', 2: '' };
  const nosys = () => ENOSYS;
  return {
    args_get: () => SUCCESS, args_sizes_get: zeroSizes,
    environ_get: () => SUCCESS, environ_sizes_get: zeroSizes,
    clock_res_get: (id, out) => { view().setBigUint64(out, 1000n, true); return SUCCESS; },
    clock_time_get: (id, prec, out) => {
      const ns = id === 0 ? BigInt(Date.now()) * 1000000n : BigInt(Math.round(performance.now() * 1e6));
      view().setBigUint64(out, ns, true); return SUCCESS;
    },
    random_get: (p, n) => { crypto.getRandomValues(u8().subarray(p, p + n)); return SUCCESS; },
    fd_write: (fd, iovs, n, out) => {
      const v = view(), m = u8(); let total = 0;
      for (let i = 0; i < n; i++) {
        const p = v.getUint32(iovs + i * 8, true), l = v.getUint32(iovs + i * 8 + 4, true);
        if (fd === 1 || fd === 2) {
          line[fd] += new TextDecoder().decode(m.subarray(p, p + l));
          let k; while ((k = line[fd].indexOf('\n')) >= 0) { log(line[fd].slice(0, k)); line[fd] = line[fd].slice(k + 1); }
        }
        total += l;
      }
      v.setUint32(out, total, true); return fd === 1 || fd === 2 ? SUCCESS : EBADF;
    },
    fd_prestat_get: () => EBADF, fd_prestat_dir_name: () => EBADF,
    fd_fdstat_get: (fd, out) => { if (fd > 2) return EBADF; const v = view(); v.setUint8(out, 2); v.setUint16(out + 2, 0, true); v.setBigUint64(out + 8, 0n, true); v.setBigUint64(out + 16, 0n, true); return SUCCESS; },
    fd_close: () => SUCCESS, fd_seek: () => EBADF, fd_read: () => EBADF, fd_pread: () => EBADF, fd_sync: () => SUCCESS,
    fd_fdstat_set_flags: nosys, fd_filestat_get: () => EBADF, fd_readdir: () => EBADF,
    path_open: () => ENOSYS, path_filestat_get: nosys, path_filestat_set_times: nosys, path_create_directory: nosys,
    path_link: nosys, path_readlink: nosys, path_remove_directory: nosys, path_rename: nosys, path_symlink: nosys, path_unlink_file: nosys,
    poll_oneoff: nosys,
    proc_exit: (c) => { throw new ExitError(c); },
  };
}

const enc = new TextEncoder(), dec = new TextDecoder();

export class HB {
  static async load(bytesOrModule, log = (s) => console.log('[hb]', s)) {
    let inst;
    const imports = { wasi_snapshot_preview1: wasiImports(() => inst.exports.memory, log) };
    const mod = bytesOrModule instanceof WebAssembly.Module ? bytesOrModule : await WebAssembly.compile(bytesOrModule);
    inst = await WebAssembly.instantiate(mod, imports);
    inst.exports._initialize();
    return new HB(inst.exports);
  }
  constructor(x) { this.x = x; this.frame = null; }
  mem() { return new Uint8Array(this.x.memory.buffer); }
  // copy bytes into module memory; returns [ptr, len] (caller frees)
  pass(bytes) {
    const n = bytes.length, p = this.x.hb_alloc(n);
    this.mem().set(bytes, p); return [p, n];
  }
  withBytes(bytes, fn) { const [p, n] = this.pass(bytes); try { return fn(p, n); } finally { this.x.hb_free(p); } }
  withStr(s, fn) { return this.withBytes(enc.encode(s), fn); }
  outBytes(n) { const p = this.x.hb_out(); return this.mem().slice(p, p + n); }
  outStr(n) { return dec.decode(this.outBytes(n)); }

  version() { return this.outStr(this.x.hb_version()); }
  put(path, bytes) { this.withStr(path, (pp, pn) => this.withBytes(bytes, (dp, dn) => this.x.hb_put(pp, pn, dp, dn))); }
  // carry: a loadout object from loadout(), null for the assumed loadout, or 'none' when a save will be restored
  open(deck, difficulty, seed = 0, achievements = null, carry = null) {
    const ach = achievements || new Uint8Array(0);
    const c = carry === 'none' ? 'none' : carry ? JSON.stringify(carry) : '';
    const r = this.withStr(deck, (dp, dn) => this.withBytes(ach, (ap, an) => this.withStr(c, (cp, cn) => this.x.hb_open(dp, dn, difficulty, seed, ap, an, cp, cn))));
    if (r !== 0) { const p = this.x.hb_out(); const m = this.mem(); let e = p; while (m[e]) e++; throw new Error(dec.decode(m.slice(p, e))); }
  }
  tick(dt, keys, i = {}) {
    this.withStr(keys, (kp, kn) => this.x.hb_tick(dt, kp, kn, i.moveX || 0, i.moveY || 0, i.turn || 0, i.pitch || 0, i.lookX || 0, i.lookY || 0, i.flags || 0));
  }
  loadout() { return JSON.parse(this.outStr(this.x.hb_loadout())); }
  info() { return JSON.parse(this.outStr(this.x.hb_info())); }
  automap(scheme) { return JSON.parse(this.outStr(this.x.hb_automap(scheme === 'touch' ? 1 : scheme === 'controller' ? 2 : 0))); }
  face(hp, mood, look) { return JSON.parse(this.outStr(this.x.hb_face(hp, mood, look))); }
  resetInput() { this.x.hb_reset_input(); }
  render() {
    const p = this.x.hb_render();
    if (!p) return null;
    // memory can grow, which detaches old views: make a fresh view each frame (no copy)
    return new Uint8ClampedArray(this.x.memory.buffer, p, W * H * 4);
  }
  state() { return JSON.parse(this.outStr(this.x.hb_state())); }
  scheme(name) { this.x.hb_scheme(name === 'touch' ? 1 : name === 'controller' ? 2 : 0); }
  stay() { this.x.hb_stay(); }
  depart() { this.x.hb_depart(); }
  console(line) { return JSON.parse(this.withStr(line, (p, n) => this.outStr(this.x.hb_console(p, n)))); }
  snapshot() { return this.outBytes(this.x.hb_snapshot()); }
  restore(bytes) { return this.withBytes(bytes, (p, n) => this.x.hb_restore(p, n)) === 1; }
  achievements() { return this.outBytes(this.x.hb_achievements()); }
}
