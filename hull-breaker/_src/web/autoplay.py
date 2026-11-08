"""Drive the real engine through a deck by its own PATH guide, on every difficulty.
    python3 autoplay.py [url] [deck ...]
For each deck and difficulty: start it, follow objTarget() (teleporting to each target, using
walls, picking up items, beating bosses), confirm the DEPART screen, depart, and check the clear
was recorded. Then a 100% run: every item, secret and enemy, and the header must read
ACCOUNT CLOSED IN FULL. Prints the route and any page errors."""
import sys, json
from playwright.sync_api import sync_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/hb/'
DECKS = [int(a) for a in sys.argv[2:]] or [1, 2]
STEP = r"""() => {
  const tick=(n)=>{for(let k=0;k<n;k++){if(G.state!=='play')break;playUpdate(1/30);}};
  G.god=true;G.notarget=true;
  const tg=objTarget();if(!tg)return {done:false,why:'no target'};
  // boss in the way? beat it
  for(const e of ENTS)if(e.kind==='enemy'&&!e.gone&&ETYPE[e.type]&&ETYPE[e.type].boss&&Math.hypot(e.x-tg[0]-.5,e.y-tg[1]-.5)<4){HITCAUSE='cutter';killEnemy(e,.5,false);tick(140);if(G.scene){for(let k=0;k<200&&G.scene;k++)playUpdate(1/30);}return {did:'beat '+e.type};}
  P.x=tg[0]+.5;P.y=tg[1]+.5;tick(3);
  // a wall to use next to this cell?
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const i=I(tg[0]+dx,tg[1]+dy),u=wallUse(i);
    if(u&&u!=='@save'){P.ang=Math.atan2(dy,dx);use();tick(40);return {did:'use '+u+' at '+(tg[0]+dx)+','+(tg[1]+dy),state:G.state};}}
  tick(20);
  return {did:'go '+tg,state:G.state};
}"""
FULL = r"""() => {
  G.god=true;G.notarget=true;const tick=(n)=>{for(let k=0;k<n;k++){if(G.state!=='play')break;playUpdate(1/30);}};
  for(const d of doors)if(d.lock==='secret'){d.lock='opened';G.secrets[d.i]=1;}
  for(const e of ENTS.slice())if(e.kind==='pickup'&&!e.gone){P.x=e.x;P.y=e.y;tick(2);if(!e.gone){const it=PACKS.core.tuning.items[e.t];if(it&&(it.log||it.asset)){G.taken[e.sid]=1;take(e);e.gone=true;}}}
  stopLog();
  for(let pass=0;pass<3;pass++)for(const e of ENTS.slice())if(e.kind==='enemy'&&!e.gone&&e.state!=='dead'){HITCAUSE='cutter';killEnemy(e,.5,false);}
  G.events=G.events.filter(v=>false);
  return {pct:deckPct(),kills:G.kills,total:G.total};
}"""
errs = []; fails = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/fonts.g*/**', lambda r: r.abort())
    pg.goto(URL); pg.wait_for_function("typeof G!=='undefined' && G.state==='title'", timeout=30000)
    for n in DECKS:
        for di in range(5):
            pg.evaluate("localStorage.clear()")
            pg.evaluate(f"startGame({di},{n})"); pg.wait_for_function("G.state==='intro'", timeout=30000)
            pg.evaluate("beginPlay()")
            route = []
            for k in range(60):
                r = pg.evaluate(STEP); route.append(r.get('did') or r.get('why'))
                st = pg.evaluate('G.state')
                if st == 'depart': break
            st = pg.evaluate('G.state')
            if st != 'depart': fails.append(f'deck {n} diff {di}: never reached DEPART; route {route[-6:]}'); continue
            pg.evaluate("act('depart')")
            ok = pg.evaluate(f"G.won && readCampaign().cleared[{n}] && readCampaign().cleared[{n}].diff===DIFF[{di}].name")
            if not ok: fails.append(f'deck {n} diff {di}: clear not recorded')
            if di == 2: print(f'deck {n} route:', ' | '.join(route))
            print(f'deck {n} difficulty {di}: cleared in {len(route)} steps')
        # 100%
        pg.evaluate(f"startGame(2,{n})"); pg.wait_for_function("G.state==='intro'", timeout=30000); pg.evaluate("beginPlay()")
        print(f'deck {n} 100% run:', pg.evaluate(FULL))
        for k in range(60):
            pg.evaluate(STEP)
            if pg.evaluate('G.state') == 'depart': break
        # anything the walk itself set off (ambushes) gets swept too, then pull the lever again
        pg.evaluate("act('stay')")
        pg.evaluate("()=>{for(let k=0;k<400&&(G.events.length||Object.keys(G.pend).length);k++){G.playTime+=1;const due=G.events.filter(v=>v.t<=G.playTime);G.events=G.events.filter(v=>v.t>G.playTime);due.forEach(v=>v.fn());}}")
        print(f'deck {n} sweep 2:', pg.evaluate(FULL))
        for k in range(10):
            pg.evaluate(STEP)
            if pg.evaluate('G.state') == 'depart': break
        h = pg.evaluate("document.querySelector('#dp-h').textContent")
        print(f'deck {n} DEPART header:', h, '|', pg.evaluate("document.querySelector('#dp-stats').innerText.replace(/\\n/g,' ')"))
        if h != 'ACCOUNT CLOSED IN FULL': fails.append(f'deck {n}: 100% not reached ({h})')
        pg.evaluate("act('depart')")
        print(f'deck {n} achievements earned:', pg.evaluate("Object.keys(HBP.achievements.data().earned)"))
    b.close()
for e in errs: print('PAGE ERROR', e)
for f in fails: print('FAIL', f)
print('AUTOPLAY OK' if not fails and not errs else 'AUTOPLAY FAILED')
