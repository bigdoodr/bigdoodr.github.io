"""Deck 01's opening cut scene (engine 1.5), as pack data. Idempotent: patches deck.json and lines.json of the pack.
    python3 opening01.py <packs_dir>
Casey approved the script on Nov 13, 2026. Lines: the Dispatch order (new, bf_alice, clean), two new Buck lines and
`not_on_order`; the terminal beat reuses the existing `schematic_ok` through the terminal's own rule."""
import json, math, os, sys
root = sys.argv[1]; d = os.path.join(root, 'deck-01')
deck = json.load(open(os.path.join(d, 'deck.json')))
PI = math.pi
N, S = -PI / 2, PI / 2

CARD = ("GORGON CONSOLIDATED\nREPOSSESSION DIVISION\n\nACCOUNT: CSV BRIMSTONE MAIDEN\nSTATUS: DELINQUENT\n"
        "LAST CONTACT: 9 DAYS AGO\nAGENT: HAMMERSMITH\n\nRECOVER THE VESSEL.\nPAYMENT PLANS ARE NOT AUTHORIZED.")
O = 40.0   # the dock office begins here; everything before it is a flying shot (cockpit, warp, arrive, dock, tunnel)
scene = {
  "duration": O + 13.5, "blackUntil": 0,
  "shots": [
    {"t": 0.0, "end": 16.0, "kind": "cockpit"},    # the order comes through (12.6 s of Dispatch); Buck keys in the coordinates after it
    {"t": 16.0, "end": 23.0, "kind": "warp"},      # systems flying by
    {"t": 23.0, "end": 28.0, "kind": "arrive"},    # out of warp: the Maiden in the window
    {"t": 28.0, "end": 34.0, "kind": "dock"},      # the approach and the clamps
    {"t": 34.0, "end": O, "kind": "tunnel"},       # the connecting tube
  ],
  "cam": [
    {"t": 0.0, "x": 5.5, "y": 56.4, "ang": N},
    {"t": O, "x": 5.5, "y": 56.4, "ang": N, "cut": True},              # the dock office, behind Buck
    {"t": O + 6.6, "x": 5.5, "y": 55.8, "ang": N},
    {"t": O + 6.9, "x": 5.0, "y": 52.15, "ang": S, "cut": True},       # from the terminal wall, back at Buck and the door
    {"t": O + 12.4, "x": 5.0, "y": 52.15, "ang": S},
    {"t": O + 12.5, "x": 4.6, "y": 53.6, "ang": S, "cut": True},       # first person
  ],
  "buck": [
    {"t": O, "x": 5.5, "y": 54.2, "view": "back", "pose": "walk"},
    {"t": O + 2.0, "x": 5.5, "y": 52.6, "view": "back", "pose": "reach"},
    {"t": O + 6.85, "x": 5.5, "y": 52.6, "view": "back", "pose": "reach"},   # holds at the terminal until the cut
    {"t": O + 6.9, "x": 4.6, "y": 53.6, "view": "front", "pose": "reach"},   # same spot, seen from the wall: still at the terminal
    {"t": O + 7.6, "x": 4.6, "y": 53.6, "view": "front", "pose": "react"},   # the clank: he flinches
    {"t": O + 8.0, "x": 4.6, "y": 53.6, "view": "side", "pose": "look"},     # turning
    {"t": O + 8.4, "x": 4.6, "y": 53.6, "view": "back", "pose": "idle"},     # facing the door
    {"t": O + 12.5, "x": 4.6, "y": 53.6, "view": "back", "pose": "idle", "hide": True},
  ],
  "steps": [
    {"t": 0.6, "card": CARD, "speaker": "GORGON DISPATCH"},
    {"t": 0.8, "say": "opening_order", "sub": 12.6},
    {"t": 13.2, "cardOff": True},
    {"t": 14.0, "say": "start", "sub": 4.3},
    {"t": 23.4, "say": "opening_nine_days", "sub": 5.2},
    {"t": 35.0, "say": "opening_clamps", "sub": 5.2},
    {"t": O + 3.0, "use": "floorplan"},
    {"t": O + 6.9, "door": [5, 57]},
    {"t": O + 7.6, "sfx": "clank", "shake": 0.2},
    {"t": O + 8.5, "spawn": {"type": "husk", "x": 5.5, "y": 58.6, "toX": 5.6, "toY": 56.4, "speed": 0.8}},
    {"t": O + 9.2, "spawn": {"type": "husk", "x": 5.5, "y": 59.4, "toX": 6.9, "toY": 56.2, "speed": 0.8}},
    {"t": O + 9.4, "sfx": "groan", "shake": 0.3},
    {"t": O + 10.2, "say": "opening_not_on_order", "sub": 2.2},
  ],
  "handoff": {"x": 4.6, "y": 53.6, "ang": S},
}
deck.setdefault('intro', {})['opening'] = 'opening'
deck.setdefault('cutscenes', {})['opening'] = scene

# the start rule: after the opening, only the objective (the scene already carried Buck's first words)
for r in deck['rules']:
    if r.get('on') == {"event": "start"}:
        acts = r['do']
        if not any(isinstance(a, dict) and 'if' in a and a['if'] == {"flag": "opening"} for a in acts):
            say = [a for a in acts if 'say' in a]; rest = [a for a in acts if 'say' not in a]
            r['do'] = [{"if": {"flag": "opening"}, "then": [], "else": say}] + rest
json.dump(deck, open(os.path.join(d, 'deck.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(d, 'deck.json'), 'a').write('\n')

doc = json.load(open(os.path.join(d, 'lines.json')))
lines = doc['lines'] if isinstance(doc, dict) else doc
have = {l['id'] for l in lines}
new = [
  {"id": "opening_order", "text": "Agent Hammersmith. Account: Brimstone Maiden. Status: delinquent. Last contact, nine days ago. Recover the vessel. Payment plans are not authorized.",
   "file": "voice/opening_order.mp3", "speaker": "dispatch"},
  {"id": "opening_nine_days", "text": "Nine days with no contact... Somebody's behind on more than rent.", "file": "voice/opening_nine_days.mp3"},
  {"id": "opening_clamps", "text": "Clamps are holding. Lights aren't. Nobody's home.", "file": "voice/opening_clamps.mp3"},
  {"id": "opening_not_on_order", "text": "Those aren't on the work order.", "file": "voice/opening_not_on_order.mp3"},
]
for l in new:
    if l['id'] not in have: lines.append(l)
json.dump(doc, open(os.path.join(d, 'lines.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(d, 'lines.json'), 'a').write('\n')
print('opening scene written;', len(new), 'lines (audio still to record)')
