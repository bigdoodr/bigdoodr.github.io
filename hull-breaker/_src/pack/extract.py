"""Stage 2 of the Deck 01 extraction: turn the raw dump into packs.

    python3 dump.py raw          # once, from the shipped index.html
    python3 extract.py raw ../../packs

Writes packs/catalog.json, packs/core/ (shared art, sounds, Buck's shared lines,
tuning) and packs/deck-01/ (level, rules, logs, deck lines and their audio), each
with a manifest listing every file's size and SHA-256. FORMAT.md describes it all.
"""
import base64, hashlib, json, os, re, shutil, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
import deck01

FORMAT = 1
ENGINE_MIN = '1.0'
CORE_VERSION = '1.0.0'
DECK_VERSION = '1.0.0'
BASE_URL = 'https://bigdoodr.github.io/hull-breaker/packs/'

RAW = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else 'raw')
OUT = os.path.abspath(sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', '..', 'packs'))
data = json.load(open(os.path.join(RAW, 'data.json')))
art = json.load(open(os.path.join(RAW, 'art.json')))
vo_files = json.load(open(os.path.join(RAW, 'vo.json')))

FLOORS = ['deckplate', 'tile', 'grating', 'soil', 'carpet']   # level zone 'floor' index -> name
CEILINGS = ['ceiling', 'ceiling_lamp']                         # lamp version goes over every light


def jdump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False); f.write('\n')


def wpng(path, b64):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'wb').write(base64.b64decode(b64))


# ------------------------------------------------------------------ core pack
def core_lines():
    """Buck lines every deck can use. id -> (text, role, subtitle seconds)."""
    L = {}
    for i, t in enumerate(data['KILLQ']): L[f'kill_{i+1}'] = (t, 'kill', 2.6)
    L['secret_first'] = ("Every ship's got a junk drawer.", 'secretFirst', 2.8)
    for i, t in enumerate(data['SECRETQ']): L[f'secret_{i+1}'] = (t, 'secret', 2.8)
    for i, t in enumerate(data['TAGQ']): L[f'tag_{i+1}'] = (t, 'tag', 2)
    L.update({
        'headshot': ("Huh. Didn't need that, apparently.", 'headshot', 3),
        'brute': ('Oh. You must be the co-signer.', 'enemyIntro', 3),
        'spitter': ('Spitters. Great.', 'enemyIntro', 2.4),
        'bloater': ("Oh, that's disgusting. Don't pop on me.", 'enemyIntro', 3),
        'low_hp': ("Ouch! That's coming out of my commission.", 'lowHp', 3),
        'death': ('Great. Repossessed.', 'death', 3),
        'save_first': ("Paperwork's filed.", 'saveFirst', 2.2),
        'stay_down': ('Stay down this time.', 'stayDown', 2.2),
        'deck_clear': ("Ship's repossessed. Mostly.", 'deckClear', 3),
        'get_shotgun': ('Now THIS is a payment plan.', 'weapon', 3),
        'get_rivetgun': ("Rivet driver. Let's nail this down.", 'weapon', 3),
        'get_satchel': ('Charge bombs. Fire in the hole.', 'weapon', 3),
        'trailer_late': ('Says here your payments are ninety days late.', 'trailer', 3.4),
        'trailer_limbs': ("Guess I'll take payment in limbs.", 'trailer', 3.4),
    })
    return L


def tuning():
    D = data
    return {
        'note': 'Reference values from the JavaScript engine (index.html). Engines read these instead of hard-coding them.',
        'difficulty': [{k: v for k, v in d.items()} for d in D['DIFF']],
        'veryEasyThin': .3,
        'player': {'hp': 100, 'maxHp': 100, 'maxArmor': 100, 'radius': .22, 'armorAbsorb': .6, 'lowHp': 30},
        'enemies': {k: dict(v, height=D['WH'][k], limbs=['head', 'armL', 'armR', 'legL', 'legR'],
                            sever=4 if k == 'brute' else 2 if k in ('crawler', 'bloater') else 3)
                    for k, v in D['ETYPE'].items()},
        'enemyIntro': {
            'brute': {'line': 'brute'},
            'spitter': {'line': 'spitter', 'msg': "TAKE A SPITTER'S HEAD TO STOP THE ACID."},
            'bloater': {'line': 'bloater', 'msg': 'SHOOT THE BELLY FROM A DISTANCE.'},
        },
        'weapons': [
            {'id': 'cutter', 'name': D['WNAME'][0], 'ammo': 'cells', 'cooldown': .5, 'limbDamage': 4, 'torsoDamage': 2, 'sfx': 'cutter'},
            {'id': 'boomstick', 'name': D['WNAME'][1], 'ammo': 'shells', 'cooldown': .9, 'pellets': 9, 'nearDamage': 2.6, 'farDamage': 1.8, 'sfx': 'shotgun'},
            {'id': 'rivet', 'name': D['WNAME'][2], 'ammo': 'rivets', 'cooldown': .095, 'limbDamage': 1.25, 'torsoDamage': 1, 'sfx': 'rivet'},
            {'id': 'charges', 'name': D['WNAME'][3], 'ammo': 'bombs', 'cooldown': .75, 'radius': 2.9, 'damage': 46, 'fuse': 1.9, 'sfx': 'whoosh'},
        ],
        'ammo': {'cells': {'max': 60}, 'shells': {'max': 40}, 'rivets': {'max': 200}, 'bombs': {'max': 9}},
        'kick': {'cooldown': .6, 'range': 1.35, 'damage': 3.5, 'stomp': 11},
        'explosions': {'barrel': {'radius': 2.7, 'damage': 42}, 'bloater': {'radius': 2.8, 'damage': 46}, 'bomb': {'radius': 2.9, 'damage': 46}},
        'revive': {'after': [12, 20], 'types': ['husk', 'spitter'], 'becomes': 'crawler', 'range': 16},
        # Amounts are multiplied by the difficulty's ammo or heal factor and rounded.
        'items': {
            'med': {'heal': 25, 'msg': 'MED-GEL', 'sprite': 'med', 'height': D['PWH']['med']},
            'medbig': {'heal': 50, 'msg': 'TRAUMA KIT', 'sprite': 'medbig', 'height': D['PWH']['medbig']},
            'cells': {'ammo': 'cells', 'amount': 8, 'msg': 'CUTTER CELLS', 'sprite': 'cells', 'height': D['PWH']['cells']},
            'shells': {'ammo': 'shells', 'amount': 6, 'msg': 'SHELLS', 'sprite': 'shells', 'height': D['PWH']['shells']},
            'rivets': {'ammo': 'rivets', 'amount': 25, 'msg': 'RIVETS', 'sprite': 'rivets', 'height': D['PWH']['rivets']},
            'bombs': {'ammo': 'bombs', 'amount': 2, 'minAmount': 1, 'msg': 'CHARGE BOMBS', 'sprite': 'bombs', 'height': D['PWH']['bombs']},
            'armor': {'armor': 60, 'msg': 'RIG PLATING', 'sprite': 'armor', 'height': D['PWH']['armor']},
            'shotgun': {'weapon': 1, 'ammo': 'shells', 'amount': 8, 'msg': 'PICKED UP THE BOOMSTICK  [2]', 'line': 'get_shotgun', 'sprite': 'shotgun', 'height': D['PWH']['shotgun'], 'mapItem': True},
            'rivetgun': {'weapon': 2, 'ammo': 'rivets', 'amount': 40, 'msg': 'PICKED UP THE RIVET DRIVER  [3]', 'line': 'get_rivetgun', 'sprite': 'rivetgun', 'height': D['PWH']['rivetgun'], 'mapItem': True},
            'satchel': {'weapon': 3, 'ammo': 'bombs', 'amount': 3, 'minAmount': 2, 'msg': 'PICKED UP CHARGE BOMBS  [4]', 'line': 'get_satchel', 'sprite': 'satchel', 'height': D['PWH']['satchel'], 'mapItem': True},
            'keyB': {'key': 'B', 'sprite': 'keyB', 'height': D['PWH']['keyB'], 'mapItem': True},
            'keyY': {'key': 'Y', 'sprite': 'keyY', 'height': D['PWH']['keyY'], 'mapItem': True},
            'keyR': {'key': 'R', 'sprite': 'keyR', 'height': D['PWH']['keyR'], 'mapItem': True},
            'log': {'log': True, 'sprite': 'log', 'height': D['PWH']['log'], 'mapItem': True},
            'asset': {'asset': True, 'sprite': 'asset', 'height': D['PWH']['asset'], 'glow': 1, 'float': .12, 'mapItem': True},
        },
        'decor': {k: {'sprite': k, 'height': v} for k, v in D['DWH'].items()},
        'barrel': {'sprite': 'barrel', 'height': .55, 'hp': 2, 'radius': .22},
        'drops': {'cells': .2, 'shells': .12, 'rivets': .12, 'med': .07},
        'ranks': [[100, 'REPO LEGEND'], [85, 'TOP COLLECTOR'], [65, 'SENIOR AGENT'], [40, 'FIELD AGENT'], [0, 'TEMP CONTRACTOR']],
    }


STRINGS = {
    'accessGranted': 'ACCESS GRANTED', 'secretFound': 'SECRET AREA FOUND', 'saved': 'PROGRESS SAVED',
    'checkpoint': 'CHECKPOINT SAVED', 'outOfAmmo': 'OUT OF AMMO', 'logFound': 'AUDIO LOG {n}/{total}',
    'assetTagged': 'ASSET TAGGED: {name}  ({n}/{total})', 'headshotTip': "HEADSHOTS DON'T STOP THEM. CUT THE LIMBS.",
    'reviveTip': 'SOME OF THE DEAD GET BACK UP. KICK BODIES TO KEEP THEM DOWN.', 'noRoute': 'NO ROUTE FOUND',
    'route': 'ROUTE TO OBJECTIVE: {m} M', 'deathHeading': 'REPOSSESSED',
    'deathBody': 'Buck Hammersmith has been written off as a total loss.',
}


def write_audio(src_f32, dst_wav, loop=None):
    """Float render -> 22.05 kHz 16-bit mono WAV, normalized; returns (gain, seconds)."""
    x = np.fromfile(src_f32, dtype=np.float32).astype(np.float64)
    sr = 44100
    if loop == 'ambient':      # drone with a 0.07 Hz filter sweep: keep two sweeps, crossfade the seam
        n = int(round(2 / .07 * sr)); fade = int(.5 * sr)
        body = x[fade:fade + n].copy(); tail = x[fade + n:fade + n + fade]
        r = np.linspace(0, 1, fade); body[:fade] = body[:fade] * r + tail * (1 - r); x = body
    elif loop == 'music':      # 32 eighth notes at 138 bpm, rendered twice: keep the second pass (it carries the first pass's tails)
        spb = 60 / 138 / 2; a = int(round((.001 + 32 * spb) * sr)); x = x[a:a + int(round(32 * spb * sr))]
    else:                      # one-shot: trim the silent tail
        nz = np.nonzero(np.abs(x) > 1e-4)[0]; x = x[:nz[-1] + 64] if len(nz) else x[:1]
    x = resample_poly(x, 1, 2); sr = 22050
    peak = float(np.max(np.abs(x))) or 1.0
    gain = peak / .89
    sf.write(dst_wav, (x / gain).astype(np.float32), sr, subtype='PCM_16')
    return round(gain, 4), round(len(x) / sr, 3)


def build_core():
    root = os.path.join(OUT, 'core')
    shutil.rmtree(root, ignore_errors=True)
    # art
    tex = {}
    for name, t in art['textures'].items():
        tid = name.lower(); entry = {'file': f'textures/{tid}.png'}
        wpng(os.path.join(root, entry['file']), t['png'])
        if t['em']: entry['emissive'] = f'textures/{tid}.em.png'; wpng(os.path.join(root, entry['emissive']), t['em'])
        tex[tid] = entry
    NO_CRACK = {'DOOR', 'LOCK', 'UNLOCK', 'BLUE', 'YEL', 'PWR', 'OVR', 'SECRET', 'VENT', 'SAVE', 'BRK', 'TERM'}  # never next to a secret panel
    for name, t in art['cracks'].items():
        if name in NO_CRACK: continue
        tid = 'crack_' + name.lower(); entry = {'file': f'textures/{tid}.png', 'crackOf': name.lower()}
        wpng(os.path.join(root, entry['file']), t['png'])
        if t['em']: entry['emissive'] = f'textures/{tid}.em.png'; wpng(os.path.join(root, entry['emissive']), t['em'])
        tex[tid] = entry
    floors = {}
    for i, t in enumerate(art['floors']):
        floors[FLOORS[i]] = {'file': f'floors/{FLOORS[i]}.png'}; wpng(os.path.join(root, floors[FLOORS[i]]['file']), t['png'])
    ceil = {}
    for i, t in enumerate(art['ceilings']):
        ceil[CEILINGS[i]] = {'file': f'floors/{CEILINGS[i]}.png'}; wpng(os.path.join(root, ceil[CEILINGS[i]]['file']), t['png'])
    spr = {}
    for name, s in art['sprites'].items():
        e = {'file': f'sprites/{name}.png', 'w': s['w'], 'h': s['h']}
        wpng(os.path.join(root, e['file']), s['png'])
        if s['allEm']: e['emissive'] = 'all'
        elif s['em']: e['emissive'] = f'sprites/{name}.em.png'; wpng(os.path.join(root, e['emissive']), s['em'])
        spr[name] = e
    jdump(os.path.join(root, 'art.json'), {'textureSize': 64, 'textures': tex, 'floors': floors, 'ceilings': ceil, 'sprites': spr,
        'procedural': {'note': 'Drawn by the engine, not shipped as files: enemies (with severed limbs), weapon viewmodels, Buck\'s HUD face, the space backdrop.',
                       'enemies': list(data['ETYPE'])}})
    # sounds
    os.makedirs(os.path.join(root, 'sfx'), exist_ok=True)
    sfx = {}
    for fn in sorted(os.listdir(os.path.join(RAW, 'sfx'))):
        sid = fn[:-4]; loop = sid if sid in ('ambient', 'music') else None
        g, secs = write_audio(os.path.join(RAW, 'sfx', fn), os.path.join(root, 'sfx', sid + '.wav'), loop)
        sfx[sid] = {'file': f'sfx/{sid}.wav', 'gain': g, 'seconds': secs}
        if loop: sfx[sid]['loop'] = True
    jdump(os.path.join(root, 'sfx.json'), {'note': 'Play at gain x distance volume, panned at runtime, into a compressor (threshold -12 dB, knee 10, ratio 5). Variants like shriek_1_3 are pitch 1.3.',
                                           'sounds': sfx})
    # Buck's shared lines
    lines = []
    os.makedirs(os.path.join(root, 'voice'), exist_ok=True)
    for lid, (text, role, sub) in core_lines().items():
        src = vo_files[text]; shutil.copy(os.path.join(RAW, 'vo', src), os.path.join(root, 'voice', lid + '.mp3'))
        lines.append({'id': lid, 'text': text, 'role': role, 'sub': sub, 'file': f'voice/{lid}.mp3'})
    jdump(os.path.join(root, 'lines.json'), {'speaker': 'BUCK', 'lines': lines})
    jdump(os.path.join(root, 'tuning.json'), tuning())
    jdump(os.path.join(root, 'strings.json'), STRINGS)
    return manifest(root, {'id': 'core', 'kind': 'core', 'version': CORE_VERSION, 'minEngine': ENGINE_MIN,
                           'title': 'Hull Breaker shared content'})


# ------------------------------------------------------------------ deck 01 pack
def zone_at(L, x, y):
    for z in L['zones'][::-1]:  # later zones sit on top of earlier ones, as in the game
        if z['x1'] <= x <= z['x2'] and z['y1'] <= y <= z['y2']: return z
    return None


def build_deck():
    root = os.path.join(OUT, 'deck-01')
    shutil.rmtree(root, ignore_errors=True)
    L = data['LEVEL']; W, H = L['w'], L['h']; geo, obj = L['geo'], L['obj']
    leg = deck01.DECK['legend']
    zones = []
    for z in L['zones']:
        zz = dict(z); zz['floor'] = FLOORS[z['floor']]; zz['light'] = data['ZTHEME'].get(z['id'])
        if zz['light'] is None: del zz['light']
        zones.append(zz)
    # logs and asset tags, placed explicitly (the old game assigned them by scan order)
    logs_at, assets_at, ai = [], [], 0
    for y in range(H):
        for x in range(W):
            c = obj[y][x]
            if c == 'l':
                z = zone_at(L, x, y); lid = z['id'] if z and z['id'] in data['LOGS_LEVEL'] else 'dockoffice'
                logs_at.append({'x': x, 'y': y, 'log': lid})
            elif c == '$':
                assets_at.append({'x': x, 'y': y, 'name': data['ASSET_NAMES'][ai] if ai < len(data['ASSET_NAMES']) else 'Ship fixture'}); ai += 1
    # secret doors wear a cracked copy of the wall beside them
    wall_tex = {k: v['tex'] for k, v in leg['walls'].items()}
    doors = []
    for y in range(H):
        for x in range(W):
            if geo[y][x] != 'X': continue
            hz = geo[y][x - 1] != '.' and geo[y][x + 1] != '.'
            cand = [geo[y][x - 1], geo[y][x + 1]] if hz else [geo[y - 1][x], geo[y + 1][x]]
            base = next((wall_tex[c] for c in cand if c in wall_tex and wall_tex[c] not in ('vent', 'save', 'brk', 'term')), 'hull')
            doors.append({'x': x, 'y': y, 'tex': 'crack_' + base})
    jdump(os.path.join(root, 'level.json'), {'w': W, 'h': H, 'geo': geo, 'obj': obj, 'zones': zones,
                                             'logs': logs_at, 'assets': assets_at, 'doors': doors})
    # logs
    os.makedirs(os.path.join(root, 'logs'), exist_ok=True)
    logs = []
    for i, lid in enumerate(deck01.LOG_ORDER):
        head, body = data['LOGS_LEVEL'][lid]
        shutil.copy(os.path.join(RAW, 'logs', lid + '.mp3'), os.path.join(root, 'logs', lid + '.mp3'))
        logs.append({'id': lid, 'order': i + 1, 'header': head, 'speaker': head.split('// ', 1)[1], 'text': body,
                     'file': f'logs/{lid}.mp3', 'zone': lid})
    jdump(os.path.join(root, 'logs.json'), {'logs': logs})
    # deck lines
    os.makedirs(os.path.join(root, 'voice'), exist_ok=True)
    lines = []
    for lid, text in deck01.LINES.items():
        shutil.copy(os.path.join(RAW, 'vo', vo_files[text]), os.path.join(root, 'voice', lid + '.mp3'))
        lines.append({'id': lid, 'text': text, 'file': f'voice/{lid}.mp3'})
    jdump(os.path.join(root, 'lines.json'), {'speaker': 'BUCK', 'lines': lines})
    # rules
    d = dict(deck01.DECK); n = d['deck']
    blurb = next(x['b'] for x in data['DECKS'] if x['n'] == n)
    deck = {'format': FORMAT, 'id': 'deck-01', 'deck': n, 'title': d['title'], 'place': d['place'], 'ship': d['ship'], 'blurb': blurb}
    deck.update({k: v for k, v in d.items() if k not in ('deck', 'title', 'place', 'ship')})
    jdump(os.path.join(root, 'deck.json'), deck)
    return manifest(root, {'id': 'deck-01', 'kind': 'deck', 'deck': n, 'version': DECK_VERSION, 'minEngine': ENGINE_MIN,
                           'title': d['title'], 'place': d['place'], 'requires': {'core': '1.0.0'}})


# ------------------------------------------------------------------ manifests and catalog
def manifest(root, head):
    files = []
    for dp, _, fns in os.walk(root):
        for fn in sorted(fns):
            if fn == 'manifest.json': continue
            p = os.path.join(dp, fn); rel = os.path.relpath(p, root).replace(os.sep, '/')
            b = open(p, 'rb').read(); files.append({'path': rel, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    files.sort(key=lambda f: f['path'])
    m = dict(format=FORMAT, **head); m['bytes'] = sum(f['bytes'] for f in files); m['files'] = files
    jdump(os.path.join(root, 'manifest.json'), m)
    return m


def main():
    os.makedirs(OUT, exist_ok=True)
    core = build_core(); deck = build_deck()

    def entry(m):
        b = open(os.path.join(OUT, m['id'], 'manifest.json'), 'rb').read()
        e = {k: m[k] for k in ('id', 'kind', 'version', 'minEngine', 'bytes')}
        e.update(manifest=f"{m['id']}/manifest.json", manifestSha256=hashlib.sha256(b).hexdigest())
        if 'deck' in m: e['deck'] = m['deck']
        return e
    catalog = {'format': FORMAT, 'game': 'hull-breaker', 'baseUrl': BASE_URL, 'packs': [entry(core), entry(deck)],
               'decks': [{'deck': x['n'], 'title': x['t'], 'place': x['p'], 'blurb': x['b'],
                          'pack': 'deck-01' if x['n'] == 1 else None} for x in data['DECKS']]}
    jdump(os.path.join(OUT, 'catalog.json'), catalog)
    print(f"core {core['bytes']/1e6:.2f} MB, {len(core['files'])} files; deck-01 {deck['bytes']/1e6:.2f} MB, {len(deck['files'])} files")


if __name__ == '__main__':
    main()
