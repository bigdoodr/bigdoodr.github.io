"""Build the Deck 03 voice review page: Okafor's relay and the seven Kokoro-voiced logs, each with its text.

    python3 deck03_review.py <out.html>
"""
import base64, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'pack')); sys.path.insert(0, os.path.join(HERE, '..', 'level', 'deck03'))
import deck03, build_level  # noqa: E402
RAW = os.path.join(HERE, '..', 'pack', 'deck03_raw', 'deck-03')
LOGS = json.load(open(os.path.join(HERE, '..', 'pack', 'deck03_logs.json')))
VOICE = {'TECH L. MARQUEZ': 'am_puck', 'DR. N. OKAFOR': 'bf_emma', 'CORWIN SABLE, GORGON LIAISON': 'bm_george'}
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
dur = lambda p: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')
pos = {v: k for k, v in build_level.LOGS.items()}
zname = {z['id']: z['name'].split(' // ')[-1].title() for z in build_level.ZONES}
items = [('relay', "Okafor's relay", 'Greenhouse Lab terminal · bf_emma', deck03.OKAFOR['okafor_relay'], os.path.join(RAW, 'voice', 'okafor_relay.mp3'))]
vol = []
for n, lid in enumerate(deck03.LOG_ORDER, 1):
    L = LOGS[lid]; x, y = pos[lid]; where = zname[build_level.zone_at(x, y)]
    who = L['speaker'].title().replace('Gorgon Liaison', 'Gorgon liaison')
    if L['speaker'] in VOICE: items.append((lid, f'{n}. {who}', f'{where} · {VOICE[L["speaker"]]}', L['text'], os.path.join(RAW, 'logs', lid + '.mp3')))
    else: vol.append(f'{n}. {who}')
cards = ''.join(f'''<article><h2>{esc(t)}</h2><p class=m>{esc(m)} · {dur(p):.0f} s</p>
<audio controls preload=none src="data:audio/mpeg;base64,{b64(p)}"></audio><p class=t>{esc(tx)}</p></article>''' for _, t, m, tx, p in items)
html = f'''<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Deck 03 voices</title><style>
/* VOICE: a field recorder's cassette index, plain and close. IDEA: a tape log sheet. PICTURE: the players themselves.
   COLOUR and TYPE: near-black, amber labels, bone text, Space Mono. LAYOUT: one column of tape cards. */
:root{{color-scheme:dark;--bg:#0d0f10;--card:#16191b;--ink:#e8e2d0;--dim:#8b98a5;--amber:#ffb627}}
*{{box-sizing:border-box;min-width:0}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 'Space Mono',ui-monospace,monospace}}
main{{max-width:760px;margin:auto;padding:clamp(20px,4vw,48px) 16px}}h1{{font-size:clamp(26px,5vw,40px);line-height:1.05;margin:0 0 8px;color:var(--amber)}}
.lead{{color:var(--dim);margin:0 0 24px}}article{{background:var(--card);border:1px solid #262b2f;border-radius:10px;padding:16px 18px;margin:0 0 14px}}
h2{{font-size:18px;margin:0}}.m{{color:var(--dim);font-size:13px;margin:2px 0 10px}}audio{{width:100%;height:44px}}.t{{margin:10px 0 0}}
footer{{color:var(--dim);font-size:14px;margin-top:22px}}</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel=stylesheet></head><body><main>
<h1>Deck 03 voices</h1><p class=lead>Okafor's relay and the seven logs by the established cast, through the recorder filter.
Each passed the speech-recognition check (93% or better).</p>{cards}
<footer>Volunteer logs, still to record: {esc(', '.join(vol))}.</footer></main></body></html>'''
open(sys.argv[1], 'w').write(html); print('wrote', sys.argv[1], round(len(html) / 1024), 'KB')
