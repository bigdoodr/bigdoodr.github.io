"""Records the engine 1.6 lines for Deck 02 with deck02_vo.py's own pipeline: Buck's four Super phase lines
(BUCK-VOICE through the voice lab's BuckDSP) and Moss's line at the locked Super's Office (af_bella, radio filter).
    cd _src/voice && ln -s ~/kok kok && python3 deck02_v16_vo.py
Writes the MP3s to _src/pack/deck02_v16_voice/, where deck02_v16.py picks them up, then speech-checks them."""
import os, shutil, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__))
sys.argv = [sys.argv[0], 'none']          # import deck02_vo without running any of its own recordings
sys.path.insert(0, HERE)
import deck02_vo as V                      # noqa: E402
import stems                               # noqa: E402

BUCK = {'phase_buffer': "That's gonna void the warranty.",
        'phase_armL': "That's one arm. The lease says I take both.",
        'phase_hoses': 'Shutting off your utilities.',
        'phase_armR': 'Nothing left but the deposit.'}
MOSS = {'moss_office': 'Hollis was always locking himself out. Mensah kept his spare in the Chapel.'}
# Nov 20: "Lease says I take both." came out "Lee says" in every take (Buck's growl eats the s); with "The" Whisper hears it right
V.BUCKSEG["That's one arm. The lease says I take both."] = ["That's one arm.", .45, "The lease says I take both."]
ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))
if ONLY:
    BUCK = {k: v for k, v in BUCK.items() if k in ONLY}; MOSS = {k: v for k, v in MOSS.items() if k in ONLY}

out = os.path.join(HERE, '..', 'pack', 'deck02_v16_voice'); os.makedirs(out, exist_ok=True)
V.RAW = tempfile.mkdtemp(); os.makedirs(os.path.join(V.RAW, 'deck-02/voice'))
V.BUCK_LINES = {k: (t, 'deck-02/voice') for k, t in BUCK.items()}
V.deck02.MOSS = MOSS
V.LOGS = {}
V.record_buck()
V.record_moss()
for f in os.listdir(os.path.join(V.RAW, 'deck-02/voice')): shutil.copy(os.path.join(V.RAW, 'deck-02/voice', f), out)
V.BUCK_ONLY = set()   # check every new line (deck02_vo's ONLY mode reads a report this script doesn't keep)
V.check()
shutil.move(os.path.join(HERE, 'deck02_vo_report.json'), os.path.join(HERE, 'deck02_v16_vo_report.json'))
