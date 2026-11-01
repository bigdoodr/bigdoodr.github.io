"""Draw a review map of a deck pack: python3 render_map.py <pack_dir> <out.png>"""
import json, sys
from PIL import Image, ImageDraw, ImageFont
P = sys.argv[1]; L = json.load(open(P + '/level.json')); D = json.load(open(P + '/deck.json'))
W, H, G, O = L['w'], L['h'], L['geo'], L['obj']; S = 12; PAD = 40; LEG = 250
im = Image.new('RGB', (W * S + LEG, H * S + PAD), (8, 10, 14)); d = ImageDraw.Draw(im)
B = '/usr/share/fonts/truetype/dejavu/DejaVuSans'
f, f2, f3 = ImageFont.truetype(B + '-Bold.ttf', 11), ImageFont.truetype(B + '-Bold.ttf', 16), ImageFont.truetype(B + '.ttf', 12)
locks = D['locks']; doors = D['legend']['doors']; walls = D['legend']['walls']
hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
for z in L['zones']:
    for y in range(z['y1'], z['y2'] + 1):
        for x in range(z['x1'], z['x2'] + 1):
            if G[y][x] in D['legend'].get('floors', {}):
                deep = D['legend']['floors'][G[y][x]].get('water') == 'swim'
                d.rectangle([x * S, PAD + y * S, x * S + S - 1, PAD + y * S + S - 1], fill=(28, 84, 140) if deep else (60, 130, 175))
            elif G[y][x] == '.': d.rectangle([x * S, PAD + y * S, x * S + S - 1, PAD + y * S + S - 1], fill=(30, 24, 40) if z['secret'] else (34, 40, 48))
for y in range(H):
    for x in range(W):
        c = G[y][x]; X, Y = x * S, PAD + y * S
        if c in doors:
            lk = locks[doors[c]]; col = (255, 0, 255) if lk.get('secret') else hexc(lk['map']) if 'map' in lk else (200, 200, 200)
            d.rectangle([X, Y, X + S - 1, Y + S - 1], fill=col)
        elif c in walls and (walls[c].get('map') or walls[c].get('role') == 'vent'):
            d.rectangle([X, Y, X + S - 1, Y + S - 1], fill=hexc(walls[c]['map']) if 'map' in walls[c] else (110, 110, 40))
        elif c != '.' and c not in D['legend'].get('floors', {}) and any(0 <= x + dx < W and 0 <= y + dy < H and G[y + dy][x + dx] == '.' for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
            d.rectangle([X, Y, X + S - 1, Y + S - 1], fill=(78, 86, 98))
        o = O[y][x]
        if o == ' ': continue
        leg = D['legend']['objects'][o]
        if 'enemy' in leg:
            col = {0: (255, 70, 70), 2: (255, 150, 60), 3: (200, 60, 200)}[leg['min']]
            if leg['enemy'] == 'super': d.ellipse([X - 6, Y - 6, X + S + 5, Y + S + 5], fill=(255, 30, 30), outline=(255, 255, 255))
            elif leg['enemy'] == 'lurker': d.polygon([(X + S // 2, Y + 1), (X + S - 2, Y + S - 2), (X + 1, Y + S - 2)], fill=col)
            elif leg['enemy'] == 'sleeper': d.rectangle([X + 1, Y + 4, X + S - 2, Y + S - 4], fill=col)
            else: d.ellipse([X + 2, Y + 2, X + S - 3, Y + S - 3], fill=col)
        elif 'start' in leg: d.ellipse([X, Y, X + S - 1, Y + S - 1], fill=(90, 255, 90))
        elif leg.get('item') == 'log': d.rectangle([X + 2, Y + 2, X + S - 3, Y + S - 3], fill=(0, 200, 255))
        elif leg.get('item') == 'asset': d.polygon([(X + S // 2, Y + 1), (X + S - 2, Y + S // 2), (X + S // 2, Y + S - 2), (X + 1, Y + S // 2)], fill=(255, 210, 0))
        elif leg.get('item') in ('boots', 'keyM'): d.rectangle([X, Y, X + S - 1, Y + S - 1], fill=(255, 255, 255)); d.text((X + 2, Y - 1), o, fill=(0, 0, 0), font=f)
        elif 'item' in leg: d.ellipse([X + 4, Y + 4, X + S - 5, Y + S - 5], fill=(140, 230, 140))
        else: d.ellipse([X + 4, Y + 4, X + S - 5, Y + S - 5], fill=(110, 110, 120))
seen = set()
for z in L['zones']:
    if z['name'] in seen and not z['secret']: continue
    seen.add(z['name']); t = z['name'].split(' // ')[-1]
    w = d.textlength(t, font=f)
    if w > (z['x2'] - z['x1'] + 1) * S: t = t.replace(' AND ', ' & ').replace('FAMILY HOUSING ', ''); w = d.textlength(t, font=f)
    d.text(((z['x1'] + z['x2'] + 1) * S / 2 - w / 2, PAD + z['y1'] * S + 3), t, fill=(200, 120, 255) if z['secret'] else (150, 255, 210), font=f)
d.text((8, 10), f"DECK {D['deck']:02d} — {D['title'].upper()}  ·  {D['place']}", fill=(255, 182, 39), font=f2)
lx, ly = W * S + 14, PAD + 4
key = [('Door (open)', (200, 200, 200), 'r'), ('Secret panel', (255, 0, 255), 'r')]
key += [(lk.get('denied', k).split('.')[0].title()[:30], hexc(l['map']), 'r') for k, l in locks.items() for lk in [l] if 'map' in l]
key += [(n.title(), hexc(c), 'r') for n, c in D.get('mapLegend', []) if n != 'WATER'] + [('Shallow water (wade)', (60, 130, 175), 'r'), ('Deep water (swim)', (28, 84, 140), 'r')] + [('Vent', (110, 110, 40), 'r')]
key += [('', None, ''), ('Enemy, all difficulties', (255, 70, 70), 'o'), ('Enemy, Normal+', (255, 150, 60), 'o'), ('Enemy, Hard+', (200, 60, 200), 'o'),
        ('  ▲ lurker  ▬ sleeper  ● other', (220, 220, 220), ''), ('Boss', (255, 30, 30), 'o'), ('', None, ''), ('Start', (90, 255, 90), 'o'),
        (f"Audio log ({len(L['logs'])})", (0, 200, 255), 'r'), (f"Asset tag ({len(L['assets'])})", (255, 210, 0), 'd'), ('b boots · M master key', (255, 255, 255), ''), ('Pickup', (140, 230, 140), 'o')]
for t, c, k in key:
    if c and k == 'r': d.rectangle([lx, ly + 2, lx + 11, ly + 13], fill=c)
    if c and k == 'o': d.ellipse([lx, ly + 2, lx + 11, ly + 13], fill=c)
    if c and k == 'd': d.polygon([(lx + 6, ly + 1), (lx + 12, ly + 7), (lx + 6, ly + 13), (lx, ly + 7)], fill=c)
    d.text((lx + (18 if k else 0), ly), t, fill=(220, 226, 232) if k else (c or (0, 0, 0)), font=f3); ly += 19
im.save(sys.argv[2]); print('wrote', sys.argv[2], im.size)
