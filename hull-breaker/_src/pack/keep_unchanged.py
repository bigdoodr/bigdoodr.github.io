"""Keep re-extracted packs from churning.

The game draws its art and sounds procedurally with random grime and noise, so every
dump.py run produces slightly different PNG and WAV bytes even when nothing changed.
Shipping those would make every app re-download the whole core pack. This puts back the
previous release's bytes for every media file that already existed, keeps the sfx gains
that go with them, drops pack files nobody uses, and rewrites the manifests and catalog.

    cp -r ../../packs /tmp/packs_prev                 # before extract.py
    python3 dump.py raw && python3 extract.py raw ../../packs
    python3 keep_unchanged.py /tmp/packs_prev ../../packs [path ...]

Paths listed after the folders (like core/textures/hull.png) are left as newly
extracted: use that when a texture or sound was changed on purpose.
"""
import hashlib, json, os, sys


def jdump(path, obj):  # same as extract.py
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=1, ensure_ascii=False); f.write('\n')


def manifest(root, head):  # same as extract.py
    files = []
    for dp, _, fns in os.walk(root):
        for fn in sorted(fns):
            if fn == 'manifest.json': continue
            p = os.path.join(dp, fn); rel = os.path.relpath(p, root).replace(os.sep, '/')
            b = open(p, 'rb').read(); files.append({'path': rel, 'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest()})
    files.sort(key=lambda f: f['path'])
    m = dict(format=1, **head); m['bytes'] = sum(f['bytes'] for f in files); m['files'] = files
    jdump(os.path.join(root, 'manifest.json'), m)
    return m

OLD, NEW = sys.argv[1], sys.argv[2]
FORCE = set(sys.argv[3:])
MEDIA = ('.png', '.wav', '.mp3')
# New cracked copies (secret-door versions) of walls that no secret door stands next to are never used.
_used = {d['tex'] for pid in os.listdir(NEW) if pid.startswith('deck-')
         for d in json.load(open(os.path.join(NEW, pid, 'level.json')))['doors']}
_old_art = json.load(open(os.path.join(OLD, 'core', 'art.json')))['textures']
UNUSED = set()
for k, v in json.load(open(os.path.join(NEW, 'core', 'art.json')))['textures'].items():
    if k.startswith('crack_') and k not in _used and k not in _old_art:
        UNUSED |= {f'core/{v["file"]}'} | ({f'core/{v["emissive"]}'} if v.get('emissive') else set())

restored = 0
for pid in ('core', 'deck-01'):
    for f in json.load(open(os.path.join(OLD, pid, 'manifest.json')))['files']:
        rel = f'{pid}/{f["path"]}'
        if not rel.endswith(MEDIA) or rel in FORCE: continue
        dst = os.path.join(NEW, rel)
        if not os.path.exists(dst): continue
        old = open(os.path.join(OLD, rel), 'rb').read()
        if open(dst, 'rb').read() != old:
            open(dst, 'wb').write(old); restored += 1

# sfx gains belong to the WAV bytes: keep the old entry wherever the old WAV was kept
old_sfx = json.load(open(os.path.join(OLD, 'core', 'sfx.json')))['sounds']
sfx = json.load(open(os.path.join(NEW, 'core', 'sfx.json')))
for k, v in old_sfx.items():
    if k in sfx['sounds'] and f'core/{v["file"]}' not in FORCE: sfx['sounds'][k] = v
jdump(os.path.join(NEW, 'core', 'sfx.json'), sfx)

art = json.load(open(os.path.join(NEW, 'core', 'art.json')))
for rel in UNUSED:
    p = os.path.join(NEW, rel)
    if os.path.exists(p): os.remove(p)
art['textures'] = {k: v for k, v in art['textures'].items() if f'core/{v["file"]}' not in UNUSED}
jdump(os.path.join(NEW, 'core', 'art.json'), art)

# manifests and catalog
cat = json.load(open(os.path.join(NEW, 'catalog.json')))
for entry in cat['packs']:
    root = os.path.join(NEW, entry['id'])
    head = {k: v for k, v in json.load(open(os.path.join(root, 'manifest.json'))).items() if k not in ('format', 'bytes', 'files')}
    m = manifest(root, head)
    entry['bytes'] = m['bytes']
    entry['manifestSha256'] = hashlib.sha256(open(os.path.join(root, 'manifest.json'), 'rb').read()).hexdigest()
jdump(os.path.join(NEW, 'catalog.json'), cat)
print(f'kept {restored} unchanged media files from {OLD}')
