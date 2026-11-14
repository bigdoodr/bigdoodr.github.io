"""Deck 02's Super payoff as a third-person cut scene (engine 1.5), as pack data. Idempotent: patches deck.json.
    python3 super_payoff02.py <packs_dir>
The old first-person `scenes.super_payoff` stays: an engine older than 1.5 ignores `cutscenes` and plays it, so the pack keeps minEngine 1.4.
Coordinates are relative to the Super's body (`anchor: lastBoss`): x runs from the body toward where Buck stood when it fell, y is a quarter turn to the left of that.
Same beats as before: Buck walks up, looks down, raises his knee and stomps the head flat, lifts his boot to show the REPOSSESSED sole print on the Super's face, \"Consider your lease terminated.\""""
import json, math, os, sys
d = os.path.join(sys.argv[1], 'deck-02'); deck = json.load(open(os.path.join(d, 'deck.json')))
PI = math.pi
scene = {
  "anchor": "lastBoss", "duration": 11.6,
  "cam": [
    {"t": 0.0, "x": 3.9, "y": -0.2, "ang": PI},                         # behind Buck as he walks up to the body
    {"t": 3.1, "x": 3.4, "y": -0.2, "ang": PI},
    {"t": 3.2, "x": 0.62, "y": 1.9, "ang": -PI / 2, "cut": True},       # low from the side: the knee goes up, the boot comes down on the head
    {"t": 6.1, "x": 0.62, "y": 1.9, "ang": -PI / 2},
    {"t": 6.2, "x": 0.62, "y": 1.0, "ang": -1.874, "cut": True},        # close on the face as the boot lifts and the print shows
    {"t": 7.6, "x": 0.62, "y": 0.95, "ang": -1.874},
    {"t": 7.7, "x": 3.0, "y": 1.6, "ang": -2.5, "cut": True},           # wide: Buck takes a beat, then walks away from it
    {"t": 11.5, "x": 3.0, "y": 1.6, "ang": -2.5},
    {"t": 11.6, "x": 2.2, "y": 0.6, "ang": 0.0, "cut": True},
  ],
  "buck": [
    {"t": 0.0, "x": 2.9, "y": -0.2, "view": "back", "pose": "walk"},
    {"t": 3.1, "x": 1.15, "y": -0.31, "view": "back", "pose": "idle"},
    {"t": 3.2, "x": 0.62, "y": 0.0, "view": "side", "pose": "look", "flip": True},
    {"t": 4.0, "x": 0.62, "y": 0.0, "view": "side", "pose": "stompUp", "flip": True},     # the high knee, held
    {"t": 5.0, "x": 0.62, "y": 0.0, "view": "side", "pose": "stomp", "flip": True},       # and down
    {"t": 6.2, "x": 0.62, "y": 0.0, "view": "side", "pose": "stompUp", "flip": True},     # the boot lifts off the face
    {"t": 7.7, "x": 0.62, "y": 0.0, "view": "front", "pose": "idle"},
    {"t": 10.0, "x": 0.62, "y": 0.0, "view": "front", "pose": "idle"},
    {"t": 11.5, "x": 2.4, "y": 0.9, "view": "front", "pose": "walk"},
    {"t": 11.55, "x": 2.4, "y": 0.9, "view": "front", "pose": "walk", "hide": True},
  ],
  "steps": [
    {"t": 0.0, "sfx": "drain", "shake": 0.35},
    {"t": 0.3, "sfx": "groan"},
    {"t": 5.05, "gib": "crush", "sfx": "splat", "shake": 0.7},
    {"t": 6.5, "gib": "print", "sfx": "stamp", "shake": 0.2},
    {"t": 7.2, "say": "payoff_super", "sub": 2.6},
  ],
  "handoff": {"x": 2.2, "y": 0.6, "ang": 0.0},
}
deck.setdefault('cutscenes', {})['super_payoff'] = scene
json.dump(deck, open(os.path.join(d, 'deck.json'), 'w'), indent=1, ensure_ascii=False); open(os.path.join(d, 'deck.json'), 'a').write('\n')
print('super payoff cut scene written')
