"""Screenshots at chosen spots: python3 shots.py url deck out_dir 'name:x,y,angle[,pitch][;js]' ..."""
import sys, time, os
from playwright.sync_api import sync_playwright
URL, DECK, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page(viewport={'width': 1280, 'height': 720})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=30000)
    pg.evaluate(f"startGame(2,{DECK})"); pg.wait_for_function("G.state==='intro'"); pg.evaluate("beginPlay()")
    pg.evaluate("G.god=true")
    for spec in sys.argv[4:]:
        name, rest = spec.split(':', 1)
        pos, _, js = rest.partition(';')
        v = [float(t) for t in pos.split(',')]
        pg.evaluate(f"()=>{{P.x={v[0]};P.y={v[1]};P.ang={v[2]};P.pitch={v[3] if len(v)>3 else 0};G.banner=null;G.objT=0;MSGS.length=0;{js}}}")
        time.sleep(1.2)
        pg.screenshot(path=os.path.join(OUT, name + '.png'))
    b.close()
    for e in errs: print('PAGE ERROR', e)
