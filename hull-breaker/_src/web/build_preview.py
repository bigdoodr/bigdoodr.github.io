"""Build a single-file preview of the web game: page, engine scripts, fonts and packs inlined.

    python3 build_preview.py <packs_dir> <out.html> [--fonts <dir with @fontsource packages>]

The live site loads engine/*.js and packs/ as separate files. A preview (an artifact, or a file
opened from disk) can't fetch them, so this script inlines everything: the engine scripts in
order, the three fonts as base64 @font-face rules (instead of Google Fonts), and every pack file
the web engine reads into window.HB_BUNDLE (JSON as objects, audio and images as base64).
"""
import base64, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.abspath(os.path.join(HERE, '..', '..'))
PACKS, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
FONTS = sys.argv[sys.argv.index('--fonts') + 1] if '--fonts' in sys.argv else os.path.expanduser('~/fonts/node_modules/@fontsource')

page = open(os.path.join(GAME, 'index.html'), encoding='utf-8').read()

# fonts: the same families the page asks Google for, embedded
faces = [('Silkscreen', 400, 'silkscreen/files/silkscreen-latin-400-normal.woff2'), ('Silkscreen', 700, 'silkscreen/files/silkscreen-latin-700-normal.woff2'),
         ('Teko', 500, 'teko/files/teko-latin-500-normal.woff2'), ('Teko', 700, 'teko/files/teko-latin-700-normal.woff2'),
         ('VT323', 400, 'vt323/files/vt323-latin-400-normal.woff2')]
css = ''.join(f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,"
              f"{base64.b64encode(open(os.path.join(FONTS, f), 'rb').read()).decode()}) format('woff2')}}" for fam, w, f in faces)
page, n = re.subn(r'<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>',
                  '<style>' + css + '</style>', page)
assert n == 1, 'font links not found'

# packs: everything the web engine fetches
cat = json.load(open(os.path.join(PACKS, 'catalog.json')))
bundle = {'catalog.json': cat}
want_json = {'core': ['tuning', 'lines', 'strings', 'achievements', 'art', 'sfx'], 'deck': ['deck', 'level', 'logs', 'lines']}
for p in cat['packs']:
    pid, kind = p['id'], p['kind']
    for k in want_json[kind]: bundle[f'{pid}/{k}.json'] = json.load(open(os.path.join(PACKS, pid, k + '.json'), encoding='utf-8'))
    man = json.load(open(os.path.join(PACKS, pid, 'manifest.json')))
    for f in man['files']:
        if f['path'].endswith('.mp3') or (f['path'].endswith('.png') and kind == 'deck'):
            bundle[f'{pid}/{f["path"]}'] = base64.b64encode(open(os.path.join(PACKS, pid, f['path']), 'rb').read()).decode()
blob = json.dumps(bundle, separators=(',', ':')).replace('</', '<\\/')

# scripts inline, in page order, after the bundle
def inline(m):
    src = open(os.path.join(GAME, m.group(1)), encoding='utf-8').read()
    assert '</script' not in src.lower(), m.group(1)
    return '<script>\n' + src + '\n</script>'
first = page.index('<script src="engine/')
page = page[:first] + '<script>window.HB_BUNDLE=' + blob + ';</script>\n' + page[first:]
page = re.sub(r'<script src="(engine/[a-z]+\.js)"></script>', inline, page)
open(OUT, 'w', encoding='utf-8').write(page)
print(f'wrote {OUT}: {len(page) / 1e6:.1f} MB, {len(bundle)} pack files inlined')
