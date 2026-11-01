"""Assemble a staging packs folder with Deck 02 in it.

    python3 build_deck02.py <stage_dir> [--from ../../packs]

Copies the live packs to <stage_dir>, then writes packs/deck-02 from deck02.py and
level/deck02/build_level.py, and adds Deck 02's needs to core (new enemies, items,
decor, textures, sounds and achievement lines) as core 1.3.0 / engine 1.3.

Art and audio that aren't made yet are filled with placeholders and listed at the end,
so a staging folder is never mistaken for a release. Never point this at ../../packs.
"""
import hashlib, json, os, shutil, struct, sys, wave

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'level', 'deck02'))
import deck02, build_level  # noqa: E402

STAGE = os.path.abspath(sys.argv[1])
SRC = os.path.abspath(sys.argv[sys.argv.index('--from') + 1]) if '--from' in sys.argv else os.path.join(HERE, '..', '..', 'packs-1.3')   # engine 1.3 packs (packs/ stays at 1.2 for the TestFlight app)
assert os.path.abspath(STAGE) != os.path.abspath(SRC), 'refusing to overwrite the live packs'
ENGINE, VERSION = '1.3', '1.3.0'
PLACEHOLDERS = []
RAW = os.path.join(HERE, 'deck02_raw')   # recorded voice/logs and finished art land here (see voice/ tools)

if os.path.exists(STAGE): shutil.rmtree(STAGE)
shutil.copytree(SRC, STAGE)
core, d2 = os.path.join(STAGE, 'core'), os.path.join(STAGE, 'deck-02')
os.makedirs(os.path.join(d2, 'voice'), exist_ok=True); os.makedirs(os.path.join(d2, 'logs'), exist_ok=True)
os.makedirs(os.path.join(d2, 'textures'), exist_ok=True)
jload = lambda p: json.load(open(p, encoding='utf-8'))
def jsave(p, o): open(p, 'w', encoding='utf-8').write(json.dumps(o, indent=1, ensure_ascii=False) + '\n')


def silent_mp3_or_wav(path, secs=.5):
    """A placeholder audio file (WAV bytes; the name keeps its .mp3 so references line up)."""
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050); w.writeframes(b'\0\0' * int(22050 * secs))


def take(rel, dst, kind):
    src = os.path.join(RAW, rel)
    if os.path.exists(src): shutil.copy(src, dst)
    else: silent_mp3_or_wav(dst); PLACEHOLDERS.append(f'{kind}: {rel}')


# ---------------- core additions (engine 1.3) ----------------
tun = jload(os.path.join(core, 'tuning.json'))
E = tun['enemies']
E['lurker'] = dict(E['crawler'], hp=10, lhp=[3, 3, 3, 3, 3], speed=1.7, dmg=14, reach=.9, wind=.35, r=.26, height=.8, sever=2,
                   ceiling=dict(dropRange=1.6, dropDmg=18, telegraph=1.1, height=1.15))
E['sleeper'] = dict(E['husk'], hp=14, lhp=[3, 3, 3, 4, 4], speed=1.45, dmg=16,
                    sleeper=dict(waitBehind=1.2, twitchEvery=[2.5, 5], lungeDmg=20))
E['super'] = dict(E['brute'], hp=220, lhp=[20, 40, 40, 999, 999], speed=.85, dmg=26, reach=1.5, wind=.75, r=.6, height=1.55,
                  boss=True, limbs=['head', 'armL', 'armR', 'legL', 'legR'], sever=2,
                  super=dict(armsToExpose=2, tankHp=40, steamEvery=7, steamDmg=8, steamRange=3.2, summonEvery=14,
                             summon=['husk', 'crawler'], summonMax=3))
tun.setdefault('enemyIntro', {})
tun['items']['boots'] = dict(boots=True, msg='STOMP BOOTS', line='get_boots', sprite='boots', height=.24, mapItem=True)
tun['items']['keyM'] = dict(key='M', sprite='keyM', height=.2, mapItem=True)
tun['decor']['pew'] = dict(sprite='pew', height=.5)
tun['decor']['tap'] = dict(sprite='tap', height=.62)
tun['kick']['stomp'] = dict(dmgMul=3, sleeperKill=True, keepsDown=True, reach=1.05)
jsave(os.path.join(core, 'tuning.json'), tun)

art = jload(os.path.join(core, 'art.json'))
NEW_TEX = {'shelf': 'locker', 'apartment': 'crew', 'chapel': 'hull2', 'daycare': 'med', 'poster': 'console', 'theater': 'hull2', 'washer': 'locker',
           'water': 'win', 'gym': 'bridge', 'pooltile': 'med', 'intercom': 'term', 'junction': 'brk', 'junctionon': 'brkon',
           'valve': 'ovrcon', 'valveopen': 'brkon', 'floorplan': 'term', 'gorgonseal': 'hull2', 'bulkhead': 'blue', 'masterdoor': 'lock', 'flooded': 'win'}
NEW_SPR = {'boots': 'armor', 'keyM': 'key', 'pew': 'bunk', 'tap': 'sign'}
for k, src in NEW_TEX.items():
    if k not in art['textures']: art['textures'][k] = dict(art['textures'][src]); PLACEHOLDERS.append(f'texture: {k} (copy of {src})')
for k in ['crack_apartment', 'crack_theater', 'crack_pooltile', 'crack_shelf', 'crack_chapel', 'crack_daycare', 'crack_gym']:
    if k not in art['textures']: art['textures'][k] = dict(art['textures']['crack_hull'], crackOf=k[6:]); PLACEHOLDERS.append(f'texture: {k} (copy of crack_hull)')
for k, src in NEW_SPR.items():
    if k not in art['sprites']: art['sprites'][k] = dict(art['sprites'][src]); PLACEHOLDERS.append(f'sprite: {k} (copy of {src})')
jsave(os.path.join(core, 'art.json'), art)

sfx = jload(os.path.join(core, 'sfx.json'))
for k, src in {'splash': 'whoosh', 'drain': 'whoosh', 'pour': 'pickup', 'stamp': 'drum'}.items():
    if k not in sfx['sounds']: sfx['sounds'][k] = dict(sfx['sounds'][src]); PLACEHOLDERS.append(f'sfx: {k} (copy of {src})')
jsave(os.path.join(core, 'sfx.json'), sfx)

lines = jload(os.path.join(core, 'lines.json'))
have = {l['id'] for l in lines['lines']}
for k, t in list(deck02.ACH_LINES.items()) + [('get_boots', "Steel toes, steel heels. Let's see who's playing dead.")]:
    if k not in have:
        f = f'voice/{k}.mp3'; take(f'core/{f}', os.path.join(core, f), 'core line')
        lines['lines'].append(dict(id=k, text=t, file=f) | ({'role': 'weapon'} if k == 'get_boots' else {}))
jsave(os.path.join(core, 'lines.json'), lines)

ach = jload(os.path.join(core, 'achievements.json'))
for a in ach['achievements']:
    if a['id'] == 'hb.steel_toed':   # the Super is the first boss; a stomp counts as a kick
        a['status'] = 'live'; a['if'] = {'all': [{'field': 'boss', 'eq': True}, {'field': 'cause', 'in': ['kick', 'stomp']}]}
jsave(os.path.join(core, 'achievements.json'), ach)

# ---------------- deck-02 ----------------
build_level.main(os.path.join(d2, 'level.json'))
deck = dict(format=1, id='deck-02', **deck02.DECK)
for a in deck['achievements']:
    if 'cond' in a: a['if'] = a.pop('cond')
    if a.get('line') is None: a.pop('line', None)
deck['blurb'] = 'Crew quarters, chapel, and rec decks, where the dead still keep house.'
jsave(os.path.join(d2, 'deck.json'), deck)

dl = []
for k, t in list(deck02.LINES.items()) + list(deck02.MOSS.items()):
    f = f'voice/{k}.mp3'; take(f'deck-02/{f}', os.path.join(d2, f), 'line')
    dl.append(dict(id=k, text=t, file=f) | ({'speaker': deck02.SPEAKERS[k]} if k in deck02.SPEAKERS else {}))
jsave(os.path.join(d2, 'lines.json'), {'lines': dl})

LOGTEXT = os.path.join(HERE, 'deck02_logs.json')
texts = jload(LOGTEXT) if os.path.exists(LOGTEXT) else {}
lv = jload(os.path.join(d2, 'level.json'))
logs = []
for i, lid in enumerate(deck02.LOG_ORDER):
    p = next(p for p in lv['logs'] if p['log'] == lid)
    t = texts.get(lid) or dict(header='AUDIO LOG // TBD', speaker='TBD', text='(log text not written yet)')
    if lid not in texts: PLACEHOLDERS.append(f'log text: {lid}')
    f = f'logs/{lid}.mp3'; take(f'deck-02/{f}', os.path.join(d2, f), 'log audio')
    logs.append(dict(id=lid, order=i + 1, header=t['header'], speaker=t['speaker'], text=t['text'], file=f,
                     zone=build_level.zone_at(p['x'], p['y']) if hasattr(build_level, 'zone_at') else None))
jsave(os.path.join(d2, 'logs.json'), {'logs': logs})


# ---------------- manifests and catalog ----------------
def manifest(pid, extra):
    root = os.path.join(STAGE, pid); files = []
    for dp, _, fns in os.walk(root):
        for fn in sorted(fns):
            rel = os.path.relpath(os.path.join(dp, fn), root).replace(os.sep, '/')
            if rel == 'manifest.json': continue
            b = open(os.path.join(dp, fn), 'rb').read(); files.append(dict(path=rel, bytes=len(b), sha256=hashlib.sha256(b).hexdigest()))
    files.sort(key=lambda f: f['path'])
    m = dict(format=1, id=pid, **extra, bytes=sum(f['bytes'] for f in files), files=files)
    jsave(os.path.join(root, 'manifest.json'), m)
    raw = open(os.path.join(root, 'manifest.json'), 'rb').read()
    return m, hashlib.sha256(raw).hexdigest()


old = jload(os.path.join(core, 'manifest.json'))
cm, csha = manifest('core', dict(kind='core', version=VERSION, minEngine=ENGINE, title=old['title']))
dm, dsha = manifest('deck-02', dict(kind='deck', deck=2, version='1.0.0', minEngine=ENGINE, title=deck02.DECK['title'],
                                    place=deck02.DECK['place'], requires={'core': VERSION}))
cat = jload(os.path.join(STAGE, 'catalog.json'))
cat['packs'] = [p for p in cat['packs'] if p['id'] not in ('core', 'deck-02')]
cat['packs'].insert(0, dict(id='core', kind='core', version=VERSION, minEngine=ENGINE, bytes=cm['bytes'], manifest='core/manifest.json', manifestSha256=csha))
cat['packs'].append(dict(id='deck-02', kind='deck', version='1.0.0', minEngine=ENGINE, bytes=dm['bytes'], manifest='deck-02/manifest.json', manifestSha256=dsha, deck=2))
for d in cat['decks']:
    if d['deck'] == 2: d['pack'] = 'deck-02'
jsave(os.path.join(STAGE, 'catalog.json'), cat)
print(f'staged {STAGE}: core {VERSION}, deck-02 1.0.0, engine {ENGINE}')
print(f'{len(PLACEHOLDERS)} placeholders (NOT shippable):')
for p in PLACEHOLDERS: print('  -', p)
