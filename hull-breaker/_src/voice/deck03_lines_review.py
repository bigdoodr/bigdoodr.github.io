"""Build the Deck 03 lines review page: Buck's lines (BUCK-VOICE) and Moss on the radio, each with its text.

    python3 deck03_lines_review.py <out.html>
"""
import base64, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, '..', 'pack'))
import deck03  # noqa: E402
RAW = os.path.join(HERE, '..', 'pack', 'deck03_raw')
REP = json.load(open(os.path.join(HERE, 'deck03_lines_report.json')))
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
dur = lambda p: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
esc = lambda s: s.replace('&', '&amp;').replace('<', '&lt;')
# Where each line plays, and whether its text is approved (the design doc's drafts) or new in this step
WHEN = {
    'start': ('Arriving at Tram Platform G', 'approved'), 'allergy': ('First spore pod', 'approved'),
    'doc_alive': ("After Okafor's relay", 'approved'), 'specimen': ('Picking up a sample', 'approved'),
    'clear_air': ('Air vented', 'approved'), 'boss_root': ('Mother Root appears', 'approved'),
    'payoff_root': ("Payoff cut scene", 'approved'), 'floorplan': ('Floor-plan terminal, Seed Bank', 'approved'),
    'sign': ('The "Do not feed after lights-out" sign', 'approved'), 'plant_room': ("The singing plant's secret room", 'approved'),
    'plant_fed': ('Feeding the singing plant', 'approved'), 'get_torch': ('Picking up the Purge Torch', 'approved'),
    'rooter_regrow': ('First rooter regrows a limb', 'approved'), 'ach_slash_and_burn': ('Achievement: Slash and Burn', 'approved'),
    'ach_chain_of_custody': ('Achievement: Chain of Custody', 'approved'),
    'moss_arrive': ('Arriving at Tram Platform G', 'drafted with the level'), 'moss_okafor': ("After Okafor's relay", 'approved'),
    'moss_scrubbers': ('All three scrubbers running', 'drafted with the level'),
    'moss_scrub_locked': ('Atmosphere Control while locked', 'drafted with the level'),
    'moss_poison': ('Root Chamber door before venting', 'drafted with the level'),
    'moss_rootdown': ('Mother Root down', 'drafted with the level'), 'moss_tracks': ('Down-line tracks still blocked', 'drafted with the level'),
    'moss_downline': ('Reaching the down-line platform', 'drafted with the level'),
}
groups = [('Buck', [(k, t, 'deck-03/voice') for k, t in deck03.LINES.items()] + [(k, t, 'core/voice') for k, t in deck03.CORE_LINES.items()]),
          ('Moss, on the radio', [(k, t, 'deck-03/voice') for k, t in deck03.MOSS.items()])]
body = ''
for name, items in groups:
    body += f'<h2 class=g>{esc(name)}</h2>'
    for k, t, w in items:
        p = os.path.join(RAW, w, k + '.mp3'); when, st = WHEN.get(k, ('', ''))
        tag = '<span class=new>NEW TEXT</span> ' if st == 'new' else ''
        body += (f'<article><p class=t>{tag}{esc(t)}</p><p class=m>{esc(when)} · {dur(p):.1f} s</p>'
                 f'<audio controls preload=none src="data:audio/mpeg;base64,{b64(p)}"></audio></article>')
html = f'''<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Deck 03 lines</title><style>
:root{{color-scheme:dark;--bg:#0d0f10;--card:#16191b;--ink:#e8e2d0;--dim:#8b98a5;--amber:#ffb627}}
*{{box-sizing:border-box;min-width:0}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 'Space Mono',ui-monospace,monospace}}
main{{max-width:760px;margin:auto;padding:clamp(20px,4vw,48px) 16px}}h1{{font-size:clamp(26px,5vw,40px);line-height:1.05;margin:0 0 8px;color:var(--amber)}}
.lead{{color:var(--dim);margin:0 0 20px}}h2.g{{font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--amber);margin:28px 0 10px}}
article{{background:var(--card);border:1px solid #262b2f;border-radius:10px;padding:14px 16px;margin:0 0 12px}}
.t{{margin:0;font-size:17px}}.m{{color:var(--dim);font-size:13px;margin:2px 0 10px}}audio{{width:100%;height:44px}}
.new{{font-size:11px;font-weight:700;color:var(--bg);background:var(--amber);border-radius:4px;padding:2px 6px;vertical-align:2px}}</style>
<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel=stylesheet></head><body><main>
<h1>Deck 03 lines</h1><p class=lead>Buck with the locked BUCK-VOICE settings, Moss through her radio. Lines marked NEW TEXT
haven't been approved yet. The speech check heard every line as written, apart from spellings ("Downline", "the air is")
and Okafor's name, which it can't spell.</p>{body}</main></body></html>'''
open(sys.argv[1], 'w').write(html); print('wrote', sys.argv[1], round(len(html) / 1024), 'KB')
