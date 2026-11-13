"""Rewrites core/sfx/static.wav as a short radio squelch (0.25 s) and updates its sfx.json entry.
The old file was 5.6 s of continuous white noise. The engine plays it under every Moss line (Game.say) and on every
spitter hiss, so on headphones it read as constant static. Moss's own clips now carry their key-up and tail bursts (deck02_vo.py).
   python3 static_squelch.py [core_dir]"""
import json, os, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt
core = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'packs-1.3', 'core')
SR, N = 22050, int(22050 * .25)
rng = np.random.default_rng(4)
y = sosfilt(butter(3, [700, 3200], 'band', fs=SR, output='sos'), rng.standard_normal(N))
a = int(SR * .006); env = np.exp(-np.linspace(0, 6, N)); env[:a] *= np.linspace(0, 1, a); env[-int(SR * .02):] *= np.linspace(1, 0, int(SR * .02))
y = y * env; y = y / np.abs(y).max() * .9
with wave.open(os.path.join(core, 'sfx', 'static.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype('<i2').tobytes())
p = os.path.join(core, 'sfx.json'); s = json.load(open(p))
s['sounds']['static'].update(gain=0.1, seconds=round(N / SR, 3))
open(p, 'w').write(json.dumps(s, indent=1, ensure_ascii=False) + '\n')
print('static.wav', N / SR, 's')
