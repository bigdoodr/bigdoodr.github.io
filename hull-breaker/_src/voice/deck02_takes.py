"""Alternate takes of single log sentences, for Casey to pick by ear (speech recognition can't judge these).
    python3 deck02_takes.py      -> /tmp/takes/<log>_<A|B|C>.mp3 and takes.json"""
import json, os, sys
import numpy as np
sys.argv = sys.argv[:1] + ['none']
import deck02_vo as vo  # noqa: E402

TAKES = {
    'resident_b9': ('The Super is still in the boiler room.', 'af_jessica', [
        ('A', 'your spelling, as written: "boy-luhr"', None, None, 'The Super is still in the boy-luhr room.'),
        ('B', 'the same sound spelled out for the voice (BOY-lur)', 'bˈɔɪlɚ', 'bˈɔɪlʌɹ', None)]),
    'delacroix_boiler': ('He\'s been down here two days with that buffer rig, fighting the valve.', 'am_adam', [
        ('A', 'your spelling, as written: "vowel-vah"', None, None, 'He\'s been down here two days with that buffer rig, fighting the vowel-vah.'),
        ('B', 'the same sound spelled out for the voice (VAL-vuh)', 'vˈælv', 'vˈælvə', None)]),
}
os.makedirs('/tmp/takes', exist_ok=True); out = {}
for lid, (text, voice, takes) in TAKES.items():
    lang = vo.LANG(voice)
    for tag, desc, a0, b0, alt in takes:
        k = vo.kokoro(); sp = vo.SPEED.get(voice, 1.0) 
        if a0:
            ph = k.tokenizer.phonemize(text, lang); assert a0 in ph, (lid, ph); ph = ph.replace(a0, b0)
            a, _ = k.create(ph, voice=voice, speed=sp, lang=lang, is_phonemes=True)
        else:
            a, _ = k.create(alt or text, voice=voice, speed=sp, lang=lang)
        y = vo.trimx(a); y = np.concatenate([np.zeros(2400), y / np.abs(y).max() * .9, np.zeros(4800)])
        p = f'/tmp/takes/{lid}_{tag}.mp3'; vo.to_mp3(y, p, vo.RECORDER)
        out[f'{lid}_{tag}'] = dict(log=lid, tag=tag, desc=desc, text=text, voice=voice, path=p)
        print(lid, tag, desc)
json.dump(out, open('/tmp/takes/takes.json', 'w'), indent=1)
