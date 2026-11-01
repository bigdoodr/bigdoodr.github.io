"""Record Deck 02's voices: Buck's new lines (BUCK-VOICE), Moss on the radio, and the 15 logs.

    cd _src/voice && ln -s ~/kok kok      (the Kokoro model files, see README)
    python3 deck02_vo.py [buck] [moss] [logs] [check]     (default: all four)

Writes MP3s into _src/pack/deck02_raw/{deck-02/voice, deck-02/logs, core/voice}, where
build_deck02.py picks them up, and a clarity report (faster-whisper) to deck02_vo_report.json.
Buck goes through the voice lab's BuckDSP with the locked settings, exactly as bake.py does.
Pauses are real silence between separately recorded segments (punctuation makes none)."""
import asyncio, base64, json, os, re, subprocess, sys, wave
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, stft, istft

HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..', 'pack'))
import deck02  # noqa: E402
RAW = os.path.join(HERE, '..', 'pack', 'deck02_raw')
for d in ('deck-02/voice', 'deck-02/logs', 'core/voice'): os.makedirs(os.path.join(RAW, d), exist_ok=True)
WHAT = set(sys.argv[1:]) or {'buck', 'moss', 'logs', 'check'}
BUCK_VOICE = {"voice": "michael", "pitch": -11, "pace": 95, "size": 87, "inton": 100, "hoarse": 37, "growl": 55, "breath": 61,
              "grit": 54, "low": 9.5, "mud": 3.5, "pres": 6, "bright": 5300, "comp": 50}
rng = np.random.default_rng(22)
bp = lambda x, lo, hi, sr: sosfilt(butter(3, [lo, hi], 'band', fs=sr, output='sos'), x)
SR = 24000


def ff(inp, out, af=None, extra=()):
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', inp] + (['-af', af] if af else []) + list(extra) + [out]
    subprocess.run(cmd, check=True)


# ---------------- Buck ----------------
# Segments: text, or a pause in seconds. Lines not listed are recorded whole.
BUCKSEG = {
    "Habitation spine. Rent's due.": ["Habitation.", .12, "Spine.", .5, "Rent's due."],
    'Orange jumpsuit. Noted.': ["Orange jumpsuit.", .45, "Noted."],
    'Commissary. Somebody left a tab open.': [('ph', 'kˈɑːməsˌɛɹi.', .95), .4, "Somebody left a tab open."],
    'Flushing out the tenants.': ["Flushing out the tennants."],
    'No lifeguard on duty. Swim at your own risk.': ["No lifeguard on duty.", .4, "Swim at your own risk."],
    "Master key. The Super won't mind. Much.": ["Master key.", .45, "The Super won't mind.", .4, "Much."],
    "Locked. The Super's got the key.": ["Locked.", .4, "The Super's got the key."],
    "Live wires in that water. Hard pass.": [('ph', 'lˈaɪv wˈaɪɚz ɪn ðæt wˈɔːɾɚ.', .88), .4, "Hard pass."],
    "Double feature. I've seen how both of them end.": ["Double feature.", .45, "I've seen how both of them end."],
    "One cold one. Then I let this all blow over.": ["One cold one.", .45, "Then I let this all blow over."],
    "Rise and shine. Or not.": ["Rise and shine.", .5, "Or not."],
    "Steel toes, steel heels. Let's see who's playing dead.": ["Steel toes, steel heels.", .4, "Let's see who's playing dead."],
}
BUCK_ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))
BUCK_LINES = {**{k: (v, 'deck-02/voice') for k, v in deck02.LINES.items()},
              **{k: (v, 'core/voice') for k, v in deck02.ACH_LINES.items()},
              'get_boots': ("Steel toes, steel heels. Let's see who's playing dead.", 'core/voice')}


def record_buck():
    os.makedirs('kok', exist_ok=True) if not os.path.exists('kok') else None
    import stems
    stems.BUCKSEG.update(BUCKSEG)
    lines = {k: v for k, v in BUCK_LINES.items() if not BUCK_ONLY or k in BUCK_ONLY}
    texts = [t for t, _ in lines.values()]
    clips = [stems.dry(t, 'michael') for t in texts]
    tpl = open(os.path.join(HERE, '..', 'pages', 'lab_template.html'), encoding='utf-8').read()
    lab = {'sr': SR, 'lines': texts[:1], 'voices': {'michael': {'name': 'Michael', 'desc': '', 'clips': clips[:1]}}}
    page = os.path.join('/tmp', 'buck_lab.html'); open(page, 'w').write(tpl.replace('__STEMS__', json.dumps(lab)))
    from playwright.async_api import async_playwright

    async def run():
        async with async_playwright() as p:
            b = await p.chromium.launch(); pg = await b.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('file://' + page); await pg.wait_for_timeout(800)
            out = await pg.evaluate("""([cl,txt,P])=>cl.map((c,i)=>{const y=BuckDSP.render(BuckDSP.decodeClip(c),P,txt[i]);
                const b=new Int16Array(y.length);for(let k=0;k<y.length;k++)b[k]=Math.max(-32767,Math.min(32767,Math.round(y[k]*32767)));
                let s='';const u=new Uint8Array(b.buffer);for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode.apply(null,u.subarray(k,k+8192));return btoa(s);})""",
                                    [clips, texts, BUCK_VOICE])
            await b.close()
            if errs: print('lab errors', errs)
            return out
    out = asyncio.run(run())
    for (lid, (t, where)), b64 in zip(lines.items(), out):
        w = wave.open('/tmp/b.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(base64.b64decode(b64)); w.close()
        ff('/tmp/b.wav', os.path.join(RAW, where, lid + '.mp3'), extra=['-c:a', 'libmp3lame', '-b:a', '56k'])
        print('buck', lid)


# ---------------- shared voice helpers (as in logs_vo.py) ----------------
_K = None
def kokoro():
    global _K
    if _K is None:
        from kokoro_onnx import Kokoro
        _K = Kokoro('kok/kokoro-v1.0.onnx', 'kok/voices-v1.0.bin')
    return _K


def trimx(a):
    a = a.astype(np.float64); pk = np.abs(a).max() + 1e-9; e = np.convolve(np.abs(a), np.ones(240) / 240, 'same'); on = np.where(e > pk * 0.02)[0]
    return a[max(0, on[0] - 100):on[-1] + 200] / pk if len(on) else a


def whisp(x, sr):
    f, t, Z = stft(x, sr, nperseg=512, noverlap=384); Z = np.abs(Z) * np.exp(1j * rng.uniform(0, 2 * np.pi, Z.shape))
    _, y = istft(Z, sr, nperseg=512, noverlap=384); y = np.pad(y[:len(x)], (0, max(0, len(x) - len(y)))); y = bp(y, 700, 5000, sr); return y / (np.abs(y).max() + 1e-9)


def breath(sr, dur, amp, sigh=False):
    n = int(sr * dur); t = np.linspace(0, 1, n); env = (np.sin(np.pi * t) ** (1.6 if not sigh else 1.0)) * (1 - 0.4 * t if sigh else 1)
    x = bp(rng.standard_normal(n), 350 if sigh else 600, 1800 if sigh else 2600, sr); x /= np.abs(x).max() + 1e-9; return x * env * amp


# (word in the text, phonemes as Kokoro writes them, the fix). Applied only to sentences containing the word.
PHFIX = [
    ('Blocks A and B', ' ɐ and ', ' ˈeɪ ænd '),      # the letter A, not the article (Casey, Oct 31)
    ('boiler', 'bˈɔɪlɚ', 'bˈɔɪlʌɹ'),                    # BOY-lur: Casey's pick (Oct 31); the default came out "bailer"
    ('Hollis', 'hˈɑːliz', 'hˈɑːlɪs'),                   # heard as "haul-lease"
    ('Hollis', 'hˈɑlɪz', 'hˈɑːlɪs'),
    ('eset', 'ɹᵻsˈɛt', 'ɹˈiːsɛt'),                      # "ree-set", not "ri-set"
    ('fighting the valve', 'vˈælv', 'vˈælvə'),          # VAL-vuh, then the "uh" trimmed (TAILTRIM): Casey's take D (Oct 31)
]
# (words in the sentence, seconds cut from its end, with a 15 ms fade). The recorder filter swallows a bare final v.
TAILTRIM = [('fighting the valve', .08)]


def say(txt, voice, lang, speed, fx=None):
    fx = fx or {}
    fixes = [f for f in PHFIX if f[0] in txt]
    if fixes:
        ph = kokoro().tokenizer.phonemize(txt, lang)
        for _, a0, b0 in fixes: ph = ph.replace(a0, b0)
        a, sr = kokoro().create(ph, voice=voice, speed=speed, lang=lang, is_phonemes=True)
    else:
        a, sr = kokoro().create(txt, voice=voice, speed=speed, lang=lang)
    a = trimx(a)
    for w, cut in TAILTRIM:
        if w in txt:
            a = a[:len(a) - int(SR * cut)].copy(); f = int(SR * .015); a[-f:] *= np.linspace(1, 0, f)
    if fx.get('trem'):
        f0, d = fx['trem']; tt = np.arange(len(a)) / sr; a = a * (1 - d * (0.5 + 0.5 * np.sin(2 * np.pi * f0 * tt + rng.uniform(0, 6))))
    if fx.get('breathy'):
        env = np.convolve(np.abs(a), np.ones(480) / 480, 'same'); env /= env.max() + 1e-9; a = a / np.abs(a).max() + fx['breathy'] * whisp(a, sr) * np.sqrt(env)
    return a / np.abs(a).max() * fx.get('gain', 1.0)


def sentences(t):
    return [s for s in re.split(r'(?<=[.?!])\s+', t.strip()) if s]


def paced(text, voice, lang, speed, fx_by_sentence=None, gap=.42, extra_gap=None):
    """Each sentence recorded on its own with real silence between them; questions and
    the last line get a little more air. fx_by_sentence maps a sentence index (negative ok) to fx."""
    parts, ss = [], sentences(text)
    fx_by_sentence = {(i if i >= 0 else len(ss) + i): f for i, f in (fx_by_sentence or {}).items()}
    for i, s in enumerate(ss):
        if i:
            g = (extra_gap or {}).get(i, gap + (.18 if ss[i - 1].endswith('?') else 0) + (.25 if i == len(ss) - 1 else 0))
            if ss[i - 1].endswith('Hollis?'): g = gap * .8   # Casey: the pause after it ran long
            parts.append(np.zeros(int(SR * g)))
            if fx_by_sentence.get(i, {}).get('breath'): parts.append(breath(SR, .5, .14)); parts.append(np.zeros(int(SR * .12)))
        parts.append(say(s, voice, lang, speed, fx_by_sentence.get(i)))
    return np.concatenate(parts)


def to_mp3(y, out, af, br='32k'):
    sf.write('/tmp/v.wav', y / (np.abs(y).max() + 1e-9) * .95, SR)
    ff('/tmp/v.wav', out, af, ['-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', br])


# ---------------- Moss (af_bella through a radio) ----------------
RADIO = "highpass=f=320,lowpass=f=3200,acrusher=bits=10:mix=0.25,acompressor=threshold=-18dB:ratio=5:attack=3:release=90:makeup=5,asoftclip=type=tanh:threshold=0.85,loudnorm=I=-16:TP=-1.5"


def record_moss():
    for lid, text in deck02.MOSS.items():
        if BUCK_ONLY and lid not in BUCK_ONLY: continue
        y = paced(text, 'af_bella', 'en-us', 1.04, gap=.32)
        y = y / np.abs(y).max() * .85
        key = bp(rng.standard_normal(int(SR * .12)), 800, 3000, SR); key = key / np.abs(key).max() * .35 * np.linspace(1, .1, len(key))
        tail = bp(rng.standard_normal(int(SR * .1)), 800, 3000, SR); tail = tail / np.abs(tail).max() * .3 * np.linspace(.1, 1, len(tail))
        y = np.concatenate([key, np.zeros(int(SR * .06)), y, np.zeros(int(SR * .08)), tail])
        hiss = bp(rng.standard_normal(len(y)), 500, 3200, SR); y += hiss / np.abs(hiss).max() * .03
        to_mp3(y, os.path.join(RAW, 'deck-02/voice', lid + '.mp3'), RADIO, '40k')
        print('moss', lid)


# ---------------- logs (the recorder filter, as Deck 01) ----------------
RECORDER = "highpass=f=260,lowpass=f=3700,equalizer=f=1600:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4,asoftclip=type=tanh:threshold=0.9,loudnorm=I=-16:TP=-1.5"
LOGS = json.load(open(os.path.join(HERE, '..', 'pack', 'deck02_logs.json')))
VOICES = LOGS.pop('_voices')
LANG = lambda v: 'en-gb' if v[0] == 'b' else 'en-us'
SPEED = {'am_echo': 1.0, 'am_adam': .97, 'bm_george': .93, 'bf_isabella': .92, 'af_heart': .95, 'af_jessica': .98, 'bm_fable': .94}
SHAKY = {'trem': (6, .1), 'breathy': .16, 'gain': .9}
QUIET = {'trem': (5, .08), 'breathy': .22, 'gain': .82}
EMOTION = {   # log -> {sentence index: fx}; logs stay straight, the feeling comes from delivery only
    'mother_a7': {-3: SHAKY, -2: SHAKY, -1: dict(QUIET, breath=True)},
    'daycare': {-2: SHAKY, -1: dict(QUIET, breath=True)},
    'delacroix_boiler': {-2: SHAKY, -1: dict(QUIET, breath=True)},
    'projectionist': {-1: dict(QUIET, breath=True)},
    'lifeguard': {-1: SHAKY},
    'oduya_laundry': {-2: SHAKY, -1: QUIET},
    'chaplain': {-1: {'breathy': .12, 'gain': .92}},
    'mother_a3': {-1: SHAKY},
}


def record_logs():
    for lid, L in LOGS.items():
        if BUCK_ONLY and lid not in BUCK_ONLY: continue
        v = VOICES[L['speaker']]
        y = paced(L['text'], v, LANG(v), SPEED.get(v, 1.0), EMOTION.get(lid), gap=.48)
        pre = bp(rng.standard_normal(int(SR * .28)), 500, 3600, SR); pre /= np.abs(pre).max(); pre *= np.linspace(1, .2, len(pre)) * .35
        post = bp(rng.standard_normal(int(SR * .22)), 500, 3600, SR); post /= np.abs(post).max(); post *= np.linspace(.2, 1, len(post)) * .3
        gap = np.zeros(int(SR * .12)); y = np.concatenate([pre, gap, y / np.abs(y).max() * .9, gap * 2, post])
        hiss = bp(rng.standard_normal(len(y)), 300, 3800, SR); y += hiss / np.abs(hiss).max() * .018
        for _ in range(int(len(y) / SR * 1.5)):
            p = rng.integers(0, len(y) - 40); y[p:p + 3] += rng.uniform(-.25, .25)
        out = os.path.join(RAW, 'deck-02/logs', lid + '.mp3'); to_mp3(y, out, RECORDER)
        print('log', lid, v)


# ---------------- clarity check ----------------
def norm(t): return re.sub(r"[^a-z0-9' ]", ' ', t.lower().replace('-', ' ')).split()


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp); d = np.arange(len(h) + 1)
    for i in range(1, len(r) + 1):
        prev, d[0] = d.copy(), i
        for j in range(1, len(h) + 1): d[j] = min(prev[j] + 1, d[j - 1] + 1, prev[j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def pcm16k(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def check():
    from faster_whisper import WhisperModel
    m = WhisperModel('small.en', device='cpu', compute_type='int8'); rep = {}
    items = [(os.path.join(RAW, w, k + '.mp3'), t, 'buck') for k, (t, w) in BUCK_LINES.items()]
    if BUCK_ONLY:
        old = json.load(open(os.path.join(HERE, 'deck02_vo_report.json')))
    items += [(os.path.join(RAW, 'deck-02/voice', k + '.mp3'), t, 'moss') for k, t in deck02.MOSS.items()]
    items += [(os.path.join(RAW, 'deck-02/logs', k + '.mp3'), L['text'], 'log') for k, L in LOGS.items()]
    if BUCK_ONLY: items = [i for i in items if os.path.basename(i[0])[:-4] in BUCK_ONLY]
    else: old = {}
    rep.update(old)
    for path, text, kind in items:
        if not os.path.exists(path): continue
        segs, _ = m.transcribe(pcm16k(path), beam_size=5, language='en'); heard = ' '.join(s.text.strip() for s in segs)
        e = wer(text, heard); rep[os.path.relpath(path, RAW)] = {'kind': kind, 'wer': round(e, 3), 'text': text, 'heard': heard}
        flag = '  <-- check' if e > .12 else ''
        print(f'{e:5.2f} {os.path.relpath(path, RAW)}{flag}')
    json.dump(rep, open(os.path.join(HERE, 'deck02_vo_report.json'), 'w'), indent=1)


if 'buck' in WHAT: record_buck()
if 'moss' in WHAT: record_moss()
if 'logs' in WHAT: record_logs()
if 'check' in WHAT: check()
