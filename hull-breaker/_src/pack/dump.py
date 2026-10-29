"""Stage 1 of the Deck 01 extraction: run the shipped game in headless Chromium
and dump everything a pack needs into a raw folder.

    python3 dump.py [out_dir]          (default: ./raw)

Writes raw/data.json (level, logs, tuning tables, legends), raw/art.json
(textures, floors, ceilings, sprites as base64 PNG), raw/vo/*.mp3 (Buck),
raw/logs/*.mp3 (audio logs) and raw/sfx/*.f32 (procedural sounds rendered
offline at pan 0, volume 1, as raw 44.1 kHz mono float32). extract.py turns that into packs.
"""
import base64, json, os, re, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, '..', '..', 'index.html')
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'raw'))

# Every procedural sound the game makes, with the argument sets it actually uses.
# (name, args, seconds to render). Pan and distance volume are applied at runtime.
SFX = [
    ('cutter', [], .6), ('shotgun', [], 1), ('rivet', [], .25), ('whoosh', [], .4), ('kick', [], .3),
    ('hit', [0, 1], .3), ('sever', [0, 1], .5), ('death', [0, 1], .8), ('groan', [0, 1], 1.5), ('roar', [0, 1], 1.6),
    ('explode', [0, 1], 1.6), ('pickup', [], .4), ('key', [], .8), ('door', [0, 1], .7), ('denied', [], .4),
    ('clang', [0, 1], 1.1), ('step', [], .15), ('hurt', [], .4), ('heart', [], .5), ('stinger', [], 2),
    ('drum', [], 1.4), ('beep', [1000], .2), ('tick', [], .1), ('whisper', [0], 2.1), ('klaxon', [], 2.2),
    ('swap', [], .25), ('dry', [], .1), ('spit', [0, 1], .4), ('splat', [0, 1], .3), ('bounce', [0, 1], .25),
    ('save', [], .7), ('breaker', [], 1.5), ('powerup', [], 3.5),
    ('braam', [2.5], 2.8), ('braam', [3], 3.3), ('braam', [4], 4.3), ('braam', [4.5], 4.8), ('braam', [5.5], 5.8), ('braam', [6], 6.3),
    ('staticN', [5.6], 5.8),
] + [('shriek', [0, 1, p], 1.1) for p in (.5, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6)]
LOOPS = [('@ambient', 32.0), ('@music', 64 * 60 / 138 / 2 + .5)]


def sfx_id(name, args):
    if name == 'braam': return f'braam_{args[0]:g}'.replace('.', '_')
    if name == 'shriek': return f'shriek_{args[2]:g}'.replace('.', '_')
    if name == 'staticN': return 'static'
    return name


def slug(t):
    return re.sub(r'[^a-z0-9]+', '_', t.lower()).strip('_')[:48]


def main():
    html = open(GAME, encoding='utf-8').read()
    hook = open(os.path.join(HERE, 'harness.js'), encoding='utf-8').read()
    boot = "window.claude?.hot?.ready?window.claude.hot.ready(()=>boot()):boot();"
    assert boot in html, 'boot line not found; the game changed shape'
    html = html.replace(boot, boot + '\n' + hook)
    for d in ('vo', 'logs', 'sfx'): os.makedirs(os.path.join(OUT, d), exist_ok=True)
    tmp = os.path.join(OUT, '_game.html'); open(tmp, 'w', encoding='utf-8').write(html)
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page()
        pg.on('pageerror', lambda e: print('PAGE ERROR', e))
        pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        pg.route('**/fonts.gstatic.com/**', lambda r: r.abort())
        pg.goto('file://' + tmp); pg.wait_for_function('window.__HB')
        data = pg.evaluate('__HB.data()')
        json.dump(data, open(os.path.join(OUT, 'data.json'), 'w'), indent=1)
        json.dump(pg.evaluate('__HB.art()'), open(os.path.join(OUT, 'art.json'), 'w'))
        vo = {}
        for k in data['VOKEYS']:
            fn = slug(k) + '.mp3'; vo[k] = fn
            open(os.path.join(OUT, 'vo', fn), 'wb').write(base64.b64decode(pg.evaluate('k=>__HB.vo(k)', k)))
        json.dump(vo, open(os.path.join(OUT, 'vo.json'), 'w'), indent=1)
        for k in data['LOGKEYS']:
            open(os.path.join(OUT, 'logs', k + '.mp3'), 'wb').write(base64.b64decode(pg.evaluate('k=>__HB.logvo(k)', k)))
        for name, args, dur in SFX + [(n, [], d) for n, d in LOOPS]:
            f32 = base64.b64decode(pg.evaluate('([n,a,d])=>__HB.sfx(n,a,d)', [name, args, dur]))
            open(os.path.join(OUT, 'sfx', sfx_id(name, args).lstrip('@') + '.f32'), 'wb').write(f32)
        b.close()
    os.remove(tmp)
    print('dumped to', OUT)


if __name__ == '__main__':
    main()
