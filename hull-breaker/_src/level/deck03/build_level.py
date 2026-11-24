# Builds Deck 03 (Root Cause, Hydroponics and Life Support) as two ASCII layers plus zones,
# logs, asset names and door textures, in pack level.json form (format 1).
#   python3 build_level.py [out.json]
# Legend (meanings live in _src/pack/deck03.py):
#  walls  # hull  = hull2  h haz  b blood  s scrawl  v vent  w window  W window with moon  p pipe  T tram
#         g greenhouse glass  d dome glass  k seed racks  o tree trunk  Y the old tree (it grabs)  m cave rock
#         t terrace wall  r root wall  F floor-plan terminal  Q save  R Okafor's relay terminal  V scrubber valve
#         N atmosphere vent console  S "Do not feed after lights-out" sign  L departure lever
#  water  , shallow (wade)  ~ deep (swim, breath meter)   -- both are floor
#  doors  D open  X secret  5 spore growth (burn it: needs the Purge Torch)  6 Atmosphere Control (three scrubbers)
#         7 Root Chamber (air vented)  8 down line (Mother Root dead)
#  objects  @ start
#   enemies  lowercase = every difficulty, UPPERCASE = Normal and up, digits = Hard and up
#            h/H/6 husk  c/C/7 crawler  s/S/8 spitter  x/X/9 bloater  z/Z/5 brute  d/D dormant husk
#            r/R/4 lurker  y/Y/3 sleeper  g/G/2 rooter  W Mother Root (boss)
#   items    + med  * trauma kit  u revival kit  a cells  e shells  i rivets  o charge bombs  f fuel  & armor
#            T Purge Torch  q sample: rooter tissue  Q sample: mother pod core  l audio log  $ asset tag
#   decor    K crate  O barrel  t table  k corpse  p remains  P planter  N the singing plant
import json, sys
W, H = 96, 84
G = [['#'] * W for _ in range(H)]
O = [[' '] * W for _ in range(H)]
ZONES = []
FLOORS = ['deckplate', 'tile', 'grating', 'soil', 'carpet']


def room(zid, name, x1, y1, x2, y2, wall='#', floor=0, light=None, power=False, secret=False, dark=False):
    for y in range(y1 - 1, y2 + 2):
        for x in range(x1 - 1, x2 + 2):
            if x1 <= x <= x2 and y1 <= y <= y2: G[y][x] = '.'
            elif G[y][x] == '#': G[y][x] = wall
    z = dict(id=zid, name=name, x1=x1, y1=y1, x2=x2, y2=y2, floor=FLOORS[floor], power=power, secret=secret, dark=dark)
    if light: z['light'] = light
    ZONES.append(z)


def block(x1, y1, x2, y2, ch):
    for y in range(y1, y2 + 1):
        for x in range(x1, x2 + 1): G[y][x] = ch


def wall(x, y, ch):
    assert G[y][x] not in '.,~', ('wall on floor', x, y, ch)
    G[y][x] = ch


def put(s):
    for tok in s.split():
        ch, xy = tok[0], tok[1:]
        x, y = map(int, xy.split(','))
        assert G[y][x] in '.,~', ('object off floor', ch, x, y, G[y][x])
        assert O[y][x] == ' ', ('dup', ch, x, y, O[y][x])
        O[y][x] = ch


COOL, SICK, GREEN, AMBER, ROOT = [.72, .86, 1], [.7, 1, .78], [.62, 1, .55], [1, .8, .5], [1, .45, .4]
# ---------- rooms ----------
room('platform', 'TRAM PLATFORM G', 36, 3, 60, 9, 'h', 2, COOL)
room('greenhouse', 'GREENHOUSE LAB', 62, 3, 78, 12, 'g', 1, GREEN)
room('closet', 'PROPAGATION CLOSET', 80, 3, 86, 8, '=', 3, [.8, .5, 1], secret=True)       # the singing plant
room('seedbank', 'SEED BANK', 34, 11, 60, 28, '#', 1, AMBER)
room('vault', 'SEED VAULT', 34, 30, 36, 33, '=', 1, secret=True)
room('orchard', 'ORCHARD DOME', 6, 4, 32, 24, 'd', 3, GREEN)
room('loft', 'GRAIN LOFT', 82, 11, 92, 12, '=', 3, secret=True)
room('terraces', 'GRAIN TERRACES', 62, 14, 92, 36, 't', 3, AMBER)
room('cavepass', 'CAVE MOUTH', 14, 27, 32, 28, 'm', 3, SICK, dark=True)
room('caves', 'FUNGUS CAVES', 4, 30, 30, 56, 'm', 3, SICK, dark=True)
room('grotto', 'MUSHROOM GROTTO', 4, 58, 10, 61, 'm', 3, [.6, .4, 1], secret=True)
room('scrubber', 'SCRUBBER HALL', 38, 30, 56, 42, 'p', 2, SICK)
room('gallery', 'PIPE GALLERY', 58, 38, 64, 40, 'p', 2, SICK, dark=True)
room('waterrec', 'WATER RECLAMATION', 66, 39, 92, 62, 'p', 2, [.6, .85, 1])
room('crawl', 'PUMP CRAWLSPACE', 58, 43, 64, 50, '=', 2, secret=True)
room('atmos', 'ATMOSPHERE CONTROL', 40, 44, 54, 52, 'h', 0, [1, .5, .35])
room('root', 'THE ROOT CHAMBER', 34, 54, 62, 74, 'r', 3, ROOT, dark=True)
room('compost', 'COMPOST WORKS', 66, 64, 79, 74, 'p', 3, SICK)
room('downline', 'TRAM PLATFORM G // DOWN LINE', 82, 64, 93, 80, 'h', 2, COOL)

# ---------- obstacles ----------
block(37, 3, 59, 3, 'T')                                        # the up-line tram car Buck rode in on
block(65, 6, 70, 6, '='); block(72, 6, 76, 6, '=')              # greenhouse potting benches
block(65, 9, 69, 9, '=')                                        # greenhouse lab bench
for y in (14, 19, 24):                                          # seed bank racks
    block(37, y, 44, y, 'k'); block(50, y, 57, y, 'k')
block(46, 21, 50, 22, '=')                                      # seed registry kiosk
for x1, y1 in [(10, 8), (18, 7), (26, 9), (11, 17), (23, 18), (28, 14)]:
    block(x1, y1, x1 + 1, y1 + 1, 'o')                          # orchard trunks
block(16, 12, 18, 14, 'Y')                                      # the old tree in the middle of the dome
block(64, 20, 75, 20, 't'); block(79, 20, 92, 20, 't')          # terrace tiers (ramps at the gaps)
block(62, 26, 80, 26, 't'); block(84, 26, 92, 26, 't')
block(64, 31, 86, 31, 't')
for x1, y1 in [(8, 34), (20, 33), (12, 40), (24, 41), (6, 48), (17, 47), (26, 52), (12, 53)]:
    block(x1, y1, x1 + 1, y1 + 1, 'm')                          # cave pillars and giant mushroom stalks
for x1 in (41, 46, 51):
    block(x1, 33, x1 + 2, 36, 'p')                              # three scrubber units
block(43, 47, 51, 48, '=')                                      # atmosphere control consoles
block(68, 42, 78, 50, '~')                                      # reclamation tank 1 (deep; never stocked)
block(81, 42, 90, 50, ',')                                      # settling tank (shallow)
block(68, 54, 88, 58, ',')                                      # overflow channel
for x1, y1 in [(36, 56), (59, 56), (36, 71), (59, 71)]:
    block(x1, y1, x1 + 1, y1 + 1, 'r')                          # Mother Root's anchor roots (pillars)
for x1, y1 in [(68, 66), (73, 66), (68, 70), (73, 70)]:
    block(x1, y1, x1 + 2, y1 + 1, 'p')                          # compost digesters
block(83, 80, 92, 80, 'T')                                      # the down-line tram car

# ---------- doors ----------
for (x, y, c) in [(48, 10, 'D'), (61, 6, 'D'), (79, 5, 'X'), (35, 29, 'X'), (33, 16, '5'), (88, 13, 'X'),
                  (61, 20, '5'), (33, 27, '5'), (18, 29, 'D'), (7, 57, 'X'), (47, 29, 'D'), (57, 39, 'D'),
                  (65, 39, 'D'), (65, 46, 'X'), (47, 43, '6'), (47, 53, '7'), (72, 63, '5'), (88, 63, '8')]:
    G[y][x] = c

# ---------- special walls ----------
for x in range(37, 60):
    if G[2][x] == 'h': wall(x, 2, 'w')
wall(48, 2, 'W')                                                # one window with Ruin in it
wall(48, 21, 'F')                                               # floor-plan terminal on the seed registry kiosk
wall(79, 10, 'R')                                               # Okafor's relay terminal, Greenhouse Lab east wall
wall(46, 22, 'S'); wall(62, 2, 'S')                             # DO NOT FEED AFTER LIGHTS-OUT
wall(5, 14, 'V'); wall(3, 44, 'V'); wall(93, 25, 'V')           # scrubber valves: orchard, caves, terraces
wall(39, 48, 'N')                                               # atmosphere vent console
for (x, y) in [(35, 6), (20, 3), (37, 36), (31, 40), (75, 37), (93, 45), (55, 48), (80, 70)]: wall(x, y, 'Q')
wall(94, 72, 'L')                                               # departure lever behind glass
VENTS = [(36, 10), (60, 10), (63, 2), (33, 13), (5, 20), (25, 3), (61, 30), (93, 17), (78, 37), (3, 36), (31, 50),
         (17, 57), (37, 40), (57, 32), (93, 55), (77, 63), (39, 45), (33, 60), (63, 66), (52, 75), (65, 72), (81, 76)]
for (x, y) in VENTS:
    assert G[y][x] not in '.,~DX5678QFRVNSLW', ('vent on bad cell', x, y, G[y][x]); wall(x, y, 'v')
for (x, y, c) in [(33, 25, 's'), (61, 24, 'b'), (31, 34, 's'), (3, 52, 'b'), (57, 41, 's'), (65, 58, 'b'), (79, 41, 's'),
                  (33, 66, 'b'), (63, 61, 's'), (65, 69, 's'), (81, 68, 'b')]:
    if G[y][x] not in '.,~DX5678QFRVNSLvW': wall(x, y, c)

# ---------- objects ----------
put('@48,7 h42,5 c54,6 k40,8 K58,5 K58,6 $59,9 +37,9 a44,5 l38,4')                                         # platform
put('T70,11 l64,4 f76,11 f77,11 g74,4 G66,11 k72,8 P65,5 P76,5 $78,3 +63,11')                              # greenhouse lab
put('N83,5 $86,3 f80,8')                                                                                   # propagation closet
put('h36,12 H58,12 c40,16 C54,17 r42,13 R53,13 y38,22 Y56,22 h45,26 652,26 s58,27 k36,27 p51,16 '
    'l48,23 l40,17 $34,11 $60,28 $43,12 e35,20 +59,16 a49,27 O35,26 i59,20')                                 # seed bank
put('$35,31 &34,33 o36,32 f35,33')                                                                         # seed vault
put('g9,6 G21,10 g14,21 G26,6 h30,20 H8,23 s25,22 c20,16 C29,11 x13,10 X24,13 r7,12 230,6 715,5 '
    'l22,21 l8,19 $6,4 $32,24 $20,22 f12,5 f31,15 +7,23 e27,22 P9,15 P30,23 k19,19')                         # orchard dome
put('$83,11 *92,12 f88,11')                                                                                # grain loft
put('h66,16 H90,16 s70,18 S86,18 s88,23 S67,23 c76,24 C90,28 g70,28 G82,29 x78,33 X66,34 h89,34 874,16 380,35 '
    'y64,29 Y86,33 l91,15 $62,14 $92,36 $77,22 e72,35 f84,34 +63,35 a90,22 i79,28 k71,29 K92,24')            # grain terraces
put('h20,27 c27,28 $14,27')                                                                                # cave mouth
put('g6,32 G16,32 g27,32 r9,38 R22,38 y5,44 Y15,44 g28,44 G10,46 h19,50 H27,48 y8,52 324,55 c18,36 C28,37 '
    'r16,55 46,55 q22,45 l14,37 l25,50 l5,54 $4,30 $30,56 $16,42 f20,40 f9,56 +29,30 *4,40 e10,50 k21,45 p11,33 d26,35 D6,41')  # fungus caves
put('$5,58 &10,61 u7,60 o9,59')                                                                            # mushroom grotto
put('h40,31 H55,31 c44,38 C50,41 s39,41 x54,38 g47,39 G41,32 752,31 l55,40 $38,30 $56,42 f40,39 +56,34 e49,31')  # scrubber hall
put('c60,39 i63,40')                                                                                      # pipe gallery
put('$64,43 &58,50 *61,47 f60,44')                                                                         # pump crawlspace
put('h70,40 H88,40 s91,44 S67,52 c79,52 C86,60 x74,60 X90,52 g67,45 G80,46 r72,52 R84,51 y91,61 Y70,61 992,40 '
    'l80,53 $66,39 $92,62 $79,40 f67,60 f91,57 +92,48 a75,52 e86,61 i66,56 O91,39 k84,52')                  # water reclamation
put('l45,46 h41,51 H53,51 s41,45 654,45 $54,52 f42,52 +52,45 t47,49')                                     # atmosphere control
put('W48,66 $35,74 $62,54 f34,62 f62,62 f40,58 f56,58 f40,70 f56,70 f48,73 +38,66 +58,66 *34,54 e62,74')   # engine 1.7 retune: more fuel in the arena                                                    # the root chamber
put('Q76,72 g67,65 G78,65 x71,68 X78,72 h67,73 272,73 s77,68 $66,74 $79,64 f70,65 +67,69 k75,69')        # compost works
put('h84,66 H92,66 c86,70 Z88,74 585,77 $82,64 $93,79 f83,72 e92,72 +92,79')                              # down-line platform

# ---------- logs (placement order = cell order) and asset names ----------
LOGS = {(38, 4): 'marquez_platform', (64, 4): 'okafor_protocol', (48, 23): 'sable_yield', (40, 17): 'marquez_seeds',
        (22, 21): 'agro_a_harvest', (8, 19): 'marquez_orchard', (91, 15): 'agro_a_regrowth', (14, 37): 'agro_b_hiding',
        (25, 50): 'agro_b_light', (5, 54): 'marquez_rooted', (55, 40): 'tech_scrubbers', (45, 46): 'tech_orders',
        (80, 53): 'marquez_irrigation'}
ASSETS = {(59, 9): 'Tram platform clock', (78, 3): 'Grow-lamp array', (86, 3): 'Specimen bell jar',
          (34, 11): 'Seed catalog terminal', (60, 28): 'Seed bank cold door', (43, 12): 'Germination tray rack',
          (35, 31): 'Heirloom seed canisters', (6, 4): 'Orchard sprinkler head', (32, 24): 'Fruit picker drone',
          (20, 22): 'Pollinator hive box', (83, 11): 'Grain auger motor', (62, 14): 'Terrace irrigation pump',
          (92, 36): 'Harvester tines', (77, 22): 'Grain silo gauge', (14, 27): 'Cave survey lamp',
          (4, 30): 'Mycelium culture rack', (30, 56): 'Spore sampler', (16, 42): 'Humidity regulator',
          (5, 58): 'Grotto spawn crates', (38, 30): 'Scrubber filter cartridge', (56, 42): 'Air quality monitor',
          (64, 43): 'Backup pump', (66, 39): 'Reclamation flow meter', (92, 62): 'UV sterilizer bank',
          (79, 40): 'Tank inspection hatch', (54, 52): 'Atmosphere mixing valve', (35, 74): 'Root-bound irrigation main',
          (62, 54): 'Nutrient injector', (66, 74): 'Compost turner', (79, 64): 'Methane flare stack',
          (82, 64): 'Down-line ticket kiosk', (93, 79): 'Tram coupling'}
SECRET_TEX = {'#': 'crack_hull', '=': 'crack_hull2', 'g': 'crack_glass', 'k': 'crack_rack', 'm': 'crack_cave',
              't': 'crack_terrace', 'p': 'crack_pipe', 'h': 'crack_haz', 'd': 'crack_glass'}


def zone_at(x, y):
    """The zone a cell belongs to; later zones sit on top of earlier ones, as in the game."""
    return next((z['id'] for z in ZONES[::-1] if z['x1'] <= x <= z['x2'] and z['y1'] <= y <= z['y2']), None)


def main(out):
    logs, assets, doors = [], [], []
    for y in range(H):
        for x in range(W):
            if O[y][x] == 'l': logs.append(dict(x=x, y=y, log=LOGS[(x, y)]))
            if O[y][x] == '$': assets.append(dict(x=x, y=y, name=ASSETS[(x, y)]))
            if G[y][x] == 'X':   # a secret door wears a cracked copy of the wall beside it
                side = next(G[y + dy][x + dx] for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)) if G[y + dy][x + dx] not in '.X,~')
                doors.append(dict(x=x, y=y, tex=SECRET_TEX.get(side, 'crack_hull')))
    assert len(logs) == len(LOGS) and len(assets) == len(ASSETS), (len(logs), len(LOGS), len(assets), len(ASSETS))
    level = dict(w=W, h=H, geo=[''.join(r) for r in G], obj=[''.join(r) for r in O], zones=ZONES, logs=logs, assets=assets, doors=doors)
    json.dump(level, open(out, 'w'))
    print('built', out, f'{len(ZONES)} zones, {len(logs)} logs, {len(assets)} asset tags, {len(doors)} secret doors')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'level.json')
