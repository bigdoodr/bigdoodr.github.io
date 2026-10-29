"""Deck 01's rules, written as pack data.

Everything here used to be JavaScript inside index.html (onEnterZone, take(),
use(), powerOn(), triggerOverride(), objTarget(), AMB, LOCKMSG, the intro and
win screens). It is now plain data that any engine can interpret: the vocabulary
is defined in FORMAT.md. extract.py merges this with the level, logs and lines
it pulls out of the shipped game and writes packs/deck-01/deck.json.
"""

DECK = {
    'deck': 1,
    'title': 'Repo Day',
    'place': 'Docking Ring',
    'ship': 'BRIMSTONE MAIDEN',
    'intro': {
        'objective': 'Restore power. Find the keycards.\nTrigger the tram override and get out.',
        # Tip shown under the objective, by difficulty index (0 Very Easy .. 4 Nightmare).
        'tips': [
            "Cut off their limbs. Most of them don't need a head.",
            "Cut off their limbs. Most of them don't need a head.",
            'Cut off their limbs, and kick the bodies. Some of them get back up.',
            'The dead get back up. Kick bodies to keep them down. Saves only happen at save stations.',
            'The dead get back up. Kick bodies to keep them down. Saves only happen at save stations.',
        ],
        'music': 'braam_2_5',
    },
    'outro': {
        'heading': 'DECK 01 OF 12 CLEARED',
        'body': 'The tram groans to life and carries Buck down to Deck 02. Eleven decks to go.',
        'tease': 'Decks 02 through 12 continue the contract in the full game.',
        'music': 'braam_4',
        'line': 'core:deck_clear',
    },

    # ---- legend: what each character in level.json means ----
    'legend': {
        'floor': '.',
        'walls': {
            '#': {'tex': 'hull'}, '=': {'tex': 'hull2'}, 'h': {'tex': 'haz'}, 'b': {'tex': 'blood'},
            't': {'tex': 'term'}, 'm': {'tex': 'med'}, 'v': {'tex': 'vent', 'role': 'vent'},
            'w': {'tex': 'win', 'map': '#3a5a7a'}, 's': {'tex': 'scrawl'}, 'p': {'tex': 'pipe'},
            'T': {'tex': 'tram'}, 'k': {'tex': 'locker'}, 'r': {'tex': 'reactor'}, 'c': {'tex': 'cargo'},
            'C': {'tex': 'cargo2'}, 'g': {'tex': 'hydro'}, 'G': {'tex': 'planter'}, 'n': {'tex': 'console'},
            'q': {'tex': 'crew'}, 'u': {'tex': 'bridge'},
            'Q': {'tex': 'save', 'role': 'save', 'light': [.2, 1, .45], 'map': '#30ff70'},
            'Z': {'tex': 'brk', 'use': 'breaker', 'light': [1, .35, .2], 'map': '#ff4030',
                  'after': {'tex': 'brkon', 'map': '#40ff80'}},
            'O': {'tex': 'ovrcon', 'use': 'override', 'light': [.35, .6, 1], 'map': '#b04dff'},
        },
        'doors': {'D': 'none', '1': 'B', '2': 'Y', '3': 'R', '4': 'power', '5': 'override', 'X': 'secret'},
        # Enemies: 'min' is the lowest difficulty index they appear on
        # (lowercase 0 = every difficulty, uppercase 2 = Normal and up, digits 3 = Hard and up).
        'objects': {
            '@': {'start': True},
            'h': {'enemy': 'husk', 'min': 0}, 'c': {'enemy': 'crawler', 'min': 0}, 's': {'enemy': 'spitter', 'min': 0},
            'x': {'enemy': 'bloater', 'min': 0}, 'z': {'enemy': 'brute', 'min': 0}, 'd': {'enemy': 'husk', 'min': 0, 'dormant': True},
            'H': {'enemy': 'husk', 'min': 2}, 'C': {'enemy': 'crawler', 'min': 2}, 'S': {'enemy': 'spitter', 'min': 2},
            'X': {'enemy': 'bloater', 'min': 2}, 'Z': {'enemy': 'brute', 'min': 2}, 'D': {'enemy': 'husk', 'min': 2, 'dormant': True},
            '6': {'enemy': 'husk', 'min': 3}, '7': {'enemy': 'crawler', 'min': 3}, '8': {'enemy': 'spitter', 'min': 3},
            '9': {'enemy': 'bloater', 'min': 3}, '5': {'enemy': 'brute', 'min': 3},
            '+': {'item': 'med'}, '*': {'item': 'medbig'}, 'a': {'item': 'cells'}, 'e': {'item': 'shells'},
            'i': {'item': 'rivets'}, 'o': {'item': 'bombs'}, '&': {'item': 'armor'}, '!': {'item': 'shotgun'},
            '?': {'item': 'rivetgun'}, '%': {'item': 'satchel'}, 'B': {'item': 'keyB'}, 'Y': {'item': 'keyY'},
            'R': {'item': 'keyR'}, 'l': {'item': 'log'}, '$': {'item': 'asset'},
            'O': {'barrel': True},
            'K': {'decor': 'crate', 'solid': True, 'r': .38}, 't': {'decor': 'table', 'solid': True, 'r': .42},
            'k': {'decor': 'corpse'}, 'p': {'decor': 'pile'}, 'm': {'decor': 'arcade', 'solid': True, 'r': .3},
            'b': {'decor': 'bunk', 'solid': True, 'r': .42},
        },
    },

    # ---- locks: which door types open, and what they say when they don't ----
    'locks': {
        'none': {'tex': 'door'},
        'secret': {'secret': True},
        'B': {'tex': 'blue', 'needs': {'key': 'B'}, 'denied': 'LOCKED. NEEDS THE BLUE KEYCARD.', 'map': '#3c78ff'},
        'Y': {'tex': 'yel', 'needs': {'key': 'Y'}, 'denied': 'LOCKED. NEEDS THE YELLOW KEYCARD.', 'map': '#ffd200'},
        'R': {'tex': 'lock', 'needs': {'key': 'R'}, 'denied': 'LOCKED. NEEDS THE RED KEYCARD.', 'map': '#ff3030'},
        'power': {'tex': 'pwr', 'needs': {'flag': 'power'}, 'denied': 'NO POWER. RESET THE THREE ENGINEERING BREAKERS.', 'map': '#ff8c00'},
        'override': {'tex': 'ovr', 'needs': {'flag': 'override'}, 'denied': 'TRAM ACCESS SEALED. TRIGGER THE OVERRIDE ON THE BRIDGE.', 'map': '#b04dff'},
    },
    'keys': {'B': {'color': '#3c78ff'}, 'Y': {'color': '#ffd200'}, 'R': {'color': '#ff3030'}},

    # ---- state the rules read and write ----
    'state': {'flags': {'power': False, 'override': False}, 'counters': {'breakers': 0}},

    # ---- rules: when something happens, check a condition, run actions ----
    'rules': [
        {'on': {'event': 'start'}, 'do': [
            {'say': 'start', 'sub': 3.6},
            {'objective': 'Get inside the ship. Take the transit corridor north out of the docking bay.', 'show': 7},
        ]},
        {'on': {'event': 'enterZone', 'zone': 'hub'}, 'do': [
            {'objective': 'Find a keycard. Try the crew deck, north of the atrium.'},
            {'ambush': 'hub', 'delay': 1.2},
        ]},
        {'on': {'event': 'enterZone', 'zone': 'reception'}, 'do': [{'ambush': 'reception', 'delay': .8}]},
        {'on': {'event': 'enterZone', 'zone': 'hydro'}, 'do': [{'ambush': 'hydro', 'delay': 2}, {'say': 'salad_bar', 'sub': 2.8}]},
        {'on': {'event': 'enterZone', 'zone': 'cargo'}, 'do': [{'ambush': 'cargo', 'delay': 2}]},
        {'on': {'event': 'enterZone', 'zone': 'security'}, 'do': [{'ambush': 'security', 'delay': 1.5}]},
        {'on': {'event': 'enterZone', 'zone': 'hall'}, 'if': {'not': {'flag': 'power'}}, 'do': [
            {'objective': 'Reset the three breakers: one here in Engineering, one in the Coolant Pumps, one in the Reactor room.'},
        ]},

        {'on': {'event': 'pickup', 'item': 'keyB'}, 'do': [
            {'msg': 'BLUE KEYCARD ACQUIRED'}, {'sfx': 'key'}, {'say': 'blue_card', 'sub': 3},
            {'objective': 'The blue door is on the east side of the atrium. Get the power back on in Engineering.'},
            {'ambush': 'blue', 'delay': 2.5}, {'autosave': 'events'},
        ]},
        {'on': {'event': 'pickup', 'item': 'keyY'}, 'do': [
            {'msg': 'YELLOW KEYCARD ACQUIRED'}, {'sfx': 'key'}, {'say': 'yellow_card', 'sub': 3},
            {'objective': 'The yellow door is on the south side of the atrium. Find the red keycard in Cargo.'},
            {'ambush': 'yellow', 'delay': 3}, {'autosave': 'events'},
        ]},
        {'on': {'event': 'pickup', 'item': 'keyR'}, 'do': [
            {'msg': 'RED KEYCARD ACQUIRED'}, {'sfx': 'key'}, {'say': 'red_card', 'sub': 3},
            {'objective': 'The red door is on the east side of the crew mess. Trigger the tram override on the Bridge.'},
            {'ambush': 'red', 'delay': 2}, {'autosave': 'events'},
        ]},

        # Tanaka's three breakers. Using one swaps its wall to the lit version (legend 'after').
        {'on': {'event': 'use', 'target': 'breaker'}, 'do': [
            {'setTile': 'after'}, {'add': 'breakers', 'value': 1}, {'sfx': 'breaker'}, {'shake': .2},
            {'msg': 'BREAKER RESET ({breakers}/3)'},
            {'if': {'counter': 'breakers', 'gte': 3}, 'then': [
                {'set': 'power', 'value': True}, {'sfx': 'powerup'}, {'flash': 1.5, 'color': [1, .9, .7]},
                {'msg': 'MAIN POWER RESTORED'},
                {'objective': "Power's on. Get the yellow keycard from the Chief Engineer's office, north side of Engineering."},
                {'ambush': 'power', 'delay': 2.5}, {'autosave': 'events'}, {'say': 'lights_on', 'sub': 3.2},
            ], 'else': [
                {'objective': 'Breakers reset: {breakers} of 3. Check Engineering, the Coolant Pumps, and the Reactor room.'},
                {'if': {'counter': 'breakers', 'eq': 1}, 'then': [{'say': 'one_down', 'sub': 1.8}]},
            ]},
        ]},

        # The tram override console on the Bridge.
        {'on': {'event': 'use', 'target': 'override'}, 'do': [
            {'if': {'flag': 'override'}, 'then': [{'msg': 'OVERRIDE ALREADY ENGAGED'}],
             'else': [{'if': {'not': {'flag': 'power'}}, 'then': [{'msg': 'NO POWER. RESTORE MAIN POWER FIRST.'}, {'sfx': 'denied'}],
                       'else': [{'if': {'not': {'key': 'R'}}, 'then': [{'msg': 'RED KEYCARD REQUIRED.'}, {'sfx': 'denied'}],
                                 'else': [
                                     {'set': 'override', 'value': True}, {'set': 'lightsOut', 'value': True}, {'set': 'alarm', 'value': True},
                                     {'msg': 'TRAM OVERRIDE ENGAGED'}, {'msg': 'WARNING: CONTAINMENT FAILURE ON DECK 1'},
                                     {'sfx': 'stinger'}, {'sfx': 'klaxon'}, {'music': 1},
                                     {'after': .9, 'do': [{'say': 'fine_print', 'sub': 3}]},
                                     {'objective': 'Get to the tram. Back through the atrium, then south through Engineering.'},
                                     {'ambush': 'override', 'delay': 1.2}, {'autosave': 'events'},
                                 ]}]}]},
        ]},

        {'on': {'event': 'doorUnlock', 'lock': 'override'}, 'do': [{'say': 'tram_open', 'sub': 3}]},
        {'on': {'event': 'doorDenied', 'lock': 'power'}, 'once': True, 'do': [{'say': 'no_power', 'sub': 2.6}]},
        {'on': {'event': 'useDecor', 'decor': 'arcade'}, 'do': [
            {'msg': 'STAR REPO // HIGH SCORE: BUCK 999,990'}, {'sfx': 'pickup'}, {'say': 'still_got_it', 'sub': 2.2},
        ]},

        # Leaving the deck. (The Deck 02 chat replaces this with the departure lever and confirm screen.)
        {'on': {'event': 'region', 'zone': 'tram', 'minY': 71.6}, 'if': {'flag': 'override'}, 'do': [{'win': True}]},
    ],

    # Vent ambushes. Each spawn list is scaled by the difficulty's spawn multiplier.
    'ambushes': {
        'hub': {'zones': ['hub'], 'spawns': ['husk', 'husk', 'crawler']},
        'reception': {'zones': ['reception'], 'spawns': ['crawler', 'crawler']},
        'hydro': {'zones': ['hydro'], 'spawns': ['husk', 'spitter']},
        'blue': {'zones': ['commons', 'bunks'], 'spawns': ['husk', 'husk', 'crawler', 'spitter']},
        'power': {'zones': ['hall', 'reactor'], 'spawns': ['husk', 'husk', 'crawler', 'crawler', 'spitter', 'bloater']},
        'yellow': {'zones': ['hub'], 'spawns': ['husk', 'husk', 'crawler', 'spitter']},
        'cargo': {'zones': ['cargo'], 'spawns': ['crawler', 'crawler', 'husk']},
        'red': {'zones': ['cargo'], 'spawns': ['husk', 'husk', 'bloater', 'crawler', 'crawler']},
        'security': {'zones': ['security'], 'spawns': ['husk', 'spitter']},
        'override': {'zones': ['hub', 'hall', 'tram'], 'spawns': ['husk', 'husk', 'husk', 'crawler', 'crawler', 'spitter', 'bloater']},
    },

    # The PATH button: the first step whose 'until' is still false is the target.
    'guide': [
        {'until': {'visited': 'hub'}, 'to': {'cell': [44, 52]}},
        {'until': {'key': 'B'}, 'to': {'item': 'keyB'}},
        {'until': {'flag': 'power'}, 'to': {'nearestUse': 'breaker'}},
        {'until': {'key': 'Y'}, 'to': {'item': 'keyY'}},
        {'until': {'key': 'R'}, 'to': {'item': 'keyR'}},
        {'until': {'flag': 'override'}, 'to': {'use': 'override'}},
        {'to': {'cell': [75, 72]}},
    ],

    # Map legend entries shown under the automap (besides cleared / items left / secret).
    'mapLegend': [['SAVE', '#30ff70'], ['BREAKER', '#ff4030']],
}

# Buck lines that only this deck uses: id -> (text, subtitle seconds).
LINES = {
    'start': "Brimstone Maiden. Ninety days overdue. Let's go collect.",
    'salad_bar': 'Smells like a salad bar died in here.',
    'blue_card': "Blue card. Now we're getting somewhere.",
    'yellow_card': 'Yellow card. Cargo, here I come.',
    'red_card': "Red card. Let's go see the bridge.",
    'one_down': 'One down.',
    'lights_on': "Lights are on. Now I can see what's eating me.",
    'no_power': 'No power, no tram. Figures.',
    'fine_print': "And there's the fine print.",
    'tram_open': "Tram's open. Somebody's waiting, aren't they.",
    'still_got_it': 'Still got it.',
}

# Pause-menu archive order.
LOG_ORDER = ['dockoffice', 'reception', 'morgue', 'lab', 'hydro', 'bunks', 'captain', 'commons',
             'hall', 'chief', 'reactor', 'cargo', 'container', 'cargooffice', 'security', 'bridge']
