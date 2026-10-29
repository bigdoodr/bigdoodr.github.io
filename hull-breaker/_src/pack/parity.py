"""Check that a deck pack describes the same deck the shipped JavaScript game builds.

    python3 parity.py [packs_dir]

Starts a new game on every difficulty inside the real index.html and compares
what it spawns (enemies, items, logs with their ids, asset names, doors and
their locks, usable walls) against the pack read by the rules in FORMAT.md.
"""
import collections, json, os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PACKS = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'packs'))
GAME = os.path.join(HERE, '..', '..', 'index.html')
deck = json.load(open(os.path.join(PACKS, 'deck-01', 'deck.json')))
level = json.load(open(os.path.join(PACKS, 'deck-01', 'level.json')))
tuning = json.load(open(os.path.join(PACKS, 'core', 'tuning.json')))
leg = deck['legend']

PROBE = """
window.__probe = di => { newGame(di);
  const ents = ENTS.map(e => ({kind:e.kind, t:e.type||e.t, sid:e.sid, x:e.x, y:e.y, dormant:e.state==='dormant', name:e.name||null, logId:e.logId||null}));
  const d = doors.map(d => ({x:d.x, y:d.y, lock:d.lock, tex:Object.keys(T).find(k=>T[k]===map[d.i])||('crack:'+map[d.i])}));
  const brk = []; for (let i=0;i<MAPN;i++) if (map[i]===T.BRK||map[i]===T.OVRCON) brk.push([i%MW,(i/MW)|0,map[i]===T.BRK?'breaker':'override']);
  return {ents, doors:d, uses:brk, start:[P.x,P.y], totals:{assets:G.assetTotal, logs:G.logTotal, secrets:G.secretTotal}};
};
"""

html = open(GAME, encoding='utf-8').read()
boot = "window.claude?.hot?.ready?window.claude.hot.ready(()=>boot()):boot();"
tmp = os.path.join(HERE, '_parity.html'); open(tmp, 'w').write(html.replace(boot, boot + PROBE))
bad = []
def hashf(n):  # the engine's hash(), used to thin Very Easy
    import math
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)

try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.route('**/fonts.g*/**', lambda r: r.abort())
        pg.goto('file://' + tmp); pg.wait_for_function('typeof window.__probe==="function"')
        for di in range(5):
            js = pg.evaluate('di=>__probe(di)', di)
            # what the pack says should spawn
            want = collections.Counter(); W = level['w']
            for y, row in enumerate(level['obj']):
                for x, c in enumerate(row):
                    o = leg['objects'].get(c)
                    if not o: continue
                    if 'enemy' in o:
                        sid = y * W + x
                        if di < o['min'] or (di == 0 and o['min'] == 0 and hashf(sid * .37) < tuning['veryEasyThin']): continue
                        want[('enemy', o['enemy'], x, y, bool(o.get('dormant')))] += 1
                    elif 'item' in o: want[('pickup', o['item'], x, y)] += 1
                    elif 'decor' in o: want[('decor', o['decor'], x, y)] += 1
                    elif o.get('barrel'): want[('barrel', None, x, y)] += 1
            got = collections.Counter()
            for e in js['ents']:
                x, y = int(e['x']), int(e['y'])
                got[(e['kind'], e['t'], x, y, e['dormant']) if e['kind'] == 'enemy' else (e['kind'], e['t'] if e['kind'] != 'barrel' else None, x, y)] += 1
            if want != got: bad.append(f'difficulty {di}: spawn mismatch, pack-only {list((want-got).items())[:5]}, game-only {list((got-want).items())[:5]}')
            if di == 2:
                logs = {(l['x'], l['y']): l['log'] for l in level['logs']}
                assets = {(a['x'], a['y']): a['name'] for a in level['assets']}
                for e in js['ents']:
                    k = (int(e['x']), int(e['y']))
                    if e['t'] == 'log' and logs.get(k) != e['logId']: bad.append(f'log at {k}: pack {logs.get(k)} game {e["logId"]}')
                    if e['t'] == 'asset' and assets.get(k) != e['name']: bad.append(f'asset at {k}: pack {assets.get(k)} game {e["name"]}')
                lockmap = {}
                for y, row in enumerate(level['geo']):
                    for x, c in enumerate(row):
                        if c in leg['doors']: lockmap[(x, y)] = leg['doors'][c]
                for d in js['doors']:
                    if lockmap.get((d['x'], d['y'])) != d['lock']: bad.append(f'door {d}: pack lock {lockmap.get((d["x"], d["y"]))}')
                uses = {(x, y): leg['walls'][c]['use'] for y, row in enumerate(level['geo']) for x, c in enumerate(row) if 'use' in leg['walls'].get(c, {})}
                if uses != {(u[0], u[1]): u[2] for u in js['uses']}: bad.append('usable walls differ')
                print('normal:', js['totals'], 'start', js['start'])
        b.close()
finally:
    os.remove(tmp)
for x in bad: print('MISMATCH', x)
print('PARITY OK' if not bad else f'{len(bad)} mismatch(es)')
sys.exit(1 if bad else 0)
