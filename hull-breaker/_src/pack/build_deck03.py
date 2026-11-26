"""Assemble a staging packs folder with Deck 03 in it (engine 1.7).

    python3 build_deck03.py <stage_dir> [--from ../../packs-1.6]

Copies packs-1.6 to <stage_dir>, then writes deck-03 from deck03.py and level/deck03/build_level.py, and adds
Deck 03's needs to core (the rooter, Mother Root, the Purge Torch and fuel, the samples, spore doors, new
textures, sounds and lines) as core 1.5.0 / engine 1.7. Decks 01 and 02 are copied unchanged.

Art and audio that aren't made yet are filled with placeholders and listed at the end, so a staging folder is
never mistaken for a release. Never point this at a live packs folder.
"""
import hashlib, json, os, shutil, sys, wave

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'level', 'deck03'))
import deck03, build_level, art_deck03  # noqa: E402

STAGE = os.path.abspath(sys.argv[1])
SRC = os.path.abspath(sys.argv[sys.argv.index('--from') + 1]) if '--from' in sys.argv else os.path.join(HERE, '..', '..', 'packs-1.6')
LIVE = {os.path.abspath(os.path.join(HERE, '..', '..', p)) for p in ('packs', 'packs-1.3', 'packs-1.5', 'packs-1.6')}
assert STAGE != SRC and STAGE not in LIVE, 'refusing to overwrite live packs'
ENGINE, VERSION = '1.7', '1.5.2'
DECK3_VERSION = '1.0.5'
PLACEHOLDERS = []
RAW = os.path.join(HERE, 'deck03_raw')   # recorded voice/logs and finished art land here (see voice/ tools)

if os.path.exists(STAGE): shutil.rmtree(STAGE)
shutil.copytree(SRC, STAGE)
core, d3 = os.path.join(STAGE, 'core'), os.path.join(STAGE, 'deck-03')
for sub in ('voice', 'logs', 'textures'): os.makedirs(os.path.join(d3, sub), exist_ok=True)
jload = lambda p: json.load(open(p, encoding='utf-8'))
def jsave(p, o): open(p, 'w', encoding='utf-8').write(json.dumps(o, indent=1, ensure_ascii=False) + '\n')


def silent(path, secs=.5):
    """A placeholder audio file (WAV bytes; the name keeps its .mp3 so references line up)."""
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050); w.writeframes(b'\0\0' * int(22050 * secs))


def take(rel, dst, kind):
    src = os.path.join(RAW, rel)
    if os.path.exists(src): shutil.copy(src, dst)
    else: silent(dst); PLACEHOLDERS.append(f'{kind}: {rel}')


# ---------------- core additions (engine 1.7) ----------------
tun = jload(os.path.join(core, 'tuning.json'))
E = tun['enemies']
# Rooter: a husk overgrown with roots. Severed limbs grow back after `regrowAfter` seconds unless the stump was
# burned; burning also stops it rising again. Fire does `fireMul` damage to it.
E['rooter'] = dict(E['husk'], hp=16, lhp=[4, 4, 4, 4, 4], speed=1.05, dmg=15, r=.34, height=1.05,
                   rooter=dict(regrowAfter=4.5, regrowHp=.6, burnStops=True, fireMul=1.6))
# Mother Root: fought part by part (engine 1.6 boss parts). Anchors take full damage only from fire; the bloom
# only while it is open. Grabbing vines come up through the floor round Buck and drag him in until cut or kicked.
E['motherroot'] = dict(E['brute'], hp=260, lhp=[999, 999, 999, 999, 999], speed=0, dmg=18, reach=2.2, wind=.8, r=.9, height=3,
                       boss=True, rooted=True, limbs=['head', 'armL', 'armR', 'legL', 'legR'], sever=0,
                       root=dict(arena=1, armor=.12, blastMul=.5, breakStagger=1.4, fireOnly=['anchor1', 'anchor2', 'anchor3'],
                                 vineEvery=[7, 6, 5, 4.5], vineWarn=1.1, vineHold=2, vinePull=.8, vineDmg=4, vineBreak='cutOrKick',
                                 sporeEvery=[0, 8, 6, 5], sporeDmg=6, sporeRange=3,
                                 bloomEvery=9, bloomOpen=3,
                                 summonEvery=[15, 12, 10, 8], summon=['rooter', 'crawler'], summonMax=[2, 3, 4, 4],
                                 drops=['fuel', 'fuel', 'fuel', 'fuel', 'med', 'medbig', 'shells', 'cells'], dropMax=18, dropChance=.65),
                       # aim matters (engine 1.7): each part is its own hit region on her sprite
                       parts=[dict(id='anchor1', name='WEST ANCHOR ROOT', hp=220, regions=['armL'], window='fire'),
                              dict(id='anchor2', name='EAST ANCHOR ROOT', hp=220, regions=['armR'], window='fire'),
                              dict(id='anchor3', name='TAP ROOT', hp=260, regions=['legL'], window='fire'),
                              dict(id='bloom', name='THE BLOOM', hp=200, regions=['head'], window='bloom')])
I = tun['items']
I['torch'] = dict(weapon=4, ammo='fuel', amount=60, msg='PICKED UP THE PURGE TORCH  [5]', line='get_torch', sprite='torch', height=.22, mapItem=True)
I['fuel'] = dict(ammo='fuel', amount=25, msg='TORCH FUEL', sprite='fuel', height=.28)
I['sampleTissue'] = dict(sample='tissue', msg='SAMPLE: ROOTER TISSUE', sprite='sample', height=.24, glow=1, mapItem=True)
I['samplePod'] = dict(sample='pod', msg='SAMPLE: SPORE POD CORE', sprite='sample', height=.24, glow=1, mapItem=True)
tun['ammo']['fuel'] = dict(max=150)
if not any(w['id'] == 'torch' for w in tun['weapons']):
    tun['weapons'].append(dict(id='torch', name='PURGE TORCH', ammo='fuel', cooldown=.05, range=3.4, cone=.22, damage=1.1,
                               burn=dict(dps=4, time=3, spread=.5), cauterize=True, perShot=1, underwater=False, sfx='flame',
                               alt=dict(id='backburn', perShot=12, cone=.6, range=4.2, damage=6, cooldown=1.1, sfx='backburn')))
tun['decor']['planter'] = dict(sprite='planter', height=.48)
tun['decor']['singingplant'] = dict(sprite='singingplant', height=1.1, use=True)
jsave(os.path.join(core, 'tuning.json'), tun)

art = jload(os.path.join(core, 'art.json'))
NEW_TEX = {'glasshouse': 'win', 'domeglass': 'win', 'seedrack': 'locker', 'trunk': 'hull2', 'oldtree': 'hull2', 'caverock': 'hull2',
           'terrace': 'hull', 'rootwall': 'blood', 'relay': 'term', 'relayon': 'term', 'scrubvalve': 'brk', 'scrubvalveon': 'brkon',
           'ventconsole': 'ovrcon', 'ventconsoleon': 'brkon', 'nofeedsign': 'sign' if 'sign' in art['textures'] else 'console',
           'rootdoor': 'lock',
           'crack_glass': 'crack_hull', 'crack_rack': 'crack_hull', 'crack_cave': 'crack_hull', 'crack_terrace': 'crack_hull'}
for k, src in NEW_TEX.items():
    if k not in art['textures']: art['textures'][k] = dict(art['textures'][src]); PLACEHOLDERS.append(f'texture: {k} (copy of {src})')
NEW_SPR = {'torch': 'rivetgun', 'fuel': 'cells', 'sample': 'log', 'planter': 'bunk', 'singingplant': 'sign'}
for k, src in NEW_SPR.items():
    if src not in art['sprites']: src = next(iter(art['sprites']))
    if k not in art['sprites']: art['sprites'][k] = dict(art['sprites'][src]); PLACEHOLDERS.append(f'sprite: {k} (copy of {src})')
art_deck03.main(os.path.join(core, 'textures'))   # drawn in code: the spore growth over a doorway
art['textures']['sporedoor'] = dict(file='textures/sporedoor.png', emissive='textures/sporedoor.em.png')
jsave(os.path.join(core, 'art.json'), art)

sfx = jload(os.path.join(core, 'sfx.json'))
for k, src in {'flame': 'whoosh', 'backburn': 'whoosh', 'plant_croon': 'drum', 'plant_gulp': 'pickup', 'regrow': 'whoosh',
               'vinecreak': 'groan', 'vinesnap': 'clank'}.items():
    if k not in sfx['sounds']: sfx['sounds'][k] = dict(sfx['sounds'][src]); PLACEHOLDERS.append(f'sfx: {k} (copy of {src})')
jsave(os.path.join(core, 'sfx.json'), sfx)

lines = jload(os.path.join(core, 'lines.json'))
have = {l['id'] for l in lines['lines']}
for k, t in deck03.CORE_LINES.items():
    if k not in have:
        f = f'voice/{k}.mp3'; take(f'core/{f}', os.path.join(core, f), 'core line')
        lines['lines'].append(dict(id=k, text=t, file=f) | ({'role': 'weapon'} if k == 'get_torch' else {}))
jsave(os.path.join(core, 'lines.json'), lines)

# ---------------- deck-03 ----------------
build_level.main(os.path.join(d3, 'level.json'))
deck = dict(format=1, id='deck-03', **deck03.DECK)
for a in deck['achievements']:
    if 'cond' in a: a['if'] = a.pop('cond')
    if a.get('line') is None: a.pop('line', None)
deck['blurb'] = 'Farms, scrubbers and reclamation tanks, where the crops learned to grow back.'
jsave(os.path.join(d3, 'deck.json'), deck)

dl = []
for k, t in list(deck03.LINES.items()) + list(deck03.MOSS.items()) + list(deck03.OKAFOR.items()):
    f = f'voice/{k}.mp3'; take(f'deck-03/{f}', os.path.join(d3, f), 'line')
    dl.append(dict(id=k, text=t, file=f) | ({'speaker': deck03.SPEAKERS[k]} if k in deck03.SPEAKERS else {}))
jsave(os.path.join(d3, 'lines.json'), {'lines': dl})

LOGTEXT = os.path.join(HERE, 'deck03_logs.json')
texts = jload(LOGTEXT) if os.path.exists(LOGTEXT) else {}
lv = jload(os.path.join(d3, 'level.json'))
logs = []
for i, lid in enumerate(deck03.LOG_ORDER):
    p = next(p for p in lv['logs'] if p['log'] == lid)
    t = texts.get(lid) or dict(header='AUDIO LOG // TBD', speaker='TBD', text='(log text not written yet)')
    if lid not in texts: PLACEHOLDERS.append(f'log text: {lid}')
    f = f'logs/{lid}.mp3'; take(f'deck-03/{f}', os.path.join(d3, f), 'log audio')
    logs.append(dict(id=lid, order=i + 1, header=t['header'], speaker=t['speaker'], text=t['text'], file=f,
                     zone=build_level.zone_at(p['x'], p['y'])))
jsave(os.path.join(d3, 'logs.json'), {'logs': logs})


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
    return m, hashlib.sha256(open(os.path.join(root, 'manifest.json'), 'rb').read()).hexdigest()


old = jload(os.path.join(core, 'manifest.json'))
cm, csha = manifest('core', dict(kind='core', version=VERSION, minEngine=ENGINE, title=old['title']))
dm, dsha = manifest('deck-03', dict(kind='deck', deck=3, version=DECK3_VERSION, minEngine=ENGINE, title=deck03.DECK['title'],
                                    place=deck03.DECK['place'], requires={'core': VERSION}))
cat = jload(os.path.join(STAGE, 'catalog.json'))
cat['packs'] = [p for p in cat['packs'] if p['id'] not in ('core', 'deck-03')]
cat['packs'].insert(0, dict(id='core', kind='core', version=VERSION, minEngine=ENGINE, bytes=cm['bytes'], manifest='core/manifest.json', manifestSha256=csha))
cat['packs'].append(dict(id='deck-03', kind='deck', version=DECK3_VERSION, minEngine=ENGINE, bytes=dm['bytes'], manifest='deck-03/manifest.json', manifestSha256=dsha, deck=3))
for d in cat['decks']:
    if d['deck'] == 3: d['pack'] = 'deck-03'
if 'baseUrl' in cat: cat['baseUrl'] = cat['baseUrl'].replace('packs-1.6', 'packs-1.7')
jsave(os.path.join(STAGE, 'catalog.json'), cat)
print(f'staged {STAGE}: core {VERSION}, deck-03 {DECK3_VERSION}, engine {ENGINE}')
print(f'{len(PLACEHOLDERS)} placeholders (NOT shippable):')
for p in PLACEHOLDERS: print('  -', p)
