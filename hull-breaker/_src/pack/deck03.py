"""Deck 03's rules, written as pack data (Root Cause, Hydroponics and Life Support).

Design: the project doc "Deck 03 — Root Cause: design draft" (approved by Casey, Nov 21, 2026).
Engine 1.7 vocabulary on top of 1.6 (to be added to FORMAT.md with the engine work):
  - a lock may carry `burn: true`: the door is a spore growth that only fire clears. The engine opens it
    when the Purge Torch's flame hits it (and fires `doorUnlock`); `needs` says what the validator may assume
    (the torch is owned), so every route stays provable.
  - lines may carry the `okafor` speaker (bf_emma through the recorder filter, played like a log).
  - `carry`: deck flags written to the campaign's story flags when the deck is cleared (the samples Buck
    takes to Deck 04). A replay can add a missing one; it never removes one.
  - new hints `torch` and `rooter`; new stat `rootersBurned`; the `kill` event's cause may be `fire`.

Progression: take the Purge Torch and hear Okafor's relay in the Greenhouse Lab, burn into the three wings off
the Seed Bank in any order and restore the scrubber valve in each, vent the air in Atmosphere Control, beat
Mother Root in the Root Chamber, then go back through Water Reclamation to the down-line platform and pull the lever.
Samples: rooter tissue (Fungus Caves), the mother pod's core (Compost Works) and Mother Root's heartwood (her
payoff scene). The first two are optional for the route and count toward 100%.
"""

DECK = {
    'deck': 3,
    'title': 'Root Cause',
    'place': 'Hydroponics and Life Support',
    'ship': 'BRIMSTONE MAIDEN',
    'intro': {
        'objective': 'Get the farms breathing again.\nRestore the three scrubbers. Vent the air. Find what took root.',
        'tips': [
            'The Purge Torch is in the Greenhouse Lab. Burn a rooter\'s stump or it grows back.',
            'The Purge Torch is in the Greenhouse Lab. Burn a rooter\'s stump or it grows back.',
            'Cut it off, then burn it. Rooters grow back anything you leave.',
            'Cut it off, then burn it. Saves only happen at save stations.',
            'Cut it off, then burn it. No saves on this deck: dying starts it over.',
        ],
        'music': 'braam_2_5',
    },
    'outro': {
        'heading': 'DECK 03 OF 12 CLEARED',
        'body': 'The down line drops Buck toward medical, with a sample case for a doctor who should be dead. Nine decks to go.',
        'tease': 'Deck 04: Bedside Manner. Medical and Research.',
        'music': 'braam_4',
        'line': 'core:deck_clear',
    },

    'legend': {
        'floor': '.',
        'floors': {',': {'water': 'wade'}, '~': {'water': 'swim'}},
        'walls': {
            '#': {'tex': 'hull'}, '=': {'tex': 'hull2'}, 'h': {'tex': 'haz'}, 'b': {'tex': 'blood'},
            's': {'tex': 'scrawl'}, 'v': {'tex': 'vent', 'role': 'vent'}, 'p': {'tex': 'pipe'}, 'T': {'tex': 'tram'},
            'w': {'tex': 'win', 'map': '#3a5a7a'}, 'W': {'tex': 'winmoon', 'map': '#3a5a7a'},
            'g': {'tex': 'glasshouse'}, 'd': {'tex': 'domeglass'}, 'k': {'tex': 'seedrack'}, 'o': {'tex': 'trunk'},
            'Y': {'tex': 'oldtree', 'map': '#6a4a2a'}, 'm': {'tex': 'caverock'}, 't': {'tex': 'terrace'}, 'r': {'tex': 'rootwall'},
            'F': {'tex': 'floorplan', 'use': 'floorplan', 'light': [.35, .95, 1], 'map': '#5ff6ff'},
            'Q': {'tex': 'save', 'role': 'save', 'light': [.2, 1, .45], 'map': '#30ff70'},
            'R': {'tex': 'relay', 'use': 'relay', 'light': [1, .3, .3], 'map': '#ff5050',
                  'after': {'tex': 'relayon', 'map': '#ff9090', 'use': 'relayAgain'}},
            'V': {'tex': 'scrubvalve', 'use': 'scrubber', 'light': [1, .35, .2], 'map': '#ff4030',
                  'after': {'tex': 'scrubvalveon', 'map': '#40ff80'}},
            'N': {'tex': 'ventconsole', 'use': 'ventAir', 'light': [1, .55, .15], 'map': '#ff8c1a',
                  'after': {'tex': 'ventconsoleon', 'map': '#40ff80'}},
            'S': {'tex': 'nofeedsign', 'use': 'sign', 'map': '#d4a64a'},
            'L': {'tex': 'lever', 'use': 'breakGlass', 'light': [1, .6, .2], 'map': '#ffb627',
                  'after': {'tex': 'leveron', 'map': '#ffb627', 'use': 'lever'}},
        },
        'doors': {'D': 'none', 'X': 'secret', '5': 'spores', '6': 'scrubbers', '7': 'vented', '8': 'rootDown'},
        'objects': {
            '@': {'start': True},
            'h': {'enemy': 'husk', 'min': 0}, 'c': {'enemy': 'crawler', 'min': 0}, 's': {'enemy': 'spitter', 'min': 0},
            'x': {'enemy': 'bloater', 'min': 0}, 'z': {'enemy': 'brute', 'min': 0}, 'd': {'enemy': 'husk', 'min': 0, 'dormant': True},
            'r': {'enemy': 'lurker', 'min': 0}, 'y': {'enemy': 'sleeper', 'min': 0}, 'g': {'enemy': 'rooter', 'min': 0},
            'W': {'enemy': 'motherroot', 'min': 0},
            'H': {'enemy': 'husk', 'min': 2}, 'C': {'enemy': 'crawler', 'min': 2}, 'S': {'enemy': 'spitter', 'min': 2},
            'X': {'enemy': 'bloater', 'min': 2}, 'Z': {'enemy': 'brute', 'min': 2}, 'D': {'enemy': 'husk', 'min': 2, 'dormant': True},
            'R': {'enemy': 'lurker', 'min': 2}, 'Y': {'enemy': 'sleeper', 'min': 2}, 'G': {'enemy': 'rooter', 'min': 2},
            '6': {'enemy': 'husk', 'min': 3}, '7': {'enemy': 'crawler', 'min': 3}, '8': {'enemy': 'spitter', 'min': 3},
            '9': {'enemy': 'bloater', 'min': 3}, '5': {'enemy': 'brute', 'min': 3}, '4': {'enemy': 'lurker', 'min': 3},
            '3': {'enemy': 'sleeper', 'min': 3}, '2': {'enemy': 'rooter', 'min': 3},
            '+': {'item': 'med'}, '*': {'item': 'medbig'}, 'u': {'item': 'medmax'}, 'a': {'item': 'cells'}, 'e': {'item': 'shells'},
            'i': {'item': 'rivets'}, 'o': {'item': 'bombs'}, 'f': {'item': 'fuel'}, '&': {'item': 'armor'},
            'T': {'item': 'torch'}, 'q': {'item': 'sampleTissue'}, 'Q': {'item': 'samplePod'},
            'l': {'item': 'log'}, '$': {'item': 'asset'},
            'O': {'barrel': True},
            'K': {'decor': 'crate', 'solid': True, 'r': .38}, 't': {'decor': 'table', 'solid': True, 'r': .42},
            'k': {'decor': 'corpse'}, 'p': {'decor': 'pile'}, 'P': {'decor': 'planter', 'solid': True, 'r': .4},
            'N': {'decor': 'singingplant', 'solid': True, 'r': .45},
        },
    },

    'locks': {
        'none': {'tex': 'door'},
        'secret': {'secret': True},
        # engine 1.7: a spore growth over the doorway. Only the Purge Torch's flame clears it.
        'spores': {'tex': 'sporedoor', 'burn': True, 'needs': {'flag': 'torch'}, 'denied': 'SPORE GROWTH. BURN IT OUT.', 'map': '#9acd32'},
        'scrubbers': {'tex': 'pwr', 'needs': {'counter': 'scrubbers', 'gte': 3},
                      'denied': 'ATMOSPHERE CONTROL. SEALED UNTIL ALL THREE SCRUBBERS RUN.', 'map': '#ff4030'},
        'vented': {'tex': 'rootdoor', 'needs': {'flag': 'vented'}, 'denied': 'POISONED AIR BEYOND. VENT IT FROM ATMOSPHERE CONTROL.', 'map': '#c04040'},
        'rootDown': {'tex': 'pwr', 'needs': {'flag': 'rootDown'}, 'denied': 'DOWN LINE LOCKED. ROOTS IN THE TRACK SWITCHES.', 'map': '#ff4030'},
    },
    'keys': {},

    'state': {'flags': {'torch': False, 'relay': False, 'vented': False, 'rootDown': False, 'rootSeen': False, 'floorplan': False,
                        'sampleTissue': False, 'samplePod': False, 'sampleHeartwood': False, 'firstSample': False, 'sawSign': False},
              'counters': {'scrubbers': 0, 'samples': 0}},
    # engine 1.7: these flags go into the campaign's story flags on a clear (Buck carries the samples to Deck 04).
    'carry': ['sampleTissue', 'samplePod', 'sampleHeartwood'],

    # Gorgon's copy: the Root Chamber is drawn as the old nutrient reservoir, a third of its size; the roots
    # hollowed out the rest. The cave mouth was never surveyed.
    'schematic': {
        'hide': [[33, 53, 63, 75], [13, 26, 33, 29]],
        'add': [[44, 58, 52, 64]],
    },

    'rules': [
        {'on': {'event': 'start'}, 'do': [
            {'say': 'start', 'sub': 3},
            {'after': 3.4, 'do': [{'say': 'moss_arrive', 'sub': 5.2}]},
            {'objective': 'Find the Greenhouse Lab, east of the platform.', 'show': 7},
        ]},
        {'on': {'event': 'use', 'target': 'floorplan'}, 'do': [
            {'if': {'flag': 'floorplan'}, 'then': [{'msg': 'FLOOR PLAN ALREADY DOWNLOADED'}], 'else': [
                {'set': 'floorplan', 'value': True}, {'floorplan': True}, {'sfx': 'pickup'}, {'msg': 'FLOOR PLAN DOWNLOADED'},
                {'say': 'floorplan', 'sub': 3}]}]},
        {'on': {'event': 'enterZone', 'zone': 'greenhouse'}, 'once': True, 'do': [{'ambush': 'greenhouse', 'delay': 6}]},

        # The Purge Torch.
        {'on': {'event': 'pickup', 'item': 'torch'}, 'do': [
            {'set': 'torch', 'value': True}, {'hint': 'torch'},
            {'if': {'flag': 'relay'}, 'then': [
                {'objective': 'Burn through the spore growth into the wings off the Seed Bank. Restore each scrubber valve.'}],
             'else': [{'objective': "A terminal on the lab's east wall is still transmitting."}]},
        ]},
        # Okafor's relay: a looping message she recorded for whoever restarted the tram. It gives Buck the sample case.
        {'on': {'event': 'use', 'target': 'relay'}, 'do': [
            {'setTile': 'after'}, {'set': 'relay', 'value': True}, {'say': 'okafor_relay', 'sub': 34},
            {'after': 34.5, 'do': [{'msg': 'SAMPLE CASE ACQUIRED (0/3)'}, {'sfx': 'key'}, {'say': 'doc_alive', 'sub': 2.6}]},
            {'after': 37.5, 'do': [{'say': 'moss_okafor', 'sub': 3.6}]},
            {'if': {'flag': 'torch'}, 'then': [
                {'objective': 'Burn through the spore growth into the wings off the Seed Bank. Restore each scrubber valve.'}],
             'else': [{'objective': 'The Purge Torch is on the lab bench. Take it.'}]},
            {'autosave': 'events'},
        ]},
        {'on': {'event': 'use', 'target': 'relayAgain'}, 'do': [{'say': 'okafor_relay', 'sub': 34}]},
        {'on': {'event': 'doorDenied', 'lock': 'spores'}, 'once': True, 'do': [{'say': 'allergy', 'sub': 1.8}]},
        {'on': {'event': 'enterZone', 'zone': 'seedbank'}, 'once': True, 'do': [{'ambush': 'seedbank', 'delay': 4}]},
        {'on': {'event': 'enterZone', 'zone': 'orchard'}, 'once': True, 'do': [{'ambush': 'orchard', 'delay': 3}]},
        {'on': {'event': 'enterZone', 'zone': 'terraces'}, 'once': True, 'do': [{'ambush': 'terraces', 'delay': 3}]},
        {'on': {'event': 'enterZone', 'zone': 'caves'}, 'once': True, 'do': [{'ambush': 'caves', 'delay': 3}]},
        # Rooters: the engine plays the core line `rooter_regrow` and the `rooter` hint the first time one regrows.

        # The three scrubber valves, one per wing, any order.
        {'on': {'event': 'use', 'target': 'scrubber'}, 'do': [
            {'setTile': 'after'}, {'add': 'scrubbers', 'value': 1}, {'sfx': 'breaker'}, {'shake': .3},
            {'msg': 'SCRUBBER RESTORED ({scrubbers}/3)'},
            {'if': {'counter': 'scrubbers', 'gte': 3}, 'then': [
                {'sfx': 'powerup'}, {'say': 'moss_scrubbers', 'sub': 4},
                {'objective': 'All three scrubbers are running. Atmosphere Control is south of the Scrubber Hall. Vent the air.'},
                {'ambush': 'scrubberhall', 'delay': 3}, {'autosave': 'events'}],
             'else': [
                {'objective': 'Restore the other scrubber valves. One in each wing off the Seed Bank.'}, {'autosave': 'events'}]},
        ]},
        {'on': {'event': 'doorDenied', 'lock': 'scrubbers'}, 'once': True, 'do': [{'say': 'moss_scrub_locked', 'sub': 3.4}]},

        # Venting the poisoned air.
        {'on': {'event': 'use', 'target': 'ventAir'}, 'do': [
            {'if': {'flag': 'vented'}, 'then': [{'msg': 'AIR VENTED'}], 'else': [
                {'setTile': 'after'}, {'set': 'vented', 'value': True}, {'set': 'alarm', 'value': True},
                {'sfx': 'powerup'}, {'shake': .8}, {'msg': 'VENTING POISONED AIR'},
                {'after': 2.5, 'do': [{'say': 'clear_air', 'sub': 2}]},
                {'after': 6, 'do': [{'set': 'alarm', 'value': False}, {'msg': 'ATMOSPHERE NOMINAL. ROOT CHAMBER UNSEALED.'}]},
                {'objective': 'The Root Chamber is open, south of Atmosphere Control. Something big is growing in there.'},
                {'ambush': 'atmos', 'delay': 4}, {'autosave': 'events'}]}]},
        {'on': {'event': 'doorDenied', 'lock': 'vented'}, 'once': True, 'do': [{'say': 'moss_poison', 'sub': 3}]},

        # Mother Root.
        {'on': {'event': 'bossSight'}, 'if': {'field': 'enemy', 'eq': 'motherroot'}, 'do': [{'if': {'not': {'flag': 'rootSeen'}}, 'then': [
            {'set': 'rootSeen', 'value': True}, {'say': 'boss_root', 'sub': 3}, {'music': 1},
            {'objective': 'Burn out her anchor roots, then hit the bloom.'},
            {'after': 3.4, 'do': [{'msg': 'BURN HER ANCHOR ROOTS ONE AT A TIME. AIM AT THE ONE THAT GLOWS.'}]},
        ]}]},
        {'on': {'event': 'kill'}, 'if': {'field': 'enemy', 'eq': 'motherroot'}, 'do': [
            {'set': 'rootDown', 'value': True}, {'set': 'arenaRed', 'value': False}, {'music': .3}, {'scene': 'root_payoff'},
            {'set': 'sampleHeartwood', 'value': True}, {'add': 'samples', 'value': 1},
            {'after': 1, 'do': [{'msg': 'SAMPLE: HEARTWOOD ({samples}/3)'}, {'say': 'moss_rootdown', 'sub': 4}]},
            {'objective': 'Back to Water Reclamation. The down line is through its south-east door.'},
            {'autosave': 'events'},
        ]},
        {'on': {'event': 'enterZone', 'zone': 'scrubber'}, 'if': {'flag': 'rootDown'}, 'once': True, 'do': [{'ambush': 'return_scrubber', 'delay': 2}]},
        {'on': {'event': 'enterZone', 'zone': 'waterrec'}, 'if': {'flag': 'rootDown'}, 'once': True, 'do': [{'ambush': 'return_waterrec', 'delay': 2.5}]},
        {'on': {'event': 'doorDenied', 'lock': 'rootDown'}, 'once': True, 'do': [{'say': 'moss_tracks', 'sub': 3.4}]},

        # Okafor's samples (the case comes with the relay; picking one up without it still counts).
        {'on': {'event': 'pickup', 'item': 'sampleTissue'}, 'do': [
            {'set': 'sampleTissue', 'value': True}, {'add': 'samples', 'value': 1}, {'msg': 'SAMPLE: ROOTER TISSUE ({samples}/3)'}, {'sfx': 'key'},
            {'if': {'not': {'flag': 'firstSample'}}, 'then': [{'set': 'firstSample', 'value': True}, {'say': 'specimen', 'sub': 2.4}]}]},
        {'on': {'event': 'pickup', 'item': 'samplePod'}, 'do': [
            {'set': 'samplePod', 'value': True}, {'add': 'samples', 'value': 1}, {'msg': 'SAMPLE: SPORE POD CORE ({samples}/3)'}, {'sfx': 'key'},
            {'if': {'not': {'flag': 'firstSample'}}, 'then': [{'set': 'firstSample', 'value': True}, {'say': 'specimen', 'sub': 2.4}]},
            {'ambush': 'compost', 'delay': 1.5}]},

        {'on': {'event': 'enterZone', 'zone': 'waterrec'}, 'once': True, 'do': [{'ambush': 'waterrec', 'delay': 3}]},
        {'on': {'event': 'water', 'depth': 'wade'}, 'once': True, 'do': [{'sfx': 'splash'}]},
        {'on': {'event': 'water', 'depth': 'swim'}, 'once': True, 'do': [{'sfx': 'splash'}, {'hint': 'swim'}]},
        {'on': {'event': 'enterZone', 'zone': 'downline'}, 'do': [
            {'say': 'moss_downline', 'sub': 3.6},
            {'objective': 'Break the glass and pull the departure lever.'},
            {'ambush': 'downline', 'delay': 2},
        ]},

        # Homage and gags.
        {'on': {'event': 'use', 'target': 'sign'}, 'do': [
            {'msg': 'HYDROPONICS NOTICE: DO NOT FEED AFTER LIGHTS-OUT.'},
            {'if': {'not': {'flag': 'sawSign'}}, 'then': [{'set': 'sawSign', 'value': True}, {'say': 'sign', 'sub': 2.4}]}]},
        {'on': {'event': 'enterZone', 'zone': 'closet'}, 'do': [{'sfx': 'plant_croon'}, {'say': 'plant_room', 'sub': 2.4}]},
        {'on': {'event': 'useDecor', 'decor': 'singingplant'}, 'do': [
            {'msg': 'YOU FEED IT A RATION BAR. IT HUMS A LITTLE HAPPIER.'}, {'sfx': 'plant_gulp'}, {'say': 'plant_fed', 'sub': 2.6},
            {'achieve': 'hb.late_night_snack'}]},

        # Leaving the deck.
        {'on': {'event': 'use', 'target': 'breakGlass'}, 'do': [
            {'setTile': 'after'}, {'sfx': 'glass'}, {'shake': .25}, {'msg': 'GLASS BROKEN'},
        ]},
        {'on': {'event': 'use', 'target': 'lever'}, 'do': [{'sfx': 'breaker'}, {'depart': True}]},
    ],

    'ambushes': {
        'greenhouse': {'zones': ['greenhouse'], 'spawns': ['husk', 'crawler']},
        'seedbank': {'zones': ['seedbank'], 'spawns': ['husk', 'crawler', 'husk']},
        'orchard': {'zones': ['orchard'], 'spawns': ['rooter', 'husk', 'crawler']},
        'terraces': {'zones': ['terraces'], 'spawns': ['rooter', 'spitter', 'husk', 'crawler']},
        'caves': {'zones': ['caves'], 'spawns': ['rooter', 'crawler', 'crawler', 'husk']},
        'scrubberhall': {'zones': ['scrubber', 'seedbank'], 'spawns': ['rooter', 'husk', 'husk', 'crawler', 'spitter', 'bloater']},
        'atmos': {'zones': ['atmos', 'scrubber'], 'spawns': ['rooter', 'rooter', 'husk', 'crawler']},
        'waterrec': {'zones': ['waterrec'], 'spawns': ['husk', 'crawler', 'rooter']},
        'compost': {'zones': ['compost'], 'spawns': ['rooter', 'husk', 'crawler', 'crawler']},
        'return_scrubber': {'zones': ['scrubber'], 'spawns': ['rooter', 'rooter', 'husk', 'husk', 'crawler', 'spitter', 'bloater']},
        'return_waterrec': {'zones': ['waterrec'], 'spawns': ['rooter', 'husk', 'husk', 'crawler', 'crawler', 'spitter']},
        'downline': {'zones': ['downline'], 'spawns': ['husk', 'husk', 'rooter', 'crawler', 'spitter']},
    },

    'guide': [
        {'until': {'flag': 'torch'}, 'to': {'item': 'torch'}},
        {'until': {'flag': 'relay'}, 'to': {'use': 'relay'}},
        {'until': {'counter': 'scrubbers', 'gte': 3}, 'to': {'nearestUse': 'scrubber'}},
        {'until': {'flag': 'vented'}, 'to': {'use': 'ventAir'}},
        {'until': {'flag': 'rootDown'}, 'to': {'cell': [48, 62]}},
        {'to': {'use': 'breakGlass'}},
    ],

    'scenes': {
        # First-person fallback for engines without cut scenes (1.4 and older never read this pack, so it is
        # only used if the cut scene fails to load).
        'root_payoff': {'target': 'lastBossKill', 'steps': [
            {'t': 0, 'camera': 'faceTarget', 'dur': .6},
            {'t': 1, 'say': 'payoff_root', 'sub': 2.4},
            {'t': 3.2, 'end': True},
        ]},
    },

    'par': 1080,   # placeholder (18:00, as Deck 02) until Casey's first Normal run

    'achievements': [
        dict(id='hb.paid_in_full.03', name='Paid in Full: Deck 03', points=10,
             desc='Reach 100% on Deck 03.', earned='Deck 03 settled in full.',
             on=dict(event='deckClear'), cond={'all': [{'field': 'deck', 'eq': 3}, {'field': 'percent', 'gte': 100}]}, line=None),
        dict(id='hb.slash_and_burn', name='Slash and Burn', points=10,
             desc='Burn 20 rooters before they regrow.', earned='Twenty rooters, cauterized.',
             progress=dict(stat='rootersBurned', target=20), line='ach_slash_and_burn'),
        dict(id='hb.uprooted', name='Uprooted', points=10,
             desc='Beat Mother Root.', earned='Mother Root, pulled.',
             on=dict(event='kill'), cond={'field': 'enemy', 'eq': 'motherroot'}, line=None),
        dict(id='hb.chain_of_custody', name='Chain of Custody', points=10,
             desc="Collect all three of Okafor's samples.", earned='Samples sealed. Chain of custody intact.',
             rule=True, line='ach_chain_of_custody'),
        dict(id='hb.allergy_season', name='Allergy Season', points=5,
             desc='Burn every spore growth on Deck 03.', earned='Spore count: zero.', rule=True, line=None),
        dict(id='hb.late_night_snack', name='Late-Night Snack', points=5, hidden=True,
             desc='Feed the singing plant.', earned='Fed it after lights-out. Probably fine.', rule=True, line=None),
    ],

    'mapLegend': [['WATER', '#2a6a9a'], ['SAVE', '#30ff70'], ['SPORES', '#9acd32'], ['SCRUBBER', '#ff4030'],
                  ['VENT', '#ff8c1a'], ['RELAY', '#ff5050'], ['FLOOR PLAN', '#5ff6ff']],
}

# The two rule-only achievements that depend on counting: Chain of Custody fires when the third sample lands,
# Allergy Season when the last spore door burns. Added here so the counts live in one place.
SPORE_DOORS = 4
DECK['state']['counters']['sporesBurned'] = 0
DECK['rules'] += [
    {'on': {'event': 'doorUnlock', 'lock': 'spores'}, 'do': [
        {'add': 'sporesBurned', 'value': 1},
        {'if': {'counter': 'sporesBurned', 'gte': SPORE_DOORS}, 'then': [{'achieve': 'hb.allergy_season'}]}]},
    *[{'on': ev, 'do': [{'if': {'counter': 'samples', 'gte': 3}, 'then': [{'achieve': 'hb.chain_of_custody'}]}]}
      for ev in ({'event': 'pickup', 'item': 'sampleTissue'}, {'event': 'pickup', 'item': 'samplePod'},
                 {'event': 'kill'})],
]

# Mother Root, phase by phase (bossPhase: the phase that just began). A save at each break: `autosave: events`, so
# Normal and easier keep it and Hard and Nightmare don't (the difficulty table), as with the Super (Casey, Nov 23).
ROOT_HINTS = {2: 'THE WEST ROOT IS ASH. BURN THE EAST ANCHOR ROOT.', 3: 'BURN THE TAP ROOT, IN FRONT OF HER.',
              4: "THE ROOTS ARE GONE. HIT THE BLOOM AT HER CROWN WHILE IT'S OPEN."}
DECK['rules'] += [{'on': {'event': 'bossPhase'}, 'if': {'all': [{'field': 'enemy', 'eq': 'motherroot'}, {'field': 'phase', 'eq': n}]},
                   'do': [{'sfx': 'clank'}, {'after': .8, 'do': [{'msg': h}]}, {'autosave': 'events'}]} for n, h in ROOT_HINTS.items()]

# Lines this deck uses: id -> text (Buck unless a speaker is given). Approved drafts (Casey, Nov 21) are marked;
# the rest are new and go to Casey with the voice review.
LINES = {
    'start': 'Hydroponics. Smells like somebody stopped paying the air bill.',     # new
    'allergy': 'Allergy season.',                                                  # approved
    'doc_alive': "Doc's alive. Somebody tell billing.",                           # approved
    'specimen': 'Specimen jar. Doc better tip.',                                   # approved
    'clear_air': 'Clearing the air.',                                              # approved
    'boss_root': "Ma'am, you're in violation of the zoning code.",                 # approved
    'payoff_root': "Weed's been abated.",                                         # approved
    'floorplan': "Gorgon's plan has this room a third the size. Something's been growing.",   # new
    'sign': "Wasn't planning on it.",                                              # new
    'plant_room': "Is that thing... humming?",                                     # new
    'plant_fed': "There you go. Don't tell anybody.",                              # new
}
MOSS = {
    'moss_arrive': "Life support's been in the red down there since the lockdown. Past the farms, the air's bad. Don't breathe it longer than you have to.",
    'moss_okafor': 'Okafor? Medical went dark days ago. I thought...',
    'moss_scrubbers': "That's all three scrubbers. Atmosphere Control's south of the hall. Vent it.",
    'moss_scrub_locked': "Atmosphere Control won't open until all three scrubbers are running. One in each wing.",
    'moss_poison': "Don't open that. Not until the air's vented. Atmosphere Control can do it.",
    'moss_rootdown': "Whatever that was, it had roots in half the deck. The down line's off Water Reclamation.",
    'moss_tracks': "Roots got into the track switches. Something's holding them shut.",
    'moss_downline': 'Down-line platform. Medical is the next stop.',
}
OKAFOR = {
    # Played like a log (recorder filter). Draft, written properly in the logs step; Casey approves the text.
    'okafor_relay': ("This is Dr. Okafor, medical. If you're hearing this, you restarted the tram. I'm alive. I'm sealed in my lab, "
                     "and I am staying sealed. Listen. In the farms the infection is doing something it shouldn't. It grows back "
                     "what you cut off. I need living tissue to understand how. Three samples: a rooter's tissue, the core of "
                     "the big spore pod in compost, and whatever is feeding the roots. The case is under this terminal. Keep it "
                     "closed. Bring it down to medical. Please."),
}
SPEAKERS = {**{k: 'moss' for k in MOSS}, **{k: 'okafor' for k in OKAFOR}}

# Core lines (BUCK-VOICE): the torch pickup, the rooter's first regrowth, achievement reactions.
CORE_LINES = {
    'get_torch': 'Time to do some weeding.',
    'rooter_regrow': 'Root cause analysis. Step one: fire.',
    'ach_slash_and_burn': 'Root and branch.',                    # new
    'ach_chain_of_custody': 'Signed, sealed, delivered. Almost.',  # new
}

LOG_ORDER = ['marquez_platform', 'okafor_protocol', 'sable_yield', 'marquez_seeds', 'agro_a_harvest', 'marquez_orchard',
             'agro_a_regrowth', 'agro_b_hiding', 'agro_b_light', 'marquez_rooted', 'tech_scrubbers', 'tech_orders',
             'marquez_irrigation']

# Mother Root's payoff cut scene (engine 1.5 player, anchored on her body like the Super's). The shots, poses and
# timing are built with the engine work and written into deck.json `cutscenes` then; these are the approved beats.
ROOT_PAYOFF_BEATS = [
    'Mother Root sags; the bloom closes and blackens.',
    'Buck walks up to the trunk and looks it over.',
    'Close: the Cutter carves a wedge of heartwood out of the trunk.',
    'He seals it in the sample case: SAMPLE 3/3.',
    "Buck: \"Weed's been abated.\"",
    'Wide, then play resumes beside the trunk.',
]
