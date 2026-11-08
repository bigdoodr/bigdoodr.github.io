"""Write the art the web engine paints itself into a core pack as PNGs, so engines that read
the pack (the Swift apps) draw the same thing.

    python3 export_art.py <url-of-game-or-preview> <packs_dir>

What it exports:
  - the Deck 02 textures the web engine paints (buildTextures3), which the pack only had as copies
  - every crack_* texture (secret panels), with the seam of light the web engine adds
  - the water floors (wade and swim)
  - the Deck 02 sprites (boots, master key, pew, beer tap, the Super's dropped buffer)
Then it updates core/art.json and the core manifest. Run validate_pack.py afterwards."""
import base64, json, os, subprocess, sys
from playwright.sync_api import sync_playwright

URL, PACKS = sys.argv[1], os.path.abspath(sys.argv[2])
CORE = os.path.join(PACKS, 'core')
PAINTED = ['shelf', 'apartment', 'chapel', 'daycare', 'poster', 'theater', 'washer', 'gym', 'pooltile', 'intercom', 'junction',
           'junctionon', 'valve', 'valveopen', 'bulkhead', 'masterdoor', 'flooded', 'floorplan', 'gorgonseal']
SPRITES = ['boots', 'keyM', 'pew', 'tap', 'buffer']
art = json.load(open(os.path.join(CORE, 'art.json')))
cracks = sorted(k for k in art['textures'] if k.startswith('crack_'))

JS = r"""async ([painted, cracks, sprites]) => {
  const pngOf = (w, h, fill) => { const c = canvasOf(w, h), g = c.getContext('2d'), id = g.createImageData(w, h); fill(id.data); g.putImageData(id, 0, 0); return c.toDataURL('image/png'); };
  const tex = t => ({img: pngOf(64, 64, d => { for (let i = 0; i < 4096; i++) { const c = t.px[i]; d[i*4] = c & 255; d[i*4+1] = (c >> 8) & 255; d[i*4+2] = (c >> 16) & 255; d[i*4+3] = 255; } }),
                     em: t.em.some(v => v) ? pngOf(64, 64, d => { for (let i = 0; i < 4096; i++) { const v = t.em[i] ? 255 : 0; d[i*4] = d[i*4+1] = d[i*4+2] = v; d[i*4+3] = 255; } }) : null});
  const out = {textures: {}, floors: {}, sprites: {}};
  for (const k of painted) { if (TEXID[k] == null) throw new Error('not painted: ' + k); out.textures[k] = tex(TEX[TEXID[k]]); }
  for (const k of cracks) out.textures[k] = tex(TEX[await ensureTexture(k)]);
  out.floors.water = tex(FLO[5]); out.floors.deepwater = tex(FLO[6]);
  bufferArt();
  for (const k of sprites) { const s = IMG[k]; if (!s) throw new Error('no sprite ' + k);
    out.sprites[k] = {w: s.w, h: s.h, img: pngOf(s.w, s.h, d => { for (let i = 0; i < s.w * s.h; i++) { const c = s.px[i]; d[i*4] = c & 255; d[i*4+1] = (c >> 8) & 255; d[i*4+2] = (c >> 16) & 255; d[i*4+3] = s.a[i] ? 255 : 0; } }),
      em: s.em.some(v => v) ? pngOf(s.w, s.h, d => { for (let i = 0; i < s.w * s.h; i++) { const v = s.em[i] ? 255 : 0; d[i*4] = d[i*4+1] = d[i*4+2] = v; d[i*4+3] = 255; } }) : null}; }
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=60000)
    pg.evaluate("startGame(2,2)"); pg.wait_for_function("G.state==='intro'")
    for sp in SPRITES[:-1]: pg.evaluate(f"ensureSprite('{sp}')")
    out = pg.evaluate(JS, [PAINTED, cracks, SPRITES]); b.close()
    if errs: sys.exit('page errors: %s' % errs)


def save(rel, data_url):
    path = os.path.join(CORE, rel); os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(base64.b64decode(data_url.split(',', 1)[1])); return rel


n = 0
for k, t in out['textures'].items():
    d = {'file': save(f'textures/{k}.png', t['img'])}
    if t['em']: d['emissive'] = save(f'textures/{k}.em.png', t['em'])
    if k.startswith('crack_'): d['crackOf'] = k[6:]
    art['textures'][k] = d; n += 1
for k, t in out['floors'].items():
    art['floors'][k] = {'file': save(f'floors/{k}.png', t['img'])}; n += 1
for k, t in out['sprites'].items():
    d = dict(art['sprites'].get(k, {}), file=save(f'sprites/{k}.png', t['img']), w=t['w'], h=t['h'])
    if t['em']: d['emissive'] = save(f'sprites/{k}.em.png', t['em'])
    else: d.pop('emissive', None)
    art['sprites'][k] = d; n += 1
json.dump(art, open(os.path.join(CORE, 'art.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(CORE, 'art.json'), 'a').write('\n')
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'remanifest.py'), PACKS, 'core'], check=True)
print(f'exported {n} images into {CORE}')
