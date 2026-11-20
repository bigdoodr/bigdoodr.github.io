"""Builds packs-1.6/ from packs-1.5/ (engine 1.6, Nov 2026 Deck 02 polish chat). Re-runnable: starts from a fresh copy.
    python3 deck02_v16.py [site_hull_breaker_dir]

What changes, besides the folder:
- core 1.4.0: the Super is fought part by part (tuning `parts` and per-phase numbers, FORMAT.md "Boss parts"),
  and the new wall art (the three office valves, the key cabinet, the boiler startup card), drawn here.
- Deck 02 1.2.0:
  * bossPhase rules: lights out and red emergency light from phase 2, a hint and a Buck line per break, `autosave: events`
    (Normal and easier save; Hard and Nightmare don't, by the difficulty table). The lights come back when he dies.
  * The Super's Office route: the guide leads to the locked office door first; trying it plays Moss
    ("Hollis was always locking himself out...") and only then does the guide point to the Chapel for the spare.
  * The master key is no longer on the office floor. It hangs in a steam-locked key cabinet in an alcove in the office's
    west wall. Three valves on the office's south wall (FEED, RETURN, BYPASS) each step LOW 40 / MID 90 / HIGH 140 psi,
    starting at MID. The boiler startup card on the Laundry's south wall gives the settings: FEED 140, RETURN 40,
    BYPASS 90. All three HIGH blows the relief valve and drops everything back to MID. `solutions` tells the tools the answer.
Both packs need engine 1.6. Older engines read packs-1.5/ and keep the old fight and the key on the floor."""
import json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw

HB = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SRC, DST = os.path.join(HB, 'packs-1.5'), os.path.join(HB, 'packs-1.6')
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, 'deck02_v16_voice')   # baked MP3s from _src/voice/deck02_v16_vo.py (added when present)
keep_voice = {}
if os.path.isdir(os.path.join(DST, 'deck-02', 'voice')):   # keep anything already baked into the folder
    for f in os.listdir(os.path.join(DST, 'deck-02', 'voice')): keep_voice[f] = open(os.path.join(DST, 'deck-02', 'voice', f), 'rb').read()
shutil.rmtree(DST, ignore_errors=True); shutil.copytree(SRC, DST)
J = lambda *p: json.load(open(os.path.join(DST, *p)))
def W(obj, *p): open(os.path.join(DST, *p), 'w').write(json.dumps(obj, indent=1, ensure_ascii=False) + '\n')

# ---------------- core: the Super in parts ----------------
t = J('core', 'tuning.json'); s = t['enemies']['super']
s['parts'] = [
    {"id": "buffer", "name": "FLOOR BUFFER", "hp": 70, "window": "stun"},
    {"id": "armL", "name": "LEFT ARM", "hp": 85, "regions": ["armL"], "sever": "armL", "window": "swing"},
    {"id": "hoses", "name": "STEAM HOSES", "hp": 75, "regions": ["head", "torso"], "window": "vent"},
    {"id": "armR", "name": "RIGHT ARM", "hp": 85, "regions": ["armR"], "sever": "armR", "window": "swing"},
    {"id": "tank", "name": "BOILER TANK", "hp": 110, "regions": ["torso"], "window": "overheat"}]
s['super'].update({
    "arena": 1, "armor": 0.12, "blastMul": 0.5, "breakStagger": 1.2,
    "summonEvery": [16, 13, 11, 10, 8], "summonMax": [2, 3, 4, 4, 5],
    "steamEvery": [0, 7, 5, 0, 0], "ventTime": [0.8, 0.8, 2.4, 0.8, 0.8],
    "chargeEvery": [5], "chargeWindup": 0.9, "chargeSpeed": 6.5, "chargeTime": 1.8, "chargeDmgMul": 1.2, "stunTime": [3.2], "stumbleTime": 1.0,
    "swingOpen": 1.4, "heatEvery": [7], "heatTime": [3],
    "scaldEvery": [3.5, 3.5, 3.5, 3.2, 2.6], "scaldJets": [2, 2, 2, 2, 3], "scaldWarn": 1.1, "scaldRadius": 1.1, "scaldDmg": 10,
    "drops": ["med", "med", "medbig", "shells", "rivets", "cells", "bombs"], "dropMax": 10, "dropChance": 0.45})
W(t, 'core', 'tuning.json')

# ---------------- core: wall art ----------------
TEX = os.path.join(DST, 'core', 'textures')
F = {'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110', 'E': '111100110100111',
     'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111', 'K': '101101110101101',
     'L': '100100100100111', 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
     'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010', 'U': '101101101101111', 'V': '101101101101010',
     'W': '101101111111101', 'Y': '101101010010010', '0': '111101101101111', '1': '010110010010111', '4': '101101111001001',
     '9': '111101111001111', '.': '000000000000010', ' ': '0' * 15}
def text(d, s, cx, y, col):
    x = cx - (4 * len(s) - 1) // 2
    for ch in s:
        for i, b in enumerate(F[ch]):
            if b == '1': d.point((x + i % 3, y + i // 3), fill=col)
        x += 4
def em_of(im, box):   # a glow map: black, with the box lit
    em = Image.new('RGBA', (64, 64), (0, 0, 0, 255)); em.paste(im.crop(box), box[:2]); return em

base = Image.open(os.path.join(TEX, 'pipe.png')).convert('RGBA')
for name, label, handle in [('valvefeed', 'FEED', (200, 40, 40)), ('valvereturn', 'RETURN', (40, 110, 210)), ('valvebypass', 'BYPASS', (220, 170, 30))]:
    im = base.copy(); d = ImageDraw.Draw(im)
    d.rectangle((8, 6, 55, 57), fill=(38, 42, 47, 255)); d.rectangle((10, 8, 53, 55), fill=(58, 64, 70, 255))
    d.ellipse((20, 10, 43, 33), fill=(225, 220, 200, 255), outline=(20, 20, 20, 255))         # the gauge
    for a in range(5): d.point((22 + a * 5, 22 - (a % 4 == 0) * 0), fill=(30, 30, 30, 255))
    d.line((31, 22, 37, 15), fill=(200, 20, 30, 255), width=1); d.point((31, 22), fill=(20, 20, 20, 255))
    d.rectangle((29, 34, 34, 44), fill=(90, 96, 100, 255))                                       # the stem
    d.ellipse((19, 38, 44, 48), outline=handle + (255,), width=3)                                # the handwheel
    d.line((22, 43, 41, 43), fill=handle + (255,), width=2); d.line((31, 38, 31, 48), fill=handle + (255,), width=2)
    d.rectangle((11, 49, 52, 55), fill=(22, 24, 26, 255)); text(d, label, 32, 50, (230, 230, 220, 255))
    im.save(os.path.join(TEX, name + '.png')); em_of(im, (20, 10, 44, 34)).save(os.path.join(TEX, name + '.em.png'))

im = Image.open(os.path.join(TEX, 'hull.png')).convert('RGBA').copy(); d = ImageDraw.Draw(im)   # the steam-locked key cabinet (a door)
d.rectangle((6, 4, 57, 61), fill=(70, 76, 82, 255)); d.rectangle((9, 7, 54, 58), fill=(40, 44, 48, 255))
d.rectangle((13, 16, 50, 46), fill=(70, 110, 120, 255)); d.rectangle((15, 18, 48, 44), fill=(30, 52, 60, 255))   # the glass front
d.line((16, 19, 26, 19), fill=(150, 200, 210, 255))
d.ellipse((26, 24, 34, 32), outline=(205, 205, 210, 255), width=2); d.rectangle((33, 27, 43, 29), fill=(205, 205, 210, 255))   # the master key inside
d.rectangle((40, 29, 41, 31), fill=(205, 205, 210, 255)); d.rectangle((43, 29, 43, 31), fill=(205, 205, 210, 255))
d.ellipse((12, 48, 22, 58), fill=(225, 220, 200, 255)); d.line((17, 53, 20, 50), fill=(200, 20, 30, 255))   # its gauge
d.rectangle((44, 49, 51, 55), fill=(200, 30, 30, 255)); d.rectangle((46, 51, 49, 53), fill=(255, 90, 80, 255))   # the red steam-lock lamp
d.rectangle((9, 8, 54, 14), fill=(22, 24, 26, 255)); text(d, 'MASTER KEY', 32, 9, (230, 200, 120, 255))
im.save(os.path.join(TEX, 'keycabinet.png'))
em = em_of(im, (44, 49, 52, 56)); ImageDraw.Draw(em).rectangle((26, 24, 43, 32), fill=(60, 60, 64, 255)); em.save(os.path.join(TEX, 'keycabinet.em.png'))

im = base.copy(); d = ImageDraw.Draw(im)   # the boiler startup card, clipped to the laundry's pipe wall
d.rectangle((10, 4, 53, 60), fill=(120, 84, 48, 255)); d.rectangle((26, 2, 37, 7), fill=(150, 150, 155, 255))
d.rectangle((13, 9, 50, 57), fill=(232, 226, 200, 255))
for i, line in enumerate(['BOILER', 'STARTUP', 'FEED 140', 'RETURN 40', 'BYPASS 90']):
    text(d, line, 32, 12 + i * 8 + (3 if i >= 2 else 0), (40, 30, 30, 255) if i >= 2 else (150, 20, 20, 255))
d.line((15, 55, 30, 52), fill=(40, 60, 140, 255)); d.line((30, 52, 34, 55), fill=(40, 60, 140, 255))   # Hollis's initials, scrawled
im.save(os.path.join(TEX, 'startupcard.png')); em_of(im, (13, 9, 51, 58)).save(os.path.join(TEX, 'startupcard.em.png'))

art = J('core', 'art.json')
for n in ('valvefeed', 'valvereturn', 'valvebypass', 'keycabinet', 'startupcard'):
    art['textures'][n] = {'file': f'textures/{n}.png', 'emissive': f'textures/{n}.em.png'}
W(art, 'core', 'art.json')

# ---------------- Deck 02 ----------------
d = J('deck-02', 'deck.json'); lv = J('deck-02', 'level.json'); lines = J('deck-02', 'lines.json')
leg = d['legend']
leg['walls'].update({
    'E': {'tex': 'valvefeed', 'use': 'valveFeed', 'light': [1, 0.35, 0.3], 'map': '#ff5a4a'},
    'R': {'tex': 'valvereturn', 'use': 'valveReturn', 'light': [0.35, 0.6, 1], 'map': '#4a8aff'},
    'Y': {'tex': 'valvebypass', 'use': 'valveBypass', 'light': [1, 0.8, 0.3], 'map': '#ffc84a'},
    'C': {'tex': 'startupcard', 'use': 'startupCard', 'light': [1, 0.9, 0.7], 'map': '#e8dcb0'}})
leg['doors']['8'] = 'cabinet'
d['locks']['cabinet'] = {'tex': 'keycabinet', 'needs': {'flag': 'pressureSet'}, 'denied': "KEY CABINET. STEAM-LOCKED. THE PRESSURE'S WRONG.", 'map': '#c0c8d0'}
d['locks']['office']['denied'] = "SUPER'S OFFICE. LOCKED."
d['state']['flags'].update({'arenaRed': False, 'officeTried': False, 'chartRead': False, 'pressureSet': False})
d['state']['counters'].update({'valveFeed': 1, 'valveReturn': 1, 'valveBypass': 1})

def setc(layer, x, y, ch):
    row = lv[layer][y]; lv[layer][y] = row[:x] + ch + row[x + 1:]
assert lv['obj'][60][46] == 'M' and lv['geo'][57][38] == '#' and lv['geo'][57][39] == '#'
setc('obj', 46, 60, ' ')                       # the key is no longer on the floor...
setc('geo', 38, 57, '.'); setc('obj', 38, 57, 'M')   # ...it hangs in an alcove in the west wall,
setc('geo', 39, 57, '8')                       # behind the steam-locked cabinet door
for x, ch in ((42, 'E'), (44, 'R'), (50, 'Y')):
    assert lv['geo'][62][x] == 'p'; setc('geo', x, 62, ch)   # the valves, on the office's south wall
assert lv['geo'][54][40] == 'p'; setc('geo', 40, 54, 'C')     # the startup card, on the laundry's south wall
z = next(z for z in lv['zones'] if z['id'] == 'office'); z['x1'] = min(z['x1'], 38)   # the alcove belongs to the office

# the office route: try the door, hear Moss, then the guide goes to the Chapel
for r in d['rules']:
    if r['on'] == {'event': 'doorDenied', 'lock': 'office'}:
        r['do'] = [{'set': 'officeTried', 'value': True}, {'say': 'moss_office', 'sub': 4.2},
                   {'objective': "The Super's Office is locked. Mensah kept his spare in the Chapel, north-east of the concourse."}]
    if r['on'] == {'event': 'pickup', 'item': 'keyC'}:
        for a in r['do']:
            if 'objective' in a: a['objective'] = "Back to the Super's Office, south of the Laundry and Recycling."
    if r['on'] == {'event': 'pickup', 'item': 'keyM'}:
        r['do'] = [a for a in r['do'] if 'objective' not in a] + [{'objective': "The Boiler Room is through the south door of the Super's Office."}]
VALVES = [('valveFeed', 'FEED'), ('valveReturn', 'RETURN'), ('valveBypass', 'BYPASS')]
PSI = ['LOW. THE GAUGE READS 40 PSI.', 'MID. THE GAUGE READS 90 PSI.', 'HIGH. THE GAUGE READS 140 PSI.']
eq = lambda c, n: {'counter': c, 'eq': n}
solved = {'all': [eq('valveFeed', 2), eq('valveReturn', 0), eq('valveBypass', 1)]}
allhot = {'all': [eq(c, 2) for c, _ in VALVES]}
new_rules = []
for c, label in VALVES:
    new_rules.append({'on': {'event': 'use', 'target': c}, 'do': [
        {'if': {'flag': 'pressureSet'},
         'then': [{'msg': "THE PRESSURE'S HOLDING. LEAVE IT."}],
         'else': [{'add': c, 'value': 1}, {'if': {'counter': c, 'gte': 3}, 'then': [{'add': c, 'value': -3}]}, {'sfx': 'clank'},
                  {'if': eq(c, 0), 'then': [{'msg': f'{label} VALVE: {PSI[0]}'}], 'else': [
                      {'if': eq(c, 1), 'then': [{'msg': f'{label} VALVE: {PSI[1]}'}], 'else': [{'msg': f'{label} VALVE: {PSI[2]}'}]}]},
                  {'if': allhot, 'then': [{'sfx': 'whoosh'}, {'shake': 0.5}, {'flash': 0.6, 'color': [1, 1, 1]},
                                          {'msg': 'ALL THREE RUNNING HOT. THE RELIEF VALVE BLOWS, AND EVERY GAUGE DROPS BACK TO 90.'},
                                          {'add': 'valveFeed', 'value': -1}, {'add': 'valveReturn', 'value': -1}, {'add': 'valveBypass', 'value': -1}]},
                  {'if': solved, 'then': [{'set': 'pressureSet', 'value': True}, {'sfx': 'powerup'}, {'shake': 0.2},
                                          {'msg': 'PRESSURE HOLDING. THE STEAM LOCK ON THE KEY CABINET RELEASES.'},
                                          {'objective': "Take the master key from the cabinet in the office's west wall."}, {'autosave': 'events'}]}]}]})
new_rules += [
    {'on': {'event': 'use', 'target': 'startupCard'}, 'do': [
        {'set': 'chartRead', 'value': True},
        {'msg': 'BOILER STARTUP, G. HOLLIS: FEED 140. RETURN 40. BYPASS 90. NEVER RUN ALL THREE HOT.'},
        {'if': {'not': {'flag': 'pressureSet'}}, 'then': [{'objective': "Set the three valves in the Super's Office to the startup card."}]}]},
    {'on': {'event': 'doorDenied', 'lock': 'cabinet'}, 'once': True, 'do': [
        {'if': {'not': {'flag': 'chartRead'}}, 'then': [{'objective': 'The key cabinet is steam-locked. The Super kept his boiler settings somewhere: try the Laundry.'}],
         'else': [{'objective': "Set the three valves on the office's south wall to the startup card."}]}]}]

# the Super, phase by phase (bossPhase: the phase that just began)
BUCK = {2: 'phase_buffer', 3: 'phase_armL', 4: 'phase_hoses', 5: 'phase_armR'}
HINT = {2: 'THE LIGHTS ARE GONE. TAKE HIS LEFT ARM WHEN HE SWINGS.', 3: 'HE VENTS STEAM THROUGH THE HOSES. CUT THEM WHILE HE HISSES.',
        4: 'THE HOSES ARE CUT. WATCH THE FLOOR. TAKE HIS RIGHT ARM WHEN HE SWINGS.', 5: 'THE TANK IS EXPOSED. HIT IT WHILE IT GLOWS.'}
for n in (2, 3, 4, 5):
    acts = ([{'set': 'lightsOut', 'value': True}, {'set': 'arenaRed', 'value': True}, {'sfx': 'clank'}] if n == 2 else [])
    acts += [{'say': BUCK[n], 'sub': 2.8}, {'after': 1.2, 'do': [{'msg': HINT[n]}]}, {'autosave': 'events'}]
    new_rules.append({'on': {'event': 'bossPhase'}, 'if': {'all': [{'field': 'enemy', 'eq': 'super'}, {'field': 'phase', 'eq': n}]}, 'do': acts})
for r in d['rules']:
    if r['on'].get('event') == 'kill' and 'super' in json.dumps(r.get('if')):
        r['do'] = [{'set': 'lightsOut', 'value': False}, {'set': 'arenaRed', 'value': False}] + r['do']
    if r['on'].get('event') == 'bossSight' and 'super' in json.dumps(r.get('if')):
        r['do'][0]['then'].append({'after': 3.4, 'do': [{'msg': "BAIT HIS CHARGE INTO A BOILER. HIT THE BUFFER WHILE HE'S STUNNED."}]})
d['rules'] += new_rules
d['solutions'] = [['valveFeed', 1], ['valveReturn', 2], ['valveBypass', 0]]   # tools only: from MID, MID, MID (every puzzle wall listed, even at 0 turns)

# the guide: office door first, then the Chapel, then the card and the valves
g = d['guide']; i = next(k for k, s in enumerate(g) if s.get('to') == {'item': 'keyC'})
g[i:i] = [{'until': {'any': [{'flag': 'officeTried'}, {'key': 'C'}]}, 'to': {'cell': [46, 53]}}]
i = next(k for k, s in enumerate(g) if s.get('to') == {'item': 'keyM'})
g[i:i] = [{'until': {'any': [{'flag': 'chartRead'}, {'flag': 'pressureSet'}]}, 'to': {'use': 'startupCard'}},
          {'until': {'flag': 'pressureSet'}, 'to': {'use': 'valveFeed'}}]

# new lines (MP3s baked by _src/voice/deck02_v16_vo.py)
NEW_LINES = [('phase_buffer', "That's gonna void the warranty.", None), ('phase_armL', "That's one arm. The lease says I take both.", None),
             ('phase_hoses', 'Shutting off your utilities.', None), ('phase_armR', 'Nothing left but the deposit.', None),
             ('moss_office', 'Hollis was always locking himself out. Mensah kept his spare in the Chapel.', 'moss')]
moss_example = next(l for l in lines['lines'] if l['id'] == 'moss_maint')
for lid, txt, spk in NEW_LINES:
    e = {'id': lid, 'text': txt, 'file': f'voice/{lid}.mp3'}
    if spk: e.update({k: v for k, v in moss_example.items() if k not in ('id', 'text', 'file')})
    lines['lines'].append(e)
    mp3 = os.path.join(VOICE, lid + '.mp3')
    dst = os.path.join(DST, 'deck-02', 'voice', lid + '.mp3')
    if os.path.exists(mp3): shutil.copy(mp3, dst)
    elif lid + '.mp3' in keep_voice: open(dst, 'wb').write(keep_voice[lid + '.mp3'])
    else: print('MISSING VOICE', lid)
W(d, 'deck-02', 'deck.json'); W(lv, 'deck-02', 'level.json'); W(lines, 'deck-02', 'lines.json')

# ---------------- manifests and catalog ----------------
cat = J('catalog.json'); cat['baseUrl'] = 'https://bigdoodr.github.io/hull-breaker/packs-1.6/'; W(cat, 'catalog.json')
rm = os.path.join(HERE, 'remanifest.py')
subprocess.run([sys.executable, rm, DST, 'core', '1.4.0', '1.6'], check=True)
subprocess.run([sys.executable, rm, DST, 'deck-02', '1.2.0', '1.6'], check=True)
