"""Record Deck 03's lines with deck02_vo.py's own pipeline: Buck (BUCK-VOICE through the voice lab's BuckDSP) and
Moss on the radio (af_bella, radio filter), as deck02_v16_vo.py does for engine 1.6.

    cd _src/voice && ln -s ~/kok kok && python3 deck03_lines_vo.py        (ONLY=id,id to redo some)

Writes MP3s into _src/pack/deck03_raw/{deck-03/voice, core/voice}, where build_deck03.py picks them up, then
speech-checks them into deck03_lines_report.json."""
import json, os, shutil, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.argv = [sys.argv[0], 'none']          # import deck02_vo without running any of its own recordings
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'pack'))
import deck02_vo as V                      # noqa: E402
import deck03                              # noqa: E402

# Pauses are real silence between separately recorded pieces (punctuation makes none), as in Deck 02.
V.BUCKSEG.update({
    'Hydroponics. Smells like somebody stopped paying the air bill.': ['Hydroponics.', .5, 'Smells like somebody stopped paying the air bill.'],
    # Nov 25: Buck's growl ate the g ("tell Billy") and "Doc's" came out "He docks"; this one is heard right
    "Doc's alive. Somebody tell billing.": [('ph', 'dˈɑːks əlˈaɪv.'), .5, 'Somebody tell', .12, 'billing.'],
    'Specimen jar. Doc better tip.': [('ph', 'spˈɛsəmən dʒˈɑːɹ.'), .45, 'Doc better tip.'],   # was heard "specimen jock"
    "Gorgon's plan says the farms end here. Gorgon lies about square footage.":
        ["Gorgon's plan says the farms end here.", .5, 'Gorgon lies about square footage.'],
    'Is that thing... humming?': ['Is that thing', .45, 'humming?'],   # a held m split it in two; takes pick a clear one
    "There you go. Don't tell anybody.": ['There you go.', .45, "Don't tell anybody."],
    'Root cause analysis. Step one: fire.': ['Root cause analysis.', .5, 'Step one.', .3, 'Fire.'],
    'Signed, sealed, delivered. Almost.': ['Signed.', .2, 'Sealed.', .2, 'Delivered.', .55, 'Almost.'],   # whole, it slurred
})
BUCK = {**{k: (t, 'deck-03/voice') for k, t in deck03.LINES.items()},
        **{k: (t, 'core/voice') for k, t in deck03.CORE_LINES.items()}}
MOSS = dict(deck03.MOSS)
ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))
if ONLY:
    BUCK = {k: v for k, v in BUCK.items() if k in ONLY}; MOSS = {k: v for k, v in MOSS.items() if k in ONLY}

OUT = os.path.join(HERE, '..', 'pack', 'deck03_raw')
V.RAW = tempfile.mkdtemp()
for d in ('deck-02/voice', 'deck-03/voice', 'core/voice'): os.makedirs(os.path.join(V.RAW, d))
# BuckDSP seeds its grit from the line's text, so one unlucky seed can bury a consonant ("tell Billy",
# "specimen jock"). Record TAKES of each Buck line with different seeds (the text plus i trailing spaces, which
# Kokoro ignores) and keep the one the speech check hears best (the first, on a tie).
TAKES = int(os.environ.get('TAKES', '4'))
for t, _ in list(BUCK.values()):
    for i in range(1, TAKES):
        if t in V.BUCKSEG: V.BUCKSEG[t + ' ' * i] = V.BUCKSEG[t]
V.BUCK_LINES = {f'{k}~{i}': (t + ' ' * i, w) for k, (t, w) in BUCK.items() for i in range(TAKES)}
# Voice-only respellings for Moss (the check still uses the real text): "Down-line" came out "Download"
# Moss says Okafor without her American R ("awk-a-fur"), close to Okafor's own "OCK-a-fuh": Casey's take A (Nov 25)
V.PHFIX.append(('Okafor', 'ˈɑːkæfɚ', 'ˈɑːkəfə'))
MOSS_SAY = {'moss_downline': 'Down line platform. Medical is the next stop.'}
V.deck02.MOSS = {k: MOSS_SAY.get(k, t) for k, t in MOSS.items()}
V.LOGS = {}
V.BUCK_ONLY = set()
if BUCK: V.record_buck()
if MOSS: V.record_moss()
# record_moss writes into deck-02/voice; Moss's Deck 03 lines belong to deck-03
for f in os.listdir(os.path.join(V.RAW, 'deck-02/voice')):
    shutil.move(os.path.join(V.RAW, 'deck-02/voice', f), os.path.join(V.RAW, 'deck-03/voice', f))
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
def hear(p):
    segs, _ = m.transcribe(V.pcm16k(p), beam_size=5, language='en'); return ' '.join(s.text.strip() for s in segs)
for k, (t, w) in BUCK.items():
    takes = [os.path.join(V.RAW, w, f'{k}~{i}.mp3') for i in range(TAKES)]
    best = min(takes, key=lambda p: V.wer(t, hear(p)))
    shutil.move(best, os.path.join(V.RAW, w, k + '.mp3'))
    for p in takes:
        if os.path.exists(p): os.remove(p)
for d in ('deck-03/voice', 'core/voice'):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)
    for f in os.listdir(os.path.join(V.RAW, d)): shutil.copy(os.path.join(V.RAW, d, f), os.path.join(OUT, d, f))

# speech check (deck02_vo.check looks for Moss in deck-02/voice, so check here)
rp = os.path.join(HERE, 'deck03_lines_report.json'); rep = json.load(open(rp)) if ONLY and os.path.exists(rp) else {}
items = [(w, k, t, 'buck') for k, (t, w) in BUCK.items()] + [('deck-03/voice', k, t, 'moss') for k, t in MOSS.items()]
for w, k, t, kind in items:
    p = os.path.join(OUT, w, k + '.mp3')
    heard = hear(p); e = V.wer(t, heard); rep[f'{w}/{k}.mp3'] = {'kind': kind, 'wer': round(e, 3), 'text': t, 'heard': heard}
    print(f'{e:5.2f} {w}/{k}.mp3  heard: {heard}' + ('  <-- check' if e > .12 else ''))
json.dump(rep, open(rp, 'w'), indent=1)
