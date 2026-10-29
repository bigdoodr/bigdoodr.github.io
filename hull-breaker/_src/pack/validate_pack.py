"""Validate the packs folder: integrity, references, level layout, and a run of
the deck's own rules to prove it can be finished, and 100% completed, on every
difficulty.

    python3 validate_pack.py [packs_dir] [deck-01 ...]

Exits non-zero on any error. Prints the progression the rules produce.
"""
import collections, hashlib, json, os, sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..', 'packs'))
ONLY = sys.argv[2:]
ENGINE_FLAGS = {'power', 'lightsOut', 'alarm'}          # flags the engine itself reacts to
EVENTS = {'start', 'enterZone', 'pickup', 'use', 'useDecor', 'doorUnlock', 'doorDenied', 'region'}
ACTIONS = {'say', 'msg', 'objective', 'sfx', 'flash', 'shake', 'set', 'add', 'ambush', 'autosave', 'music', 'setTile', 'after', 'if', 'win'}
DIFFS = ['Very Easy', 'Easy', 'Normal', 'Hard', 'Nightmare']
errors, warns = [], []
err = errors.append
load = lambda *p: json.load(open(os.path.join(ROOT, *p), encoding='utf-8'))


def check_manifest(pid, entry=None):
    m = load(pid, 'manifest.json')
    raw = open(os.path.join(ROOT, pid, 'manifest.json'), 'rb').read()
    if entry and entry.get('manifestSha256') != hashlib.sha256(raw).hexdigest(): err(f'{pid}: catalog manifestSha256 is stale')
    if entry and entry.get('bytes') != m['bytes']: err(f'{pid}: catalog bytes {entry.get("bytes")} != manifest {m["bytes"]}')
    listed = set()
    for f in m['files']:
        p = os.path.join(ROOT, pid, f['path']); listed.add(f['path'])
        if not os.path.exists(p): err(f'{pid}: missing {f["path"]}'); continue
        b = open(p, 'rb').read()
        if len(b) != f['bytes'] or hashlib.sha256(b).hexdigest() != f['sha256']: err(f'{pid}: hash/size mismatch {f["path"]}')
    for dp, _, fns in os.walk(os.path.join(ROOT, pid)):
        for fn in fns:
            rel = os.path.relpath(os.path.join(dp, fn), os.path.join(ROOT, pid)).replace(os.sep, '/')
            if rel != 'manifest.json' and rel not in listed: err(f'{pid}: {rel} is on disk but not in the manifest')
    if sum(f['bytes'] for f in m['files']) != m['bytes']: err(f'{pid}: manifest byte total is wrong')
    return m, listed


def walk_actions(acts, fn):
    for a in acts:
        fn(a)
        if 'if' in a: walk_actions(a.get('then', []), fn); walk_actions(a.get('else', []), fn)
        if 'after' in a: walk_actions(a.get('do', []), fn)


def cond_names(c, out):
    if not c: return
    for k in ('all', 'any'):
        for s in c.get(k, []): cond_names(s, out)
    if 'not' in c: cond_names(c['not'], out)
    for k in ('flag', 'key', 'visited', 'counter'):
        if k in c: out.append((k, c[k]))


def validate_deck(pid, core, core_files):
    deck, level = load(pid, 'deck.json'), load(pid, 'level.json')
    logs = {l['id']: l for l in load(pid, 'logs.json')['logs']}
    lines = {l['id'] for l in load(pid, 'lines.json')['lines']}
    _, files = check_manifest(pid, CAT_ENTRIES.get(pid))
    for l in load(pid, 'lines.json')['lines'] + list(logs.values()):
        if l['file'] not in files: err(f'{pid}: audio {l["file"]} missing')
    leg = deck['legend']; W, H, G, O = level['w'], level['h'], level['geo'], level['obj']
    zones = {z['id']: z for z in level['zones']}
    tex, items, enemies, decor = core['art']['textures'], core['tuning']['items'], core['tuning']['enemies'], core['tuning']['decor']
    sfx, core_lines = core['sfx']['sounds'], {l['id'] for l in core['lines']['lines']}
    flags = set(deck['state']['flags']) | ENGINE_FLAGS; counters = set(deck['state']['counters'])
    # ---- references
    for ch, w in leg['walls'].items():
        for t in [w['tex']] + ([w['after']['tex']] if 'after' in w else []):
            if t not in tex: err(f'{pid}: wall {ch} uses unknown texture {t}')
    for lk, l in deck['locks'].items():
        if 'tex' in l and l['tex'] not in tex: err(f'{pid}: lock {lk} texture {l["tex"]}')
    for d in level['doors']:
        if d['tex'] not in tex: err(f'{pid}: door at {d["x"]},{d["y"]} texture {d["tex"]}')
    for lk in leg['doors'].values():
        if lk not in deck['locks']: err(f'{pid}: door legend uses undefined lock {lk}')
    for ch, o in leg['objects'].items():
        if 'item' in o and o['item'] not in items: err(f'{pid}: object {ch} item {o["item"]} not in core tuning')
        if 'enemy' in o and o['enemy'] not in enemies: err(f'{pid}: object {ch} enemy {o["enemy"]} unknown')
        if 'decor' in o and o['decor'] not in decor: err(f'{pid}: object {ch} decor {o["decor"]} unknown')
    for z in level['zones']:
        if z['floor'] not in core['art']['floors']: err(f'{pid}: zone {z["id"]} floor {z["floor"]}')
    uses = {w['use'] for w in leg['walls'].values() if 'use' in w}
    for a in deck['ambushes'].values():
        for z in a['zones']:
            if z not in zones: err(f'{pid}: ambush zone {z} unknown')
        for e in a['spawns']:
            if e not in enemies: err(f'{pid}: ambush enemy {e} unknown')
    def check_action(a):
        k = [x for x in a if x in ACTIONS]
        if len(k) != 1: err(f'{pid}: action {a} must have exactly one verb'); return
        k = k[0]
        if k == 'say':
            lid = a['say']
            if not (lid in lines or (lid.startswith('core:') and lid[5:] in core_lines)): err(f'{pid}: say {lid} has no line')
        if k == 'sfx' and a['sfx'] not in sfx: err(f'{pid}: sfx {a["sfx"]} unknown')
        if k == 'set' and a['set'] not in flags: err(f'{pid}: set {a["set"]} is not a declared flag')
        if k == 'add' and a['add'] not in counters: err(f'{pid}: add {a["add"]} is not a declared counter')
        if k == 'ambush' and a['ambush'] not in deck['ambushes']: err(f'{pid}: ambush {a["ambush"]} undefined')
        if k == 'if': names = []; cond_names(a['if'], names); check_names(names)
    def check_names(names):
        for k, v in names:
            if k == 'flag' and v not in flags: err(f'{pid}: condition flag {v} undeclared')
            if k == 'counter' and v not in counters: err(f'{pid}: condition counter {v} undeclared')
            if k == 'key' and v not in deck['keys']: err(f'{pid}: condition key {v} undeclared')
            if k == 'visited' and v not in zones: err(f'{pid}: condition zone {v} unknown')
    for r in deck['rules']:
        ev = r['on'].get('event')
        if ev not in EVENTS: err(f'{pid}: unknown event {ev}')
        if 'zone' in r['on'] and r['on']['zone'] not in zones: err(f'{pid}: rule zone {r["on"]["zone"]} unknown')
        if ev == 'use' and r['on']['target'] not in uses: err(f'{pid}: no wall offers use {r["on"]["target"]}')
        if ev == 'pickup' and r['on']['item'] not in items: err(f'{pid}: pickup rule item {r["on"]["item"]}')
        names = []; cond_names(r.get('if'), names); check_names(names)
        walk_actions(r['do'], check_action)
    for step in deck['guide']:
        names = []; cond_names(step.get('until'), names); check_names(names)
    for k in ('music',):
        if deck['intro'].get(k) and deck['intro'][k] not in sfx: err(f'{pid}: intro music unknown')
    # ---- level layout
    floor = leg['floor']; doorch = leg['doors']
    if len(G) != H or any(len(r) != W for r in G) or len(O) != H or any(len(r) != W for r in O): err(f'{pid}: layer sizes do not match w/h')
    for y in range(H):
        for x in range(W):
            c, o = G[y][x], O[y][x]
            if c not in floor and c not in doorch and c not in leg['walls']: err(f'{pid}: unknown geo char {c!r} at {x},{y}')
            if c in doorch:
                h = G[y][x-1] == floor and G[y][x+1] == floor; v = G[y-1][x] == floor and G[y+1][x] == floor
                if not (h or v): err(f'{pid}: door {c} at {x},{y} not between floors')
            if o != ' ':
                if o not in leg['objects']: err(f'{pid}: unknown object {o!r} at {x},{y}')
                if c != floor: err(f'{pid}: object {o} at {x},{y} sits on {c!r}')
            if c == floor and (x in (0, W-1) or y in (0, H-1)): err(f'{pid}: floor on the border at {x},{y}')
    lpos = {(p['x'], p['y']) for p in level['logs']}; apos = {(p['x'], p['y']) for p in level['assets']}
    for y in range(H):
        for x in range(W):
            if O[y][x] == 'l' and (x, y) not in lpos: err(f'{pid}: log at {x},{y} has no entry')
            if O[y][x] == '$' and (x, y) not in apos: err(f'{pid}: asset at {x},{y} has no entry')
    for p in level['logs']:
        if O[p['y']][p['x']] != 'l': err(f'{pid}: log entry at {p["x"]},{p["y"]} has no l')
        if p['log'] not in logs: err(f'{pid}: log id {p["log"]} not in logs.json')
    placed = collections.Counter(p['log'] for p in level['logs'])
    for lid in logs:
        if placed[lid] != 1: err(f'{pid}: log {lid} is placed {placed[lid]} times')
    for p in level['assets']:
        if O[p['y']][p['x']] != '$': err(f'{pid}: asset entry at {p["x"]},{p["y"]} has no $')
    starts = [(x, y) for y in range(H) for x in range(W) if O[y][x] in leg['objects'] and leg['objects'][O[y][x]].get('start')]
    if len(starts) != 1: err(f'{pid}: need exactly one start, found {len(starts)}'); return
    # ---- run the rules on every difficulty (rules may branch on it)
    res = None
    for d in range(5):
        n = len(errors); r = run_rules(pid, deck, level, starts[0], d)
        if len(errors) > n: errors.insert(n, f'{pid}: on {DIFFS[d]}:')
        if d == 2: res = r
        elif r and res and r['order'] != res['order']: print(f'  note: {DIFFS[d]} progression differs: {r["order"]}')
    return res


def zone_of(level, x, y):
    for z in level['zones'][::-1]:  # later zones sit on top of earlier ones, as in the game
        if z['x1'] <= x <= z['x2'] and z['y1'] <= y <= z['y2']: return z['id']
    return None


def run_rules(pid, deck, level, start, diff=2):
    leg = deck['legend']; W, H, G, O = level['w'], level['h'], level['geo'], level['obj']
    floor, doorch, locks = leg['floor'], leg['doors'], deck['locks']
    S = {'flags': dict(deck['state']['flags']), 'counters': dict(deck['state']['counters']), 'keys': set(), 'visited': set(),
         'tiles': {}, 'won': False, 'unlocked': set(), 'taken': set(), 'fired': set()}
    for f in ENGINE_FLAGS: S['flags'].setdefault(f, False)
    order = []

    def cond(c):
        if not c: return True
        if 'all' in c: return all(cond(s) for s in c['all'])
        if 'any' in c: return any(cond(s) for s in c['any'])
        if 'not' in c: return not cond(c['not'])
        if 'flag' in c: return bool(S['flags'].get(c['flag']))
        if 'key' in c: return c['key'] in S['keys']
        if 'visited' in c: return c['visited'] in S['visited']
        if 'difficulty' in c: return all(op(diff, c['difficulty'][k]) for k, op in (('gte', lambda a, b: a >= b), ('eq', lambda a, b: a == b), ('lte', lambda a, b: a <= b)) if k in c['difficulty'])
        if 'counter' in c:
            v = S['counters'][c['counter']]
            return all(op(v, c[k]) for k, op in (('gte', lambda a, b: a >= b), ('eq', lambda a, b: a == b), ('lte', lambda a, b: a <= b)) if k in c)
        raise ValueError(c)

    def act(acts, cell):
        changed = False
        for a in acts:
            if 'if' in a: changed |= act(a['then'] if cond(a['if']) else a.get('else', []), cell)
            elif 'after' in a: changed |= act(a['do'], cell)
            elif 'set' in a:
                if S['flags'].get(a['set']) != a['value']: S['flags'][a['set']] = a['value']; changed = True; order.append(f'{a["set"]}={a["value"]}')
            elif 'add' in a: S['counters'][a['add']] += a['value']; changed = True
            elif 'setTile' in a and cell: S['tiles'][cell] = 'after'; changed = True
            elif 'win' in a: S['won'] = True; changed = True; order.append('WIN')
        return changed

    def fire(ev, **kw):
        any_change = False
        for i, r in enumerate(deck['rules']):
            on = r['on']
            if on['event'] != ev or any(on.get(k) != v for k, v in kw.items() if k in on and k != 'cell'): continue
            if r.get('once') and i in S['fired']: continue
            if not cond(r.get('if')): continue
            S['fired'].add(i)
            any_change |= act(r['do'], kw.get('cell'))
        return any_change

    def passable(c):
        if c == floor: return True
        if c in doorch:
            l = locks[doorch[c]]
            return l.get('secret') or not l.get('needs') or cond(l['needs'])
        return False

    def reach():
        seen = {start}; q = collections.deque([start])
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in seen or not (0 <= n[0] < W and 0 <= n[1] < H) or not passable(G[n[1]][n[0]]): continue
                seen.add(n); q.append(n)
        return seen

    fire('start')
    for _ in range(200):
        seen = reach(); progressed = False
        for (x, y) in sorted(seen):
            z = zone_of(level, x, y)
            if z and z not in S['visited']: S['visited'].add(z); fire('enterZone', zone=z); progressed = True
            o = O[y][x]; od = leg['objects'].get(o, {})
            if 'item' in od and (x, y) not in S['taken']:
                S['taken'].add((x, y)); it = CORE['tuning']['items'][od['item']]
                if 'key' in it: S['keys'].add(it['key']); order.append('key ' + it['key'])
                fire('pickup', item=od['item']); progressed = True
        for y in range(H):
            for x in range(W):
                w = leg['walls'].get(G[y][x])
                if not w or 'use' not in w or S['tiles'].get((x, y)) == 'after': continue
                if any((x + dx, y + dy) in seen for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    if fire('use', target=w['use'], cell=(x, y)): progressed = True
        for r in deck['rules']:
            on = r['on']
            if on['event'] == 'region' and cond(r.get('if')) and not S['won']:
                if any(zone_of(level, x, y) == on['zone'] and y + .5 >= on.get('minY', -1) for (x, y) in seen): act(r['do'], None); progressed = True
        if not progressed: break
    seen = reach()
    floor_cells = {(x, y) for y in range(H) for x in range(W) if G[y][x] == floor}
    res = {'order': order, 'won': S['won'], 'floor': len(floor_cells), 'reached': len(floor_cells & seen)}
    if not S['won']: err(f'{pid}: the rules never reach a win. Got: {order}')
    if floor_cells - seen: err(f'{pid}: {len(floor_cells - seen)} floor cells unreachable, e.g. {sorted(floor_cells - seen)[:5]}')
    unreach = [(O[y][x], x, y) for y in range(H) for x in range(W) if O[y][x] != ' ' and (x, y) not in seen]
    if unreach: err(f'{pid}: objects unreachable: {unreach[:10]}')
    # every difficulty: same progression (only enemies differ); count what each one fields
    cnt = collections.Counter(c for r in O for c in r if c != ' ')
    res['enemies'] = {DIFFS[d]: sum(n for c, n in cnt.items() if 'enemy' in leg['objects'].get(c, {}) and leg['objects'][c]['min'] <= d) for d in range(5)}
    res['secrets'] = sum(r.count(k) for r in G for k, v in doorch.items() if locks[v].get('secret'))
    res['logs'] = len(level['logs']); res['assets'] = len(level['assets'])
    return res


CAT = load('catalog.json'); CAT_ENTRIES = {p['id']: p for p in CAT['packs']}
check_manifest('core', CAT_ENTRIES.get('core'))
CORE = {k: load('core', k + '.json') for k in ('art', 'tuning', 'sfx', 'lines', 'strings')}
_, core_files = check_manifest('core')
for group in ('textures', 'floors', 'ceilings', 'sprites'):
    for k, v in CORE['art'][group].items():
        for f in (v['file'], v.get('emissive')):
            if f and f != 'all' and f not in core_files: err(f'core: art {k} file {f} missing')
for k, v in CORE['sfx']['sounds'].items():
    if v['file'] not in core_files: err(f'core: sfx {k} missing')
for l in CORE['lines']['lines']:
    if l['file'] not in core_files: err(f'core: line {l["id"]} missing')
for p in CAT['packs']:
    if p['kind'] != 'deck' or (ONLY and p['id'] not in ONLY): continue
    r = validate_deck(p['id'], CORE, core_files)
    if r:
        print(f"{p['id']}: progression {' -> '.join(r['order'])}")
        print(f"  floor cells reachable {r['reached']}/{r['floor']}; secrets {r['secrets']}, logs {r['logs']}, asset tags {r['assets']}")
        print('  enemies placed by difficulty:', r['enemies'])
for w in warns: print('WARN', w)
for e in errors: print('ERROR', e)
print('OK' if not errors else f'{len(errors)} error(s)')
sys.exit(1 if errors else 0)
