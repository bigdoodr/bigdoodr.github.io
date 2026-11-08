"""Boot the web game headless, start a deck, play a few seconds, screenshot.
    python3 smoke.py [url] [deck] [difficulty] [out.png]"""
import sys, time
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/hb/'
DECK = int(sys.argv[2]) if len(sys.argv) > 2 else 1
DI = int(sys.argv[3]) if len(sys.argv) > 3 else 2
OUT = sys.argv[4] if len(sys.argv) > 4 else '/tmp/smoke.png'
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.type + ' ' + m.text) if m.type in ('error', 'warning') else None)
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL)
    try:
        pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=20000)
    except Exception as ex:
        print('\n'.join(errs)); raise
    pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=20000)
    pg.screenshot(path=OUT.replace('.png', '_title.png'))
    pg.evaluate(f"startGame({DI},{DECK})")
    pg.wait_for_function("G.state==='intro'", timeout=20000)
    pg.evaluate("beginPlay()")
    time.sleep(2.5)
    info = pg.evaluate("({state:G.state,obj:G.obj,zone:(zoneAtXY(P.x,P.y)||{}).id,ents:ENTS.length,total:G.total,logs:G.logTotal,assets:G.assetTotal,secrets:G.secretTotal,hp:P.hp,flags:G.flags,counters:G.counters})")
    print(info)
    pg.screenshot(path=OUT)
    b.close()
for e in errs: print(e)
