# Builds Deck 02 (Hostile Tenancy, the Habitation Spine) as two ASCII layers plus zones,
# logs, asset names and door textures, in pack level.json form (format 1).
#   python3 build_level.py [out.json]
# Legend (meanings live in _src/pack/deck02.py):
#  walls  # hull  = hull2  h haz  b blood  s scrawl  v vent  w window  W window with moon  p pipe  T tram
#         k shelf  q apartment  c chapel  y daycare  m theater  o movie poster (usable)  U washer  ~ pool water  g gym  l pool tile
#         G Gorgon's weld over the old service hall (usable)  F floor-plan terminal  Q save  A intercom (Block A)  B intercom (Block B)  J junction box  V flush valve  L departure lever
#  water  , shallow (wade)  ~ deep (swim, breath meter)   -- both are floor
#  doors  D open  X secret  1 Block A bulkhead  2 Block B bulkhead  3 maintenance (both junctions)
#         4 Boiler Room (master key)  5 flooded (drain Block B)
#  objects  @ start
#   enemies  lowercase = every difficulty, UPPERCASE = Normal and up, digits = Hard and up
#            h/H/6 husk  c/C/7 crawler  s/S/8 spitter  x/X/9 bloater  z/Z/5 brute  d/D dormant husk
#            r/R/4 lurker  y/Y/3 sleeper  W the Super (boss)
#   items    + med  * trauma kit  a cells  e shells  i rivets  o charge bombs  & armor
#            b stomp boots  M master key  l audio log  $ asset tag
#   decor    K crate  O barrel  t table  k corpse  p remains  n bunk  P pew/seat  T beer tap
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


WARM, COOL, SICK, CANDLE = [1, .86, .66], [.72, .86, 1], [.7, 1, .78], [1, .72, .45]
# ---------- rooms ----------
room('platform', 'TRAM PLATFORM H', 36, 3, 60, 9, 'h', 2, COOL)
room('concourse', 'ARRIVALS CONCOURSE', 30, 11, 66, 29, '#', 1, WARM)
room('commissary', 'THE COMMISSARY', 12, 3, 28, 14, '#', 1, WARM)
room('leasing', 'LEASING OFFICE', 30, 4, 33, 9, '#', 4, WARM)       # Sable's desk, and the building's own floor plan
room('pub', 'PUB BACK ROOM', 14, 16, 18, 18, '=', 0, secret=True)
room('chapel', 'CHAPEL', 68, 3, 84, 14, 'c', 4, CANDLE, dark=True)
room('blockA', 'FAMILY HOUSING BLOCK A', 12, 23, 28, 25, 'q', 4, WARM)
room('blockA2', 'FAMILY HOUSING BLOCK A', 12, 26, 14, 60, 'q', 4, WARM, dark=True)
room('aptA3', 'APARTMENT A-3', 2, 27, 10, 34, 'q', 4, WARM)
room('aptA7', 'APARTMENT A-7', 2, 36, 10, 43, 'q', 4, WARM, dark=True)
room('aptA12', 'APARTMENT A-12', 2, 46, 10, 54, 'q', 4, WARM)
room('daycare', 'DAYCARE', 16, 28, 28, 40, 'y', 4, [1, .93, .8])
room('theater', 'HOLO-THEATER', 16, 43, 30, 56, 'm', 4, [.85, .6, 1], dark=True)
room('booth', 'PROJECTION BOOTH', 20, 58, 24, 60, '=', 0, secret=True)
room('blockB', 'FAMILY HOUSING BLOCK B', 68, 23, 84, 25, 'q', 4, WARM)
room('blockB2', 'FAMILY HOUSING BLOCK B', 82, 26, 84, 59, 'q', 4, WARM, dark=True)
room('aptB2', 'APARTMENT B-2', 86, 27, 94, 34, 'q', 4, WARM)
room('aptB9', 'APARTMENT B-9', 86, 37, 94, 45, 'q', 4, WARM, dark=True)
room('gym', 'REC CENTER', 68, 28, 80, 38, 'g', 0, COOL)
room('pool', 'REC CENTER POOL', 68, 41, 80, 55, 'l', 1, [.6, .9, 1], dark=True)
room('underpool', 'UNDER THE POOL', 72, 57, 76, 59, '=', 2, secret=True)
room('maint', 'MAINTENANCE CORRIDOR', 44, 31, 48, 40, 'p', 2, SICK, dark=True)
room('laundry', 'LAUNDRY AND RECYCLING', 34, 42, 58, 53, 'p', 1, SICK)
room('chute', 'LAUNDRY CHUTE', 60, 44, 64, 46, '=', 2, secret=True)
room('office', "SUPER'S OFFICE", 40, 55, 52, 61, '#', 0, WARM)
room('closet', "SUPER'S CLOSET", 54, 57, 57, 59, '=', 0, secret=True)
room('boiler', 'BOILER ROOM', 30, 63, 58, 76, 'p', 2, [1, .55, .35])
room('lower', 'BLOCK B LOWER LEVEL', 60, 61, 92, 70, 'q', 2, [.6, .8, .9], dark=True)
room('downline', 'TRAM PLATFORM H // DOWN LINE', 60, 72, 92, 82, 'h', 2, COOL)

# ---------- obstacles ----------
block(37, 3, 59, 3, 'T')                                        # the up-line tram car Buck rode in on
for x, y in [(36, 15), (59, 15), (36, 25), (59, 25)]: block(x, y, x + 1, y + 1, '#')   # concourse pillars
block(46, 19, 50, 21, '=')                                      # concourse info kiosk
block(14, 6, 20, 6, 'k'); block(23, 6, 27, 6, 'k')              # commissary shelves (the shoe shop is the north aisle)
block(14, 10, 19, 10, 'k')                                      # pub counter (bottles behind the bar)
block(75, 3, 77, 3, '=')                                        # chapel altar
block(70, 30, 72, 31, '='); block(76, 30, 78, 31, '=')          # gym machines
block(71, 44, 77, 47, ',')                                      # the pool: shallow end (wade)
block(71, 48, 77, 55, '~')                                      # deep end (swim; the drain panel to UNDER THE POOL is down here)
block(37, 44, 55, 44, 'U'); block(37, 49, 55, 49, 'U')          # rows of washers
for x1, y1 in [(34, 66), (51, 66), (34, 71), (51, 71)]: block(x1, y1, x1 + 3, y1 + 3, 'p')   # boilers
block(61, 81, 91, 82, 'T')                                      # the down-line tram car
for x1, y1, x2, y2 in [(63, 63, 67, 66), (75, 61, 81, 63), (85, 66, 90, 69), (70, 68, 73, 70)]:
    block(x1, y1, x2, y2, ',')                                  # what the drain left behind in Block B's lower level

# ---------- doors ----------
for (x, y, c) in [(48, 10, 'D'), (29, 12, 'D'), (32, 10, 'D'), (16, 15, 'X'), (67, 12, 'D'),
                  (29, 24, '1'), (11, 30, 'D'), (11, 40, 'D'), (11, 50, 'D'), (15, 34, 'D'), (15, 50, 'D'), (22, 57, 'X'),
                  (67, 24, '2'), (85, 30, 'D'), (85, 41, 'D'), (81, 33, 'D'), (81, 48, 'D'), (74, 56, 'X'),
                  (46, 30, '3'), (46, 41, 'D'), (59, 45, 'X'), (46, 54, 'D'), (53, 58, 'X'),
                  (46, 62, '4'), (83, 60, '5'), (59, 68, '5'), (80, 71, 'D')]:
    G[y][x] = c

# ---------- special walls ----------
for x in range(37, 60):
    if G[2][x] == 'h': wall(x, 2, 'w')
wall(48, 2, 'W')                                                 # one window with Ruin in it
for x in range(17, 31, 3): wall(x, 42, 'o')                      # theater posters along the north wall (wall row y42)
for (x, y) in [(35, 7), (67, 17), (11, 44), (85, 36), (35, 41), (39, 58), (93, 76)]: wall(x, y, 'Q')
wall(66, 30, 'G')                                                 # the service hall Gorgon welded shut (still on Gorgon's plan)
wall(32, 3, 'F')                                                  # floor-plan terminal (the real layout)
wall(29, 21, 'A'); wall(67, 21, 'B')                              # Moss's intercoms by each bulkhead
wall(11, 57, 'J'); wall(85, 57, 'J')                              # lockdown junction boxes, one per wing
wall(44, 77, 'V')                                                 # the Boiler Room flush valve
wall(93, 79, 'L')                                                 # departure lever behind glass
VENTS = [(35, 4), (40, 10), (66, 10), (29, 16), (67, 27), (40, 30), (55, 30), (20, 2), (85, 8), (11, 26), (15, 42), (11, 59),
         (29, 34), (31, 52), (86, 26), (81, 40), (85, 52), (67, 33), (67, 48), (43, 35), (52, 41), (59, 50), (53, 56),
         (29, 66), (29, 74), (40, 77), (93, 65), (65, 60), (59, 78), (70, 71)]
for (x, y) in VENTS:
    assert G[y][x] not in '.DX12345QAJBVLW', ('vent on bad cell', x, y, G[y][x]); wall(x, y, 'v')
for (x, y, c) in [(28, 22, 's'), (13, 22, 'b'), (1, 31, 's'), (11, 37, 'b'), (15, 38, 's'), (83, 22, 's'), (81, 43, 'b'),
                  (87, 26, 's'), (95, 40, 'b'), (33, 41, 's'), (59, 52, 'b'), (39, 62, 's'), (59, 74, 'b'), (61, 60, 's'),
                  (86, 71, 'b'), (31, 30, 's'), (65, 30, 'b'), (69, 15, 's'), (7, 26, 'b')]:
    if G[y][x] not in '.DX12345QAJBVLvW': wall(x, y, c)

# ---------- objects ----------
put('@48,7 h42,5 h52,5 d55,8 k40,8 K58,5 K58,6 l38,5 $59,9 +37,9 a44,5')                                  # platform
put('h33,13 h63,13 c40,22 H55,22 H44,27 S62,27 633,27 k42,14 p52,26 O31,28 O65,12 +31,12 e64,28 '
    't40,13 t56,13 $61,14 $34,20')                                                                          # concourse
put('l31,5 t32,6 k33,8')                                                                                    # leasing office
put('b17,4 T20,10 h25,9 c13,13 x26,12 H22,4 827,4 l13,8 $28,3 e24,13 +12,4 a20,13 t23,9')                  # commissary
put('$16,17 *14,16 o18,18')                                                                                 # pub back room
put('P70,6 P73,6 P79,6 P82,6 P70,9 P73,9 P79,9 P82,9 l76,5 $84,3 d72,12 D80,12 s84,13 +68,3 e68,14 k76,12 $69,13')  # chapel
put('h24,24 H18,25 r20,23 C27,23 y13,32 Y13,38 r13,42 y13,47 c13,52 413,55 313,58 k14,36 k12,45 $12,59 +14,27 a12,40')                                                                         # Block A halls
put('n3,28 n9,28 t6,31 l5,33 y8,30 $2,34 e9,33')                                                            # A-3
put('l3,37 r6,39 Y9,42 +2,43 n3,42 $10,36')                                                                 # A-7
put('h5,48 y8,52 D3,53 $10,46 i2,46 t6,50')                                                                 # A-12
put('l22,30 $28,40 p18,33 p26,37 +16,40')                                                                   # daycare (empty and quiet)
put('P19,47 P22,47 P25,47 P28,47 P19,50 P22,50 P25,50 P28,50 P19,53 P22,53 P25,53 P28,53 '
    'l29,44 h18,44 H28,55 r24,45 s17,55 x23,48 Y26,51 $16,56 e30,49 720,55 $30,43')                        # holo-theater
put('$22,59 *24,60 a20,58')                                                                                 # projection booth
put('h72,24 H78,25 r70,23 476,23 y83,28 r83,35 c83,40 y82,44 Y84,50 R83,53 382,57 s84,58 k83,46 $84,59 +68,25 e82,38')  # Block B halls
put('l93,28 y88,33 n94,34 $94,27 a90,30')                                                                   # B-2
put('l92,44 h88,39 S93,40 D90,44 *94,45 i86,45 $86,38')                                                     # B-9
put('h70,35 z75,34 C79,37 669,29 &68,38 e74,37 $80,28 k73,36')                                              # gym
put('l68,42 x70,54 X79,42 s69,48 y79,52 r74,42 978,54 +80,55 $68,55 k79,46 y73,51 Y76,54')                               # pool
put('$74,58 &72,59 o76,57 y75,59')                                                                          # under the pool
put('h46,33 c45,38 747,36 +48,31 a44,40 $44,31')                                                            # maintenance corridor
put('l57,52 h36,47 H50,47 y42,51 Y52,51 x46,46 S56,43 640,52 c35,52 $34,53 e58,47 +34,46 i45,52')          # laundry
put('$62,45 *64,44 e60,46')                                                                                 # laundry chute
put('t46,58 l41,56 l51,56 M46,60 y50,60 R42,60 a52,61 +40,61 $52,55')                                       # super's office
put('$56,58 &54,59 o57,57 e55,57')                                                                          # super's closet
put('W46,70 l46,75 $31,76 +31,64 *58,76 e44,64 a48,64 O40,65 O52,75')                                       # boiler room
put('h64,63 H70,66 y75,68 Y86,64 x80,63 S90,69 r68,62 484,68 962,69 $92,61 +61,61 e91,70 k72,64 p88,62')   # Block B lower level
put('z70,76 Z85,76 577,78 h64,79 H90,74 c75,74 +92,72 *60,80 e66,73 a88,80 $61,72 $91,80')                  # down-line platform

# ---------- logs (placement order = cell order) and asset names ----------
LOGS = {(38, 5): 'oduya_platform', (31, 5): 'sable_attrition', (13, 8): 'delacroix_commissary', (76, 5): 'chaplain',
        (5, 33): 'mother_a3', (3, 37): 'mother_a7', (22, 30): 'daycare', (29, 44): 'projectionist',
        (93, 28): 'resident_b2', (92, 44): 'resident_b9', (68, 42): 'lifeguard', (57, 52): 'oduya_laundry',
        (41, 56): 'super_hollis', (51, 56): 'sable_sealed', (46, 75): 'delacroix_boiler'}
ASSETS = {(59, 9): 'Tram platform clock', (61, 14): 'Concourse arrivals board', (34, 20): 'Welcome-aboard mural panel',
          (28, 3): 'Commissary cash register', (16, 17): 'Back-room dartboard', (84, 3): 'Chapel organ pipes',
          (69, 13): 'Brass collection plate', (12, 59): 'Block A mailbox bank', (2, 34): 'Family holo-frame',
          (10, 36): 'Apartment kitchenette', (10, 46): 'Window planter box', (28, 40): 'Daycare nap mats',
          (16, 56): 'Holo-theater projector lens', (30, 43): 'Concession popcorn machine', (22, 59): 'Film reel archive',
          (84, 59): 'Block B pressure door', (94, 27): 'Recliner, barely used', (86, 38): 'Wall-mounted aquarium',
          (80, 28): 'Rowing machine', (68, 55): 'Lifeguard chair', (74, 58): 'Pool filter pump',
          (44, 31): 'Maintenance tool cart', (34, 53): 'Industrial dryer', (62, 45): 'Chute compactor',
          (52, 55): "Super's key cabinet", (56, 58): 'Floor buffer (spare)', (31, 76): 'Boiler pressure gauge',
          (92, 61): 'Sump pump', (61, 72): 'Down-line ticket kiosk', (91, 80): 'Tram coupling'}
SECRET_TEX = {'#': 'crack_hull', '=': 'crack_hull2', 'q': 'crack_apartment', 'm': 'crack_theater', 'p': 'crack_pipe',
              'l': 'crack_pooltile', 'k': 'crack_shelf', 'c': 'crack_chapel', 'y': 'crack_daycare', 'g': 'crack_gym', 'h': 'crack_haz'}


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
                side = next(G[y + dy][x + dx] for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)) if G[y + dy][x + dx] not in '.X')
                doors.append(dict(x=x, y=y, tex=SECRET_TEX.get(side, 'crack_hull')))
    assert len(logs) == len(LOGS) and len(assets) == len(ASSETS), (len(logs), len(LOGS), len(assets), len(ASSETS))
    level = dict(w=W, h=H, geo=[''.join(r) for r in G], obj=[''.join(r) for r in O], zones=ZONES, logs=logs, assets=assets, doors=doors)
    json.dump(level, open(out, 'w'))
    print('built', out, f'{len(ZONES)} zones, {len(logs)} logs, {len(assets)} asset tags, {len(doors)} secret doors')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'level.json')
