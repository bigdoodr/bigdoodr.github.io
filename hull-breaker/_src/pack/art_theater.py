"""Draws Deck 02's Holo-Theater art into packs-1.3/core/textures: five original B-movie posters
(poster, poster2..poster5) and the screen tiles (screenL, screenM, screenC, screenR), each with a .em.png glow map.
   python3 art_theater.py [core_dir]
Titles and art are original, in the deck's affectionate-pun style. No real films, logos or characters."""
import os, random, sys
from PIL import Image, ImageDraw

CORE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'packs-1.3', 'core')
TEX = os.path.join(CORE, 'textures')
F = {  # 3x5 pixel font, rows top to bottom
 'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110', 'E': '111100110100111',
 'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101', 'I': '111010010010111', 'K': '101101110101101',
 'L': '100100100100111', 'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010', 'U': '101101101101111', 'V': '101101101101010',
 'Y': '101101010010010', '9': '111101111001111', '-': '000000111000000', ' ': '0' * 15}

def text(d, s, cx, y, col, k=1):
    w = (4 * len(s) - 1) * k; x = cx - w // 2
    for ch in s:
        for i, b in enumerate(F[ch]):
            if b == '1': d.rectangle((x + (i % 3) * k, y + (i // 3) * k, x + (i % 3) * k + k - 1, y + (i // 3) * k + k - 1), fill=col)
        x += 4 * k

base = Image.open(os.path.join(TEX, 'theater.png')).convert('RGBA')

def poster(name, frame, bg, title, tcol, art):
    im = base.copy(); d = ImageDraw.Draw(im)
    d.rectangle((10, 4, 53, 59), fill=frame + (255,))
    d.rectangle((12, 6, 51, 57), fill=bg + (255,))
    art(d)
    d.rectangle((12, 34, 51, 57), fill=(22, 12, 16, 255))
    for i, line in enumerate(title): text(d, line, 32, 37 + 6 * i, tcol)
    im.save(os.path.join(TEX, name + '.png'))
    em = Image.new('RGBA', (64, 64), (0, 0, 0, 255)); em.paste(im.crop((12, 6, 52, 58)), (12, 6))   # the whole print glows a little
    em.save(os.path.join(TEX, name + '.em.png'))

def zombie(d):
    d.rectangle((12, 6, 51, 33), fill=(20, 32, 58, 255)); d.ellipse((38, 8, 46, 16), fill=(240, 230, 150, 255))
    d.rectangle((12, 28, 51, 33), fill=(12, 18, 14, 255))
    d.rectangle((14, 24, 19, 33), fill=(90, 96, 100, 255)); d.rectangle((14, 24, 19, 25), fill=(130, 136, 140, 255))
    d.ellipse((22, 11, 42, 31), fill=(96, 150, 72, 255)); d.ellipse((24, 13, 30, 19), fill=(120, 176, 90, 255))
    d.rectangle((27, 19, 29, 21), fill=(230, 50, 40, 255)); d.rectangle((35, 19, 37, 21), fill=(230, 50, 40, 255))
    d.rectangle((27, 25, 37, 27), fill=(20, 10, 10, 255))
    for x in range(28, 37, 2): d.point((x, 25), fill=(235, 235, 220, 255))

def thing(d):
    d.rectangle((12, 6, 51, 33), fill=(44, 26, 20, 255))
    d.rectangle((22, 8, 40, 33), fill=(96, 64, 42, 255)); d.rectangle((24, 10, 38, 33), fill=(70, 46, 30, 255))
    d.rectangle((29, 12, 33, 16), fill=(210, 170, 60, 255)); text(d, '9', 31, 13, (60, 30, 10, 255))
    d.rectangle((16, 32, 48, 33), fill=(50, 220, 100, 255))
    pts = [(30, 33), (27, 30), (23, 28), (20, 24), (19, 20), (21, 16), (25, 14)]
    for i, (x, y) in enumerate(pts):
        r = 3 - i // 3; d.ellipse((x - r, y - r, x + r, y + r), fill=(70, 190, 90, 255))
        d.point((x - 1, y), fill=(190, 250, 170, 255))

def mold(d):
    rnd = random.Random(5)
    d.rectangle((12, 6, 51, 33), fill=(14, 36, 36, 255))
    d.ellipse((17, 10, 47, 32), fill=(30, 40, 30, 255))
    for _ in range(26):
        x, y = rnd.randint(19, 45), rnd.randint(12, 30)
        if ((x - 32) / 15) ** 2 + ((y - 21) / 11) ** 2 < 1: d.rectangle((x, y, x + 1, y + 1), fill=(12, 20, 12, 255))
    for _ in range(40): d.point((rnd.randint(15, 49), rnd.randint(8, 32)), fill=(120, 180, 90, 255))
    d.rectangle((26, 16, 28, 19), fill=(240, 240, 90, 255)); d.rectangle((36, 16, 38, 19), fill=(240, 240, 90, 255))
    d.rectangle((27, 17, 27, 18), fill=(10, 10, 10, 255)); d.rectangle((37, 17, 37, 18), fill=(10, 10, 10, 255))

def deposit(d):
    d.rectangle((12, 6, 51, 33), fill=(120, 86, 24, 255))
    d.ellipse((20, 8, 44, 32), fill=(150, 110, 30, 255)); d.ellipse((22, 10, 42, 30), fill=(236, 196, 56, 255))
    d.rectangle((28, 14, 29, 17), fill=(30, 20, 10, 255)); d.rectangle((35, 14, 36, 17), fill=(30, 20, 10, 255))
    d.ellipse((26, 21, 38, 28), fill=(40, 10, 12, 255))
    for x in range(27, 38, 2): d.point((x, 22), fill=(240, 240, 230, 255)); d.point((x + 1 if x < 36 else x, 27), fill=(240, 240, 230, 255))

def roommate(d):
    d.rectangle((12, 6, 51, 33), fill=(58, 34, 80, 255))
    d.rectangle((20, 8, 44, 33), fill=(230, 206, 130, 255))
    d.ellipse((28, 11, 36, 19), fill=(14, 10, 20, 255)); d.rectangle((26, 18, 38, 33), fill=(14, 10, 20, 255))
    d.rectangle((22, 22, 26, 30), fill=(14, 10, 20, 255)); d.rectangle((38, 22, 42, 26), fill=(14, 10, 20, 255))
    d.rectangle((38, 26, 44, 29), fill=(170, 112, 56, 255)); d.rectangle((38, 26, 44, 26), fill=(210, 150, 80, 255))
    d.point((30, 14), fill=(255, 255, 255, 255)); d.point((34, 14), fill=(255, 255, 255, 255))

poster('poster', (200, 160, 50), (20, 32, 58), ['NIGHT OF', 'THE LIVING', 'DEADBEATS'], (230, 70, 50), zombie)
poster('poster2', (180, 60, 50), (44, 26, 20), ['THE THING', 'FROM', 'UNIT 9'], (120, 230, 100), thing)
poster('poster3', (70, 170, 160), (14, 36, 36), ['CREATURE', 'FROM THE', 'BLACK MOLD'], (170, 230, 140), mold)
poster('poster4', (230, 230, 230), (120, 86, 24), ['SECURITY', 'DEPOSIT'], (255, 220, 90), deposit)
poster('poster5', (200, 80, 170), (58, 34, 80), ['RETURN OF', 'THE', 'ROOMMATE'], (240, 150, 220), roommate)

# ---- screen: four tiles. L and R carry the frame ends, M repeats, C says INTERMISSION ----
def screen(name, left, right, words=None):
    rnd = random.Random(11)
    im = Image.new('RGBA', (64, 64), (30, 34, 44, 255)); d = ImageDraw.Draw(im)
    for y in range(4, 60):
        k = 1 - abs(y - 32) / 28.0
        row = (int(20 + 60 * k), int(44 + 120 * k), int(70 + 150 * k))
        if y % 2: row = tuple(int(v * .82) for v in row)
        d.line((0, y, 63, y), fill=row + (255,))
    for _ in range(10): d.point((rnd.randint(0, 63), rnd.randint(4, 59)), fill=(150, 210, 240, 255))
    d.rectangle((0, 0, 63, 3), fill=(30, 34, 44, 255)); d.line((0, 3, 63, 3), fill=(96, 110, 130, 255))
    d.rectangle((0, 60, 63, 63), fill=(30, 34, 44, 255)); d.line((0, 60, 63, 60), fill=(96, 110, 130, 255))
    if left: d.rectangle((0, 0, 3, 63), fill=(30, 34, 44, 255)); d.line((3, 3, 3, 60), fill=(96, 110, 130, 255))
    if right: d.rectangle((60, 0, 63, 63), fill=(30, 34, 44, 255)); d.line((60, 3, 60, 60), fill=(96, 110, 130, 255))
    if words:
        for i, w in enumerate(words): text(d, w, 32, 18 + 16 * i, (235, 250, 255, 255), 2)
    im.save(os.path.join(TEX, name + '.png'))
    em = Image.new('RGBA', (64, 64), (0, 0, 0, 255)); em.paste(im.crop((4 if left else 0, 4, 60 if right else 64, 60)), (4 if left else 0, 4))
    em.save(os.path.join(TEX, name + '.em.png'))
screen('screenL', True, False); screen('screenM', False, False); screen('screenC', False, False, ['INTER', 'MISSION']); screen('screenR', False, True)
print('theater art written to', TEX)
