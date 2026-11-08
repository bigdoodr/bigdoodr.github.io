"""Build the Deck 02 casting sheet: every log, Buck line and Moss call, plus a pool of the
voices still in reserve reading one sample line through the recorder filter.

    python3 deck02_review.py /tmp/deck02_voices.html
"""
import base64, json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'pack'))
import deck02
sys.argv, OUT = sys.argv[:1] + ['none'], sys.argv[1]
import deck02_vo as vo  # noqa: E402  (records nothing with the 'none' argument)

RAW = vo.RAW
b64 = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
dur = lambda p: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout)
WHERE = {
    'oduya_platform': 'Up-line platform', 'sable_attrition': 'Leasing office', 'delacroix_commissary': 'Commissary',
    'chaplain': 'Chapel', 'mother_a3': 'Block A, unit A-3', 'mother_a7': 'Block A, unit A-7', 'daycare': 'Daycare',
    'projectionist': 'Theater booth', 'resident_b2': 'Block B, unit B-2', 'resident_b9': 'Block B, unit B-9',
    'lifeguard': 'Pool deck', 'oduya_laundry': 'Laundry', 'super_hollis': "Super's office", 'sable_sealed': 'Bulkhead control',
    'delacroix_boiler': 'Boiler room'}
POOL_NAMES = {
    'am_echo': ('Echo', 'US male, plain'), 'am_adam': ('Adam', 'US male, rough'), 'bm_george': ('George', 'UK male, clipped'),
    'bf_isabella': ('Isabella', 'UK female, warm'), 'af_heart': ('Heart', 'US female, soft'), 'af_jessica': ('Jessica', 'US female, bright'),
    'bm_fable': ('Fable', 'UK male, older'), 'af_alloy': ('Alloy', 'US female, flat'), 'af_aoede': ('Aoede', 'US female, light'),
    'af_river': ('River', 'US female, calm'), 'af_sky': ('Sky', 'US female, young'), 'am_santa': ('Santa', 'US male, jolly'),
    'bf_lily': ('Lily', 'UK female, gentle'), 'af_bella': ('Bella', 'US female (Moss)')}
SAMPLE = "Day nine. The water pressure's gone again. If anyone finds this, the stairs past the laundry are still clear."

CHANGED = set(os.environ.get('CHANGED', '').split(','))  # clips redone after a round of notes
logs = []
for lid in deck02.LOG_ORDER:
    L = vo.LOGS[lid]; p = os.path.join(RAW, 'deck-02/logs', lid + '.mp3')
    logs.append({'id': lid, 'grp': 'log', 'who': L['speaker'], 'where': WHERE.get(lid, ''), 'voice': vo.VOICES[L['speaker']],
                 'text': L['text'], 'a': b64(p), 'dur': dur(p), 'changed': lid in CHANGED})
for lid, (t, where) in vo.BUCK_LINES.items():
    p = os.path.join(RAW, where, lid + '.mp3')
    logs.append({'id': lid, 'grp': 'buck', 'who': 'BUCK', 'where': lid.replace('_', ' '), 'voice': 'buck', 'text': t, 'a': b64(p), 'dur': dur(p), 'changed': lid in CHANGED})
for lid, t in deck02.MOSS.items():
    p = os.path.join(RAW, 'deck-02/voice', lid + '.mp3')
    logs.append({'id': lid, 'grp': 'moss', 'who': 'MOSS (RADIO)', 'where': lid.replace('moss_', '').replace('_', ' '), 'voice': 'af_bella',
                 'text': t, 'a': b64(p), 'dur': dur(p), 'changed': lid in CHANGED})

TAKES = json.load(open('/tmp/takes/takes.json')) if os.path.exists('/tmp/takes/takes.json') else {}
for tid, t in TAKES.items():
    logs.append({'id': tid, 'grp': 'take', 'who': t.get('who') or ('TAKE ' + t['tag'] + ' · ' + vo.LOGS[t['log']]['speaker']), 'where': t['desc'], 'voice': t['voice'],
                 'text': t['text'], 'a': b64(t['path']), 'dur': dur(t['path'])})

pool = []
for v, (name, kind) in POOL_NAMES.items():
    y = vo.paced(SAMPLE, v, vo.LANG(v), vo.SPEED.get(v, .96), gap=.45)
    p = f'/tmp/pool_{v}.mp3'; vo.to_mp3(y, p, vo.RECORDER); pool.append({'id': v, 'name': name, 'kind': kind, 'a': b64(p)})
pool.append({'id': 'buck', 'name': 'Buck', 'kind': 'Locked (BUCK-VOICE)', 'a': logs[len(deck02.LOG_ORDER)]['a']})

tpl = open(os.path.join(HERE, '..', 'pages', 'review_template.html'), encoding='utf-8').read()
R = [
    ('<title>Deck 01 Log Voices</title>', '<title>Deck 02 Voices</title>'),
    ('<h1>Deck 01 log voices</h1>', '<h1>Deck 02 voices</h1>'),
    ("""<p class="lede">All 16 audio logs, in roughly the order you'd find them. Logs marked Updated include your latest round of notes. Play any one, then use the box under it to pick a different voice or describe what to change. When you're done, press Copy feedback at the bottom and paste it to Claude. Your notes stay saved on this device until then.</p>""",
     """<p class="lede">Hostile Tenancy's 15 audio logs in the order you'd find them, then Buck's new lines and Moss on the radio. Listen for pacing and pronunciation. Play any one, then use the box under it to recast or describe what to change. When you're done, press Copy feedback at the bottom and paste it to Claude. Your notes stay saved on this device until then.</p>"""),
    ('<ol class="logs" id="logs"></ol>', '<ol class="logs" id="logs"></ol>\n  <h2>BUCK</h2>\n  <p class="lede">Locked voice settings. Notes here are about delivery or pronunciation, not casting.</p>\n  <ol class="logs" id="g-buck"></ol>\n  <h2>MOSS ON THE RADIO</h2>\n  <ol class="logs" id="g-moss"></ol>'),
    ('Every available English voice reading the same line through the recorder filter. Voices already cast are marked.',
     'The Deck 02 cast plus the voices still in reserve, all reading the same line through the recorder filter. Voices already cast are marked.'),
    ("hb-log-voice-notes-v5", "hb-deck02-voice-notes-v1"),
    ("const ol=$('#logs');", "const OLS={log:$('#logs'),buck:$('#g-buck'),moss:$('#g-moss'),take:$('#g-take')};let gi={log:0,buck:0,moss:0,take:0};"),
    ("DATA.logs.forEach((l,i)=>{\n  const li", "DATA.logs.forEach(l=>{const i=gi[l.grp]++;\n  const li"),
    ("DATA.pool.forEach(p=>{if(p.id===l.voice)return;", "if(l.grp!=='buck'&&l.grp!=='take')DATA.pool.forEach(p=>{if(p.id===l.voice||p.id==='buck')return;"),
    ("  ol.appendChild(li);", "  OLS[l.grp].appendChild(li);"),
    ("const castBy={};DATA.logs.forEach(l=>{(castBy[l.voice]=castBy[l.voice]||[]).push(l.who);});",
     "const castBy={};DATA.logs.forEach(l=>{const c=castBy[l.voice]=castBy[l.voice]||[];if(c.indexOf(l.who)<0)c.push(l.who);});"),
    ("'- '+l.who+' ('+l.where+', '+l.voice+')'", "'- '+l.who+' ['+l.id+'] ('+l.where+', '+l.voice+')'"),
    ("return lines.length?'LOG VOICE FEEDBACK\\n'", "return lines.length?'DECK 02 VOICE FEEDBACK\\n'"),
    ("k?k+' of 16 logs have notes'", "k?k+' of '+DATA.logs.length+' clips have notes'"),
]
if TAKES: R.append(('<h2>AUDIO LOGS</h2>', '<h2>PICK A TAKE</h2>\n  <p class="lede">Buck\'s longer reply to Moss, two endings, both through his locked voice settings. Note the one that lands, or none. Put a note on the one that sounds right (or on none, if none do), and it goes into that log.</p>\n  <ol class="logs" id="g-take"></ol>\n  <h2>AUDIO LOGS</h2>'))
R.append(("<ol class=\"logs\" id=\"logs\"></ol>", "<ol class=\"logs\" id=\"logs\"></ol>") if TAKES else ('<h2>AUDIO LOGS</h2>', '<h2>AUDIO LOGS</h2>\n  <ol class="logs" id="g-take" hidden></ol>'))
for a, b in R:
    assert a in tpl, a[:60]
    tpl = tpl.replace(a, b)
html = '<!DOCTYPE html>\n<meta charset="utf-8">\n' + tpl.replace('__DATA__', json.dumps({'logs': logs, 'pool': pool}))
open(OUT, 'w', encoding='utf-8').write(html); print(OUT, len(html) // 1024, 'KB')
