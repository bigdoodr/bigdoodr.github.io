"""Render the sounds the web engine synthesizes itself into a core pack as WAVs, so engines that
read the pack (the Swift apps) play the same thing.

    python3 export_sfx.py <url-of-game-or-preview> <packs_dir>

FORMAT.md: 22.05 kHz 16-bit mono WAV, normalized; `gain` restores the original level."""
import base64, json, os, struct, subprocess, sys, wave
from playwright.sync_api import sync_playwright

URL, PACKS = sys.argv[1], os.path.abspath(sys.argv[2])
CORE = os.path.join(PACKS, 'core')
SOUNDS = {'thud': .4, 'splash': .8, 'drain': 3.9, 'pour': 1.4, 'stamp': .45, 'bubbles': .55}
SR = 22050

JS = r"""async ([id, secs, sr]) => {
  const off = new OfflineAudioContext(1, Math.ceil(secs * sr), sr);
  // the engine checks A.c.state before playing; an offline context only runs once rendering starts
  const ctx = new Proxy(off, {get: (t, k) => k === 'state' ? 'running' : (typeof t[k] === 'function' ? t[k].bind(t) : t[k])});
  const saved = {c: A.c, sfx: A.sfx, nb: A.nb};
  const nb = off.createBuffer(1, saved.nb.length, saved.nb.sampleRate); nb.copyToChannel(saved.nb.getChannelData(0), 0);
  A.c = ctx; A.sfx = off.destination; A.nb = nb;
  try { S[id](); } finally { A.c = saved.c; A.sfx = saved.sfx; A.nb = saved.nb; }
  const buf = await off.startRendering(), d = buf.getChannelData(0);
  return Array.from(d);
}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=60000)
    pg.evaluate("auInit()"); pg.wait_for_function("A.c && A.nb", timeout=10000)
    out = {k: pg.evaluate(JS, [k, secs, SR]) for k, secs in SOUNDS.items()}
    b.close()
    if errs: sys.exit('page errors: %s' % errs)

sfx = json.load(open(os.path.join(CORE, 'sfx.json')))
for k, data in out.items():
    peak = max(1e-9, max(abs(v) for v in data))
    # trim trailing silence (below -60 dB of the peak)
    end = len(data)
    while end > 1 and abs(data[end - 1]) < peak * 1e-3: end -= 1
    data = data[:end + int(SR * .02)]
    rel = f'sfx/{k}.wav'; path = os.path.join(CORE, rel)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', max(-32767, min(32767, int(v / peak * 32767)))) for v in data))
    sfx['sounds'][k] = {'file': rel, 'gain': round(peak, 4), 'seconds': round(len(data) / SR, 3)}
    print(f'{k}: peak {peak:.3f}, {len(data) / SR:.2f}s')
json.dump(sfx, open(os.path.join(CORE, 'sfx.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(CORE, 'sfx.json'), 'a').write('\n')
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'remanifest.py'), PACKS, 'core'], check=True)
