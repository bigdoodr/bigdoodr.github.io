'use strict';
/* Hull Breaker: the deck runtime (engine 1.3). Builds a deck from its pack and runs the deck's
   rules, in the vocabulary of _src/pack/FORMAT.md. Nothing in here is specific to one deck:
   Deck 01's keycards, breakers and override are rules in packs/deck-01/deck.json. */

/* ---------- textures and sprites named by the packs ---------- */
const TEXID={};for(const k in T)TEXID[k.toLowerCase()]=T[k];
const FLOORID={deckplate:0,tile:1,grating:2,soil:3,carpet:4,water:5,deepwater:6};
// A texture id the engine doesn't paint itself is loaded from the pack's PNG (art.json).
async function ensureTexture(id){
  if(TEXID[id]!=null)return TEXID[id];
  if(id.startsWith('crack_')){const b=await ensureTexture(id.slice(6));TEXID[id]=crackTex(b);return TEXID[id];}
  const core=PACKS.core,deckArt=DK&&DK.art,def=(deckArt&&deckArt.textures&&deckArt.textures[id])||core.art.textures[id];
  if(!def){console.warn('unknown texture',id);return T.HULL;}
  const pack=deckArt&&deckArt.textures&&deckArt.textures[id]?DK.id:'core';
  try{const c=await packImage(pack,def.file),e=def.emissive?await packImage(pack,def.emissive):null;
    const idx=TEX.length;TEX[idx]=texFrom(c,e?maskCanvas(e):null);TEXID[id]=idx;return idx;}
  catch(err){console.warn(err);return T.HULL;}
}
function maskCanvas(src){const c=canvasOf(src.width,src.height),g=c.getContext('2d'),d=src.getContext('2d').getImageData(0,0,src.width,src.height);
  for(let i=0;i<d.data.length;i+=4)d.data[i+3]=d.data[i]>127?255:0;g.putImageData(d,0,0);return c;}
async function ensureSprite(id){
  if(IMG[id])return;
  const def=PACKS.core.art.sprites[id];if(!def){console.warn('unknown sprite',id);return;}
  try{IMG[id]=imgFrom(await packImage('core',def.file),def.emissive==='all');}catch(e){console.warn(e);}
}

/* ---------- the compiled deck ---------- */
let DK=null;     // {id, n, deck, level, legend, walls, logs, ...}
async function prepareDeck(n){
  const pk=await loadDeck(n),deck=pk.deck,leg=deck.legend;registerEnemyTypes();
  DK={id:pk.id,n,deck,level:pk.level,leg,pack:pk,logs:pk.logs.logs,walls:{},texOf:{}};
  for(const [ch,w] of Object.entries(leg.walls)){
    DK.walls[ch]=Object.assign({},w,{tid:await ensureTexture(w.tex),atid:w.after?await ensureTexture(w.after.tex):0});
  }
  for(const l of Object.values(deck.locks))if(l.tex)DK.texOf[l.tex]=await ensureTexture(l.tex);
  for(const d of pk.level.doors||[])DK.texOf[d.tex]=await ensureTexture(d.tex);
  DK.texOf.unlock=T.UNLOCK;
  const tun=PACKS.core.tuning;
  for(const o of Object.values(leg.objects)){
    if(o.item){const it=tun.items[o.item];if(it&&it.sprite)await ensureSprite(it.sprite);}
    if(o.decor){const dd=tun.decor[o.decor];if(dd&&dd.sprite)await ensureSprite(dd.sprite);}
  }
  DK.floors=Object.assign({},leg.floors||{});
  DK.useWalls=new Set();for(const w of Object.values(DK.walls)){if(w.use)DK.useWalls.add(w.tid);if(w.after&&w.after.use)DK.useWalls.add(w.atid);}
  DK.tidUse={};DK.tidAfter={};
  for(const w of Object.values(DK.walls)){if(w.use)DK.tidUse[w.tid]=w.use;if(w.after){DK.tidAfter[w.tid]=w.atid;if(w.after.use)DK.tidUse[w.atid]=w.after.use;}if(w.role==='save')DK.tidUse[w.tid]='@save';}
  DK.mapColor={};for(const w of Object.values(DK.walls)){if(w.map)DK.mapColor[w.tid]=w.map;if(w.after&&w.after.map)DK.mapColor[w.atid]=w.after.map;}
  LEVEL=pk.level;DECK=pk;
  return DK;
}
// What Use does on a wall cell: its legend 'use', or its 'after' use once a rule has switched it.
function wallUse(i){
  if(doorAt[i]||!LEVEL)return null;const x=i%MW,y=(i/MW)|0,w=DK.walls[LEVEL.geo[y][x]];if(!w)return null;
  if(G.tiles&&G.tiles[i]!=null)return w.after&&w.after.use||null;
  return w.use||(w.role==='save'?'@save':null);
}
// The guide names a wall by its first use, so it still finds the lever after the glass is broken.
function wallUse0(i){if(doorAt[i]||!LEVEL)return null;const w=DK.walls[LEVEL.geo[(i/MW)|0][i%MW]];return w&&w.use||null;}
const deckNum=()=>DK?DK.n:1;
const deckNN=()=>String(deckNum()).padStart(2,'0');

/* ---------- level: map, doors, water, lights ---------- */
let WATER=new Uint8Array(1);     // per cell: 0 dry, 1 wade, 2 swim
// Map knowledge (engine 1.3). KNOWN: the real layout a floor-plan terminal reveals (never secret rooms or secret doors).
// SCHEM: Gorgon's out-of-date copy from deck.schematic, drawn faintly until the terminal is used (null = the deck has none).
let KNOWN=new Uint8Array(1),SCHEM=null;
function buildLevelMap(){
  const L=LEVEL,leg=DK.leg;setDims(L.w,L.h);WATER=new Uint8Array(MAPN);
  for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++){
    const c=L.geo[y][x],i=I(x,y);
    if(c===leg.floor||leg.doors[c]){map[i]=0;continue;}
    const fl=DK.floors[c];if(fl){map[i]=0;WATER[i]=fl.water==='swim'?2:fl.water==='wade'?1:0;continue;}
    map[i]=DK.walls[c]?DK.walls[c].tid:T.HULL;
  }
  L.zones.forEach((z,zi)=>{for(let y=z.y1;y<=z.y2;y++)for(let x=z.x1;x<=z.x2;x++){const i=I(x,y);zoneAt[i]=zi;floorT[i]=WATER[i]===2?FLOORID.deepwater:WATER[i]===1?FLOORID.water:(FLOORID[z.floor]||0);}});
  const over={};for(const d of L.doors||[])over[d.y*L.w+d.x]=d.tex;
  for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++){
    const c=L.geo[y][x],lock=leg.doors[c];if(!lock)continue;
    const lk=DK.deck.locks[lock]||{};let tex=0;
    if(over[y*L.w+x])tex=DK.texOf[over[y*L.w+x]];
    else if(lk.secret)tex=crackTex(T.HULL);
    else tex=lk.tex?DK.texOf[lk.tex]:T.DOOR;
    addDoor(x,y,lock,tex);
    const nz=[I(x-1,y),I(x+1,y),I(x,y-1),I(x,y+1)].map(j=>zoneAt[j]).find(v=>v>=0);
    floorT[I(x,y)]=nz!=null&&nz>=0?(FLOORID[L.zones[nz].floor]||0):0;
  }
  KNOWN=new Uint8Array(MAPN);
  for(let i=0;i<MAPN;i++){if(map[i]!==0)continue;const z=zoneAt[i],d=doorAt[i];
    if(d?d.lock==='secret':(z>=0&&L.zones[z].secret))continue;KNOWN[i]=1;}
  const sc=DK.deck.schematic;SCHEM=null;
  if(sc){SCHEM=KNOWN.slice();
    for(const [v,rs] of [[0,sc.hide||[]],[1,sc.add||[]]])for(const r of rs)for(let y=r[1];y<=r[3];y++)for(let x=r[0];x<=r[2];x++)SCHEM[I(x,y)]=v;}
}
function levelLights(L){
  const out=[];
  L.zones.forEach((z,zi)=>{
    const col=z.light||[1,.8,.55],w=z.x2-z.x1+1,h=z.y2-z.y1+1,area=w*h,grp=z.power?'power':'';
    if(z.secret){out.push([(z.x1+z.x2+1)/2,(z.y1+z.y2+1)/2,[1,.7,.4],3.4,'steady',1,'']);return;}
    const sp=z.dark?6.5:5,rad=z.dark?4.3:5.6,nx=Math.max(1,Math.round(w/sp)),ny=Math.max(1,Math.round(h/sp));
    for(let a=0;a<ny;a++)for(let b=0;b<nx;b++){
      const lx=z.x1+Math.floor((b+.5)*w/nx),ly=z.y1+Math.floor((a+.5)*h/ny);
      if(map[I(lx,ly)]!==0)continue;
      const hs=hash(lx*31+ly*17+zi),type=z.dark?(hs<.45?'dying':hs<.7?'flicker':'steady'):(hs<.1?'dying':hs<.25?'flicker':'steady');
      out.push([lx+.5,ly+.5,col,rad,type,0,grp]);
    }
    if(area>=20){
      const cx=(z.x1+z.x2+1)/2,cy=(z.y1+z.y2+1)/2,r=clamp(Math.sqrt(area)*.6,4,9);
      out.push([cx,cy,[1,.08,.06],r,'alarm',0,'']);
      if(z.power)out.push([cx,cy,[1,.16,.08],r*.85,'emerg',1,'']);
    }
  });
  const lit={};for(const w of Object.values(DK.walls))if(w.light){lit[w.tid]=w.light;if(w.after)lit[w.atid]=w.light;}
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){
    const c=lit[map[I(x,y)]];if(!c||doorAt[I(x,y)])continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(map[I(x+dx,y+dy)]===0){out.push([x+.5+dx*.9,y+.5+dy*.9,c,2.4,'steady',1,'']);break;}
  }
  return out;
}

/* ---------- a new run of the current deck ---------- */
let LOGLIST=[];
function zoneAtXY(x,y){const z=zoneAt[I(x|0,y|0)];return z>=0?LEVEL.zones[z]:null;}
function newGame(di,carry){
  G.diff=di;D=DIFF[di];
  buildLevelMap();initLights(levelLights(LEVEL));
  ENTS=[];PARTS=[];PL=PARTS;PROJ=[];MSGS.length=0;POPS.length=0;
  const st=DK.deck.state||{flags:{},counters:{}};
  Object.assign(G,{total:0,kills:0,limbs:0,playTime:0,lightsOut:false,alarm:false,power:false,events:[],flash:0,shake:0,
    saidLow:false,tipHead:false,said:{},ambT:6,obj:'',objT:0,won:false,flowT:0,curZone:-1,visited:{},vz:{},amb:{},pend:{},secrets:{},logs:{},assets:{},taken:{},
    banner:null,mapOn:false,reviveTip:false,flags:Object.assign({},st.flags),counters:Object.assign({},st.counters),tiles:{},fired:{},
    audited:false,damageTaken:0,used:{},stays:0,mapReal:di<=1,water:0,breath:1,lastProgress:0,scene:null,god:false,buddha:false,noclip:false,notarget:false,lastBoss:null,guideTurn:null});
  if(A.lp)A.lp.frequency.value=20000;
  for(const f of ['power','lightsOut','alarm'])if(f in G.flags){G[f]=!!G.flags[f];delete G.flags[f];}
  const tun=PACKS.core.tuning;
  P={x:4.5,y:4.5,ang:0,pitch:0,r:.22,hp:100,armor:0,cells:D.cells,shells:0,rivets:0,bombs:0,has:[true,false,false,false],wpn:0,keys:{},boots:false,
    cd:0,kcd:0,kick:0,kickDone:true,anim:0,switchT:0,bob:0,bobAmt:0,stepPh:0,dead:false,deathT:0,heartT:0};
  if(carry){P.has=carry.has.slice();P.boots=!!carry.boots;P.cells=Math.max(carry.cells,D.cells>>1);P.shells=carry.shells;P.rivets=carry.rivets;P.bombs=carry.bombs;P.armor=carry.armor||0;
    P.hp=di<=1?100:di===2?Math.max(carry.hp,50):Math.max(1,carry.hp);}
  const leg=DK.leg,L=LEVEL,logAt={},assetAt={};
  for(const p of L.logs)logAt[p.y*L.w+p.x]=p.log;for(const a of L.assets)assetAt[a.y*L.w+a.x]=a.name;
  let assetN=0,logN=0;LOGLIST=[];G.guide=null;G.roomTag=null;G.lastRoom='';
  for(let y=0;y<L.h;y++)for(let x=0;x<L.w;x++){
    const c=L.obj[y][x];if(c===' ')continue;
    const o=leg.objects[c];if(!o)continue;
    const sid=I(x,y),cx=x+.5,cy=y+.5;
    if(o.start){P.x=cx;P.y=cy;continue;}
    if(o.enemy){if(di<o.min)continue;if(di===0&&o.min===0&&!(tun.enemies[o.enemy]||{}).boss&&hash(sid*.37)<tun.veryEasyThin)continue;spawnEnemy(o.enemy,cx,cy,{dormant:!!o.dormant,sid});continue;}
    if(o.item){const it=tun.items[o.item]||{},po={sid};
      if(it.asset){po.name=assetAt[sid]||'Ship fixture';assetN++;}
      if(it.log){const id=logAt[sid],lg=DK.logs.find(q=>q.id===id);if(lg){po.logId=id;po.log=[lg.header,lg.text];logN++;LOGLIST.push({sid,id,log:po.log,where:(zoneAtXY(cx,cy)||{}).name||'',order:lg.order});}}
      pickup(o.item,cx,cy,po);continue;}
    if(o.barrel){barrel(cx,cy,sid);continue;}
    if(o.decor)decor(o.decor,cx,cy,!!o.solid,o.r||.3,{sid});
  }
  G.assetTotal=assetN;G.logTotal=logN;G.secretTotal=doors.filter(d=>d.lock==='secret').length;
  setObj('',0);
}
function setObj(t,show){G.obj=t;G.objT=show==null?6:show;}

/* ---------- conditions, events, actions ---------- */
function getFlag(f){return f==='power'||f==='lightsOut'||f==='alarm'?!!G[f]:!!G.flags[f];}
function setFlag(f,v){if(f==='power'||f==='lightsOut'||f==='alarm')G[f]=!!v;else G.flags[f]=!!v;}
function cmp(v,c){if('eq' in c&&v!==c.eq)return false;if('gte' in c&&!(v>=c.gte))return false;if('lte' in c&&!(v<=c.lte))return false;return true;}
function cond(c,fl){
  if(!c)return true;
  if(c.all)return c.all.every(s=>cond(s,fl));
  if(c.any)return c.any.some(s=>cond(s,fl));
  if(c.not)return !cond(c.not,fl);
  if('flag' in c)return getFlag(c.flag);
  if('key' in c)return !!(P&&P.keys[c.key]);
  if('visited' in c)return !!G.vz[c.visited];
  if('counter' in c)return cmp(G.counters[c.counter]||0,c);
  if('difficulty' in c)return cmp(G.diff,c.difficulty);
  if('field' in c){fl=fl||{};const v=fl[c.field];
    if('in' in c)return c.in.includes(v);
    if('subsetOf' in c)return Array.isArray(v)&&v.every(x=>c.subsetOf.includes(x));
    if('eqField' in c)return v===fl[c.eqField];
    if('gteField' in c)return v>=fl[c.gteField];
    if('lteField' in c)return v<=fl[c.lteField];
    return cmp(v,c);}
  return false;
}
const EVKEYS=['zone','item','target','decor','lock','depth'];
function fireEvent(ev,args,fields){
  args=args||{};let any=false;
  const rules=DK?DK.deck.rules:[];
  for(let i=0;i<rules.length;i++){
    const r=rules[i],on=r.on;if(on.event!==ev)continue;
    if(EVKEYS.some(k=>k in on&&on[k]!==args[k]))continue;
    if(r.once&&G.fired[i])continue;
    if(!cond(r.if,fields))continue;
    G.fired[i]=1;any=true;runActions(r.do,args.cell,fields);
  }
  if(FIELD_EVENTS.has(ev))checkAchievements(ev,fields||{});
  return any;
}
const FIELD_EVENTS=new Set(['kill','blast','sever','death','secret','cheat','deckClear']);
function fmtText(t){return String(t).replace(/\{(\w+)\}/g,(m,k)=>k in G.counters?G.counters[k]:m);}
function playSfx(id){
  if(!id)return;
  const m=/^(braam|shriek)_(\d+)(?:_(\d+))?$/.exec(id);
  if(m){const v=parseFloat(m[2]+(m[3]?'.'+m[3]:''));if(m[1]==='braam')S.braam(v);else S.shriek(0,1,v);return;}
  if(id==='static'){S.staticN(.6);return;}
  if(typeof S[id]==='function'){S[id](0,1);return;}
  const def=PACKS.core&&PACKS.core.sfxDefs&&PACKS.core.sfxDefs[id];if(def)packAudio('core',def.file,b=>{if(b&&AOK()){const s=A.c.createBufferSource();s.buffer=b;const g=A.c.createGain();g.gain.value=def.gain||1;s.connect(g);g.connect(A.sfx);s.start();}});
}
function runActions(acts,cell,fields){
  for(const a of acts||[]){
    if('if' in a){runActions(cond(a.if,fields)?a.then:a.else,cell,fields);continue;}
    if('after' in a&&'do' in a){const d=a.do;G.events.push({t:G.playTime+a.after,fn:()=>runActions(d,cell,fields)});continue;}
    if('say' in a){sayLine(a.say,a.sub,true);continue;}
    if('msg' in a){msg(fmtText(a.msg));continue;}
    if('objective' in a){setObj(fmtText(a.objective),a.show);G.lastProgress=G.playTime;continue;}
    if('sfx' in a){playSfx(a.sfx);continue;}
    if('flash' in a){G.flash=Math.max(G.flash,a.flash);if(a.color)G.flashC=a.color;continue;}
    if('shake' in a){G.shake=Math.max(G.shake,a.shake);continue;}
    if('set' in a){setFlag(a.set,a.value);G.flowT=0;G.lastProgress=G.playTime;continue;}
    if('add' in a){G.counters[a.add]=(G.counters[a.add]||0)+a.value;G.lastProgress=G.playTime;continue;}
    if('ambush' in a){queueAmbush(a.ambush,a.delay||0);continue;}
    if('autosave' in a){autoSave(a.autosave);continue;}
    if('music' in a){MUS.target=a.music;MUS.hold=G.playTime+4;continue;}
    if('setTile' in a){if(cell!=null&&G.tiles[cell]==null){const w=DK.walls[LEVEL.geo[(cell/MW)|0][cell%MW]];if(w&&w.after){map[cell]=w.atid;G.tiles[cell]=w.atid;}}continue;}
    if('win' in a){G.events.push({t:G.playTime,fn:()=>winGame()});continue;}
    if('depart' in a){G.events.push({t:G.playTime,fn:()=>openDepart()});continue;}
    if('achieve' in a){achieve(a.achieve);continue;}
    if('scene' in a){playScene(a.scene);continue;}
    if('hint' in a){showHint(a.hint);continue;}
    if('floorplan' in a){G.mapReal=true;continue;}
  }
}

/* ---------- lines (Buck, and radio voices) ---------- */
const SPEAKER={buck:{name:'BUCK',color:'var(--amber)'},moss:{name:'MOSS',color:'#ff9a3c',radio:true}};
function sayLine(id,sub,force){
  const l=findLine(id);if(!l){console.warn('no line',id);return;}
  const sp=SPEAKER[l.speaker||'buck']||SPEAKER.buck;
  if(sp.radio)S.staticN(.35);
  say(l.text,sub||Math.max(2,l.text.length/16),force,l);
}
// Every line of the core and the current deck is decoded once audio is running.
function preloadVoices(){
  if(!A.c)return;
  const all=[...PACKS.core.lines.lines,...(DECK?DECK.lines.lines:[])];
  for(const l of all){if(VOB[l.text])continue;packAudio(l.pack,l.file,b=>{if(b)VOB[l.text]=b;});}
}
function logDecode(key,cb){const lg=DK&&DK.logs.find(q=>q.id===key);if(!lg)return cb(null);packAudio(lg.pack,lg.file,cb);}

/* ---------- doors and locks ---------- */
function lockOK(l){const lk=DK.deck.locks[l];if(!lk||!lk.needs)return true;return cond(lk.needs);}
function updateDoors(dt){
  for(const d of doors){
    if(d.lock==='secret')continue;
    if(d.lock==='opened'){d.open=Math.min(1,d.open+dt*1.1);continue;}
    const cx=d.x+.5,cy=d.y+.5,pd=Math.hypot(P.x-cx,P.y-cy);
    const lk=DK.deck.locks[d.lock];
    if(lk&&lk.needs){
      const ok=cond(lk.needs);
      // A door shows its open (green) look as soon as you can get through it, not only once you walk up.
      if(ok&&!d.ready){d.ready=true;map[d.i]=T.UNLOCK;}
      else if(!ok&&d.ready){d.ready=false;map[d.i]=lk.tex?DK.texOf[lk.tex]:T.DOOR;}
      if(pd<1.7){
        if(ok){const was=d.lock;d.lock='none';map[d.i]=T.UNLOCK;S.key();msg(PACKS.core.strings.accessGranted);G.flowT=0;fireEvent('doorUnlock',{lock:was});}
        else if(G.clock>d.msgT){d.msgT=G.clock+3;msg(lk.denied||'LOCKED.');S.denied();fireEvent('doorDenied',{lock:d.lock});}
      }
      continue;
    }
    let near=pd<1.6;
    if(!near&&pd<14)for(const e of ENTS)if(e.kind==='enemy'&&e.state==='chase'&&Math.abs(e.x-cx)<1.3&&Math.abs(e.y-cy)<1.3){near=true;break;}
    if(near)d.hold=1.4;else d.hold-=dt;
    const target=d.hold>0?1:0;
    if(target>d.open){if(d.open===0){const [p,v]=panOf(cx,cy);S.door(p,v);}d.open=Math.min(1,d.open+dt*2.4);}
    else if(target<d.open){let occ=pd<.75;if(!occ)for(const e of ENTS)if(e.kind==='enemy'&&Math.abs(e.x-cx)<.75&&Math.abs(e.y-cy)<.75){occ=true;break;}
      if(!occ){if(d.open===1){const [p,v]=panOf(cx,cy);S.door(p,v*.7);}d.open=Math.max(0,d.open-dt*1.8);}}
  }
}

/* ---------- Use ---------- */
function useTarget(){
  for(const da of [0,-.3,.3]){
    for(const dist of [.6,.95,1.3]){
      const a=P.ang+da,x=P.x+Math.cos(a)*dist,y=P.y+Math.sin(a)*dist;if(x<0||y<0||x>=MW||y>=MH)break;
      const i=I(x|0,y|0),t=map[i],d=doorAt[i];
      if(d&&d.lock==='secret')return {k:'secret',d};
      const wu=wallUse(i);if(!d&&wu)return {k:wu,i};
      if(t&&!d)return {k:'wall',i};
    }
  }
  return null;
}
const SECRETQ=['secret_1','secret_2','secret_3','secret_4','secret_5','secret_6'];
function use(){
  const u=useTarget();
  if(u&&u.k==='secret'){const d=u.d;d.lock='opened';G.secrets[d.i]=1;G.flowT=0;msg(PACKS.core.strings.secretFound);S.door(0,1);S.key();G.lastProgress=G.playTime;
    const n=Object.keys(G.secrets).length;let q='secret_first';if(n>1){const pool=SECRETQ.filter(x=>x!==G.lastSecretQ);q=pool[(R()*pool.length)|0];}G.lastSecretQ=q;sayLine('core:'+q,2.8,true);
    fireEvent('secret',{},{found:n,total:G.secretTotal});return;}
  if(u&&u.k==='@save'){
    if(D.save==='never'){msg('NO SAVES ON NIGHTMARE. FINISH THE DECK.');S.denied();return;}
    saveGame();S.save();msg(PACKS.core.strings.saved);FX.pick=.2;if(!G.said.save){G.said.save=1;sayLine('core:save_first',2.2,true);}return;}
  if(u&&u.k!=='wall'){if(fireEvent('use',{target:u.k,cell:u.i}))return;}
  for(const e of ENTS)if(e.kind==='decor'&&!e.gone&&Math.hypot(e.x-P.x,e.y-P.y)<1.5){if(fireEvent('useDecor',{decor:e.t}))return;}
  // Nothing to use: a plain wall answers with a dull thud, so searching for secrets gives feedback.
  if(u&&u.k==='wall')S.thud();else S.dry();
}

/* ---------- ambushes ---------- */
function queueAmbush(id,delay){if(G.amb[id]||G.pend[id])return;G.pend[id]=1;G.events.push({t:G.playTime+delay,fn:()=>{if(!G.pend[id])return;delete G.pend[id];ambush(id);}});}
function ambush(id){
  const a=DK.deck.ambushes[id];if(G.amb[id]||!a)return;G.amb[id]=1;const n=Math.max(1,Math.round(a.spawns.length*D.spawn));
  const vents=ventCells(a.zones);if(!vents.length)return;
  for(let k=0;k<n;k++){const type=a.spawns[k%a.spawns.length];G.events.push({t:G.playTime+.4+k*1.1,fn:()=>{const c=pickVent(vents);if(c)ventSpawnAt(c,type);}});}
}

/* ---------- pickups ---------- */
const TAGQ=['tag_1','tag_2','tag_3'];
function take(e){
  const it=PACKS.core.tuning.items[e.t];if(!it)return false;
  const a=D.ammo,h=D.heal,amax=PACKS.core.tuning.ammo,str=PACKS.core.strings;
  const n=o=>Object.keys(o).length;
  if(it.log){G.logs[e.sid]=1;playLog(e.logId,e.log[0],e.log[1]);msg(str.logFound.replace('{n}',n(G.logs)).replace('{total}',G.logTotal));S.beep(1200);FX.pick=.2;G.lastProgress=G.playTime;fireEvent('pickup',{item:e.t});return true;}
  if(it.asset){G.assets[e.sid]=1;msg(str.assetTagged.replace('{name}',e.name.toUpperCase()).replace('{n}',n(G.assets)).replace('{total}',G.assetTotal));S.key();pop('+ASSET','#ffc23a');
    if(R()<.4)sayLine('core:'+TAGQ[(R()*TAGQ.length)|0],2,false);FX.pick=.25;G.lastProgress=G.playTime;fireEvent('pickup',{item:e.t});return true;}
  if(it.key){P.keys[it.key]=1;FX.pick=.3;G.flowT=0;G.lastProgress=G.playTime;fireEvent('pickup',{item:e.t});return true;}
  if(it.boots){P.boots=true;msg(it.msg);if(it.line)sayLine('core:'+it.line,3,true);S.pickup();FX.pick=.3;G.lastProgress=G.playTime;fireEvent('pickup',{item:e.t});return true;}
  if(it.weapon!=null){P.has[it.weapon]=true;const am=it.ammo;P[am]=Math.min(amax[am].max,P[am]+Math.max(it.minAmount||0,Math.round(it.amount*a)));selectWeapon(it.weapon);msg(it.msg);
    if(it.line)sayLine('core:'+it.line,3,true);S.pickup();FX.pick=.25;G.lastProgress=G.playTime;fireEvent('pickup',{item:e.t});return true;}
  if(it.heal){if(P.hp>=100)return false;P.hp=Math.min(100,P.hp+Math.round(it.heal*h));}
  else if(it.ammo){const am=it.ammo;if(P[am]>=amax[am].max)return false;P[am]=Math.min(amax[am].max,P[am]+Math.max(it.minAmount||0,Math.round(it.amount*a)));}
  else if(it.armor){if(P.armor>=100)return false;P.armor=Math.min(100,P.armor+it.armor);}
  else return false;
  msg(it.msg);S.pickup();FX.pick=.25;fireEvent('pickup',{item:e.t});return true;
}

/* ---------- the PATH guide ---------- */
function objFind(item){const leg=DK.leg.objects;for(let y=0;y<LEVEL.h;y++)for(let x=0;x<LEVEL.w;x++){const o=leg[LEVEL.obj[y][x]];if(o&&o.item===item&&!G.taken[I(x,y)])return [x,y];}return null;}
function floorBeside(i){const x=i%MW,y=(i/MW)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const j=I(x+dx,y+dy);if(map[j]===0&&!doorAt[j])return [x+dx,y+dy];}return null;}
function objTarget(){
  for(const st of DK.deck.guide){
    if(st.until&&cond(st.until))continue;
    const to=st.to;
    if(to.cell)return to.cell;
    if(to.item){const f=objFind(to.item);if(f)return f;continue;}
    if(to.use){for(let i=0;i<MAPN;i++)if(wallUse0(i)===to.use){const f=floorBeside(i);if(f)return f;}continue;}
    if(to.nearestUse){let best=null,bl=1e9;for(let i=0;i<MAPN;i++)if(wallUse(i)===to.nearestUse){const f=floorBeside(i);if(!f)continue;const p=pathTo(f[0],f[1]);if(p&&p.length<bl){bl=p.length;best=f;}}if(best)return best;continue;}
  }
  return null;
}

/* ---------- saves (one key per deck; Deck 01 keeps the legacy key) ---------- */
const saveKey=n=>n===1?'hb-save':'hb-save-'+String(n).padStart(2,'0');
function packSeenS(){return packSeen();}
function saveGame(){
  if(D.save==='never')return;
  const z=zoneAtXY(P.x,P.y);
  const s={v:3,deck:deckNum(),diff:G.diff,time:G.playTime,zone:z?z.name:'',
    p:{x:P.x,y:P.y,ang:P.ang,hp:P.hp,armor:P.armor,cells:P.cells,shells:P.shells,rivets:P.rivets,bombs:P.bombs,has:P.has.slice(),wpn:P.wpn,keys:Object.assign({},P.keys),boots:P.boots},
    g:JSON.parse(JSON.stringify({power:G.power,lightsOut:G.lightsOut,alarm:G.alarm,flags:G.flags,counters:G.counters,tiles:G.tiles,fired:G.fired,obj:G.obj,visited:G.visited,vz:G.vz,mapReal:G.mapReal,amb:G.amb,pend:G.pend,
      secrets:G.secrets,logs:G.logs,assets:G.assets,taken:G.taken,kills:G.kills,total:G.total,limbs:G.limbs,said:G.said,saidLow:G.saidLow,tipHead:G.tipHead,audited:G.audited,damageTaken:G.damageTaken,used:G.used,stays:G.stays})),
    doors:doors.map(d=>[d.lock,map[d.i]]),
    ents:ENTS.filter(e=>e.kind==='enemy'&&!e.gone&&e.state!=='dead').map(e=>({t:e.type,x:+e.x.toFixed(2),y:+e.y.toFixed(2),hp:e.hp,lhp:e.lhp,m:e.mask,
      s:e.state==='dormant'?'d':e.state==='idle'?'i':e.state==='ceiling'?'u':e.state==='playdead'?'p':'c',sid:e.sid,b:e.berserk?1:0,x0:e.x0,y0:e.y0})),
    seen:packSeen()};
  G.lastSave=s;HBP.store.set(saveKey(deckNum()),s);
}
function loadGame(s){
  newGame(s.diff);
  ENTS=ENTS.filter(e=>e.kind!=='enemy'&&!(e.sid>=0&&s.g.taken[e.sid]));
  for(const r of s.ents){const e=makeEnemy(r.t,r.x,r.y,{sid:r.sid,dormant:r.s==='d'});e.hp=r.hp;e.lhp=r.lhp;e.mask=r.m;e.berserk=!!r.b;e.crawl=(r.m&24)===24;
    if(r.s==='c')e.state='chase';else if(r.s==='u')e.state='ceiling';else if(r.s==='p')e.state='playdead';ENTS.push(e);}
  Object.assign(P,JSON.parse(JSON.stringify(s.p)));
  const g=JSON.parse(JSON.stringify(s.g));
  if(s.v===2){ // a Deck 01 save from engine 1.2: its state lived in named fields
    g.flags={override:!!g.override};g.counters={breakers:g.breakers||0};g.tiles={};g.fired={};
    for(const i of s.brk||[])g.tiles[i]=T.BRKON;for(const i of s.lev||[])g.tiles[i]=T.LEVERON;}
  Object.assign(G,g);if(G.flags.floorplan)G.mapReal=true;G.playTime=s.time;G.events=[];G.curZone=-1;
  doors.forEach((d,i)=>{const r=s.doors[i];if(!r)return;d.lock=r[0];map[d.i]=r[1];if(d.lock==='opened')d.open=1;});
  for(const i in G.tiles)map[+i]=G.tiles[i];
  unpackSeen(s.seen);
  const pend=Object.keys(G.pend||{});G.pend={};pend.forEach(id=>queueAmbush(id,1.5));
  G.lastSave=s;
}
function readSave(n){
  n=n||curDeck();const s=HBP.store.get(saveKey(n));
  if(s&&(s.v===2||s.v===3)&&s.diff!==4&&(s.deck||1)===n)return s;
  return G.lastSave&&(G.lastSave.deck||1)===n&&G.lastSave.diff!==4?G.lastSave:null;
}

/* ---------- campaign, records, Deck Select ---------- */
function readCampaign(){const c=HBP.store.get('hb-campaign');if(c&&c.v===1){c.flags=c.flags||{};return c;}return {v:1,cleared:{},flags:{}};}
function writeCampaign(c){HBP.store.set('hb-campaign',c);}
function curDeck(){const c=readCampaign();return c.cur||1;}
function deckStatus(c,n){
  const av=deckAvailability(n);
  if(c.cleared[n])return av==='open'?'cleared':'cleared-'+av;
  if(n===1||c.cleared[n-1])return av;
  return 'locked';
}
function readRecords(){return HBP.store.get('hb-records')||{};}
function writeRecord(n,diff,pct,time,audited){
  if(audited)return;const r=readRecords(),k=n+':'+diff,o=r[k];
  r[k]={pct:Math.max(pct,o?o.pct:0),time:o&&o.time&&o.time<time?o.time:Math.round(time)};HBP.store.set('hb-records',r);
}
function catDecks(){return (PACKS.catalog&&PACKS.catalog.decks)||[];}
function openDecks(){
  G.state='diff';G.sub='decks';const c=readCampaign(),nav=$('#m-decks');nav.innerHTML='';
  catDecks().forEach(d=>{const st=deckStatus(c,d.deck),b=document.createElement('button');b.className='btn';b.tabIndex=-1;b.dataset.act='dk:'+d.deck;
    const num=String(d.deck).padStart(2,'0');b.textContent=num+'  '+(st==='locked'?'??????':d.title.toUpperCase())+(st.startsWith('cleared')?'  ✓':'')+(c.audited&&c.audited[d.deck]?'  AUDITED':'');
    if(st==='locked'||st==='dev'||st==='update')b.classList.add('dim');bindBtn(b);nav.appendChild(b);});
  const back=document.createElement('button');back.className='btn';back.tabIndex=-1;back.dataset.act='title';back.textContent='Back';bindBtn(back);nav.appendChild(back);
  const done=Object.keys(c.cleared).length;$('#dk-count').textContent=done+' OF 12 DECKS CLEARED';
  showOnly('#decks-ov');setMenu('#m-decks');
}
function previewDeck(n){
  const c=readCampaign(),d=catDecks().find(x=>x.deck===n),st=deckStatus(c,n),num=String(n).padStart(2,'0');if(!d)return;
  $('#dk-h').textContent='DECK '+num+(st==='locked'?'':'  //  '+d.place.toUpperCase());
  let body=st==='locked'?'Clear Deck '+String(n-1).padStart(2,'0')+' to unlock.':d.blurb;
  if(st.startsWith('cleared')){const r=c.cleared[n];body+='\n\nCLEARED on '+r.diff+(r.byCode?'  ·  by account number':'  ·  '+r.pct+'% complete  ·  '+fmtTime(r.time));}
  const rec=readRecords();for(let di=0;di<5;di++){const r=rec[n+':'+di];if(r)body+='\nBEST ON '+DIFF[di].name.toUpperCase()+': '+r.pct+'%  ·  '+fmtTime(r.time);}
  if(st==='dev')body+='\n\nIn production.';
  if(st==='update'||st==='cleared-update')body+='\n\nThis deck needs a newer version of the game. Reload the page to update.';
  if(st==='open'||st==='cleared')body+='\n\nPress to start this deck.';
  $('#dk-b').textContent=body;
}
function pickDeck(n){
  const c=readCampaign(),st=deckStatus(c,n);
  if(st!=='open'&&st!=='cleared'){previewDeck(n);S.denied();return;}
  if(n===1&&!c.diff){showDiff();return;}
  const di=c.diff?DIFF.findIndex(d=>d.name===c.diff):2;
  startGame(di<0?2:di,n);
}
function lastClear(){
  const c=readCampaign();let best=null;
  for(const k in c.cleared){const r=c.cleared[k];if(!best||+k>best.n)best=Object.assign({n:+k},r);}
  return best;
}

/* ---------- starting, leaving and clearing a deck ---------- */
async function startGame(di,n){
  stopLog();n=n||1;
  const c=readCampaign();
  if(n===1&&!c.cur){}  // a brand new campaign starts on Deck 01
  showOnly('#loading');G.state='loading';
  try{await prepareDeck(n);}catch(err){console.error(err);$('#load-msg').textContent='THIS DECK COULD NOT BE LOADED. CHECK YOUR CONNECTION AND TRY AGAIN.';setTimeout(toTitle,2500);return;}
  const carry=n>1?(c.carryFor&&c.carryFor[n])||c.carry:null;
  newGame(di,carry);preloadVoices();
  c.cur=n;c.diff=DIFF[di].name;writeCampaign(c);
  G.state='intro';G.introT=0;const intro=DK.deck.intro||{};
  $('#i-deck').textContent='DECK '+deckNN()+' OF 12 // '+D.name.toUpperCase();
  $('#i-title').textContent=(DK.deck.title||'').toUpperCase();
  $('#i-obj').textContent=intro.objective||'';
  $('#i-tip').textContent=(intro.tips||[])[di]||'';
  showOnly('#intro');setMenu(null);setTouchPlaying(false);$('#sub').hidden=true;$('#log').hidden=true;
  stopVoice();MUS.target=0;ambLevel(.55);playSfx(intro.music||'braam_2_5');
}
async function loadAndPlay(s){
  if(!s){toTitle();return;}
  showOnly('#loading');G.state='loading';
  try{await prepareDeck(s.deck||1);}catch(err){console.error(err);toTitle();return;}
  stopVoice();stopLog();loadGame(s);preloadVoices();showOnly(null);G.state='play';setTouchPlaying(true);$('#sub').hidden=true;$('#log').hidden=true;MUS.target=0;ambLevel(.55);
  G.banner={t:'SAVE LOADED',life:2.5};G.objT=5;IN.edges.clear();
}
function beginPlay(){
  showOnly(null);G.state='play';setTouchPlaying(true);quipCD=0;IN.edges.clear();
  const z=zoneAtXY(P.x,P.y);if(z){G.banner={t:z.name,life:3.2};G.visited[z.name]=1;G.vz[z.id]=1;G.curZone=zoneAt[I(P.x|0,P.y|0)];}
  fireEvent('start');if(z)fireEvent('enterZone',{zone:z.id});G.objT=Math.max(G.objT,7);G.lastProgress=0;
}
function deckPct(){const n=o=>Object.keys(o||{}).length;
  return Math.round(100*(G.kills/Math.max(1,G.total)+n(G.secrets)/Math.max(1,G.secretTotal)+n(G.logs)/Math.max(1,G.logTotal)+n(G.assets)/Math.max(1,G.assetTotal))/4);}
function openDepart(){
  if(G.state!=='play')return;
  pauseLog();stopVoice();$('#sub').hidden=true;G.state='depart';setTouchPlaying(false);if(document.pointerLockElement)document.exitPointerLock();
  const n=o=>Object.keys(o||{}).length,pct=deckPct();
  const row=(k,a,b)=>`<dt>${k}</dt><dd class="${a>=b?'full':'miss'}">${a} / ${b}</dd>`;
  $('#dp-h').textContent=pct>=100?'ACCOUNT CLOSED IN FULL':'DEPART DECK '+deckNN()+'?';
  $('#dp-p').textContent=pct>=100?'Depart Deck '+deckNN()+'?':'Outstanding items stay on the ship.';
  $('#dp-stats').innerHTML=`<dt>TIME</dt><dd>${fmtTime(G.playTime)}</dd>`+row('KILLS',G.kills,G.total)+row('SECRETS',n(G.secrets),G.secretTotal)+row('AUDIO LOGS',n(G.logs),G.logTotal)+row('ASSETS TAGGED',n(G.assets),G.assetTotal);
  $('#dp-pct').textContent=pct+'% COMPLETE';showOnly('#depart');setMenu('#m-depart');
}
function stayDeck(){showOnly(null);G.state='play';setTouchPlaying(true);IN.edges.clear();resumeLog();G.stays=(G.stays||0)+1;sayLine('core:forgot_something',2,true);addStat('departStays');}
function rankOf(pct){for(const [min,name] of PACKS.core.tuning.ranks)if(pct>=min)return name;return '';}
function winGame(){
  if(G.won)return;
  const pct=deckPct(),n=deckNum();
  fireEvent('deckClear',{},{percent:pct,time:Math.round(G.playTime),par:DK.deck.par||0,underPar:!!DK.deck.par&&G.playTime<=DK.deck.par,
    damageTaken:Math.round(G.damageTaken),weapons:Object.keys(G.used),difficulty:G.diff,deck:n});
  G.won=true;G.state='win';stopLog();$('#log').hidden=true;MUS.target=0;S.braam(4);if(document.pointerLockElement)document.exitPointerLock();
  const out=DK.deck.outro||{};sayLine(out.line||'core:deck_clear',3,true);setTouchPlaying(false);
  $('#sub').hidden=true;const o=$('#over');o.classList.add('win');showOnly('#over');
  $('#o-h').textContent=out.heading||('DECK '+deckNN()+' OF 12 CLEARED');$('#o-p').textContent=out.body||'';
  $('#o-tease').textContent=out.tease||'';
  $('#o-rank').textContent=pct+'% COMPLETE · '+rankOf(pct)+(G.audited?' · AUDITED':'');$('#o-rank').hidden=false;
  $('#o-stats').innerHTML=statsHTML()+`<dt>LIMBS SEVERED</dt><dd>${G.limbs}</dd>`;
  $('#o-stats').hidden=false;$('#o-tease').hidden=!out.tease;
  document.querySelector('#m-over [data-act="load"]').hidden=true;
  const nx=document.querySelector('#m-over [data-act="next"]');if(nx)nx.hidden=deckAvailability(n+1)!=='open';
  document.querySelector('#m-over [data-act="retry"]').textContent='Play Again';setMenu('#m-over');
  HBP.store.remove(saveKey(n));G.lastSave=null;
  const c=readCampaign(),prev=c.cleared[n];
  if(!prev||pct>=prev.pct||prev.byCode)c.cleared[n]={pct,time:Math.round(G.playTime),diff:D.name};
  c.diff=D.name;c.cur=Math.min(12,n+1);
  const carry={has:P.has.slice(),boots:P.boots,cells:P.cells,shells:P.shells,rivets:P.rivets,bombs:P.bombs,armor:Math.round(P.armor),hp:Math.round(P.hp)};
  c.carryFor=c.carryFor||{};c.carryFor[n+1]=carry;c.carry=carry;
  if(G.audited){c.audited=c.audited||{};c.audited[n]=1;}else if(c.audited)delete c.audited[n];
  writeCampaign(c);writeRecord(n,G.diff,pct,G.playTime,G.audited);
}
function showDeath(){
  G.state='dead';stopLog();$('#log').hidden=true;$('#sub').hidden=true;const o=$('#over');o.classList.remove('win');showOnly('#over');setTouchPlaying(false);
  $('#o-h').textContent=PACKS.core.strings.deathHeading;$('#o-p').textContent=PACKS.core.strings.deathBody;
  $('#o-rank').hidden=true;$('#o-stats').hidden=true;$('#o-tease').hidden=true;
  const nx=document.querySelector('#m-over [data-act="next"]');if(nx)nx.hidden=true;
  const s=readSave(deckNum()),lb=document.querySelector('#m-over [data-act="load"]');lb.hidden=!s||s.diff!==G.diff;
  if(s)lb.textContent='Load Last Save · '+(s.zone||'Deck '+deckNN());
  document.querySelector('#m-over [data-act="retry"]').textContent='Restart Deck';setMenu('#m-over');
}

/* ---------- achievements ---------- */
function allAchievements(){return [...PACKS.core.achievements.achievements,...((DK&&DK.deck.achievements)||[])];}
let toastQ=[],toastT=0,achLineT=-99;
function achieve(id){
  const a=allAchievements().find(x=>x.id===id);if(!a)return;
  if(a.status==='planned')return;
  if(G.audited&&!a.cheat)return;
  if(!HBP.achievements.unlock(id))return;
  toastQ.push(a);
}
function addStat(name,n){
  if(G.audited)return;
  HBP.achievements.addStat(name,G.diff,n||1);
  for(const a of allAchievements()){const p=a.progress;if(!p||p.stat!==name||a.status==='planned')continue;
    if(HBP.achievements.stat(name,p.minDifficulty||0)>=p.target)achieve(a.id);}
}
function checkAchievements(ev,fl){
  for(const a of allAchievements()){if(!a.on||a.on.event!==ev||a.status==='planned')continue;if(G.audited&&!a.cheat)continue;if(cond(a.if,fl))achieve(a.id);}
}
function updateToasts(dt){
  if(toastT>0){toastT-=dt;return;}
  if(!toastQ.length)return;
  if((logPlay&&!logPlay.paused)||!$('#log').hidden||G.scene)return;   // never over a log or a scene
  const a=toastQ.shift();toastT=4;G.toast={a,life:4};
  if(a.line&&G.voiceQuips!==false&&G.playTime-achLineT>20){achLineT=G.playTime;sayLine('core:'+a.line,2.6,true);}
  S.save();
}
function drawToast(g){
  const t=G.toast;if(!t)return;t.life-=1/60;if(t.life<=0){G.toast=null;return;}
  const a=Math.min(1,t.life*2,(4-t.life)*4),w=150,x=RW-w-4,y=IN.touchMode?96:60;g.globalAlpha=Math.max(0,a);
  g.fillStyle='rgba(4,6,10,.88)';g.fillRect(x,y,w,26);g.fillStyle='#ffb627';g.fillRect(x,y,2,26);
  txt(g,t.a.name.toUpperCase(),x+6,y+3,'#ffb627','8px Silkscreen, monospace');txt(g,t.a.earned||'',x+6,y+13,'#e8edf1','8px Silkscreen, monospace');g.globalAlpha=1;
}

/* ---------- one-time hints (the light tutorial) ---------- */
function hintText(id){
  const pad=IN.pad&&IN.pad.on,touch=IN.touchMode;
  const K=(k,p,t)=>pad?p:touch?t:k;
  return {
    move:K('WASD TO MOVE, MOUSE TO LOOK. E TO USE.','LEFT STICK TO MOVE, RIGHT STICK TO LOOK. A TO USE.','LEFT THUMB MOVES, RIGHT THUMB LOOKS. TAP USE.'),
    limbs:'AIM FOR THE LIMBS. HEADSHOTS BARELY SLOW THEM DOWN.',
    kick:K('RIGHT-CLICK OR F TO KICK.','B TO KICK.','TAP KICK TO KICK.'),
    stayDown:'KICK A BODY ON THE FLOOR TO KEEP IT DOWN.',
    map:K('TAB OR M OPENS THE MAP.','D-PAD DOWN OPENS THE MAP.','TAP MAP TO SEE WHERE YOU ARE.'),
    guide:K('LOST? PRESS G FOR A ROUTE TO THE OBJECTIVE.','LOST? CLICK THE RIGHT STICK FOR A ROUTE.','LOST? TAP PATH FOR A ROUTE TO THE OBJECTIVE.'),
    stomp:K('STOMP BOOTS: KICK A BODY ON THE FLOOR TO STOMP IT.','STOMP BOOTS: B ON A BODY ON THE FLOOR STOMPS IT.','STOMP BOOTS: TAP KICK ON A BODY ON THE FLOOR TO STOMP IT.'),
    lurker:'DRIPPING FROM ABOVE? LOOK UP. LURKERS WAIT ON THE CEILING.',
    swim:'DEEP WATER: WATCH YOUR BREATH. ONLY THE CUTTER AND KICKS WORK DOWN HERE.',
  }[id]||'';
}
function hintsSeen(){return HBP.store.get('hb-hints')||{};}
function showHint(id){
  if(G.hintsOff)return;const seen=hintsSeen();if(seen[id])return;seen[id]=1;HBP.store.set('hb-hints',seen);
  G.hint={t:hintText(id),life:6};
}
function updateHints(dt){
  if(G.hint){G.hint.life-=dt;if(G.hint.life<=0)G.hint=null;}
  if(G.hintsOff||G.state!=='play')return;
  const near=ENTS.find(e=>e.kind==='enemy'&&!e.gone&&e.state!=='dormant'&&e.state!=='idle'&&e.state!=='dead'&&Math.hypot(e.x-P.x,e.y-P.y)<9);
  if(near){showHint('limbs');if(Math.hypot(near.x-P.x,near.y-P.y)<2.2)G.events.push({t:G.playTime+1.5,fn:()=>showHint('kick')});}
  if(G.playTime-G.lastProgress>90&&G.playTime>60){if(!hintsSeen().map)showHint('map');else showHint('guide');G.lastProgress=G.playTime;}
}
function drawHint(g){
  const h=G.hint;if(!h||G.mapOn)return;const a=Math.min(1,h.life*1.5,(6-h.life)*4);g.globalAlpha=Math.max(0,a);
  g.font='8px Silkscreen, monospace';const lines=[];let line='';for(const wd of h.t.split(' ')){const t=line?line+' '+wd:wd;if(g.measureText(t).width>RW*.6&&line){lines.push(line);line=wd;}else line=t;}if(line)lines.push(line);
  const w=Math.max(...lines.map(l=>g.measureText(l).width))+12,x=(RW-w)/2,y=RH*.56;
  g.fillStyle='rgba(4,6,10,.75)';g.fillRect(x,y,w,lines.length*9+4);g.fillStyle='#5ff6ff';g.fillRect(x,y,2,lines.length*9+4);lines.forEach((l,k)=>txt(g,l,RW/2,y+2+k*9,'#5ff6ff','8px Silkscreen, monospace','center'));g.globalAlpha=1;
}
