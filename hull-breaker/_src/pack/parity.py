"""Check that the web engine builds exactly the deck a pack describes.

    python3 parity.py [packs_dir] [deck ...] [--url http://localhost:8765/hb/]

Serves nothing itself: point --url at a page that serves this engine with packs_dir as packs/
(see _src/web/README.md). For every difficulty it starts a new game of each deck and compares
what the engine spawns (enemies, items, decor, logs and asset names, doors and their locks,
usable walls, the start) with the pack, read by the rules in FORMAT.md.
"""
import collections, json, math, os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[1:]]
URL = 'http://localhost:8765/hb/'
if '--url' in args: i = args.index('--url'); URL = args[i + 1]; del args[i:i + 2]
PACKS = os.path.abspath(args[0] if args else os.path.join(HERE, '..', '..', 'packs'))
DECKS = [int(a) for a in args[1:]] or None
cat = json.load(open(os.path.join(PACKS, 'catalog.json')))
tuning = json.load(open(os.path.join(PACKS, 'core', 'tuning.json')))
if DECKS is None: DECKS = [d['deck'] for d in cat['decks'] if d['pack']]

PROBE = """async ([n,di]) => { await prepareDeck(n); newGame(di);
  const ents = ENTS.map(e => ({kind:e.kind, t:e.type||e.t, x:e.x, y:e.y, dormant:e.state==='dormant', name:e.name||null, logId:e.logId||null}));
  const d = doors.map(d => ({x:d.x, y:d.y, lock:d.lock}));
  const uses = []; for (let i=0;i<MAPN;i++) {const u=wallUse(i); if (u && u!=='@save') uses.push([i%MW,(i/MW)|0,u]);}
  let water=0; for (let i=0;i<MAPN;i++) if (WATER[i]) water++;
  return {ents, doors:d, uses, water, start:[P.x,P.y], totals:{assets:G.assetTotal, logs:G.logTotal, secrets:G.secretTotal, enemies:G.total}};
}"""

def hashf(n):
    s = math.sin(n * 127.1 + 311.7) * 43758.5453
    return s - math.floor(s)

bad = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.on('pageerror', lambda e: bad.append('page error: ' + str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=30000)
    for n in DECKS:
        pid = 'deck-%02d' % n
        deck = json.load(open(os.path.join(PACKS, pid, 'deck.json'))); level = json.load(open(os.path.join(PACKS, pid, 'level.json')))
        leg = deck['legend']; W = level['w']
        for di in range(5):
            js = pg.evaluate(PROBE, [n, di])
            want = collections.Counter()
            for y, row in enumerate(level['obj']):
                for x, c in enumerate(row):
                    o = leg['objects'].get(c)
                    if not o or o.get('start'): continue
                    if 'enemy' in o:
                        if di < o['min'] or (di == 0 and o['min'] == 0 and not tuning['enemies'][o['enemy']].get('boss') and hashf((y * W + x) * .37) < tuning['veryEasyThin']): continue
                        want[('enemy', o['enemy'], x, y, bool(o.get('dormant')))] += 1
                    elif 'item' in o: want[('pickup', o['item'], x, y)] += 1
                    elif 'decor' in o: want[('decor', o['decor'], x, y)] += 1
                    elif o.get('barrel'): want[('barrel', None, x, y)] += 1
            got = collections.Counter()
            for e in js['ents']:
                x, y = int(e['x']), int(e['y'])
                got[(e['kind'], e['t'], x, y, e['dormant']) if e['kind'] == 'enemy' else (e['kind'], e['t'] if e['kind'] != 'barrel' else None, x, y)] += 1
            if want != got: bad.append(f'{pid} difficulty {di}: spawn mismatch, pack-only {list((want-got).items())[:5]}, engine-only {list((got-want).items())[:5]}')
            if di == 2:
                logs = {(l['x'], l['y']): l['log'] for l in level['logs']}; assets = {(a['x'], a['y']): a['name'] for a in level['assets']}
                for e in js['ents']:
                    k = (int(e['x']), int(e['y']))
                    if e['t'] == 'log' and logs.get(k) != e['logId']: bad.append(f'{pid} log at {k}: pack {logs.get(k)} engine {e["logId"]}')
                    if e['t'] == 'asset' and assets.get(k) != e['name']: bad.append(f'{pid} asset at {k}: pack {assets.get(k)} engine {e["name"]}')
                lockmap = {(x, y): leg['doors'][c] for y, row in enumerate(level['geo']) for x, c in enumerate(row) if c in leg['doors']}
                for d in js['doors']:
                    if lockmap.get((d['x'], d['y'])) != d['lock']: bad.append(f'{pid} door {d}: pack lock {lockmap.get((d["x"], d["y"]))}')
                if len(js['doors']) != len(lockmap): bad.append(f'{pid}: {len(js["doors"])} doors in engine, {len(lockmap)} in pack')
                uses = {(x, y): leg['walls'][c]['use'] for y, row in enumerate(level['geo']) for x, c in enumerate(row) if 'use' in leg['walls'].get(c, {})}
                if uses != {(u[0], u[1]): u[2] for u in js['uses']}: bad.append(f'{pid}: usable walls differ')
                water = sum(1 for row in level['geo'] for c in row if c in leg.get('floors', {}))
                if water != js['water']: bad.append(f'{pid}: water cells pack {water} engine {js["water"]}')
                print(f'{pid} normal:', js['totals'], 'start', js['start'], 'water', js['water'])
    b.close()
for x in bad: print('MISMATCH', x)
print('PARITY OK' if not bad else f'{len(bad)} mismatch(es)')
sys.exit(1 if bad else 0)
