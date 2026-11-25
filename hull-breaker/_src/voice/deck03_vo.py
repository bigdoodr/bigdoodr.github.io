"""Record Deck 03's Kokoro voices: Okafor's relay and the logs by the established cast (Marquez, Okafor, Sable).

    cd _src/voice && ln -s ~/kok kok      (the Kokoro model files, see README)
    python3 deck03_vo.py [logs] [relay] [check]      (default: all three)

Writes MP3s into _src/pack/deck03_raw/deck-03/{logs,voice}, where build_deck03.py picks them up, and a clarity
report (faster-whisper) to deck03_vo_report.json. Same recipe as deck02_vo.py: each sentence recorded on its
own with real silence between (punctuation makes none), the recorder filter, a click of tape at each end.
Volunteer speakers (Lindqvist, Castellanos, Haddad) are not recorded here; their logs stay placeholders
until the volunteers' takes arrive (drop them in deck03_raw/deck-03/logs/<id>.mp3).
Logs stay straight: feeling comes from delivery (a tremor, breath), never from pitch or speed."""
import json, os, re, subprocess, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, stft, istft

HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'pack'))
import deck03  # noqa: E402
RAW = os.path.join(HERE, '..', 'pack', 'deck03_raw')
for d in ('deck-03/voice', 'deck-03/logs'): os.makedirs(os.path.join(RAW, d), exist_ok=True)
WHAT = set(sys.argv[1:]) or {'logs', 'relay', 'check'}
rng = np.random.default_rng(33)
bp = lambda x, lo, hi, sr: sosfilt(butter(3, [lo, hi], 'band', fs=sr, output='sos'), x)
SR = 24000
VOICE = {'TECH L. MARQUEZ': 'am_puck', 'DR. N. OKAFOR': 'bf_emma', 'CORWIN SABLE, GORGON LIAISON': 'bm_george'}
LANG = lambda v: 'en-gb' if v[0] == 'b' else 'en-us'
SPEED = {'am_puck': 1.02, 'bf_emma': .95, 'bm_george': .93}   # as in Deck 01 and 02
RECORDER = "highpass=f=260,lowpass=f=3700,equalizer=f=1600:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4,asoftclip=type=tanh:threshold=0.9,loudnorm=I=-16:TP=-1.5"
SHAKY = {'trem': (6, .1), 'breathy': .16, 'gain': .9}
QUIET = {'trem': (5, .08), 'breathy': .22, 'gain': .82}
EMOTION = {   # log -> {sentence index: fx}
    'marquez_rooted': {-2: SHAKY, -1: dict(QUIET, breath=True)},
    'marquez_orchard': {-1: QUIET},
    'marquez_irrigation': {-1: SHAKY},
    'okafor_protocol': {-1: {'breathy': .12, 'gain': .92}},
    'okafor_relay': {-1: dict(QUIET, breath=True)},   # "Please."
}
# Voice-only respellings (the transcript keeps the real word), as in logs_vo.py's SAYFIX
# ' | ' makes a short pause inside a sentence (a comma alone is too quick in places Casey flagged).
SAYFIX = [('Ruin', 'Roo-in'), ('Lindqvist', 'Lind-kvist'), ('found Abernathy', 'found Abba-nathy'), ('Dr. ', 'Doctor '),
          ('years old, older', 'years old, | older'), ('samples: ', 'samples, | ')]
# Phoneme fixes, applied after phonemizing: "the oyster" ran together into "the-aster", and Compost took the British vowel.
# Okafor keeps the voice's own reading, "OCK-a-fuh" (Casey's pick, Nov 25): the series pronunciation.
PHONFIX = [('ðɪ ˈɔɪst', 'ðˈi ˈɔɪst'), ('kˈɒmpɒst', 'kˈɒmpəʊst')]
PAUSE = .26


def ff(inp, out, af=None, extra=()):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', inp] + (['-af', af] if af else []) + list(extra) + [out], check=True)


_K = None
def kokoro():
    global _K
    if _K is None:
        from kokoro_onnx import Kokoro
        _K = Kokoro('kok/kokoro-v1.0.onnx', 'kok/voices-v1.0.bin')
    return _K


def trimx(a):
    """Trim silence; the tail is cut tighter, with a short fade, because Kokoro leaves a little noise after short sentences."""
    a = a.astype(np.float64); pk = np.abs(a).max() + 1e-9; e = np.convolve(np.abs(a), np.ones(240) / 240, 'same'); on = np.where(e > pk * 0.02)[0]
    if not len(on): return a
    end = np.where(e > pk * 0.07)[0][-1] + int(SR * .07); a = a[max(0, on[0] - 100):min(len(a), end)] / pk
    f = min(len(a), int(SR * .05)); a[-f:] *= np.linspace(1, 0, f) ** 2
    return a


def whisp(x, sr):
    f, t, Z = stft(x, sr, nperseg=512, noverlap=384); Z = np.abs(Z) * np.exp(1j * rng.uniform(0, 2 * np.pi, Z.shape))
    _, y = istft(Z, sr, nperseg=512, noverlap=384); y = np.pad(y[:len(x)], (0, max(0, len(x) - len(y)))); y = bp(y, 700, 5000, sr)
    return y / (np.abs(y).max() + 1e-9)


def breath(sr, dur, amp):
    n = int(sr * dur); t = np.linspace(0, 1, n); x = bp(rng.standard_normal(n), 600, 2600, sr)
    return x / (np.abs(x).max() + 1e-9) * np.sin(np.pi * t) ** 1.6 * amp


def say(txt, voice, lang, speed, fx=None):
    fx = fx or {}
    for a0, b0 in SAYFIX: txt = txt.replace(a0, b0)
    chunks = []
    for part in txt.split(' | '):
        ph = kokoro().tokenizer.phonemize(part, lang).replace('ɪnðɪ ', 'ɪn ðɪ ')
        for a0, b0 in PHONFIX: ph = ph.replace(a0, b0)
        a, sr = kokoro().create(ph, voice=voice, speed=speed, lang=lang, is_phonemes=True)
        if chunks: chunks.append(np.zeros(int(sr * PAUSE)))
        chunks.append(trimx(a))
    a = np.concatenate(chunks)
    if fx.get('trem'):
        f0, d = fx['trem']; tt = np.arange(len(a)) / sr; a = a * (1 - d * (0.5 + 0.5 * np.sin(2 * np.pi * f0 * tt + rng.uniform(0, 6))))
    if fx.get('breathy'):
        env = np.convolve(np.abs(a), np.ones(480) / 480, 'same'); env /= env.max() + 1e-9; a = a / np.abs(a).max() + fx['breathy'] * whisp(a, sr) * np.sqrt(env)
    return a / np.abs(a).max() * fx.get('gain', 1.0)


def sentences(t):
    return [s for s in re.split(r'(?<=[.?!])\s+', t.strip()) if s]


def paced(text, voice, fxs=None, gap=.48):
    parts, ss = [], sentences(text.replace('Dr. ', 'Doctor '))   # before splitting, or "Dr." ends a sentence
    fxs = {(i if i >= 0 else len(ss) + i): f for i, f in (fxs or {}).items()}
    for i, s in enumerate(ss):
        if i:
            parts.append(np.zeros(int(SR * (gap + (.25 if i == len(ss) - 1 else 0)))))
            if fxs.get(i, {}).get('breath'): parts.append(breath(SR, .5, .14)); parts.append(np.zeros(int(SR * .12)))
        parts.append(say(s, voice, LANG(voice), SPEED.get(voice, 1.0), fxs.get(i)))
    return np.concatenate(parts)


def tape(y):
    """Tape clicks and hiss at each end, a little crackle throughout (the recorder)."""
    pre = bp(rng.standard_normal(int(SR * .28)), 500, 3600, SR); pre /= np.abs(pre).max(); pre *= np.linspace(1, .2, len(pre)) * .35
    post = bp(rng.standard_normal(int(SR * .22)), 500, 3600, SR); post /= np.abs(post).max(); post *= np.linspace(.2, 1, len(post)) * .3
    gap = np.zeros(int(SR * .12)); y = np.concatenate([pre, gap, y / np.abs(y).max() * .9, gap * 2, post])
    hiss = bp(rng.standard_normal(len(y)), 300, 3800, SR); y += hiss / np.abs(hiss).max() * .018
    for _ in range(int(len(y) / SR * 1.5)):
        p = rng.integers(0, len(y) - 40); y[p:p + 3] += rng.uniform(-.25, .25)
    return y


def to_mp3(y, out):
    sf.write('/tmp/v3.wav', y / (np.abs(y).max() + 1e-9) * .95, SR)
    ff('/tmp/v3.wav', out, RECORDER, ['-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '32k'])


LOGS = json.load(open(os.path.join(HERE, '..', 'pack', 'deck03_logs.json')))


def record_logs():
    for lid, L in LOGS.items():
        v = VOICE.get(L['speaker'])
        if not v: print('volunteer', lid); continue
        to_mp3(tape(paced(L['text'], v, EMOTION.get(lid))), os.path.join(RAW, 'deck-03/logs', lid + '.mp3'))
        print('log', lid, v)


def record_relay():
    y = tape(paced(deck03.OKAFOR['okafor_relay'], 'bf_emma', EMOTION['okafor_relay'], gap=.44))
    to_mp3(y, os.path.join(RAW, 'deck-03/voice', 'okafor_relay.mp3')); print('relay', round(len(y) / SR, 1), 's')


def norm(t): return re.sub(r"[^a-z0-9' ]", ' ', t.lower().replace('-', ' ')).split()


def wer(ref, hyp):
    r, h = norm(ref), norm(hyp); d = np.arange(len(h) + 1)
    for i in range(1, len(r) + 1):
        prev, d[0] = d.copy(), i
        for j in range(1, len(h) + 1): d[j] = min(prev[j] + 1, d[j - 1] + 1, prev[j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def check():
    from faster_whisper import WhisperModel
    m = WhisperModel('small.en', device='cpu', compute_type='int8'); rep = {}
    items = [(os.path.join(RAW, 'deck-03/logs', k + '.mp3'), L['text']) for k, L in LOGS.items() if L['speaker'] in VOICE]
    items.append((os.path.join(RAW, 'deck-03/voice', 'okafor_relay.mp3'), deck03.OKAFOR['okafor_relay']))
    for path, text in items:
        raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        segs, _ = m.transcribe(np.frombuffer(raw, np.float32).copy(), beam_size=5, language='en')
        heard = ' '.join(s.text.strip() for s in segs); e = wer(text, heard)
        rep[os.path.relpath(path, RAW)] = {'wer': round(e, 3), 'text': text, 'heard': heard}
        print(f'{e:5.2f} {os.path.relpath(path, RAW)}' + ('  <-- check' if e > .12 else ''))
    json.dump(rep, open(os.path.join(HERE, 'deck03_vo_report.json'), 'w'), indent=1)


if 'logs' in WHAT: record_logs()
if 'relay' in WHAT: record_relay()
if 'check' in WHAT: check()
