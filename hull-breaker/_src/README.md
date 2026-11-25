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
| `pack/FORMAT.md` | The deck pack format (version 1): what the native apps download and the web game will read. Start here for engine or pack work. |
| `pack/dump.py` | Runs the shipped `index.html` in headless Chromium and dumps its data, art, voices, logs and rendered sounds to a raw folder. |
| `pack/extract.py` | Builds `../packs/` (catalog, `core`, `deck-01`) from the dump plus `pack/deck01.py`, Deck 01's rules written as data. |
| `pack/validate_pack.py` | Checks hashes and cross-references, the map, and runs the deck's rules to prove a win and 100% on every difficulty. |
| `pack/parity.py` | Starts the real game on every difficulty and checks it spawns exactly what the pack says. |
| `pack/keep_unchanged.py` | After a re-extract, keeps unchanged media byte-for-byte from the last release and rewrites manifests and the catalog. |

## WebAssembly beta

`../wasm/` is the Swift engine compiled to WebAssembly with a JavaScript shell (Phase 4 of the platforms plan), served at `bigdoodr.github.io/hull-breaker/wasm/` and reading `../packs-1.7/` (engine 1.7 since Nov 22, 2026). Its source is in the Apple repo (`bigdoodr/hull-breaker-apple`, `Web/` and `Sources/HullBreakerWeb/`); rebuild with `Web/build.sh <site>/hull-breaker/wasm` there rather than editing the copies here. Its saves use `hbw-` keys, apart from this game's `hb-` keys.

## Pack folders by engine

| Folder | Read by | Notes |
|---|---|---|
| `../packs/` | engine 1.2 TestFlight builds | being retired |
| `../packs-1.3/` | the JavaScript web game, engine 1.3–1.4 builds | |
| `../packs-1.5/` | engine 1.5 builds and the WebAssembly beta | cut scenes |
| `../packs-1.6/` | engine 1.6 builds | the Super broken part by part, the office valve puzzle, Moss at the locked office. Built from packs-1.5 by `pack/deck02_v16.py` (re-runnable); its voices by `voice/deck02_v16_vo.py`. |
| `../packs-1.7/` | engine 1.7 builds and the Wasm beta | Deck 03 (Root Cause), the Purge Torch, rooters, Mother Root. Built from packs-1.6 by `pack/build_deck03.py` (re-runnable) with `level/deck03/build_level.py` and `pack/deck03.py`; core 1.5.1, Deck 03 1.0.2. Logs 1–4, 6, 10 and 13 and Okafor's relay are recorded (`voice/deck03_vo.py`); the volunteer logs, Buck and Moss lines and most art are still placeholders. |

Until the WebAssembly build replaces the web game, a fix to Deck 01 or Deck 02 data goes into every folder that carries that deck (re-run `deck02_v16.py` after changing packs-1.5).

## Deck packs

`../packs/` is public (GitHub Pages serves it at `bigdoodr.github.io/hull-breaker/packs/`), so a deck's story goes public when its pack is pushed. Packs go up when a deck goes into testing (Casey, Nov 22, 2026). Rebuild and check Deck 01's pack with:

```
cd _src/pack
cp -r ../../packs /tmp/packs_prev
python3 dump.py raw && python3 extract.py raw ../../packs
python3 keep_unchanged.py /tmp/packs_prev ../../packs
python3 validate_pack.py && python3 parity.py
```

The game draws its art and sounds with random grime and noise, so a fresh dump changes every PNG and WAV a little. `keep_unchanged.py` puts the previous release's bytes back for files that already existed, so apps only download what really changed. Name a file after the folders to keep its new version (a texture changed on purpose).

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

Python 3 with `kokoro-onnx`, `soundfile`, `pillow`, `praat-parselmouth`, `scipy`, `numpy`, `faster-whisper` (clarity checks), `playwright` (Chromium), and `ffmpeg`. Kokoro model files: `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the `thewh1teagle/kokoro-onnx` GitHub releases (`model-files-v1.0`), placed in `kok/`.
