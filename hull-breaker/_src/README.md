# Hull Breaker — source and tools

`../index.html` is the whole game: one self-contained page (engine, level data, art, Buck's voice lines and the audio logs, all inlined). Jekyll does not publish this `_src` folder; it lives here so future development sessions can rebuild content the same way.

The series bible (story, characters, lore facts, deck outlines, rules for continuity) is kept in the Claude project for Hull Breaker, not in this repo, so the public site doesn't spoil the story.

## Layout

| Path | What it is |
|---|---|
| `level/build_level.py` | Builds Deck 01 as two ASCII layers (geometry + objects) plus zone data → `level.json`. Read its header comments for the character legend. |
| `level/validate.py` | Checks a level: doors sit between floors, nothing inside walls, every object reachable, key progression (B → power → Y → R → override) completes. Renders `map.png`. |
| `level/level.json` | Deck 01 as shipped. Embedded in `index.html` as `const LEVEL=…`. |
| `voice/stems.py` | Records clean Kokoro takes and pitch marks. `python3 stems.py lab` builds the Buck Voice Lab stems; `python3 stems.py bake <voice> <lines.json> <out.json>` records game lines. `BUCKSEG` holds per-line pauses and phoneme overrides (e.g. "repossessed" = `ɹˌiːpəzˈɛst`). |
| `voice/bake.py` | Renders recorded stems through the Buck Voice Lab DSP in headless Chromium so game audio matches the lab exactly. Edit its `F` path to point at a built lab page. |
| `voice/logs_vo.py` | Records the audio logs: one Kokoro voice per speaker, recorder filter, `SEGS` for pauses, breaths, sighs, gasps and light emotion. `python3 logs_vo.py [log ids…]` re-records only those logs. |
| `voice/pool_vo.py` | Records the casting-pool sample for every English Kokoro voice. |
| `voice/logs_text.json` | Deck 01 log headers and scripts (the subtitles). |
| `pages/lab_template.html` | Buck Voice Lab page (fill `__STEMS__` with `lab_stems.json`). Its `BuckDSP` script is the reference voice processor. |
| `pages/review_template.html` | Log voice review page template. |

## Buck's voice (locked)

```
BUCK-VOICE {"voice":"michael","pitch":-11,"pace":95,"size":87,"inton":100,"hoarse":37,"growl":55,"breath":61,"grit":54,"low":9.5,"mud":3.5,"pres":6,"bright":5300,"comp":50}
```

Rules learned the hard way:
- Kokoro mispronounces some words; fix with phonemes in `BUCKSEG` (`is_phonemes=True`), not respellings, and confirm with speech recognition after processing.
- Punctuation does not create pauses. Record each side separately and insert silence.
- Buck's growl turns a bare "Ow" into "now". Use "Ouch!".
- Emotion comes only from post-processing (tremble, breath, softer gain, gentle slowdown). Never raise pitch with resampling; it makes voices sound like children.

## Requirements

Python 3 with `kokoro-onnx`, `soundfile`, `praat-parselmouth`, `scipy`, `numpy`, `faster-whisper` (clarity checks), `playwright` (Chromium), and `ffmpeg`. Kokoro model files: `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the `thewh1teagle/kokoro-onnx` GitHub releases (`model-files-v1.0`), placed in `kok/`.
