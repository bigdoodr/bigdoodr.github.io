"""Series-wide achievements, written as pack data (core/achievements.json).

Each achievement is a line item on Buck's invoice. Earning conditions are either a
running total (`progress`) that unlocks at its target, or an event with a condition
(`on` / `if`), in the same vocabulary as deck rules (FORMAT.md, "Achievements").
Deck-only achievements live in each deck's deckNN.py.

`status`: "live" ones can be earned in the current engine and get registered with
Game Center for the next build; "planned" ones are defined but can't happen yet
(no boss on Deck 01), so they wait for the update that makes them earnable.

Points come from the series budget in the bible (approved by Casey before anything
goes to App Store Connect). Points and IDs never change once live.
"""

ACHIEVEMENTS = [
    dict(id='hb.foot_the_bill', name='Foot the Bill', points=10,
         desc='Land the final blow with a kick, 50 times.', earned='Fifty kicks to settle accounts.',
         progress=dict(stat='kickKills', target=50), line='footnote'),
    dict(id='hb.steel_toed', name='Steel-Toed', points=15, status='planned',
         desc='Finish any boss with a kick.', earned='Finished a boss with a kick.',
         on=dict(event='kill'), cond={'all': [{'field': 'boss', 'eq': True}, {'field': 'cause', 'eq': 'kick'}]}, line='steel_toed'),
    dict(id='hb.line_items', name='Line Items', points=15,
         desc='Sever 500 limbs.', earned='Five hundred limbs, itemized.',
         progress=dict(stat='limbsSevered', target=500), line='line_items'),
    dict(id='hb.do_not_resuscitate', name='Do Not Resuscitate', points=10,
         desc='Kick 25 bodies so they stay down, on Normal or harder.', earned='Twenty-five bodies kept down.',
         progress=dict(stat='bodiesKicked', target=25, minDifficulty=2), line='dnr'),
    dict(id='hb.collateral_damage', name='Collateral Damage', points=10,
         desc='Kill 3 enemies with one bloater burst.', earned='Three for the price of one bloater.',
         on=dict(event='blast'), cond={'all': [{'field': 'source', 'eq': 'bloater'}, {'field': 'kills', 'gte': 3}]}, line='collateral'),
    dict(id='hb.bulk_discount', name='Bulk Discount', points=10,
         desc='Kill 5 enemies with one Charge Bomb.', earned='Five accounts closed with one charge.',
         on=dict(event='blast'), cond={'all': [{'field': 'source', 'eq': 'bomb'}, {'field': 'kills', 'gte': 5}]}, line='bulk_discount'),
    dict(id='hb.no_head_for_business', name='No Head for Business', points=10,
         desc="Take a spitter's head while it's spitting.", earned='Beheaded a spitter mid-spit.',
         on=dict(event='sever'), cond={'all': [{'field': 'enemy', 'eq': 'spitter'}, {'field': 'limb', 'eq': 'head'}, {'field': 'state', 'eq': 'spit'}]},
         line='no_head'),
    dict(id='hb.liability', name='Liability', points=5,
         desc='Get killed by your own Charge Bomb.', earned='Blew yourself up. On the clock.',
         on=dict(event='death'), cond={'field': 'cause', 'eq': 'bomb'}, line=None),
    dict(id='hb.hidden_fees', name='Hidden Fees', points=10,
         desc='Find every secret in a deck.', earned='Found every secret in a deck.',
         on=dict(event='secret'), cond={'field': 'found', 'eqField': 'total'}, line='hidden_fees'),
    dict(id='hb.clean_credit', name='Clean Credit', points=25,
         desc='Clear a deck without taking damage.', earned='Cleared a deck without a scratch.',
         on=dict(event='deckClear'), cond={'field': 'damageTaken', 'eq': 0}, line='clean_credit'),
    dict(id='hb.rush_job', name='Rush Job', points=25,
         desc="Clear a deck under its par time.", earned='Cleared a deck under par.',
         on=dict(event='deckClear'), cond={'field': 'underPar', 'eq': True}, line='rush_job'),
    dict(id='hb.budget_cuts', name='Budget Cuts', points=25,
         desc='Clear a deck using only the Cutter and kicks.', earned='Cleared a deck on Cutter and boot leather.',
         on=dict(event='deckClear'), cond={'field': 'weapons', 'subsetOf': ['cutter', 'kick']}, line='budget_cuts'),
    dict(id='hb.bad_credit', name='Bad Credit', points=10,
         desc='Die 100 times.', earned='Written off a hundred times.',
         progress=dict(stat='deaths', target=100), line='bad_credit'),
]

# Buck's reactions, by line id: one short line each, recorded with BUCK-VOICE.
LINES = {
    'footnote': 'Consider that a footnote.',
    'steel_toed': 'Steel toes. Best investment I ever made.',
    'line_items': "Five hundred line items. That's a long invoice.",
    'dnr': 'Stay down. That one\'s in writing.',
    'collateral': "Collateral. Gorgon loves collateral.",
    'bulk_discount': 'Bulk discount. Volume pricing.',
    'no_head': "Nothing to say? Didn't think so.",
    'hidden_fees': 'Every hidden fee. Found them all.',
    'clean_credit': 'Not a scratch. Clean credit.',
    'rush_job': 'Rush job. Bill them for overtime anyway.',
    'budget_cuts': 'Budget cuts. Still got the job done.',
    'bad_credit': "A hundred times dead. My credit score's taken worse.",
}
