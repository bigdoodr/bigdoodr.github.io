'use strict';
/* Hull Breaker engine 1.3 features: console and cheats, campaign confirm, the achievements
   screen, water and swimming, scenes (boss payoffs), new sounds and textures. */
OVS.push('#loading','#console','#confirm','#ach-ov','#settings','#photo');

/* ---------- sounds ---------- */
Object.assign(S,{
  thud(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.45);const s=osc('sine',95,t,.14,vca(t,.003,.9,.12,o));s.frequency.exponentialRampToValueAtTime(55,t+.12);nz(t,.05,filt('lowpass',500,1,vca(t,.002,.5,.04,o)));},
  splash(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.55);const f=filt('bandpass',1400,.8,vca(t,.005,.9,.45,o));f.frequency.exponentialRampToValueAtTime(400,t+.45);nz(t,.5,f);nz(t+.05,.25,filt('highpass',4000,1,vca(t+.05,.01,.4,.22,o)));},
  drain(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.7);const f=filt('lowpass',900,2,vca(t,.4,.9,3.2,o));f.frequency.exponentialRampToValueAtTime(120,t+3.4);nz(t,3.6,f);
    const s=osc('sine',70,t,3.4,vca(t,.3,.6,3,o));s.frequency.exponentialRampToValueAtTime(30,t+3.3);for(let k=0;k<8;k++)nz(t+.3+k*.35,.08,filt('bandpass',600+k*90,6,vca(t+.3+k*.35,.005,.5,.07,o)));},
  pour(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.35);const f=filt('bandpass',1200,3,vca(t,.05,.7,1.1,o));f.frequency.linearRampToValueAtTime(2200,t+1.1);nz(t,1.2,f);},
  stamp(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.9);const s=osc('sine',110,t,.25,vca(t,.002,1.2,.22,o));s.frequency.exponentialRampToValueAtTime(45,t+.2);nz(t,.06,filt('highpass',1200,1,vca(t,.001,.9,.05,o)));},
  // the kick with the steel-toe boots: the usual thump plus a ring of steel
  clank(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.85);const s=osc('sine',120,t,.18,vca(t,.003,1,.15,o));s.frequency.exponentialRampToValueAtTime(40,t+.15);
    for(const [f,v,d] of [[1180,.32,.22],[1730,.22,.16],[2610,.14,.1]])osc('square',f,t,d,filt('bandpass',f,9,vca(t,.001,v,d,o)));nz(t,.04,filt('highpass',3000,1,vca(t,.001,.6,.03,o)));},
  bubbles(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.2);for(let k=0;k<5;k++){const tt=t+k*.07+R()*.04,s=osc('sine',500+R()*500,tt,.06,vca(tt,.004,.4,.05,o));s.frequency.exponentialRampToValueAtTime(1400+R()*600,tt+.05);}},
});

/* ---------- new textures and sprites (engine-painted; dumped to PNG for the packs) ---------- */
function buildTextures3(){
  const add=(key,draw,em)=>{T[key.toUpperCase()]=TEX.length;TEX[TEX.length]=mkTex(draw,em);TEXID[key]=T[key.toUpperCase()];};
  const panelDoor=(g,lamp,label,col)=>{door(g,lamp);if(label){g.fillStyle=col||'#c9d4dc';g.font='bold 6px monospace';g.textAlign='center';g.fillText(label,32,51);}};
  add('shelf',g=>{g.fillStyle='#3a3530';g.fillRect(0,0,64,64);for(let y=6;y<64;y+=16){g.fillStyle='#6b5d4f';g.fillRect(2,y+10,60,3);for(let x=4;x<60;x+=7+((R()*4)|0)){const h=5+R()*5;g.fillStyle=['#a33','#38a','#da3','#4a5','#bbb'][(R()*5)|0];g.fillRect(x,y+10-h,5,h);}}grime(g,64,64,140,.15);});
  add('apartment',g=>{g.fillStyle='#6e6455';g.fillRect(0,0,64,64);g.fillStyle='#7d7262';for(let x=0;x<64;x+=8)g.fillRect(x,0,6,44);g.fillStyle='#4a3f33';g.fillRect(0,44,64,20);g.fillStyle='#9c8a6c';g.fillRect(0,43,64,2);grime(g,64,64,180,.14);});
  add('chapel',g=>{g.fillStyle='#2c2630';g.fillRect(0,0,64,64);g.fillStyle='#3b3340';g.fillRect(8,4,48,56);g.fillStyle='#120e14';g.fillRect(20,10,24,40);g.fillStyle='#7a4fbf';g.fillRect(22,12,9,18);g.fillStyle='#c94f3f';g.fillRect(33,12,9,18);g.fillStyle='#d9b23f';g.fillRect(22,32,20,16);g.fillStyle='#120e14';g.fillRect(31,12,2,36);g.fillRect(22,30,20,2);grime(g,64,64,120,.15);},
    g=>{g.fillStyle='#fff';g.fillRect(22,12,20,36);});
  add('daycare',g=>{g.fillStyle='#d8cfb8';g.fillRect(0,0,64,64);for(let x=0;x<64;x+=16){g.fillStyle=['#e7a9a1','#a8c8e6','#b9dca0','#f1d58a'][x/16];g.fillRect(x,40,16,6);}g.fillStyle='#9a8f78';g.fillRect(0,46,64,18);grime(g,64,64,160,.1);});
  add('theater',g=>{g.fillStyle='#3a1418';g.fillRect(0,0,64,64);for(let x=0;x<64;x+=8){g.fillStyle='#4f1c22';g.fillRect(x,0,4,64);g.fillStyle='#2a0e11';g.fillRect(x+6,0,2,64);}grime(g,64,64,120,.15);});
  add('poster',g=>{g.fillStyle='#3a1418';g.fillRect(0,0,64,64);g.fillStyle='#c9a227';g.fillRect(10,4,44,56);const bg=['#1a2a4a','#3a1a3a','#1a3a2a'][(R()*3)|0];g.fillStyle=bg;g.fillRect(12,6,40,52);
    g.fillStyle='#d8e04a';circ(g,32,26,9);g.fillStyle=bg;circ(g,35,23,7);g.fillStyle='#ff4a3a';g.font='bold 9px Impact, "Arial Black", sans-serif';g.textAlign='center';g.fillText('NIGHT OF',32,44);g.fillText('THE B-REEL',32,53);},
    g=>{g.fillStyle='#fff';g.fillRect(12,38,40,18);});
  add('washer',g=>{g.fillStyle='#bfc6cb';g.fillRect(0,0,64,64);for(const x of [2,34]){g.fillStyle='#9aa3a9';g.fillRect(x,6,28,52);g.fillStyle='#2e3a44';circ(g,x+14,34,10);g.fillStyle='#5b6f80';circ(g,x+14,34,7);g.fillStyle='#222';g.fillRect(x+3,10,10,4);g.fillStyle='#38ff88';g.fillRect(x+22,10,3,3);}grime(g,64,64,140,.12);},
    g=>{g.fillStyle='#fff';g.fillRect(24,10,3,3);g.fillRect(56,10,3,3);});
  add('gym',g=>{g.fillStyle='#2b3a40';g.fillRect(0,0,64,64);g.fillStyle='#d8743a';g.fillRect(0,30,64,4);g.fillStyle='#1e2a2f';g.fillRect(0,44,64,20);g.fillStyle='#e8edf1';g.font='bold 8px monospace';g.textAlign='center';g.fillText('REC',32,22);grime(g,64,64,140,.14);});
  add('pooltile',g=>{g.fillStyle='#bcd8e0';g.fillRect(0,0,64,64);g.fillStyle='#8fb0ba';for(let i=0;i<64;i+=8){g.fillRect(i,0,1,64);g.fillRect(0,i,64,1);}g.fillStyle='#2a6a9a';g.fillRect(0,50,64,4);grime(g,64,64,150,.12);});
  add('gorgonseal',g=>{hull(g,'#3a3f44');g.fillStyle='#6b6f72';g.fillRect(6,4,52,56);g.fillStyle='#585c60';g.fillRect(6,30,52,3);
    g.strokeStyle='#c9a227';g.lineWidth=2;g.beginPath();g.moveTo(6,4);g.lineTo(58,4);g.lineTo(58,60);g.lineTo(6,60);g.closePath();g.stroke();
    for(let y=4;y<62;y+=4){g.fillStyle=(y/4)%2?'#8a5a2a':'#b07a3a';g.fillRect(5,y,2,2);g.fillRect(57,y,2,2);}
    g.fillStyle='#2a2d30';for(const [x,y] of [[10,8],[54,8],[10,56],[54,56],[32,8],[32,56]])circ(g,x,y,1.5);
    g.fillStyle='#d8c27a';g.font='bold 7px monospace';g.textAlign='center';g.fillText('SEALED',32,20);g.font='bold 5px monospace';
    g.fillText('BY ORDER OF',32,27);g.fillText('GORGON',32,40);g.fillText('CONSOLIDATED',32,46);g.fillText('ASSET PROTECTION',32,53);grime(g,64,64,160,.18);});
  add('floorplan',g=>{hull(g,'#2a3036');g.fillStyle='#071a22';g.fillRect(8,8,48,38);g.strokeStyle='#5ff6ff';g.lineWidth=1;
    for(const [x,y,w,h] of [[12,12,14,10],[28,12,24,6],[12,24,8,18],[22,24,16,12],[40,20,12,16],[22,38,30,4]])g.strokeRect(x+.5,y+.5,w,h);
    g.fillStyle='#ffb627';g.fillRect(30,29,2,2);g.fillStyle='#5ff6ff';g.font='bold 6px monospace';g.textAlign='center';g.fillText('FLOOR PLAN',32,56);},
    g=>{g.fillStyle='#fff';g.fillRect(8,8,48,38);});
  add('intercom',g=>{hull(g,'#2a3036');g.fillStyle='#0d1013';g.fillRect(16,8,32,40);for(let y=14;y<30;y+=3){g.fillStyle='#3a434c';g.fillRect(20,y,24,1);}g.fillStyle='#ff8c1a';circ(g,32,38,4);g.fillStyle='#ffb627';g.font='bold 6px monospace';g.textAlign='center';g.fillText('INTERCOM',32,56);},
    g=>{g.fillStyle='#fff';circ(g,32,38,4);g.fillRect(16,51,32,7);});
  const jbox=(g,on)=>{hull(g,'#3a3f45');g.fillStyle='#1a1d20';g.fillRect(12,6,40,44);g.fillStyle='#c9a227';g.fillRect(14,8,36,4);g.fillStyle=on?'#30ff70':'#ff3a2a';for(let k=0;k<4;k++)g.fillRect(16+k*9,16,6,6);g.fillStyle='#8a96a1';g.fillRect(29,26,6,16);g.fillStyle='#d0142f';g.fillRect(25,on?26:38,14,5);g.fillStyle='#ffb627';g.font='bold 5px monospace';g.textAlign='center';g.fillText('LOCKDOWN',32,58);};
  add('junction',g=>jbox(g,false),g=>{g.fillStyle='#fff';for(let k=0;k<4;k++)g.fillRect(16+k*9,16,6,6);});
  add('junctionon',g=>jbox(g,true),g=>{g.fillStyle='#fff';for(let k=0;k<4;k++)g.fillRect(16+k*9,16,6,6);});
  const valve=(g,open)=>{g.fillStyle='#262b30';g.fillRect(0,0,64,64);g.fillStyle='#5a646d';g.fillRect(28,0,8,64);g.fillStyle=open?'#2a9a5a':'#2a6aaa';circ(g,32,30,15);g.fillStyle='#1a1d20';circ(g,32,30,11);g.strokeStyle=open?'#40ff80':'#3cb4ff';g.lineWidth=3;g.beginPath();
    for(let k=0;k<3;k++){const a=k*2.1+(open?.6:0);g.moveTo(32,30);g.lineTo(32+Math.cos(a)*11,30+Math.sin(a)*11);}g.stroke();g.fillStyle='#e8edf1';g.font='bold 6px monospace';g.textAlign='center';g.fillText(open?'OPEN':'FLUSH',32,56);};
  add('valve',g=>valve(g,false),g=>{g.fillStyle='#fff';g.fillRect(18,50,28,8);});
  add('valveopen',g=>valve(g,true),g=>{g.fillStyle='#fff';g.fillRect(18,50,28,8);});
  add('bulkhead',g=>{door(g,'#ff8c1a');g.fillStyle='#c9a227';g.fillRect(0,26,6,12);g.fillRect(58,26,6,12);},g=>{g.fillStyle='#fff';g.fillRect(27,31,10,8);});
  add('masterdoor',g=>{door(g,'#c0c8d0');g.fillStyle='#e8edf1';g.font='bold 6px monospace';g.textAlign='center';g.fillText('MASTER',32,50);},g=>{g.fillStyle='#fff';g.fillRect(27,31,10,8);});
  add('flooded',g=>{door(g,'#3cb4ff');g.fillStyle='rgba(40,120,170,.75)';g.fillRect(0,30,64,34);for(let x=0;x<64;x+=4){g.fillStyle='rgba(180,230,255,.6)';g.fillRect(x,30+((x/4)%2),3,1);}g.fillStyle='#ffd200';g.font='bold 6px monospace';g.textAlign='center';g.fillText('⚡ LIVE',32,24);},
    g=>{g.fillStyle='#fff';g.fillRect(27,18,10,8);});
  // water floors: shallow (you can see the tiles) and deep
  FLO[5]=mkTex(g=>{g.fillStyle='#3d7f9e';g.fillRect(0,0,64,64);g.fillStyle='#5aa0bf';for(let i=0;i<64;i+=16){g.fillRect(i,0,1,64);g.fillRect(0,i,64,1);}for(let k=0;k<30;k++){g.fillStyle=`rgba(200,240,255,${(.15+R()*.25).toFixed(2)})`;g.fillRect(R()*64|0,R()*64|0,3+R()*6|0,1);}});
  FLO[6]=mkTex(g=>{g.fillStyle='#173f5c';g.fillRect(0,0,64,64);for(let k=0;k<40;k++){g.fillStyle=`rgba(120,200,240,${(.1+R()*.2).toFixed(2)})`;g.fillRect(R()*64|0,R()*64|0,4+R()*8|0,1);}});
  // sprites
  const spr=(w,h,draw)=>{const c=canvasOf(w,h);draw(c.getContext('2d'));return imgFrom(c);};
  IMG.boots=spr(32,24,g=>{for(const x of [3,17]){g.fillStyle='#3a2a1e';g.fillRect(x,2,10,14);g.fillRect(x,14,13,7);g.fillStyle='#8a96a1';g.fillRect(x,19,13,3);g.fillRect(x+9,14,4,3);g.fillStyle='#c9a227';g.fillRect(x+1,5,8,2);}});
  IMG.keyM=spr(20,12,g=>{g.fillStyle='#c0c8d0';g.fillRect(1,3,8,6);g.fillRect(8,5,10,2);g.fillRect(14,7,2,3);g.fillRect(17,7,2,3);g.fillStyle='#04060a';g.fillRect(3,5,4,2);});
  IMG.pew=spr(40,22,g=>{g.fillStyle='#4a2f1e';g.fillRect(0,4,40,6);g.fillRect(0,12,40,4);g.fillStyle='#2a1a10';g.fillRect(2,16,4,6);g.fillRect(34,16,4,6);g.fillStyle='#6b4630';g.fillRect(0,4,40,1);});
  IMG.tap=spr(20,28,g=>{g.fillStyle='#2a2f34';g.fillRect(0,18,20,10);g.fillStyle='#c9a227';g.fillRect(4,4,3,14);g.fillRect(13,4,3,14);g.fillStyle='#d0142f';g.fillRect(3,1,5,4);g.fillStyle='#3a7a3a';g.fillRect(12,1,5,4);});
}
// Secret panels: a cracked wall with a thin warm seam of light down its right edge, which
// nothing else in the game has, so players learn exactly what to press Use on.
const _crackTex=crackTex;
crackTex=function(tid){
  if(CRACKS[tid])return CRACKS[tid];
  const id=_crackTex(tid),t=TEX[id];
  for(let y=4;y<60;y++){const i=(y<<6)|62;t.px[i]=0x2fa6ff;t.em[i]=(y%9)<6?1:0;t.px[i-1]=0x10406a;}
  return id;
};

/* ---------- water and swimming ---------- */
function updateWater(dt){
  const w=WATER[I(P.x|0,P.y|0)]||0;
  if(w!==G.water){
    if(w>G.water){S.splash();fireEvent('water',{depth:w===2?'swim':'wade'});}
    G.water=w;if(A.lp)A.lp.frequency.setTargetAtTime(w===2?600:20000,A.c.currentTime,.08);
  }
  if(w===2){
    if(P.wpn!==0)selectWeapon(0);
    G.breath=Math.max(0,G.breath-dt/15);
    if(G.breath<=0){G.drownT=(G.drownT||0)-dt;if(G.drownT<=0){G.drownT=1;hurtPlayer(9,{x:P.x,y:P.y},false,'drown');S.bubbles();}}
    else if(R()<dt*.7)S.bubbles();
  }else G.breath=Math.min(1,G.breath+dt/3);
}
const _fire=fire;
fire=function(){if(G.water===2&&P.wpn!==0){P.wpn=0;return;}_fire();};
function drawWaterFX(g){
  if(G.water===2){const t=G.clock;g.fillStyle='rgba(20,90,140,.38)';g.fillRect(0,0,RW,RH);
    for(let k=0;k<6;k++){g.fillStyle='rgba(150,220,255,.08)';g.fillRect(0,((t*9+k*31)%RH)|0,RW,2);}}
  else if(G.water===1){g.fillStyle='rgba(40,120,170,.12)';g.fillRect(0,RH*.8,RW,RH*.2);}
  if(G.breath<1){const w=60,x=(RW-w)/2,y=IN.touchMode?22:8;g.fillStyle='rgba(4,6,10,.7)';g.fillRect(x-2,y-2,w+4,8);
    g.fillStyle=G.breath>.3?'#5ff6ff':'#ff3048';g.fillRect(x,y,w*G.breath,4);txt(g,'AIR',x-4,y-2,'#8b98a5','8px Silkscreen, monospace','right');}
}

/* ---------- scenes (engine 1.3): the boss payoff ---------- */
function playScene(id){
  const def=DK.deck.scenes&&DK.deck.scenes[id];if(!def)return;
  const tg=G.lastBoss||{x:P.x+Math.cos(P.ang),y:P.y+Math.sin(P.ang)};
  // Buck walks up to the body: stand 1.3 cells from it, on the side he's coming from.
  const dx=P.x-tg.x,dy=P.y-tg.y,dl=Math.hypot(dx,dy)||1;let sx=tg.x+dx/dl*1.3,sy=tg.y+dy/dl*1.3;
  if(solidAt(sx,sy)||!los(sx,sy,tg.x,tg.y)){sx=P.x;sy=P.y;}
  G.scene={def,t:0,tx:tg.x,ty:tg.y,x0:P.x,y0:P.y,sx,sy,ang0:P.ang,pitch0:P.pitch,done:{},boot:0,stamp:0,stampT:0};
  if(document.pointerLockElement)document.exitPointerLock();
}
function updateScene(dt){
  const sc=G.scene;sc.t+=dt;
  for(const [k,st] of sc.def.steps.entries()){
    if(sc.t<st.t||sc.done[k])continue;sc.done[k]=1;
    if(st.sfx)playSfx(st.sfx);if(st.shake)G.shake=Math.max(G.shake,st.shake);
    if(st.say)sayLine(st.say,st.sub,true);
    if(st.stamp){sc.stamp=st.stamp;sc.stampT=0;}
    if(st.gib){const hx=sc.tx-Math.sin(P.ang)*.31,hy=sc.ty+Math.cos(P.ang)*.31;gibs(hx,hy,.15,18);bleed(hx,hy,.15,16,2.2);for(const e of ENTS)if(e.kind==='decor'&&e.t==='superbody')e.t='superbody_nohead';}
    if(st.end){G.scene=null;IN.edges.clear();return;}
  }
  // camera: turn to face the body, then look down at it; the boot rises and comes down
  const want=Math.atan2(sc.ty-sc.sy,sc.tx-sc.sx);let da=want-sc.ang0;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;
  const k1=clamp(sc.t/.6,0,1),k2=clamp((sc.t-.6)/.4,0,1),kw=clamp(sc.t/.9,0,1),sm=kw*kw*(3-2*kw);
  P.x=lerp(sc.x0,sc.sx,sm);P.y=lerp(sc.y0,sc.sy,sm);P.bob+=dt*6*(kw<1?1:0);
  P.ang=sc.ang0+da*(k1*k1*(3-2*k1));P.pitch=lerp(sc.pitch0,-RH*.3,k2);
  sc.boot=sc.t<1?0:sc.t<1.35?(sc.t-1)/.35:sc.t<1.5?1-(sc.t-1.35)/.15:sc.t<2.6?0:Math.max(0,1-(sc.t-2.6)*2);
  sc.down=sc.t>=1.35&&sc.t<2.6;
  if(sc.stamp)sc.stampT+=dt;
  updateParts(PARTS,dt);updateLights(G.clock);
}
function drawScene(g){
  const sc=G.scene;if(!sc)return;
  // the boot, in first person: raised (boot 0..1), then planted
  // the boot lands on the head: the right end of the lying body (47 of 64 pixels across the sprite)
  const dep=Math.max(.6,Math.hypot(sc.tx-P.x,sc.ty-P.y)),sw=F*1.55/dep*(96/110),hx=RW/2+(47/64-.5)*sw;
  const up=sc.boot,y=sc.down?RH*.55:RH*(1.05-up*.55),x=hx-RW*.11;
  if(sc.t>=1){g.fillStyle='#2a1f16';g.fillRect(x,y,RW*.22,RH*.5);g.fillStyle='#3a2a1e';g.fillRect(x-RW*.02,y+RH*.22,RW*.28,RH*.12);
    g.fillStyle='#8a96a1';g.fillRect(x-RW*.02,y+RH*.32,RW*.28,RH*.04);g.fillStyle='#c9a227';g.fillRect(x+RW*.02,y+RH*.05,RW*.16,3);}
  if(sc.stamp){const k=Math.min(1,sc.stampT*6),s=1+ (1-k)*1.5;g.save();g.translate(RW/2,RH*.42);g.rotate(-.18);g.scale(s,s);g.globalAlpha=Math.min(1,k*1.2);
    g.strokeStyle='#d0142f';g.lineWidth=3;g.strokeRect(-70,-14,140,28);g.fillStyle='#d0142f';g.font='16px Silkscreen, monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(sc.stamp,0,1);g.restore();g.globalAlpha=1;g.textAlign='left';g.textBaseline='top';}
  g.fillStyle='#000';g.fillRect(0,0,RW,RH*.08);g.fillRect(0,RH*.92,RW,RH*.08);
}

/* ---------- campaign confirm and New Game ---------- */
let cfAction=null;
function confirmNewGame(){
  const c=readCampaign();
  if(!Object.keys(c.cleared).length&&!c.cur){showDiff();return;}
  cfAction='newgame';G.sub='confirm';showOnly('#confirm');setMenu('#m-confirm');
}
function newCampaign(di){
  for(let n=1;n<=12;n++)HBP.store.remove(saveKey(n));
  writeCampaign({v:1,cleared:{},flags:{},diff:DIFF[di].name,cur:1});G.lastSave=null;
  startGame(di,1);
}

/* ---------- the console (Pause → Console, or ` while paused) ---------- */
const CONLOG=[];
function conPrint(t){CONLOG.push(t);while(CONLOG.length>14)CONLOG.shift();$('#con-out').textContent=CONLOG.join('\n');}
function openConsole(){
  G.sub='console';showOnly('#console');setMenu('#m-console');const el=$('#con-in');el.value='';
  if(!CONLOG.length)conPrint('Type help for a list of commands.');
  setTimeout(()=>el.focus(),30);
}
function closeConsole(){$('#con-in').blur();G.sub=null;showOnly('#pause');setMenu('#m-pause');$('#p-stats').innerHTML=statsHTML();}
const CHEATS={bhpaid:'god',bhcosign:'buddha',bhghost:'noclip',bhaudit:'notarget',bhfullkit:'give all',bhfloorplan:'reveal'};
function cheat(cmd){
  if(!G.audited){G.audited=true;conPrint('Run marked AUDITED. Records are not kept for this deck.');}
  fireEvent('cheat',{},{command:cmd});
}
function runConsole(line){
  const raw=line.trim();if(!raw)return;conPrint('> '+raw);
  let [cmd,...args]=raw.toLowerCase().split(/\s+/);
  if(CHEATS[cmd]){[cmd,...args]=CHEATS[cmd].split(' ');}
  const inPlay=!!P&&G.state==='pause';
  const need=()=>{if(!inPlay){conPrint('Start a deck first.');return false;}return true;};
  switch(cmd){
    case 'help':conPrint('god · buddha · noclip · notarget · give all|weapons|ammo|keys|armor · health · reveal · warp NN · code XXXX-XXXX-XXXX-XXXX · kill · clear');break;
    case 'clear':CONLOG.length=0;$('#con-out').textContent='';break;
    case 'god':case 'godmode':if(!need())break;G.god=!G.god;cheat('god');conPrint('God mode '+(G.god?'on':'off'));break;
    case 'buddha':if(!need())break;G.buddha=!G.buddha;cheat('buddha');conPrint('Buddha '+(G.buddha?'on':'off'));break;
    case 'noclip':if(!need())break;G.noclip=!G.noclip;cheat('noclip');conPrint('Noclip '+(G.noclip?'on':'off'));break;
    case 'notarget':if(!need())break;G.notarget=!G.notarget;cheat('notarget');conPrint('Notarget '+(G.notarget?'on':'off'));break;
    case 'health':if(!need())break;P.hp=100;cheat('health');conPrint('Health restored');break;
    case 'give':{if(!need())break;const w=args[0]||'all',am=PACKS.core.tuning.ammo;
      if(w==='all'||w==='weapons')P.has=[true,true,true,true];
      if(w==='all'||w==='ammo')for(const k in am)P[k]=am[k].max;
      if(w==='all'||w==='keys')for(const k in DK.deck.keys)P.keys[k]=1;
      if(w==='all'||w==='armor')P.armor=100;
      if(w==='all')P.boots=true;
      cheat('give '+w);conPrint('Given: '+w);break;}
    case 'reveal':if(!need())break;seenMap.fill(1);G.mapReal=true;for(const z of LEVEL.zones)G.vz[z.id]=1;cheat('reveal');conPrint('Map revealed');break;
    case 'kill':if(!need())break;cheat('kill');closeConsole();resumeGame();hurtPlayer(9999,{x:P.x,y:P.y},true,'self');break;
    case 'warp':{const n=+args[0];if(!(n>=1&&n<=12)){conPrint('warp NN (01-12)');break;}
      if(deckAvailability(n)!=='open'){conPrint('Deck '+String(n).padStart(2,'0')+' is not built yet.');break;}
      const carry=P?{has:P.has.slice(),boots:P.boots,cells:P.cells,shells:P.shells,rivets:P.rivets,bombs:P.bombs,armor:P.armor,hp:P.hp}:null;
      const c=readCampaign();c.carryFor=c.carryFor||{};if(carry)c.carryFor[n]=carry;writeCampaign(c);
      closeConsole();startGame(G.diff,n).then(()=>{G.audited=true;});break;}
    case 'code':conPrint(typeof enterCode==='function'?enterCode(args.join('')):'Account numbers arrive with the save-code update.');break;
    default:conPrint("Unknown command. Type help.");
  }
}
addEventListener('keydown',e=>{
  if(G.sub!=='console')return;
  e.stopImmediatePropagation();
  if(e.code==='Enter'){e.preventDefault();const el=$('#con-in');runConsole(el.value);el.value='';}
  else if(e.code==='Escape'){e.preventDefault();closeConsole();}
},true);

/* ---------- achievements screen (Pause → Achievements) ---------- */
function openAchievements(){
  G.sub='ach';const nav=$('#m-ach');nav.innerHTML='';
  const list=allAchievements().filter(a=>a.status!=='planned'),d=HBP.achievements.data();
  const got=list.filter(a=>d.earned[a.id]).length;$('#ach-count').textContent=got+' OF '+list.length+' LINE ITEMS';
  list.forEach(a=>{const b=document.createElement('button');b.className='btn';b.tabIndex=-1;b.dataset.act='ac:'+a.id;
    const earned=!!d.earned[a.id];b.textContent=(earned?'✓ ':'  ')+(a.hidden&&!earned?'REDACTED':a.name);bindBtn(b);nav.appendChild(b);});
  const back=document.createElement('button');back.className='btn';back.tabIndex=-1;back.dataset.act='achback';back.textContent='Back';bindBtn(back);nav.appendChild(back);
  $('#ach-h').textContent='';$('#ach-b').textContent='';
  showOnly('#ach-ov');setMenu('#m-ach');
}
function previewAch(id){
  const a=allAchievements().find(x=>x.id===id),d=HBP.achievements.data();if(!a)return;const earned=!!d.earned[a.id];
  if(a.hidden&&!earned){$('#ach-h').textContent='REDACTED';$('#ach-b').textContent='This line item is classified until you earn it.';return;}
  $('#ach-h').textContent=a.name.toUpperCase()+'  ·  '+a.points+' PTS';
  let b=earned?a.earned:a.desc;
  if(a.progress&&!earned){const v=HBP.achievements.stat(a.progress.stat,a.progress.minDifficulty||0);b+='\n\nPROGRESS: '+Math.min(v,a.progress.target)+' / '+a.progress.target;}
  $('#ach-b').textContent=b;
}

/* ================= SETTINGS AND COMFORT (engine 1.3) ================= */
// Comfort options live in OPT (engine.js). Each entry: label, current value text, step(dir), and the panel text.
const flip=k=>()=>{OPT[k]=!OPT[k];},onOff=k=>()=>OPT[k]?'On':'Off';
const COMFORT={
  bob:{label:'Head bob',val:onOff('bob'),step:flip('bob'),desc:'The view and the weapon sway as Buck walks. Turn it off if walking around makes you queasy.'},
  shake:{label:'Screen shake',val:onOff('shake'),step:flip('shake'),desc:'Explosions, heavy hits and the Super shake the screen.'},
  flash:{label:'Reduce flashing',val:onOff('flash'),step:flip('flash'),desc:'Tones down explosion flashes, the red flash when Buck is hurt and the pickup flash, and makes flickering lamps waver instead of strobe.'},
  turn:{label:'Turn speed',val:()=>TURNS[OPT.turn][0],step:d=>{OPT.turn=(OPT.turn+d+TURNS.length)%TURNS.length;},desc:'How fast the arrow keys and the right stick turn Buck. Mouse and touch look are not affected.'},
  lookLock:{label:'Look up and down',val:()=>OPT.lookLock?'Locked level':'Free',step:flip('lookLock'),desc:'Free lets Buck look up and down, which slides the whole view. Locked level keeps the horizon still. Aiming works either way.'},
  fov:{label:'Field of view',val:()=>FOVS[OPT.fov][0],step:d=>{OPT.fov=(OPT.fov+d+FOVS.length)%FOVS.length;},desc:'A wider view shows more at the sides and makes motion feel slower. Some people find it easier on the stomach.'},
  dot:{label:'Center dot',val:onOff('dot'),step:flip('dot'),desc:'A small dot that stays in the middle of the screen, a fixed point to rest your eyes on.'},
  scan:{label:'Scanlines',val:onOff('scan'),step:flip('scan'),desc:'The retro TV lines over the picture.'},
  bright:{label:'Brightness',val:()=>OPT.bright+'%',step:d=>{OPT.bright+=d*10;if(OPT.bright>150)OPT.bright=70;if(OPT.bright<70)OPT.bright=150;},desc:'Brightens or darkens the whole picture. Dark rooms stay dark relative to the rest.'},
};
const SETDESC={sound:['SOUND','All game audio.'],voice:['VOICE','Buck, Moss and the audio logs.'],hints:['HINTS','Short prompts the first time something new comes up: kicking, stomping, swimming, the map.'],
  quips:['ACHIEVEMENT QUIPS','Buck says a line when you earn an achievement.'],setback:['BACK','']};
function applyComfort(save){
  cv.classList.toggle('scan-off',!OPT.scan);cv.style.filter=OPT.bright===100?'':`brightness(${OPT.bright/100})`;
  resize();
  document.querySelectorAll('#m-settings [data-act^="cf:"]').forEach(b=>{const c=COMFORT[b.dataset.act.slice(3)];b.textContent=c.label+': '+c.val();});
  if(save)HBP.store.set('hb-comfort',OPT);
}
function settingsPanel(){
  const b=menuBtns()[menuIdx];if(!b)return;try{b.scrollIntoView({block:'nearest'});}catch(e){}
  const a=b.dataset.act,c=a.startsWith('cf:')?COMFORT[a.slice(3)]:null,d=SETDESC[a]||['',''];
  $('#st-h').textContent=c?('COMFORT · '+c.label.toUpperCase()):d[0];
  $('#st-b').textContent=c?c.desc+(IN.touchMode?'':' Left and right change it.'):d[1];
}
let settingsFrom='title';
function openSettings(){settingsFrom=G.state==='pause'?'pause':G.sub==='photo'?'photo':'title';G.sub='settings';showOnly('#settings');refreshToggles();applyComfort(false);setMenu('#m-settings');}
function closeSettings(){G.sub=null;if(settingsFrom==='pause'){showOnly('#pause');setMenu('#m-pause');}else toTitle();}
const _markSel=markSel;
markSel=function(){_markSel();if(curMenu&&curMenu.id==='m-settings')settingsPanel();};
const _menuNav=menuNav;
menuNav=function(){
  if(curMenu&&curMenu.id==='m-settings'){const b=menuBtns()[menuIdx],a=b&&b.dataset.act;
    if(a&&a.startsWith('cf:')){const d=edge('left')?-1:edge('right')?1:0;if(d){S.tick();COMFORT[a.slice(3)].step(d);applyComfort(true);settingsPanel();}}}
  _menuNav();
};
// The photosensitivity warning shows once, the first time the title screen would appear.
const _toTitle=toTitle;
toTitle=function(){_toTitle();if(!HBP.store.get('hb-photo')){G.sub='photo';showOnly('#photo');setMenu('#m-photo');}};
applyComfort(false);

const _act=act;
act=function(a){
  if(a&&a.startsWith('ac:')){S.beep(700);previewAch(a.slice(3));return;}
  if(a&&a.startsWith('cf:')){S.beep(700);COMFORT[a.slice(3)].step(1);applyComfort(true);settingsPanel();return;}
  switch(a){
    case 'settings':S.beep(700);openSettings();return;
    case 'setback':S.beep(700);closeSettings();return;
    case 'ph:ok':S.beep(700);HBP.store.set('hb-photo',1);G.sub=null;toTitle();return;
    case 'ph:comfort':S.beep(700);HBP.store.set('hb-photo',1);openSettings();return;
    case 'achievements':S.beep(700);openAchievements();return;
    case 'achback':S.beep(700);G.sub=null;showOnly('#pause');setMenu('#m-pause');return;
    case 'conback':S.beep(700);closeConsole();return;
    case 'cfyes':S.beep(700);G.sub='diff';showDiff();return;
    case 'cfno':S.beep(700);toTitle();return;
  }
  _act(a);
};

window.claude?.hot?.ready?window.claude.hot.ready(()=>boot()):boot();

/* ---------- Deck 02 enemies: lurker, sleeper, the Super (engine 1.3) ---------- */
const LPAL=fl=>({skin:fl?'#fff':'#8d8698',skinD:fl?'#ddd':'#5a5466',suit:fl?'#fff':'#4a4456',suitD:fl?'#ccc':'#2a2632',bone:fl?'#fff':'#e8e2f0',gore:'#5a0b3a',goreD:'#2d0420',eye:'#ff5adf'});
const SLPAL=fl=>({skin:fl?'#fff':'#a39c86',skinD:fl?'#ddd':'#6a6452',suit:fl?'#fff':'#3d5a7a',suitD:fl?'#ccc':'#22364c',bone:fl?'#fff':'#ebe3c4',gore:'#7d0b14',goreD:'#3d0408',eye:'#ffd23c'});
const SUPAL=fl=>({skin:fl?'#fff':'#b3a37c',skinD:fl?'#ddd':'#786a4c',suit:fl?'#fff':'#4d6680',suitD:fl?'#ccc':'#2c3d50',bone:fl?'#fff':'#efe6c4',gore:'#7d0b14',goreD:'#3d0408',eye:'#ffd23c'});
// Enemy types and heights come from the core tuning, so new types need only their behavior here.
function registerEnemyTypes(){
  const E=PACKS.core.tuning.enemies;
  for(const [k,v] of Object.entries(E)){if(!ETYPE[k])ETYPE[k]={hp:v.hp,lhp:v.lhp,speed:v.speed,dmg:v.dmg,reach:v.reach,wind:v.wind,r:v.r};ETYPE[k].boss=!!v.boss;ETYPE[k].sever=v.sever;ETYPE[k].def=v;}
  WH.lurker=.5;WH.sleeper=1;WH.super=1.55;
}
const _makeEnemy=makeEnemy;
makeEnemy=function(type,x,y,o){
  const e=_makeEnemy(type,x,y,o);o=o||{};
  if(type==='lurker'&&!o.drop){e.state='ceiling';e.z=.5;e.dripT=0;}
  if(type==='sleeper'&&!o.awake){e.state='playdead';e.behind=0;e.twitch=2+R()*3;e.twT=0;}
  if(type==='super'){e.steamT=5;e.summonT=10;e.summoned=0;e.tankDone=false;}
  return e;
};
const _needSever=needSever;needSever=e=>e.type==='super'?99:(ETYPE[e.type]&&ETYPE[e.type].sever)||_needSever(e);
const _severCount=severCount;severCount=e=>e.type==='lurker'?_severCount({type:'crawler',mask:e.mask}):_severCount(e);
const _wake=wake;
wake=function(e){
  if(e.state==='ceiling'){if(G.notarget)return;dropLurker(e);return;}
  if(e.state==='playdead'){if(G.notarget)return;e.state='rise';e.t=.6;const [p,v]=panOf(e.x,e.y);S.shriek(p,v,1.2);return;}
  _wake(e);
};
function dropLurker(e){e.state='drop';e.t=0;e.z=.5;e.lunge=true;const [p,v]=panOf(e.x,e.y);S.shriek(p,v,1.5);}
const _updateEnemy=updateEnemy;
updateEnemy=function(e,dt,d){
  if(e.flash>0)e.flash-=dt;
  if(e.state==='ceiling'){
    // Lurkers hang from the ceiling. Dripping and a shadow give them away; they drop when you walk under.
    if(d<5&&los(e.x,e.y,P.x,P.y)){e.dripT-=dt;if(e.dripT<=0){e.dripT=.25+R()*.35;addPart({x:e.x+(R()-.5)*.2,y:e.y+(R()-.5)*.2,z:.95,vx:0,vy:0,vz:-1,img:IMG.glob2,wh:.03,life:.9,t:'spark'});}
      if(d<3.2)showHint('lurker');}
    const cd=ETYPE.lurker.def.ceiling||{};
    if(d<(cd.dropRange||1.6)&&!G.notarget)dropLurker(e);
    return;
  }
  if(e.state==='drop'&&e.type==='lurker'){
    e.t+=dt;e.z=Math.max(0,.5-e.t*1.8);
    if(e.z<=0){e.state='chase';e.cd=.4;
      if(e.lunge&&Math.hypot(P.x-e.x,P.y-e.y)<.8){hurtPlayer((ETYPE.lurker.def.ceiling||{}).dropDmg||18,e);G.shake=Math.max(G.shake,.4);}e.lunge=false;}
    return;
  }
  if(e.state==='playdead'){
    // Sleepers ignore you while you face them. Walk past with your back turned and they get up.
    e.twT-=dt;if(e.twT<=0){e.twitch-=dt;if(e.twitch<=0){e.twitch=2.5+R()*2.5;e.twT=.28;}}
    const wet=WATER[I(e.x|0,e.y|0)]===2;
    if(d<(wet?1.6:3)&&!G.notarget){
      const fx=Math.cos(P.ang),fy=Math.sin(P.ang),dot=((e.x-P.x)*fx+(e.y-P.y)*fy)/(d||1);
      if(wet||dot<-.1){e.behind+=dt;if(e.behind>=((ETYPE.sleeper.def.sleeper||{}).waitBehind||1.2)){e.state='rise';e.t=.55;e.lunge=true;const [p,v]=panOf(e.x,e.y);S.shriek(p,v,1.2);}}
      else e.behind=Math.max(0,e.behind-dt*.5);
    }
    return;
  }
  if(e.type==='super')superTick(e,dt,d);
  if(e.state==='rise'&&e.type==='sleeper'&&e.lunge&&e.t>=.95){e.lunge=false;e.state='attack';e.t=e.wind*.6;e.hit=false;}
  _updateEnemy(e,dt,d);
};
function superTick(e,dt,d){
  const sd=ETYPE.super.def.super||{};
  if((e.mask&6)===6&&!e.bufferDropped){e.bufferDropped=true;bufferArt();decor('buffer',e.x+Math.cos(P.ang+1.2)*.5,e.y+Math.sin(P.ang+1.2)*.5,false,.3);S.thud();}
  if(e.state!=='chase'&&e.state!=='attack')return;
  G.bossBar={e,name:'THE SUPER'};
  e.steamT-=dt;
  if(e.steamT<=0){
    if(!e.hissing){e.hissing=.8;const [p,v]=panOf(e.x,e.y);S.whoosh();S.staticN(.8);}
    e.hissing-=dt;for(let k=0;k<2;k++)addPart({x:e.x+(R()-.5)*.5,y:e.y+(R()-.5)*.5,z:1,vx:(R()-.5),vy:(R()-.5),vz:.6,img:IMG.glob2,wh:.05,life:.5,t:'spark'});
    if(e.hissing<=0){e.hissing=0;e.steamT=sd.steamEvery||7;
      for(let k=0;k<30;k++){const a=R()*Math.PI*2,s=1+R()*3;addPart({x:e.x,y:e.y,z:.8,vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:R(),img:IMG.glob2,wh:.06,life:.7,t:'spark'});}
      if(d<(sd.steamRange||3.2)&&los(e.x,e.y,P.x,P.y))hurtPlayer(sd.steamDmg||8,e,false,'enemy');G.shake=Math.max(G.shake,.3);}
  }
  e.summonT-=dt;
  if(e.summonT<=0){e.summonT=sd.summonEvery||14;
    const live=ENTS.filter(x=>x.kind==='enemy'&&!x.gone&&x.summon).length;
    if(live<(sd.summonMax||3)){const z=zoneAtXY(e.x,e.y),v=z?ventCells([z.id]):[];if(v.length){const t=(sd.summon||['husk'])[e.summoned++%(sd.summon||['husk']).length];const c=pickVent(v);ventSpawnAt(c,t);const ne=ENTS[ENTS.length-1];if(ne)ne.summon=true;}}}
  // His rig shrugs off body hits until both arms are off; then the boiler tank is open.
  if(!e.tankDone&&(e.mask&6)===6){e.tankDone=true;e.hp=Math.min(e.hp,(sd.tankHp||40)*D.hp);pop('TANK EXPOSED','#ff8c1a');msg('THE TANK IS EXPOSED. FINISH HIM.');}
}
const _damageEnemy=damageEnemy;
damageEnemy=function(e,part,dmg,hz){
  if(e.type==='super'){
    if(e.state==='idle'||e.state==='dormant')wake(e);
    if(part==='legL'||part==='legR')part='torso';
    if(part==='torso'&&!e.tankDone)dmg*=.15;
    if(part==='head'&&e.mask&1)part='torso';
  }
  if(e.state==='ceiling'||e.state==='playdead')e.killState=e.state==='ceiling'?'ceiling':'playingDead';else e.killState='other';
  _damageEnemy(e,part,dmg,hz);
};
const _killEnemy=killEnemy;
killEnemy=function(e,hz,big){
  const boss=e.type==='super'&&e.state!=='dead';
  if(boss){G.lastBoss={x:e.x,y:e.y};G.bossBar=null;}
  const stomped=HITCAUSE==='stomp'&&P&&P.boots&&(PACKS.core.tuning.kick.stomp||{}).keepsDown;
  _killEnemy(e,hz,big);
  if(stomped)for(const d of ENTS)if(d.kind==='decor'&&d.t==='pile'&&d.x===e.x&&d.y===e.y)d.revive=0;
  // The Super leaves his body (and his head) for the payoff scene.
  if(boss){for(const d of ENTS)if(d.kind==='decor'&&d.t==='pile'&&d.x===e.x&&d.y===e.y)d.gone=true;bossBodyArt();decor('superbody',e.x,e.y,false,.5);}
};
// The Super's rig, painted over the husk body (64x96 canvas, before the 1.5x scale):
// a riveted boiler tank strapped to his chest with pipes over his shoulders, and the floor buffer
// held in whichever hand he still has. With both arms gone the buffer is dropped (a loose prop).
function superRig(g,mask,pose,atk,tankOpen,fl,phase){
  if(pose==='lie')return;
  const oy=pose==='crouch'?20:0,Y=v=>v+oy,armL=!(mask&2),armR=!(mask&4);
  // the buffer: handle from the hand down to the pad on the floor beside his foot
  if(armL||armR){const sd=armR?1:-1,sx=sd>0?43:21,hang=[sx+sd*7,Y(58)],up=[sx+sd*5,Y(-1)];
    const hx=hang[0]+(up[0]-hang[0])*atk,hy=hang[1]+(up[1]-hang[1])*atk,px=32+sd*20+(hx+sd*4-(32+sd*20))*atk,py=Y(91)+(hy-26-Y(91))*atk;   // on a swing the pad comes up overhead
    g.strokeStyle=fl?'#fff':'#c9662e';g.lineWidth=2.4;g.lineCap='round';g.beginPath();g.moveTo(hx,hy-3);g.lineTo(px,py-2);g.stroke();
    g.strokeStyle=fl?'#fff':'#2a2d30';g.lineWidth=2;g.beginPath();g.moveTo(hx-3,hy-3);g.lineTo(hx+3,hy-3);g.stroke();   // grip bar
    g.fillStyle=fl?'#fff':'#3a3f45';ell(g,px,py,9,3);g.fillStyle=fl?'#ddd':'#7d8a95';ell(g,px,py-1,8,2.2);
    g.fillStyle=fl?'#fff':'#c9662e';g.fillRect(px-3,py-4,6,3);}
  // pipes from the tank up over both shoulders
  g.strokeStyle=fl?'#fff':'#8a6a3a';g.lineWidth=2;g.lineCap='butt';
  for(const sd of [-1,1]){g.beginPath();g.moveTo(32+sd*7,Y(32));g.lineTo(32+sd*9,Y(25));g.lineTo(32+sd*12,Y(23));g.stroke();}
  // the tank: a riveted pressure vessel, banded, with a gauge
  const tx=22,ty=Y(31),tw=20,th=22;
  g.fillStyle=fl?'#fff':'#4f575f';g.fillRect(tx,ty+2,tw,th-4);g.fillRect(tx+2,ty,tw-4,th);
  g.fillStyle=fl?'#eee':'#68727b';g.fillRect(tx+2,ty+2,tw-4,th-4);
  g.fillStyle=fl?'#ddd':'#3a4148';g.fillRect(tx,ty+7,tw,2);g.fillRect(tx,ty+th-8,tw,2);
  g.fillStyle=fl?'#fff':'#a9b3bb';for(const [rx,ry] of [[2,3],[tw-3,3],[2,th-4],[tw-3,th-4],[tw/2,1],[tw/2,th-2]])g.fillRect(tx+rx,ty+ry,1,1);
  if(tankOpen){const pulse=(phase|0)%4<2?1:0;
    g.fillStyle=fl?'#fff':(pulse>.5?'#ffd200':'#ff8c1a');g.fillRect(tx+4,ty+10,tw-8,6);
    g.fillStyle=fl?'#fff':'#ff8c1a';g.fillRect(tx,ty+7,tw,2);g.fillRect(tx,ty+th-8,tw,2);g.fillRect(tx+tw/2-1,ty+3,2,4);g.fillRect(tx+6,ty+16,1,4);g.fillRect(tx+13,ty+15,1,5);}
  else{g.fillStyle=fl?'#fff':'#e8e2c8';circ(g,32,ty+12,3.2);g.fillStyle='#2a2d30';circ(g,32,ty+12,2.2);g.fillStyle='#d0142f';g.fillRect(32,ty+11,2,1);}
  // straps over the shoulders
  g.fillStyle=fl?'#fff':'#5a3f22';g.fillRect(tx+1,ty-6,3,7);g.fillRect(tx+tw-4,ty-6,3,7);
}
function bufferArt(){
  if(IMG.buffer)return;DWH.buffer=.3;
  IMG.buffer=art(48,20,g=>{g.strokeStyle='#c9662e';g.lineWidth=3;g.beginPath();g.moveTo(4,6);g.lineTo(34,15);g.stroke();
    g.fillStyle='#2a2d30';g.fillRect(2,3,3,7);g.fillStyle='#3a3f45';ell(g,38,16,10,3.5);g.fillStyle='#7d8a95';ell(g,38,15,9,2.5);g.fillStyle='#c9662e';g.fillRect(35,11,6,3);});
}
function bossBodyArt(){
  if(IMG.superbody)return;DWH.superbody=DWH.superbody_nohead=1.55;
  for(const [k,mask] of [['superbody',0],['superbody_nohead',1]]){const r=drawHusk({mask,f:0,atk:0,pose:'lie',flash:0,kind:'super',brute:false});
    const c2=canvasOf(96,110),g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(r.c,0,0,96,110);IMG[k]=imgFrom(c2);}
}
// Kicks with the stomp boots: a body on the floor gets stomped (three times the stomp damage, and a
// sleeper playing dead dies outright). Without the boots, a kick only wakes a sleeper. A body killed
// by a stomp stays down (no revive). Standing kicks with the boots are in applyKick (engine.js).
const _applyKick=applyKick;
applyKick=function(){
  if(P.boots&&G.water!==2){
    const fx=Math.cos(P.ang),fy=Math.sin(P.ang),st=PACKS.core.tuning.kick.stomp||{};
    for(const e of ENTS){
      if(e.gone||e.kind!=='enemy'||e.state==='dead')continue;
      const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d>(st.reach||1.05)+.3||d<.01||(dx*fx+dy*fy)/d<.5)continue;
      if(e.type==='sleeper'&&e.state==='playdead'&&WATER[I(e.x|0,e.y|0)]!==2){HITCAUSE='stomp';G.used.kick=1;e.killState='playingDead';pop('STOMP','#ffb627');
        S.clank();G.shake=Math.max(G.shake,.25);addStat('sleepersStomped');gibs(e.x,e.y,.1,8);killEnemy(e,.1,false);return;}
      if(e.crawl||e.type==='crawler'||e.state==='dormant'||e.state==='rise'||e.type==='lurker'&&e.z<=0){HITCAUSE='stomp';G.used.kick=1;pop('STOMP','#ffb627');
        damageEnemy(e,'torso',(PACKS.core.tuning.kick.damage||3.5)*3.2*(st.dmgMul||3),.15);if(!e.gone&&e.state!=='dead'&&e.type!=='super')HITCAUSE='stomp';S.clank();G.shake=Math.max(G.shake,.25);return;}
    }
  }
  _applyKick();
};
// The HUD mark for the boots, beside the keycards: a boot with a steel toe cap (11x8).
function drawBootIcon(g,x,y){
  g.fillStyle='#6b4a32';g.fillRect(x+1,y,4,5);g.fillRect(x+1,y+4,9,2);
  g.fillStyle='#c9d4dc';g.fillRect(x+6,y+4,4,2);g.fillRect(x,y+6,11,1);
  g.fillStyle='#ffb627';g.fillRect(x+1,y+1,4,1);
}
// drawing
const _enemyImg=enemyImg;
enemyImg=function(e){
  if(e.type!=='lurker'&&e.type!=='sleeper'&&e.type!=='super')return _enemyImg(e);
  let pose='stand',atk=0,f=Math.floor(e.phase*8)&7;
  if(e.state==='playdead'||e.state==='dormant')pose=e.twT>0?'lie2':'lie';
  else if(e.state==='rise')pose=e.t<.35?'lie':e.t<.75?'crouch':'stand';
  else if(e.state==='attack'){const k=e.t/e.wind;atk=k<1?k:Math.max(0,.6-(e.t-e.wind)*4);}
  if(e.state==='stagger')f=2;
  const aq=Math.round(clamp(atk,0,1)*3),fl=e.flash>0?1:0,ceil=e.state==='ceiling'?1:0;
  const key=e.type+'|'+e.mask+'|'+pose+'|'+f+'|'+aq+'|'+fl+'|'+ceil+'|'+(e.tankDone?1:0);
  let v=ECACHE.get(key);
  if(!v){
    const o={mask:e.mask,f,atk:aq/3,pose:pose==='lie2'?'lie':pose,flash:fl,brute:false,kind:e.type};
    let r;
    if(e.type==='lurker'){r=drawCrawler(Object.assign(o,{pal:LPAL}));
      if(ceil){const c2=canvasOf(r.c.width,r.c.height),g2=c2.getContext('2d');g2.translate(0,r.c.height);g2.scale(1,-1);g2.drawImage(r.c,0,0);r={c:c2,regs:r.regs.map(q=>({p:q.p,x0:q.x0,x1:q.x1,y0:1-q.y1,y1:1-q.y0}))};}}
    else{r=drawHusk(o);
      if(pose==='lie2'){const g=r.c.getContext('2d'),C=SLPAL(fl);seg(g,22,84,18,74,3,2,C.skin);}   // the twitch: a hand comes up
      if(e.type==='super'){const g=r.c.getContext('2d');superRig(g,e.mask,pose,aq/3,e.tankDone,fl,f);
        const c2=canvasOf(96,110),g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(r.c,0,0,96,110);r={c:c2,regs:r.regs};}}
    v=imgFrom(r.c);v.regs=r.regs;if(ECACHE.size>900)ECACHE.clear();ECACHE.set(key,v);
  }
  return v;
};
// boss health bar
const _drawHUD=drawHUD;
drawHUD=function(dt){
  _drawHUD(dt);
  if(P.boots&&!G.mapOn){const nk=Object.keys(DK&&DK.deck.keys||{}).length,touch=IN.touchMode;
    drawBootIcon(ctx,touch?RW-52:(RW>>1)+20+nk*11+2,touch?46:RH-21+11);}
  const b=G.bossBar;if(!b||b.e.gone||b.e.state==='dead'||G.mapOn||Math.hypot(b.e.x-P.x,b.e.y-P.y)>18){G.bossBar=null;return;}
  const g=ctx,w=RW*.5,x=(RW-w)/2,y=IN.touchMode?RH-26:RH-32,k=clamp(b.e.hp/(ETYPE.super.hp*D.hp),0,1);
  g.fillStyle='rgba(4,6,10,.8)';g.fillRect(x-2,y-10,w+4,16);txt(g,b.name,RW/2,y-9,'#ff3048','8px Silkscreen, monospace','center');
  g.fillStyle='#3a0a10';g.fillRect(x,y,w,4);g.fillStyle=b.e.tankDone?'#ff8c1a':'#d0142f';g.fillRect(x,y,w*k,4);
};
