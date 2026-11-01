# Hull Breaker deck pack format, version 1 (engine 1.2)

A deck pack is everything one deck needs, as data and media files, with no code. The native apps download packs from GitHub Pages and the web game will read the same files. App Review guideline 2.5.2 forbids downloading code that changes features, so packs only describe a deck in a fixed vocabulary that the engine already understands. New mechanics (an enemy behavior, a weapon, a boss, a new rule verb) need an engine update, and a pack that uses them raises its `minEngine`.

Packs are published from this repo at `https://bigdoodr.github.io/hull-breaker/packs/`. Push a deck's pack only when the deck ships: everything under `packs/` is public, logs included.

## Layout

```
packs/
  catalog.json            what exists, newest versions, the 12-deck list
  core/                   shared by every deck
    manifest.json
    art.json              textures, floors, ceilings, sprites
    sfx.json              sound effects and music loops
    lines.json            Buck's shared lines (kill quips, secrets, weapon pickups, deck clear...)
    tuning.json           difficulty table, enemies, weapons, items, ranks
    achievements.json     series-wide achievements (engine 1.1)
    strings.json          engine messages (ACCESS GRANTED, CHECKPOINT SAVED...)
    textures/ floors/ sprites/ sfx/ voice/
  deck-01/
    manifest.json
    deck.json             identity, intro/outro, legend, locks, state, rules, ambushes, guide
    level.json            the map: geometry and object layers, zones, placed logs and asset tags
    logs.json             audio logs: header, speaker, subtitle text, audio file, archive order
    lines.json            Buck lines only this deck uses
    logs/ voice/
```

A deck may also ship its own `textures/`, `sprites/` and `sfx/` with an `art.json` or `sfx.json` of the same shape; ids it defines win over core ids. Line ids prefixed `core:` always mean core.

## Versioning and downloads

- Every JSON file starts with `"format": 1` where it has a top-level object for it (`catalog`, `manifest`, `deck`). A reader rejects a higher major format.
- `version` is semver per pack. Bump the patch for fixes (a typo, a re-recorded line), minor for added content, major for anything that breaks saves (moved objects, renamed zones).
- `minEngine` is the lowest engine version that can play the pack. An app that is older shows the deck as "Update required" instead of downloading it.
- `requires` names the core version a deck was built against.
- Download order: fetch `catalog.json`; for each pack whose `version` is newer than the cached one, fetch its `manifest.json`, check it against `manifestSha256`, then fetch each file whose `sha256` differs from the cached copy, verify it, and swap the pack in only when every file checks out. tvOS may purge the cache while the app is closed; the app re-downloads on next launch.

### catalog.json

```json
{"format":1, "game":"hull-breaker", "baseUrl":"https://bigdoodr.github.io/hull-breaker/packs/",
 "packs":[{"id":"core","kind":"core","version":"1.0.0","minEngine":"1.0","bytes":5060000,
           "manifest":"core/manifest.json","manifestSha256":"..."},
          {"id":"deck-01","kind":"deck","deck":1, ...}],
 "decks":[{"deck":1,"title":"Repo Day","place":"Docking Ring","blurb":"...","pack":"deck-01"},
          {"deck":2,"title":"Hostile Tenancy", ..., "pack":null}]}
```

`decks` always lists all 12. `pack: null` shows as "In production" in Deck Select.

### manifest.json

`{format, id, kind, version, minEngine, title, [deck, place, requires], bytes, files:[{path, bytes, sha256}]}`. Every file in the pack folder except the manifest is listed.

## Coordinates and shared conventions

- The map is a grid. Cell `(x, y)` covers `x..x+1`, `y..y+1`; entities stand at cell centers (`x+.5`). `y` grows southward. Angles are radians, 0 = east.
- Colors are `"#rrggbb"` or `[r, g, b]` floats (0..1, may exceed 1 for lights).
- Text is English. `{name}` in a message or objective is replaced with that counter's value (`{breakers}`), and engine strings use `{n}`, `{total}`, `{name}`, `{m}`.
- `hash(n)`: `s = sin(n*127.1 + 311.7) * 43758.5453; return s - floor(s)`. Engines must match it bit for bit where it decides placement (Very Easy thinning, light flicker types).

## level.json

| Field | Meaning |
|---|---|
| `w`, `h` | Grid size. |
| `geo` | `h` strings of `w` characters: floor, walls and doors (meanings in `deck.legend`). |
| `obj` | `h` strings: objects standing on floor cells, `' '` for none. |
| `zones` | Rooms: `{id, name, x1, y1, x2, y2, floor, light, power, secret, dark}`. Later zones sit on top of earlier ones where they overlap (the sealed container inside the cargo hold). `floor` names a core floor texture. `light` is the room's lamp color. `power` rooms go dark until the `power` flag is set. `secret` rooms get no banner and no map name. `dark` rooms get fewer, dimmer, flickering lamps. |
| `logs` | `[{x, y, log}]`: which audio log each `l` object plays. |
| `assets` | `[{x, y, name}]`: the name of each `$` asset tag. |
| `doors` | `[{x, y, tex}]`: texture overrides for door cells. Secret doors use a cracked copy of the wall beside them (`crack_hull`, `crack_med`...). |

A door cell takes the floor texture of the zone next to it. The object at `@` is the player start, facing east.

### Lights (engine rule, from zones)

For each zone: a secret zone gets one steady lamp at its center (`[1,.7,.4]`, radius 3.4). Otherwise lamps are spread on a grid with spacing 5 (6.5 if `dark`) and radius 5.6 (4.3 if `dark`), skipping wall cells; each lamp's type comes from `hash(lx*31 + ly*17 + zoneIndex)`: dark rooms 45% dying, 25% flicker, else steady; other rooms 10% dying, 15% flicker. Zones with area 20 or more add a red alarm light at the center (radius `clamp(sqrt(area)*.6, 4, 9)`) and, if `power`, an emergency light that glows only while power is off. Walls with a `light` in the legend put a small steady lamp (radius 2.4) on their first open side. Lamps in `power` zones are at 5% until power is on. While `lightsOut` is set, every lamp but alarms and "keep" lamps drops to 8%. The ceiling over every non-alarm lamp uses `ceiling_lamp`; the rest use `ceiling`.

## deck.json

```json
{"format":1, "id":"deck-01", "deck":1, "title":"Repo Day", "place":"Docking Ring", "ship":"BRIMSTONE MAIDEN", "blurb":"...",
 "intro":{...}, "outro":{...}, "legend":{...}, "locks":{...}, "keys":{...}, "state":{...},
 "rules":[...], "ambushes":{...}, "guide":[...], "mapLegend":[...]}
```

- `intro`: `objective` (shown on the deck card, `\n` for line breaks), `tips` (five strings, one per difficulty), `music` (an sfx id played on the card).
- `outro`: `heading`, `body`, `tease`, `music`, `line` (Buck's sign-off, normally `core:deck_clear`).
- `keys`: keycards this deck uses, with HUD colors. Keycards never carry between decks.

### legend

- `floor`: the floor character (`.`).
- `walls`: character → `{tex, role?, use?, light?, map?, after?}`. `tex` is a texture id. `role` is an engine role: `vent` (ambush spawn point) or `save` (save station). `use` makes the wall usable and names the `use` event it fires. `light` adds a small lamp. `map` is its automap color (default `#5d6873`). `after` is what the wall becomes when a rule runs `setTile: "after"`: `{tex, map?, use?}`. Without `use` the cell can't be used again; with `use` (engine 1.2) it stays usable and fires that use name instead (the departure lever's glass cover becomes the lever).
- `doors`: character → lock id (see `locks`).
- `objects`: character → one of `{start}`, `{enemy, min, dormant?}`, `{item}`, `{decor, solid?, r?}`, `{barrel}`. `min` is the lowest difficulty index the enemy appears on (0 Very Easy … 4 Nightmare). On Very Easy, enemies with `min` 0 are skipped where `hash(cellIndex*.37) < tuning.veryEasyThin`, with `cellIndex = y*w + x`. Bosses (`"boss": true` in the tuning) are never skipped (engine 1.3).

### locks

Lock id → `{tex?, needs?, denied?, map?, secret?}`. A door with `needs` stays shut until the condition is true; walking up to it then opens it for good (texture `unlock`, message `strings.accessGranted`, fires `doorUnlock`). While the condition is false, walking up shows `denied` at most every 3 seconds and fires `doorDenied`. `secret: true` doors look like walls and open with Use; each one counts as a secret. `none` doors open for anyone.

### state

`{"flags": {"power": false, "override": false}, "counters": {"breakers": 0}}`. Every flag and counter a rule reads or writes is declared here, except the engine flags, which always exist and start false:

| Engine flag | What the engine does with it |
|---|---|
| `power` | Lights `power` zones, turns off emergency lights. |
| `lightsOut` | Drops all lamps except alarms to 8%. |
| `alarm` | Turns the red alarm lights on and raises the background music. |

Flags, counters, keys held and zones visited are saved with mid-deck saves.

### rules

A rule is `{"on": event, "if": condition?, "once": bool?, "do": [actions]}`. When the event happens and the condition holds, the actions run in order. `once` rules run at most once per playthrough.

| Event | Fires when |
|---|---|
| `{"event":"start"}` | Play begins after the intro card (not when a save loads). |
| `{"event":"enterZone","zone":id}` | The player first enters that zone. |
| `{"event":"pickup","item":id}` | After the engine applies an item's own effect (keycards are added, weapons equipped). |
| `{"event":"use","target":name}` | The player uses a wall whose legend `use` is `name`. The used cell is the rule's cell. |
| `{"event":"useDecor","decor":id}` | The player presses Use within 1.5 of that decor. |
| `{"event":"doorUnlock","lock":id}` | A locked door of that lock opens. |
| `{"event":"doorDenied","lock":id}` | The player is turned away by that lock. |
| `{"event":"region","zone":id,"minY":n}` | Checked every frame: the player is in the zone (and `y >= minY` if given). |
| `{"event":"kill"}` | An enemy dies. Fields: `enemy` (type), `cause` (`cutter`, `boomstick`, `rivet`, `kick`, `bomb`, `bloater`, `barrel`, `self`), `boss` (bool). Engine 1.1. |
| `{"event":"blast"}` | An explosion finishes. Fields: `source` (`bomb`, `bloater`, `barrel`), `kills` (enemies it killed). Engine 1.1. |
| `{"event":"sever"}` | A limb comes off. Fields: `enemy`, `limb` (`head`, `armL`, `armR`, `legL`, `legR`), `state` (`spit`, `attack`, `other`). Engine 1.1. |
| `{"event":"death"}` | Buck dies. Field: `cause` (`enemy`, `spit`, `bomb`, `bloater`, `barrel`). Engine 1.1. |
| `{"event":"secret"}` | A secret panel opens. Fields: `found`, `total`. Engine 1.1. |
| `{"event":"cheat"}` | A console cheat is used (engine 1.2). Field: `command`. The run is already marked audited, so only `cheat` achievements can fire. |
| `{"event":"deckClear"}` | The deck is won, before the outro. Fields: `percent`, `time` (seconds), `par`, `underPar` (bool), `damageTaken`, `weapons` (list of `cutter`, `boomstick`, `rivet`, `charges`, `kick` used), `difficulty` (0–4), `deck`. Engine 1.1. |

Conditions: `{"flag":f}`, `{"key":"R"}`, `{"visited":zone}`, `{"counter":c,"gte":n}` (also `eq`, `lte`), `{"difficulty":{"gte":n}}`, `{"not":c}`, `{"all":[...]}`, `{"any":[...]}`.

On the events that carry fields, `{"field":name, ...}` tests one of them (engine 1.1): `"eq"` (number, text or bool), `"gte"`, `"lte"`, `"in"` (list of text), `"subsetOf"` (a list field holds only these), `"eqField"`, `"gteField"`, `"lteField"` (compare with another field, e.g. `{"field":"found","eqField":"total"}`).

Actions (one verb each):

| Action | Effect |
|---|---|
| `{"say":id,"sub":secs}` | Buck says a line (deck `lines.json`, or `core:id`), with a subtitle for `sub` seconds. Rule lines always play, interrupting a quip. |
| `{"msg":text}` | A HUD message (top left, 4 s, at most 4 stacked). |
| `{"objective":text,"show":secs}` | Sets the objective and shows it (default 6 s). |
| `{"sfx":id}` | Plays a core or deck sound, centered. |
| `{"flash":x,"color":[r,g,b]}` / `{"shake":x}` | Screen flash or shake. |
| `{"set":flag,"value":bool}` / `{"add":counter,"value":n}` | Change state. |
| `{"ambush":id,"delay":secs}` | Queue that ambush. Each ambush runs once. |
| `{"autosave":"events"}` | Checkpoint save, if the difficulty saves on events (Very Easy, Easy, Normal). |
| `{"music":x}` | Set the combat music target (0..1) until the engine next changes it. |
| `{"setTile":"after"}` | Replace the rule's cell with its legend `after` wall. |
| `{"after":secs,"do":[...]}` | Run actions later (play time; pausing stops the clock). |
| `{"if":cond,"then":[...],"else":[...]}` | Branch. |
| `{"win":true}` | Clear the deck: records, carry-over, outro. |
| `{"depart":true}` | Open the DEPART DECK NN? screen (engine 1.2): kills, secrets, audio logs and asset tags as found / total, incomplete ones highlighted, and the deck percent; at 100% the header reads ACCOUNT CLOSED IN FULL. **Stay** has the default focus (Back, Esc and Menu also mean Stay): it closes the screen, Buck says the core `departStay` line, the `departStays` total goes up, and the wall can be used again. **Depart** clears the deck exactly like `win`. Play is frozen while the screen is up. |
| `{"achieve":id}` | Give an achievement (engine 1.1). Audited runs earn nothing except achievements marked `cheat`. |
| `{"floorplan":true}` | Swap Gorgon's schematic on the automap for the real layout (engine 1.3; a floor-plan terminal's `use` rule). Saved with the deck. |

The engine does the rest on its own: secret doors, save stations, item pickups and their messages, logs, asset tags, enemy intro lines, kill quips, revives, death, low-health warnings.

### schematic (engine 1.3)

What the automap knows before Buck explores. `{"hide":[[x1,y1,x2,y2],...], "add":[[x1,y1,x2,y2],...]}`, rectangles inclusive. Gorgon's copy is the real layout (every floor cell outside secret rooms and secret doors), minus `hide`, plus `add`, which may cover solid wall (a hallway on the plan that isn't there). Until the `floorplan` action runs, cells Buck hasn't seen are drawn as faint dots with a faint outline, labeled GORGON'S PLAN. After it runs, and from the start on Very Easy and Easy, the real layout is drawn dimly instead. Secret rooms never appear either way, and the `?` hints don't change. `{}` means Gorgon's copy matches; no `schematic` key means no plan at all (only what Buck has seen).

### par and achievements (engine 1.1)

`par` is the deck's target time in seconds (Rush Job). `achievements` lists the deck's own achievements, in the same shape as `core/achievements.json` below.

### ambushes

`id → {"zones":[...], "spawns":[enemy types]}`. When run, `round(len(spawns) * difficulty.spawn)` enemies (at least 1) drop out of vents on or next to those zones, 1.1 s apart, cycling through the list, preferring vents more than 3 cells from the player.

### guide

The PATH button walks this list and routes to the first step whose `until` is false (a step with no `until` is the last resort). Targets: `{"cell":[x,y]}`, `{"item":id}` (that object's cell), `{"use":name}` (floor beside the first wall with that use), `{"nearestUse":name}` (the closest by path among walls with that use not yet switched to `after`).

## logs.json and lines.json

- Log: `{id, order, header, speaker, text, file, zone}`. `text` is the subtitle, typed out at 42 characters a second. `order` is the pause-menu archive order. Logs are played straight: Buck's quips stay quiet while one plays.
- Line: `{id, text, file, [role, sub]}`. Core lines have a `role` the engine picks from (`kill`, `secretFirst`, `secret`, `tag`, `headshot`, `enemyIntro`, `lowHp`, `death`, `saveFirst`, `stayDown`, `deckClear`, `weapon`, `trailer`, `departStay`). Every Buck line is recorded with the locked BUCK-VOICE settings and whisper-checked before it ships.
- Audio is MP3 (Kokoro takes rendered through the voice lab DSP, and the log recorder filter).

## core/achievements.json (engine 1.1)

`{"format":1, "achievements":[...]}`. Each achievement is a line item on Buck's invoice:

```json
{"id":"hb.foot_the_bill", "name":"Foot the Bill", "points":10, "hidden":false, "status":"live",
 "desc":"Land the final blow with a kick, 50 times.", "earned":"Fifty kicks to settle accounts.",
 "line":"ach_footnote", "progress":{"stat":"kickKills", "target":50}}
{"id":"hb.bulk_discount", ..., "on":{"event":"blast"},
 "if":{"all":[{"field":"source","eq":"bomb"},{"field":"kills","gte":5}]}}
```

- `id`: `hb.` plus snake case; Paid in Full uses `hb.paid_in_full.NN`. IDs and points never change once live in Game Center.
- `points` (1–100), `hidden` (Game Center's hidden setting; the pause menu shows REDACTED), `desc` (before), `earned` (after), `line` (a core line Buck says, at most once every 20 seconds and only if the player hasn't muted it).
- `status`: `live` achievements can be earned with the current engine and are registered with the stores; `planned` ones are defined but can't happen yet (they get registered with the update that makes them earnable).
- Earned either by a running total, `progress: {stat, target, minDifficulty?}`, counted across campaigns and difficulties (stats: `kickKills`, `limbsSevered`, `deaths`, `bodiesKicked`, and `departStays` from engine 1.2; `minDifficulty` counts only runs on that difficulty or harder), or by an event: `on` (one of the field-carrying events above) with an optional `if`. Rules can also give one with `achieve`.
- Audited runs earn nothing unless the achievement has `"cheat": true` (Irregularities Noted, on the `cheat` event). Achievements and running totals are stored apart from the campaign (`hb-achievements` on the web), so New Game never erases them.
- Game Center caps a game at 100 achievements and 1,000 points; the validator checks the total across all packs.

## core/art.json

`{textureSize: 64, textures, floors, ceilings, sprites, procedural}`.

- Texture: `{file, emissive?, crackOf?}`. 64×64 RGB PNG. `emissive` is a same-size mask PNG (white = glows at full brightness in the dark).
- Sprite: `{file, w, h, emissive?}`: RGBA PNG; alpha below 50% is transparent. `emissive` is a mask PNG or `"all"`.
- `procedural` lists what the engine draws itself in version 1: enemies with their severed-limb states, weapon viewmodels, Buck's HUD face and the space backdrop. Enemies are drawn by the engine because each one is tied to behavior code anyway.

World sizes come from `tuning.json` (`height` of items, decor, barrels, enemies, in cell units).

## core/sfx.json

`id → {file, gain, seconds, loop?}`. 22.05 kHz 16-bit mono WAV, normalized; multiply by `gain` to restore the original level, then by distance volume `clamp(1.5/(1 + d*.35), 0, 1)` and pan `clamp(lateral/(d+.3), -1, 1)`. Mix through a compressor (threshold −12 dB, knee 10, ratio 5, attack 3 ms, release 200 ms). `shriek_1_3` means pitch 1.3; `braam_4` is the 4-second swell. `ambient` (28.6 s) and `music` (32 eighth notes at 138 bpm, 6.96 s) loop seamlessly. Music volume follows the engine's combat target and ducks to 40% under Buck and 50% under logs.

## core/tuning.json

A difficulty's `save` is `area` (checkpoints in every new area, plus events and stations), `events` (checkpoints after big moments, plus stations), `stations` (save stations only) or `never` (no mid-deck saves at all: stations refuse, and dying restarts the deck; engine 1.2, Nightmare). Enemies may carry `"boss": true` (engine 1.1; read by the `kill` event). The numbers the JavaScript engine has hard-coded: the difficulty table (`dmg`, `hp`, `spd`, `ammo`, `heal`, `spawn`, `cells`, `save`, `revive`, `desc`), enemy stats (`hp`, `lhp` per limb, `speed`, `dmg`, `reach`, `wind`, `r`, `height`, limbs needed to kill), weapons, ammo caps, kick, explosions, revives, items (amounts scaled by the difficulty's ammo or heal factor), decor sizes, drop chances and end-of-deck ranks. Enemy types and weapon behaviors are engine code; their numbers live here so balance changes ship as a core pack update.

The kick (engine 1.3): `kick.damage` is a standing kick and a plain stomp does `damage × 3.2`. With the stomp boots (an item with `"boots": true`), `kick.stomp` applies: `dmgMul` multiplies the stomp, `sleeperKill` kills a sleeper playing dead outright, `keepsDown` means a body killed by a stomp never revives, and `reach` is how close a body on the floor must be. `kick.boots` (core 1.3.1) is the standing kick with the boots: `dmgMul` multiplies `kick.damage` and `push` multiplies the knockback. Kicks with the boots play the `clank` sound.

## Tools

| Script | Use |
|---|---|
| `dump.py raw` | Runs the shipped `index.html` in headless Chromium and dumps its data, art (as PNG), voice and log MP3s, and every procedural sound rendered offline. |
| `extract.py raw ../../packs` | Builds `core`, `deck-01` and `catalog.json` from the dump plus `deck01.py` (the deck's rules as data). |
| `validate_pack.py` | Checks hashes, every cross-reference, the map layout, and runs the deck's rules to prove the deck can be won and 100% reached on every difficulty. |
| `parity.py` | Starts the real game on every difficulty and checks it spawns exactly what the pack describes. |

Later decks are authored as packs directly: a `build_level.py` for the map, a `deckNN.py` for the rules, recorded lines and logs, then `validate_pack.py` before anything ships.
