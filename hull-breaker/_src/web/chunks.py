"""Edit engine.js by top-level declaration ('chunks'): list, cut, replace.
A chunk starts at a line beginning (column 0) with function/const/let/async function/Object.assign/
addEventListener or a /* ===== */ banner, and runs to the next such line."""
import re, sys
START = re.compile(r'^(?:async function |function |const |let |Object\.assign|addEventListener|/\* =|// ----|window\.)', re.M)
NAME = re.compile(r'^(?:async function |function |const |let )([A-Za-z_$][\w$]*)')
def split(src):
    pos = [m.start() for m in START.finditer(src)]
    head = src[:pos[0]] if pos else src
    out = [head]
    for i, p in enumerate(pos):
        out.append(src[p:pos[i + 1] if i + 1 < len(pos) else len(src)])
    return out
def name(ch):
    m = NAME.match(ch); return m.group(1) if m else None
def cut(src, names):
    names = set(names); parts = split(src); keep = []; gone = []
    for ch in parts:
        n = name(ch)
        if n in names: gone.append(n); continue
        keep.append(ch)
    missing = names - set(gone)
    assert not missing, f'not found: {missing}'
    return ''.join(keep)
def get(src, n):
    for ch in split(src):
        if name(ch) == n: return ch
    raise KeyError(n)
def sub(src, old, new, count=1):
    assert src.count(old) == count, (src.count(old), old[:80])
    return src.replace(old, new)
if __name__ == '__main__':
    src = open(sys.argv[1]).read()
    for ch in split(src)[1:]:
        print(len(ch), name(ch) or ch[:40].replace('\n', ' '))
