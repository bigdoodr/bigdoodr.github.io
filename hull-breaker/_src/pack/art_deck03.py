"""Deck 03 art drawn in code (engine 1.7): the spore growth over a doorway (`sporedoor`), with a glow map.

    python3 art_deck03.py <core textures dir>

A fungal mass that fills the doorway: dark bark-brown and olive lumps, ropes of root at the edges, and spore
pods whose centers glow a sickly yellow-green (the glow map). The engine adds a slow green pulse of light on
both sides of every spore door, so it reads as alive from across a room. Deterministic (fixed seed).
"""
import math, os, random, sys
from PIL import Image, ImageDraw

S = 64


def spore_door():
    rnd = random.Random(303)
    im = Image.new('RGBA', (S, S), (34, 30, 16, 255)); em = Image.new('RGBA', (S, S), (0, 0, 0, 255))
    d, e = ImageDraw.Draw(im), ImageDraw.Draw(em)
    # the old door underneath shows at the top corners: a hint that this used to be a doorway
    d.rectangle([0, 0, 63, 5], fill=(58, 62, 66, 255)); d.rectangle([0, 0, 4, 63], fill=(48, 52, 56, 255)); d.rectangle([59, 0, 63, 63], fill=(48, 52, 56, 255))
    # lumps of growth, darker at the back
    for _ in range(46):
        x, y, r = rnd.randint(2, 61), rnd.randint(4, 63), rnd.randint(4, 10)
        c = rnd.choice([(52, 48, 22), (64, 70, 28), (78, 86, 34), (46, 40, 20), (90, 96, 40)])
        d.ellipse([x - r, y - r, x + r, y + r * 0.9], fill=c + (255,))
        d.arc([x - r, y - r, x + r, y + r * 0.9], 200, 320, fill=(120, 128, 60, 255))
    # roots roping over the frame
    for k in range(6):
        x0 = rnd.choice([1, 3, 60, 62]); pts = []
        for i in range(12):
            y = i * 6; pts.append((x0 + math.sin(i * 0.9 + k) * 4 + (k - 2.5) * 1.5, y))
        d.line(pts, fill=(70, 46, 22, 255), width=3); d.line(pts, fill=(104, 72, 36, 255), width=1)
    # spore pods: a rim, a pale body, and a glowing center
    for _ in range(9):
        x, y, r = rnd.randint(10, 54), rnd.randint(12, 58), rnd.randint(3, 6)
        d.ellipse([x - r - 1, y - r - 1, x + r + 1, y + r + 1], fill=(60, 54, 20, 255))
        d.ellipse([x - r, y - r, x + r, y + r], fill=(150, 176, 58, 255))
        d.ellipse([x - r + 2, y - r + 2, x + r - 2, y + r - 2], fill=(206, 240, 90, 255))
        e.ellipse([x - r + 1, y - r + 1, x + r - 1, y + r - 1], fill=(150, 150, 150, 255))
        e.ellipse([x - r + 2, y - r + 2, x + r - 2, y + r - 2], fill=(255, 255, 255, 255))
    # fine spores in the air
    for _ in range(40):
        x, y = rnd.randint(0, 63), rnd.randint(0, 63)
        d.point((x, y), fill=(200, 230, 100, 255)); e.point((x, y), fill=(120, 120, 120, 255))
    return im, em


def main(tex):
    im, em = spore_door()
    im.save(os.path.join(tex, 'sporedoor.png')); em.save(os.path.join(tex, 'sporedoor.em.png'))
    print('drew sporedoor')


if __name__ == '__main__':
    main(sys.argv[1])
