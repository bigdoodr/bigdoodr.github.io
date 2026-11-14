"""Record Deck 01's opening cut scene lines: three Buck lines (BUCK-VOICE) and the Gorgon Dispatch order (bf_alice, clean).
    cd _src/voice && ln -s ~/kok kok && python3 opening_vo.py <out_dir>
Writes <out_dir>/voice/*.mp3, then whisper-checks them."""
import os, sys
out = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else '/tmp/opening_vo'
sys.argv = ['x', 'none']                      # deck02_vo runs its jobs from argv at import; ask for none
import deck02_vo as V                         # noqa: E402
BUCK = {"opening_nine_days": "Nine days with no contact... Somebody's behind on more than rent.",
        "opening_clamps": "Clamps are holding. Lights aren't. Nobody's home.",
        "opening_not_on_order": "Those aren't on the work order."}
ORDER = "Agent Hammersmith. Account: Brimstone Maiden. Status: delinquent. Last contact, nine days ago. Recover the vessel. Payment plans are not authorized."
V.BUCKSEG[BUCK['opening_nine_days']] = ['Nine days with no contact.', .65, "Somebody's behind on more than", .08, 'rent.']
V.RAW = out; os.makedirs(os.path.join(out, 'voice'), exist_ok=True)
V.BUCK_LINES = {k: (t, 'voice') for k, t in BUCK.items()}; V.BUCK_ONLY = set()
V.record_buck()
y = V.paced(ORDER, 'bf_alice', 'en-gb', 0.95, gap=.4)
V.to_mp3(y, os.path.join(out, 'voice', 'opening_order.mp3'), 'loudnorm=I=-16:TP=-1.5', br='56k')
# clarity check
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
for k, t in {**BUCK, 'opening_order': ORDER}.items():
    segs, _ = m.transcribe(V.pcm16k(os.path.join(out, 'voice', k + '.mp3')), beam_size=5, language='en')
    heard = ' '.join(s.text.strip() for s in segs); e = V.wer(t, heard)
    print(f'{e:5.2f} {k}: {heard}' + ('   <-- check' if e > .12 else ''))
