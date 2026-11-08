"""Rewrite one pack's manifest (sizes, hashes, version) and its catalog entry after an edit.
    python3 remanifest.py <packs_dir> <pack_id> [new_version] [new_minEngine]"""
import hashlib, json, os, sys
root, pid = sys.argv[1], sys.argv[2]
d = os.path.join(root, pid); man = json.load(open(os.path.join(d, 'manifest.json')))
files = []
for dp, _, fns in os.walk(d):
    for fn in fns:
        rel = os.path.relpath(os.path.join(dp, fn), d).replace(os.sep, '/')
        if rel == 'manifest.json': continue
        b = open(os.path.join(dp, fn), 'rb').read(); files.append(dict(path=rel, bytes=len(b), sha256=hashlib.sha256(b).hexdigest()))
man['files'] = sorted(files, key=lambda f: f['path']); man['bytes'] = sum(f['bytes'] for f in files)
if len(sys.argv) > 3: man['version'] = sys.argv[3]
if len(sys.argv) > 4: man['minEngine'] = sys.argv[4]
open(os.path.join(d, 'manifest.json'), 'w').write(json.dumps(man, indent=1, ensure_ascii=False) + '\n')
cat = json.load(open(os.path.join(root, 'catalog.json')))
for p in cat['packs']:
    if p['id'] == pid:
        p.update(version=man['version'], minEngine=man['minEngine'], bytes=man['bytes'],
                 manifestSha256=hashlib.sha256(open(os.path.join(d, 'manifest.json'), 'rb').read()).hexdigest())
open(os.path.join(root, 'catalog.json'), 'w').write(json.dumps(cat, indent=1, ensure_ascii=False) + '\n')
print(pid, man['version'], man['bytes'])
