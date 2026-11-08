'use strict';
const $=s=>document.querySelector(s);
const frame=$('#frame'), cv=$('#c'), ctx=cv.getContext('2d',{alpha:false});
const clamp=(v,a,b)=>v<a?a:v>b?b:v, lerp=(a,b,t)=>a+(b-a)*t, R=Math.random;
const lerp2=(a,b,t)=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t)];
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Comfort settings (engine 1.3). The device's Reduce Motion setting turns the motion and flash options on by default.
const TURNS=[['Slow',1.3],['Medium',1.9],['Normal',2.5],['Fast',3.2]],FOVS=[['Normal',1],['Wide',1.15],['Wider',1.3]];
const OPT=Object.assign({bob:!reduceMotion,shake:!reduceMotion,flash:reduceMotion,turn:2,lookLock:false,scan:true,bright:100,fov:0,dot:false},HBP.store.get('hb-comfort')||{});

/* ================= RESOLUTION ================= */
let RW=320,RH=180,F=162,IMGD,BUF,ZB,CONE;
const vmc=document.createElement('canvas'), vmg=vmc.getContext('2d');
function resize(){
  const vw=innerWidth, vh=innerHeight;
  const nw=Math.round(clamp(180*vw/vh,240,400)/2)*2;
  if(nw!==RW||!IMGD){
    RW=nw; RH=180; cv.width=RW; cv.height=RH; vmc.width=RW; vmc.height=RH;
    IMGD=ctx.createImageData(RW,RH); BUF=new Uint32Array(IMGD.data.buffer); ZB=new Float32Array(RW); CONE=new Float32Array(RW*RH);
    for(let y=0;y<RH;y++)for(let x=0;x<RW;x++){const dx=(x-RW/2)/(RH*.6),dy=(y-RH/2)/(RH*.48);CONE[y*RW+x]=Math.exp(-(dx*dx+dy*dy)*1.6);}
  }
  F=RH*.9/FOVS[OPT.fov][1]; ctx.imageSmoothingEnabled=false; vmg.imageSmoothingEnabled=false;
  const s=Math.min(vw/RW,vh/RH);
  frame.style.width=(RW*s)+'px'; frame.style.height=(RH*s)+'px';
  frame.style.setProperty('--u',(RH*s/100)+'px');
  document.body.classList.toggle('portrait',vh>vw*1.1);
}
addEventListener('resize',resize);

/* ================= DRAW HELPERS ================= */
function canvasOf(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function poly(g,p){g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);g.closePath();g.fill();}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
function ell(g,x,y,rx,ry){g.beginPath();g.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);g.fill();}
function seg(g,x1,y1,x2,y2,w1,w2,c){const a=Math.atan2(y2-y1,x2-x1)+Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);g.fillStyle=c;g.beginPath();g.moveTo(x1+ca*w1/2,y1+sa*w1/2);g.lineTo(x2+ca*w2/2,y2+sa*w2/2);g.lineTo(x2-ca*w2/2,y2-sa*w2/2);g.lineTo(x1-ca*w1/2,y1-sa*w1/2);g.closePath();g.fill();circ(g,x2,y2,w2/2);circ(g,x1,y1,w1/2);}
function grime(g,w,h,n,a){for(let i=0;i<n;i++){const v=R()<.55?0:255;g.fillStyle=`rgba(${v},${v},${v},${(a*R()).toFixed(3)})`;g.fillRect(R()*w|0,R()*h|0,1+R()*3|0,1+R()*2|0);}}

/* ================= TEXTURES ================= */
const TS=64;
const T={HULL:1,HAZ:2,BLOOD:3,TERM:4,DOOR:5,LOCK:6,WIN:7,VENT:8,SCRAWL:9,MED:10,SECRET:11,PIPE:12,TRAM:13,UNLOCK:14,HULL2:15,LOCKER:16,REACTOR:17,CARGO:18,CARGO2:19,HYDRO:20,PLANTER:21,CONSOLE:22,CREW:23,BRIDGE:24,SAVE:25,BRK:26,BRKON:27,BLUE:28,YEL:29,PWR:30,OVR:31,OVRCON:32,LEVER:33,LEVERON:34,WINMOON:35};
const TEX=[],FLO=[],CEI=[];
function texFrom(c,emc){
  const d=c.getContext('2d').getImageData(0,0,TS,TS).data, px=new Uint32Array(TS*TS), em=new Uint8Array(TS*TS);
  for(let i=0;i<TS*TS;i++)px[i]=d[i*4]|(d[i*4+1]<<8)|(d[i*4+2]<<16);
  if(emc){const e=emc.getContext('2d').getImageData(0,0,TS,TS).data;for(let i=0;i<TS*TS;i++)em[i]=e[i*4+3]>40?1:0;}
  return {px,em};
}
function mkTex(draw,emDraw){const c=canvasOf(TS,TS),g=c.getContext('2d');draw(g);let e=null;if(emDraw){e=canvasOf(TS,TS);emDraw(e.getContext('2d'));}return texFrom(c,e);}
function hull(g,base){
  g.fillStyle=base||'#3a434c';g.fillRect(0,0,64,64);
  const gr=g.createLinearGradient(0,0,0,64);gr.addColorStop(0,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  g.fillStyle='rgba(0,0,0,.55)';[[0,0,64,1],[0,0,1,64],[31,0,2,64],[0,42,64,2]].forEach(r=>g.fillRect(...r));
  g.fillStyle='rgba(255,255,255,.13)';[[1,1,30,1],[33,1,30,1],[1,44,30,1],[33,44,30,1]].forEach(r=>g.fillRect(...r));
  for(const [x,y] of [[4,4],[26,4],[36,4],[58,4],[4,37],[26,37],[36,37],[58,37],[4,48],[58,48],[4,59],[26,59],[36,59],[58,59]]){g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x,y+1,2,2);g.fillStyle='#8a96a1';g.fillRect(x,y,2,1);}
  grime(g,64,64,240,.17);
  g.fillStyle='rgba(70,45,25,.28)';g.fillRect(10,45,3,17);g.fillRect(47,4,2,12);
}
function door(g,light){
  g.fillStyle='#50565c';g.fillRect(0,0,64,64);
  const gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,'rgba(0,0,0,.3)');gr.addColorStop(.5,'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  for(const y0 of [2,52]){g.save();g.beginPath();g.rect(0,y0,64,10);g.clip();g.fillStyle='#d9761e';g.fillRect(0,y0,64,10);g.fillStyle='#17191b';for(let x=-12;x<76;x+=10){poly(g,[[x,y0],[x+5,y0],[x-5,y0+10],[x-10,y0+10]]);}g.restore();}
  g.fillStyle='#14171a';g.fillRect(31,0,2,64);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(33,0,1,64);
  g.fillStyle='#0b0e12';g.fillRect(22,18,20,6);g.fillStyle='#1d3346';g.fillRect(23,19,18,4);
  g.fillStyle='#2b3035';g.fillRect(8,26,6,16);g.fillRect(50,26,6,16);
  if(light){g.fillStyle='#0c0d0e';g.fillRect(25,29,14,12);g.fillStyle=light;g.fillRect(27,31,10,8);}
  grime(g,64,64,160,.14);
}
function hazBand(g,y,h){g.save();g.beginPath();g.rect(0,y,64,h);g.clip();g.fillStyle='#c9a227';g.fillRect(0,y,64,h);g.fillStyle='#16181a';for(let x=-16;x<84;x+=12)poly(g,[[x,y],[x+6,y],[x-6,y+h],[x-12,y+h]]);g.restore();g.fillStyle='rgba(0,0,0,.5)';g.fillRect(0,y-1,64,1);g.fillRect(0,y+h,64,1);}
function blood(g,cx,cy,n,sp){for(let i=0;i<n;i++){g.fillStyle=`rgba(${100+R()*40|0},6,12,.88)`;circ(g,cx+(R()-.5)*sp,cy+(R()-.5)*sp*.7,1+R()*5);}for(let i=0;i<6;i++){g.fillStyle='rgba(95,6,12,.85)';g.fillRect(cx+(R()-.5)*sp|0,cy|0,1+R()*2|0,6+R()*20|0);}}
function buildTextures(){
  TEX[T.HULL]=mkTex(g=>hull(g));
  TEX[T.HULL2]=mkTex(g=>hull(g,'#2f353b'));
  TEX[T.HAZ]=mkTex(g=>{hull(g,'#41474d');hazBand(g,47,11);g.fillStyle='rgba(201,162,39,.8)';g.font='bold 9px monospace';g.fillText('DK-1',6,30);});
  TEX[T.BLOOD]=mkTex(g=>{hull(g);blood(g,32,24,14,26);});
  TEX[T.TERM]=mkTex(g=>{hull(g,'#2a3036');g.fillStyle='#0d1013';g.fillRect(9,8,46,32);g.fillStyle='#04210f';g.fillRect(11,10,42,28);g.fillStyle='#39ff88';for(let y=13;y<36;y+=4)g.fillRect(13,y,6+R()*30|0,2);g.fillStyle='#ff3a3a';g.fillRect(12,46,3,3);g.fillStyle='#ffb627';g.fillRect(18,46,3,3);},
    g=>{g.fillStyle='#fff';g.fillRect(11,10,42,28);g.fillRect(12,46,3,3);g.fillRect(18,46,3,3);});
  TEX[T.DOOR]=mkTex(g=>door(g));
  TEX[T.LOCK]=mkTex(g=>door(g,'#ff2030'),g=>{g.fillStyle='#fff';g.fillRect(27,31,10,8);});
  TEX[T.UNLOCK]=mkTex(g=>door(g,'#2cff6a'),g=>{g.fillStyle='#fff';g.fillRect(27,31,10,8);});
  TEX[T.SECRET]=mkTex(g=>{medWall(g);g.strokeStyle='rgba(20,22,24,.55)';g.lineWidth=1;g.beginPath();g.moveTo(41,8);g.lineTo(44,18);g.lineTo(40,26);g.lineTo(46,38);g.stroke();});
  TEX[T.WIN]=mkTex(g=>{g.fillStyle='#30363c';g.fillRect(0,0,64,64);g.fillStyle='#02040a';g.fillRect(5,6,54,52);for(let i=0;i<40;i++){g.fillStyle=`rgba(220,230,255,${.3+R()*.7})`;g.fillRect(6+R()*52|0,7+R()*50|0,1,1);}g.fillStyle='#22272c';g.fillRect(30,6,4,52);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(5,6,54,2);},
    g=>{g.fillStyle='#fff';g.fillRect(5,6,25,52);g.fillRect(34,6,25,52);});
  TEX[T.WINMOON]=mkTex(g=>{g.fillStyle='#30363c';g.fillRect(0,0,64,64);g.fillStyle='#02040a';g.fillRect(5,6,54,52);for(let i=0;i<40;i++){g.fillStyle=`rgba(220,230,255,${.3+R()*.7})`;g.fillRect(6+R()*52|0,7+R()*50|0,1,1);}g.fillStyle='#4f2a20';circ(g,32,31,15);g.fillStyle='#3a1d17';circ(g,36,35,11);g.fillStyle='#4f2a20';circ(g,30,29,11);g.strokeStyle='#ff3a20';g.lineWidth=1.2;g.beginPath();g.moveTo(22,34);g.lineTo(27,31);g.lineTo(31,35);g.lineTo(37,27);g.lineTo(41,30);g.stroke();g.fillStyle='#22272c';g.fillRect(30,6,4,52);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(5,6,54,2);},
    g=>{g.fillStyle='#fff';g.fillRect(5,6,25,52);g.fillRect(34,6,25,52);});
  TEX[T.VENT]=mkTex(g=>{g.fillStyle='#2b3035';g.fillRect(0,0,64,64);g.fillStyle='#121519';g.fillRect(6,6,52,52);for(let y=9;y<56;y+=6){g.fillStyle='#050607';g.fillRect(8,y,48,3);g.fillStyle='#4a535c';g.fillRect(8,y+3,48,1);}for(const[x,y]of[[3,3],[59,3],[3,59],[59,59]]){g.fillStyle='#8a96a1';g.fillRect(x,y,2,2);}grime(g,64,64,120,.15);});
  TEX[T.SCRAWL]=mkTex(g=>{hull(g);g.fillStyle='rgba(135,6,16,.95)';g.textAlign='center';g.font='bold 14px Impact, "Arial Black", sans-serif';g.fillText('CUT THE',32,22);g.font='bold 19px Impact, "Arial Black", sans-serif';g.fillText('LIMBS',32,42);for(let i=0;i<8;i++)g.fillRect(8+R()*48|0,40,1,6+R()*16|0);blood(g,50,56,4,10);});
  TEX[T.MED]=mkTex(medWall);
  TEX[T.PIPE]=mkTex(g=>{g.fillStyle='#262b30';g.fillRect(0,0,64,64);for(const [y,r] of [[10,5],[25,4],[46,8]]){const gr=g.createLinearGradient(0,y-r,0,y+r);gr.addColorStop(0,'#2e353b');gr.addColorStop(.35,'#7c8892');gr.addColorStop(1,'#1a1e22');g.fillStyle=gr;g.fillRect(0,y-r,64,r*2);g.fillStyle='#14171a';g.fillRect(14,y-r-1,4,r*2+2);g.fillRect(46,y-r-1,4,r*2+2);}g.fillStyle='#a8231f';circ(g,30,46,4);g.fillStyle='#14171a';g.fillRect(29,38,2,16);grime(g,64,64,160,.18);});
  TEX[T.TRAM]=mkTex(g=>{hull(g,'#4a4636');hazBand(g,2,8);g.fillStyle='#c9a227';g.font='bold 13px Impact, "Arial Black", sans-serif';g.textAlign='center';g.fillText('TRAM',32,32);poly(g,[[24,38],[40,38],[40,35],[46,40],[40,45],[40,42],[24,42]]);});
  // floors
  FLO[0]=mkTex(g=>{g.fillStyle='#262b30';g.fillRect(0,0,64,64);for(let y=0;y<64;y+=8)for(let x=0;x<64;x+=8){g.fillStyle='#3b434a';g.fillRect(x+((y/8)%2?4:1),y+2,3,1);g.fillStyle='#16191c';g.fillRect(x+((y/8)%2?4:1),y+3,3,1);}g.fillStyle='#121417';g.fillRect(0,0,64,1);g.fillRect(0,0,1,64);g.fillRect(32,0,1,64);g.fillRect(0,32,64,1);grime(g,64,64,200,.2);});
  FLO[1]=mkTex(g=>{g.fillStyle='#8d9599';g.fillRect(0,0,64,64);g.fillStyle='#5d6569';for(let i=0;i<64;i+=16){g.fillRect(i,0,1,64);g.fillRect(0,i,64,1);}grime(g,64,64,180,.15);g.fillStyle='rgba(110,8,14,.35)';circ(g,44,40,6);});
  FLO[2]=mkTex(g=>{g.fillStyle='#2c3136';g.fillRect(0,0,64,64);g.fillStyle='#16191c';g.fillRect(0,31,64,2);g.fillRect(31,0,2,64);for(const[x,y]of[[4,4],[58,4],[4,58],[58,58],[36,36],[26,26]]){g.fillStyle='#5a646d';g.fillRect(x,y,2,2);}g.fillStyle='rgba(201,162,39,.4)';g.fillRect(0,0,64,2);grime(g,64,64,220,.2);});
  CEI[0]=mkTex(g=>{g.fillStyle='#181b1f';g.fillRect(0,0,64,64);g.fillStyle='#0c0e10';g.fillRect(0,0,64,2);g.fillRect(0,0,2,64);g.fillRect(31,0,2,64);g.fillStyle='#262b30';g.fillRect(12,12,40,40);g.fillStyle='#1b1f23';g.fillRect(14,14,36,36);grime(g,64,64,120,.15);});
  CEI[1]=mkTex(g=>{g.fillStyle='#181b1f';g.fillRect(0,0,64,64);g.fillStyle='#2b3035';g.fillRect(14,22,36,20);g.fillStyle='#dfe9f2';g.fillRect(17,25,30,14);g.fillStyle='#b7c4cf';g.fillRect(17,31,30,2);});
}
function medWall(g){g.fillStyle='#a6aeb2';g.fillRect(0,0,64,64);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,0,64,1);g.fillRect(0,0,1,64);g.fillRect(31,0,1,64);g.fillRect(0,46,64,1);g.fillStyle='#b5121f';g.fillRect(12,14,8,22);g.fillRect(5,21,22,8);g.fillStyle='#69737a';g.fillRect(0,47,64,17);grime(g,64,64,160,.12);g.fillStyle='rgba(120,10,16,.5)';g.fillRect(40,30,14,3);g.fillRect(44,30,2,14);}

function buildTextures2(){
  const cont=(g,a,b)=>{g.fillStyle=a;g.fillRect(0,0,64,64);for(let x=0;x<64;x+=6){g.fillStyle=b;g.fillRect(x,0,2,64);}
    g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,64,2);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,62,64,2);
    g.fillStyle='rgba(232,237,241,.85)';g.font='bold 8px monospace';g.fillText('GCX-'+((R()*900+100)|0),6,30);grime(g,64,64,260,.2);};
  const brk=(g,on)=>{hull(g,'#3a3f45');g.fillStyle='#1a1d20';g.fillRect(16,6,32,42);g.fillStyle=on?'#30ff70':'#ff3a2a';g.fillRect(26,9,12,6);
    g.fillStyle='#8a96a1';g.fillRect(30,on?18:28,4,16);g.fillStyle='#c9a227';g.fillRect(24,on?15:42,16,5);hazBand(g,53,7);};
  TEX[T.LOCKER]=mkTex(g=>{g.fillStyle='#4d5a63';g.fillRect(0,0,64,64);for(let i=0;i<4;i++){const x=i*16;g.fillStyle='#5f6d77';g.fillRect(x+1,2,14,58);g.fillStyle='#2a3036';g.fillRect(x,0,1,64);
    for(let y=8;y<20;y+=3)g.fillRect(x+4,y,8,1);g.fillStyle='#c9ccd0';g.fillRect(x+11,30,2,6);g.fillStyle='#2a3036';}grime(g,64,64,160,.15);});
  TEX[T.REACTOR]=mkTex(g=>{g.fillStyle='#1e2a2c';g.fillRect(0,0,64,64);for(let y=4;y<64;y+=12){g.fillStyle='#0b1112';g.fillRect(4,y,56,8);g.fillStyle='#38f5d0';g.fillRect(6,y+3,52,2);}
    g.fillStyle='#2c3b3e';g.fillRect(0,0,4,64);g.fillRect(60,0,4,64);grime(g,64,64,90,.15);},g=>{g.fillStyle='#fff';for(let y=4;y<64;y+=12)g.fillRect(6,y+3,52,2);});
  TEX[T.CARGO]=mkTex(g=>cont(g,'#a4581f','#7a3f14'));
  TEX[T.CARGO2]=mkTex(g=>cont(g,'#2f5d7a','#1f4157'));
  TEX[T.HYDRO]=mkTex(g=>{g.fillStyle='#1d2724';g.fillRect(0,0,64,64);g.fillStyle='#0d1712';g.fillRect(4,6,56,44);
    for(let i=0;i<46;i++){g.fillStyle=`rgb(${40+R()*40|0},${110+R()*90|0},${40+R()*30|0})`;ell(g,6+R()*52,12+R()*38,2+R()*4,1+R()*3);}
    g.fillStyle='#ff6bd6';g.fillRect(4,6,56,2);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(4,8,56,42);g.fillStyle='#39433f';g.fillRect(0,50,64,14);g.fillRect(31,6,2,44);},
    g=>{g.fillStyle='#fff';g.fillRect(4,6,56,2);});
  TEX[T.PLANTER]=mkTex(g=>{g.fillStyle='#2a1f16';g.fillRect(0,0,64,64);for(let i=0;i<70;i++){g.fillStyle=`rgb(${50+R()*50|0},${110+R()*90|0},${40+R()*40|0})`;ell(g,R()*64,R()*40,2+R()*5,1+R()*4);}
    g.fillStyle='#5a646d';g.fillRect(0,40,64,24);g.fillStyle='#3a444b';g.fillRect(0,40,64,2);g.fillStyle='#c9a227';g.fillRect(4,50,10,3);grime(g,64,64,100,.15);});
  TEX[T.CONSOLE]=mkTex(g=>{g.fillStyle='#232a33';g.fillRect(0,0,64,64);g.fillStyle='#0a0f16';g.fillRect(6,8,24,18);g.fillRect(34,8,24,18);g.fillStyle='#3aa0ff';
    for(let y=11;y<24;y+=3){g.fillRect(8,y,6+R()*14|0,1);g.fillRect(36,y,6+R()*14|0,1);}g.fillStyle='#ffb627';g.fillRect(10,34,4,3);g.fillStyle='#ff3a3a';g.fillRect(18,34,4,3);
    g.fillStyle='#39424c';g.fillRect(0,44,64,20);},g=>{g.fillStyle='#fff';g.fillRect(8,10,20,14);g.fillRect(36,10,20,14);g.fillRect(10,34,4,3);g.fillRect(18,34,4,3);});
  TEX[T.CREW]=mkTex(g=>{g.fillStyle='#5a4a3c';g.fillRect(0,0,64,64);g.fillStyle='#6a5747';for(let y=0;y<44;y+=11)g.fillRect(0,y+1,64,9);
    g.fillStyle='#3a2f26';g.fillRect(0,44,64,20);g.fillStyle='#8a7a5a';g.fillRect(0,43,64,2);grime(g,64,64,180,.15);});
  TEX[T.BRIDGE]=mkTex(g=>{g.fillStyle='#262d38';g.fillRect(0,0,64,64);g.fillStyle='#1b212a';g.fillRect(0,0,64,6);g.fillRect(0,58,64,6);g.fillStyle='#3a6fd8';g.fillRect(0,28,64,2);
    g.fillStyle='rgba(0,0,0,.4)';g.fillRect(31,0,2,64);grime(g,64,64,140,.12);},g=>{g.fillStyle='#fff';g.fillRect(0,28,64,2);});
  TEX[T.SAVE]=mkTex(g=>{hull(g,'#2a3036');g.fillStyle='#07100b';g.fillRect(14,6,36,36);g.strokeStyle='#30ff70';g.lineWidth=3;g.beginPath();g.arc(32,24,12,0,Math.PI*2);g.stroke();
    g.fillStyle='#30ff70';g.fillRect(29,16,6,10);g.fillRect(25,25,14,3);g.font='bold 8px monospace';g.textAlign='center';g.fillText('SAVE',32,52);},
    g=>{g.fillStyle='#fff';g.fillRect(14,6,36,36);g.fillRect(16,45,32,9);});
  TEX[T.BRK]=mkTex(g=>brk(g,false),g=>{g.fillStyle='#fff';g.fillRect(26,9,12,6);});
  TEX[T.BRKON]=mkTex(g=>brk(g,true),g=>{g.fillStyle='#fff';g.fillRect(26,9,12,6);});
  const lamp=g=>{g.fillStyle='#fff';g.fillRect(27,31,10,8);};
  TEX[T.BLUE]=mkTex(g=>door(g,'#3c78ff'),lamp);
  TEX[T.YEL]=mkTex(g=>door(g,'#ffd200'),lamp);
  TEX[T.PWR]=mkTex(g=>door(g,'#ff8c00'),lamp);
  TEX[T.OVR]=mkTex(g=>door(g,'#b04dff'),lamp);
  TEX[T.OVRCON]=mkTex(g=>{hull(g,'#262d38');g.fillStyle='#0a0f16';g.fillRect(8,6,48,30);g.fillStyle='#ff3a3a';g.font='bold 8px monospace';g.textAlign='center';
    g.fillText('TRAM',32,18);g.fillText('OVERRIDE',32,30);g.fillStyle='#5a0a10';g.fillRect(24,42,16,10);g.fillStyle='#ff4a4a';g.fillRect(26,43,12,6);},
    g=>{g.fillStyle='#fff';g.fillRect(8,6,48,30);g.fillRect(26,43,12,6);});
  const lever=(g,glass)=>{hull(g,'#3a3f45');hazBand(g,2,6);g.fillStyle='#14171a';g.fillRect(14,12,36,40);
    g.fillStyle='#ffb627';g.font='bold 7px monospace';g.textAlign='center';g.fillText('DEPART',32,19);
    g.fillStyle='#2a2f34';g.fillRect(29,24,6,22);g.fillStyle='#0a0c0e';g.fillRect(31,26,2,18);
    g.fillStyle='#8a96a1';g.fillRect(30,28,4,12);g.fillStyle='#d0142f';g.fillRect(24,24,16,6);g.fillStyle='#ff5a5a';g.fillRect(24,24,16,2);
    if(glass){g.fillStyle='rgba(170,215,255,.30)';g.fillRect(16,22,32,28);g.fillStyle='rgba(235,245,255,.75)';g.fillRect(19,25,2,10);g.fillRect(22,25,1,5);
      g.strokeStyle='#c9d4dc';g.lineWidth=1;g.strokeRect(16.5,22.5,31,27);g.fillStyle='#ffb627';g.font='bold 5px monospace';g.fillText('BREAK GLASS',32,57);}
    else{g.fillStyle='rgba(200,230,255,.6)';poly(g,[[16,22],[23,22],[16,30]]);poly(g,[[48,22],[42,22],[48,27]]);poly(g,[[16,50],[16,44],[21,50]]);poly(g,[[48,50],[40,50],[48,43]]);
      g.strokeStyle='#c9d4dc';g.lineWidth=1;g.strokeRect(16.5,22.5,31,27);g.fillStyle='#30ff70';g.font='bold 5px monospace';g.fillText('READY',32,57);}};
  const leverEm=glass=>g=>{g.fillStyle='#fff';g.fillRect(17,13,30,7);g.fillRect(24,24,16,6);if(!glass)g.fillRect(22,53,20,5);};
  TEX[T.LEVER]=mkTex(g=>lever(g,true),leverEm(true));
  TEX[T.LEVERON]=mkTex(g=>lever(g,false),leverEm(false));
  FLO[3]=mkTex(g=>{g.fillStyle='#22261b';g.fillRect(0,0,64,64);for(let i=0;i<220;i++){g.fillStyle=`rgba(${60+R()*40|0},${70+R()*60|0},${30+R()*20|0},.8)`;g.fillRect(R()*64|0,R()*64|0,1+R()*2|0,1);}
    g.fillStyle='#3a3f35';g.fillRect(0,0,64,2);g.fillRect(0,32,64,2);});
  FLO[4]=mkTex(g=>{g.fillStyle='#4a2226';g.fillRect(0,0,64,64);for(let y=0;y<64;y+=4)for(let x=(y/4)%2*4;x<64;x+=8){g.fillStyle='#57292d';g.fillRect(x,y,4,4);}grime(g,64,64,260,.18);});
}
const CRACKS={};
function crackTex(tid){
  if(CRACKS[tid])return CRACKS[tid];
  const src=TEX[tid]||TEX[T.HULL],px=src.px.slice(),em=src.em.slice();
  const dk=(c,f)=>{const r=(c&255)*f,g=((c>>8)&255)*f,b=((c>>16)&255)*f;return (r|0)|((g|0)<<8)|((b|0)<<16);};
  let x=41;for(let y=5;y<44;y++){const i=(y<<6)|x;px[i]=dk(px[i],.25);em[i]=0;if(x<63){px[i+1]=dk(px[i+1],1.35>1?1:1);}
    if(y%4===0)x+=hash(y*3.1+tid)<.5?-1:1;x=clamp(x,32,60);}
  for(let k=0;k<6;k++){const i=((44+k)<<6)|(x+k%2);px[i]=dk(px[i],.35);}
  const id=TEX.length;TEX[id]={px,em};CRACKS[tid]=id;return id;
}

/* ================= SPRITE ART ================= */
const IMG={};
function imgFrom(c,allEm){
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data, n=c.width*c.height;
  const px=new Uint32Array(n), a=new Uint8Array(n), em=new Uint8Array(n);
  for(let i=0;i<n;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2];px[i]=r|(g<<8)|(b<<16);a[i]=d[i*4+3]>110?1:0;
    em[i]=allEm||(r>235&&g>170&&b<110)||(g>215&&b>215&&r<140)||(g>230&&r<120&&b<170)?1:0;}
  return {w:c.width,h:c.height,px,a,em};
}
function art(w,h,fn,allEm){const c=canvasOf(w,h),g=c.getContext('2d');fn(g);return imgFrom(c,allEm);}

const PAL=fl=>({skin:fl?'#fff':'#aaa68e',skinD:fl?'#ddd':'#6e6a57',suit:fl?'#fff':'#a4581f',suitD:fl?'#ccc':'#5d300f',bone:fl?'#fff':'#ebe3c4',gore:'#7d0b14',goreD:'#3d0408',eye:'#ffd23c'});
const BPAL=fl=>({skin:fl?'#fff':'#8a7a68',skinD:fl?'#ddd':'#4e4237',suit:fl?'#fff':'#40302a',suitD:fl?'#ccc':'#221814',bone:fl?'#fff':'#e6dcbb',gore:'#7d0b14',goreD:'#3d0408',eye:'#ffd23c'});

function drawHusk(o){
  const c=canvasOf(64,96), g=c.getContext('2d'), m=o.mask, C=o.kind==='spitter'?SPAL(o.flash):o.kind==='bloater'?BLPAL(o.flash):o.kind==='sleeper'?SLPAL(o.flash):o.kind==='super'?SUPAL(o.flash):o.brute?BPAL(o.flash):PAL(o.flash);
  const regs=[];
  const box=(p,pts,pad)=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of pts){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1]);}regs.push({p,x0:(x0-pad)/64,y0:(y0-pad)/96,x1:(x1+pad)/64,y1:(y1+pad)/96});};
  if(o.pose==='lie'){
    g.fillStyle='rgba(90,6,12,.9)';ell(g,32,92,30,4);
    seg(g,16,86,3,90,7,6,C.suit);seg(g,16,89,4,94,6,5,C.suitD);
    g.fillStyle=C.suit;g.fillRect(14,81,28,11);g.fillStyle=C.skin;g.fillRect(20,82,8,5);g.fillStyle=C.bone;g.fillRect(21,83,6,1);g.fillRect(21,85,6,1);
    seg(g,40,84,56,79,5,4,C.skinD);g.fillStyle=C.bone;poly(g,[[55,77],[57,81],[63,74]]);
    if(m&1){g.fillStyle=C.gore;ell(g,46,87,5,3);g.fillStyle=C.goreD;ell(g,46,87,3,2);g.fillStyle='rgba(90,6,12,.9)';ell(g,52,90,9,3);}
    else{g.fillStyle=C.skin;ell(g,47,86,6,5);g.fillStyle=C.gore;g.fillRect(45,87,6,2);}
    regs.push({p:'torso',x0:.02,y0:.76,x1:.98,y1:1});
    return {c,regs};
  }
  const crawl=(m&24)===24, oy=crawl?40:o.pose==='crouch'?20:0;
  const sw=Math.sin(o.f/8*Math.PI*2)*(crawl?.5:1), a=o.atk, Y=v=>v+oy;
  if(!crawl){
    for(const [hx,sd,bit] of [[27,-1,8],[37,1,16]]){
      const ph=sd*sw;
      if(m&bit){g.fillStyle=C.gore;circ(g,hx,Y(60),4);g.fillStyle=C.goreD;circ(g,hx,Y(61),2);g.fillStyle=C.gore;g.fillRect(hx-1,Y(63),2,4);continue;}
      const k=[hx+sd+ph*2,Y(76)], f=[hx+ph*5,Y(93)];
      seg(g,hx,Y(58),k[0],k[1],8,6,C.suit);seg(g,k[0],k[1],f[0],f[1],6,5,C.skinD);
      g.fillStyle='#1a1512';g.fillRect(f[0]-4,f[1]-2,8,3);
      box(sd<0?'legL':'legR',[[hx-2,Y(58)],k,f],3);
    }
  }
  g.fillStyle=C.suit;poly(g,[[20,Y(24)],[44,Y(24)],[39,Y(58)],[25,Y(58)]]);
  g.fillStyle=C.skin;poly(g,[[24,Y(30)],[31,Y(28)],[30,Y(45)],[25,Y(47)]]);
  g.fillStyle=C.bone;for(let y=31;y<45;y+=4)g.fillRect(25,Y(y),5,1);
  g.fillStyle=C.gore;g.fillRect(34,Y(40),3,11);g.fillRect(36,Y(35),2,6);
  g.fillStyle=C.suitD;g.fillRect(25,Y(54),14,3);
  g.fillStyle=o.flash?'#fff':'#c8c27a';g.fillRect(33,Y(28),9,2);
  if(o.brute){g.fillStyle=C.bone;poly(g,[[14,Y(20)],[24,Y(18)],[24,Y(28)],[12,Y(30)]]);poly(g,[[50,Y(20)],[40,Y(18)],[40,Y(28)],[52,Y(30)]]);g.fillStyle=C.eye;circ(g,28,Y(40),1.6);circ(g,37,Y(48),1.4);circ(g,30,Y(51),1.2);}
  if(o.kind==='bloater'){g.fillStyle=C.skin;ell(g,32,Y(43),15,14);g.fillStyle=C.skinD;ell(g,32,Y(49),13,7);g.fillStyle=o.flash?'#fff':'#ffe14a';for(const [qx,qy,qr] of [[26,39,3],[37,35,2.6],[35,46,3.3],[27,50,2.2],[40,43,1.9],[31,43,1.6]])circ(g,qx,Y(qy),qr);g.fillStyle=C.gore;g.fillRect(30,Y(53),3,4);}
  if(o.kind==='spitter'){g.fillStyle=o.flash?'#fff':'#7dff4a';ell(g,32,Y(24),5.5,3.8);g.fillStyle='#2d5a1a';g.fillRect(29,Y(23),6,1);}
  box('torso',o.kind==='bloater'?[[17,Y(28)],[47,Y(57)]]:[[20,Y(24)],[44,Y(58)]],0);
  for(const [sx,sd,bit] of [[21,-1,2],[43,1,4]]){
    const sy=Y(26);
    if(m&bit){g.fillStyle=C.gore;circ(g,sx,sy,4);g.fillStyle=C.goreD;circ(g,sx,sy,2);continue;}
    let e,w,t;
    if(crawl){e=[sx+sd*10,Y(36)];w=[sx+sd*14,Y(46)];t=[sx+sd*10,Y(56)];}
    else{const hang=[[sx+sd*6+sw*sd*2,Y(44)],[sx+sd*7,Y(58)],[sx+sd*9,Y(77)]],up=[[sx+sd*11,Y(10)],[sx+sd*5,Y(-1)],[sx-sd*9,Y(-6)]];
      e=lerp2(hang[0],up[0],a);w=lerp2(hang[1],up[1],a);t=lerp2(hang[2],up[2],a);}
    seg(g,sx,sy,e[0],e[1],7,5,C.skin);seg(g,e[0],e[1],w[0],w[1],5,4,C.skinD);
    g.fillStyle=C.bone;poly(g,[[w[0]-2.5,w[1]],[w[0]+2.5,w[1]],[t[0],t[1]]]);
    g.fillStyle=C.gore;g.fillRect(w[0]-1,w[1]-1,2,2);
    box(sd<0?'armL':'armR',[[sx,sy],e,w,t],4);
  }
  if(m&1){
    g.fillStyle=C.gore;circ(g,32,Y(22),4);g.fillStyle=C.goreD;circ(g,32,Y(21),2);
    g.strokeStyle=C.gore;g.lineWidth=1;g.beginPath();g.moveTo(31,Y(20));g.lineTo(28+sw*2,Y(12));g.moveTo(33,Y(20));g.lineTo(36-sw*2,Y(13));g.stroke();
  }else{
    const hx=32+(crawl?0:sw*1.2), hy=Y(13);
    seg(g,32,Y(25),hx,hy+4,5,5,C.skinD);
    g.fillStyle=C.skin;ell(g,hx,hy,6,8);
    g.fillStyle='#1b0d0d';g.fillRect(hx-4,hy-3,3,3);g.fillRect(hx+1,hy-3,3,3);
    g.fillStyle=C.eye;g.fillRect(hx-3,hy-2,1,1);g.fillRect(hx+2,hy-2,1,1);
    g.fillStyle=C.gore;g.fillRect(hx-1,hy+1,2,7);g.fillStyle=C.bone;g.fillRect(hx-2,hy+2,1,1);g.fillRect(hx+1,hy+3,1,1);g.fillRect(hx-2,hy+5,1,1);
    if(o.kind==='spitter'){g.fillStyle='#7dff4a';g.fillRect(hx-1,hy+2,3,4);}
    box('head',[[hx-6,hy-8],[hx+6,hy+7]],1);
  }
  return {c,regs};
}
function drawCrawler(o){
  const c=canvasOf(64,48), g=c.getContext('2d'), m=o.mask, C=(o.pal||PAL)(o.flash), regs=[];
  const sw=Math.sin(o.f/8*Math.PI*2);
  seg(g,24,30,10-sw*3,46,4,2,C.skinD);seg(g,40,30,54+sw*3,46,4,2,C.skinD);
  for(const [sx,sd,bit] of [[22,-1,2],[42,1,4]]){
    if(m&bit){g.fillStyle=C.gore;circ(g,sx,22,3.5);continue;}
    const e=[sx+sd*11,18-o.atk*12+sw*sd*2], t=[sx+sd*5,45-o.atk*34];
    seg(g,sx,22,e[0],e[1],5,4,C.skin);g.fillStyle=C.bone;poly(g,[[e[0]-2,e[1]],[e[0]+2,e[1]],[t[0],t[1]]]);
    regs.push({p:sd<0?'armL':'armR',x0:(Math.min(sx,e[0],t[0])-4)/64,y0:(Math.min(e[1],t[1],22)-4)/48,x1:(Math.max(sx,e[0],t[0])+4)/64,y1:(Math.max(e[1],t[1],22)+4)/48});
  }
  g.fillStyle=C.skin;ell(g,32,27,14,11);g.fillStyle=C.skinD;ell(g,32,31,12,6);
  g.strokeStyle=C.gore;g.lineWidth=1;g.beginPath();g.moveTo(22,22);g.lineTo(28,28);g.moveTo(42,21);g.lineTo(36,30);g.stroke();
  g.fillStyle='#160606';circ(g,32,30,5);g.fillStyle=C.bone;for(let i=0;i<8;i++){const an=i/8*Math.PI*2;g.fillRect(32+Math.cos(an)*4|0,30+Math.sin(an)*4|0,1,1);}
  g.fillStyle=C.eye;g.fillRect(27,20,2,2);g.fillRect(31,18,2,2);g.fillRect(35,20,2,2);
  regs.push({p:'torso',x0:17/64,y0:15/48,x1:47/64,y1:39/48});
  return {c,regs};
}
function buildArt(){
  const C=PAL(false);
  IMG.g_arm=art(20,20,g=>{seg(g,3,4,10,10,5,4,C.skin);g.fillStyle=C.bone;poly(g,[[9,8],[12,11],[18,19]]);g.fillStyle=C.gore;circ(g,3,4,2.5);});
  IMG.g_leg=art(20,20,g=>{seg(g,4,3,9,11,6,5,C.suit);seg(g,9,11,12,17,5,4,C.skinD);g.fillStyle='#1a1512';g.fillRect(9,16,7,3);g.fillStyle=C.gore;circ(g,4,3,3);});
  IMG.g_head=art(16,16,g=>{g.fillStyle=C.skin;ell(g,8,7,5,6);g.fillStyle='#1b0d0d';g.fillRect(5,5,2,2);g.fillRect(9,5,2,2);g.fillStyle=C.gore;g.fillRect(7,8,2,5);circ(g,8,13,2.5);});
  IMG.blood=art(3,3,g=>{g.fillStyle='#8a0c14';g.fillRect(0,0,3,3);});
  IMG.blood2=art(2,2,g=>{g.fillStyle='#5e0710';g.fillRect(0,0,2,2);});
  IMG.splat=art(14,3,g=>{g.fillStyle='#5a0810';ell(g,7,1.5,7,1.5);});
  IMG.chunk=art(6,6,g=>{g.fillStyle=C.skinD;circ(g,3,3,2.6);g.fillStyle=C.gore;g.fillRect(1,2,3,2);});
  IMG.spark=art(2,2,g=>{g.fillStyle='#ffe08a';g.fillRect(0,0,2,2);},true);
  IMG.fire=art(8,8,g=>{const gr=g.createRadialGradient(4,4,0,4,4,4);gr.addColorStop(0,'#fff6c0');gr.addColorStop(.5,'#ff9a1a');gr.addColorStop(1,'rgba(200,40,0,0)');g.fillStyle=gr;g.fillRect(0,0,8,8);},true);
  IMG.cutfx=art(4,2,g=>{g.fillStyle='#8ffbff';g.fillRect(0,0,4,2);},true);
  IMG.med=art(24,20,g=>{g.fillStyle='#d9dee2';g.fillRect(1,4,22,15);g.fillStyle='#9aa3a8';g.fillRect(1,15,22,4);g.fillStyle='#d21d2b';g.fillRect(10,6,4,10);g.fillRect(7,9,10,4);g.fillStyle='#55606a';g.fillRect(8,1,8,3);});
  IMG.medbig=art(28,22,g=>{g.fillStyle='#e8ecef';g.fillRect(1,4,26,17);g.fillStyle='#d21d2b';g.fillRect(11,6,6,13);g.fillRect(7,10,14,5);g.fillStyle='#3fe0c5';g.fillRect(2,5,3,3);});
  IMG.cells=art(24,20,g=>{for(let i=0;i<3;i++){g.fillStyle='#1a1f24';g.fillRect(2+i*7,2,6,17);g.fillStyle='#5ff6ff';g.fillRect(3+i*7,5,4,11);g.fillStyle='#e8ffff';g.fillRect(4+i*7,6,1,9);}});
  IMG.shells=art(22,18,g=>{g.fillStyle='#8f1717';g.fillRect(1,6,20,11);g.fillStyle='#b72424';g.fillRect(1,6,20,3);for(let i=0;i<4;i++){g.fillStyle='#c22a2a';g.fillRect(3+i*4,1,3,6);g.fillStyle='#d9a43a';g.fillRect(3+i*4,5,3,2);}g.fillStyle='#e8edf1';g.fillRect(5,11,12,2);});
  IMG.shotgun=art(40,14,g=>{g.fillStyle='#2b2f33';g.fillRect(2,3,26,3);g.fillRect(2,6,26,2);g.fillStyle='#5b636b';g.fillRect(2,3,26,1);g.fillStyle='#6b3a1e';poly(g,[[24,4],[38,6],[38,12],[30,12],[24,8]]);g.fillStyle='#d9a43a';g.fillRect(14,9,3,3);});
  IMG.key=art(16,14,g=>{g.fillStyle='#ffd23c';g.fillRect(0,0,16,14);g.fillStyle='#c41a24';g.fillRect(1,1,14,12);g.fillStyle='#e8edf1';g.fillRect(1,4,14,2);g.fillStyle='#ffd23c';g.fillRect(3,8,4,3);});
  IMG.armor=art(24,24,g=>{g.fillStyle='#3d4a52';poly(g,[[3,2],[9,2],[12,5],[15,2],[21,2],[22,20],[12,23],[2,20]]);g.fillStyle='#3fe0c5';g.fillRect(6,8,12,2);g.fillStyle='#a4581f';g.fillRect(5,14,14,2);});
  IMG.log=art(16,20,g=>{g.fillStyle='#1b1f23';g.fillRect(1,1,14,18);g.fillStyle='#2cf07a';g.fillRect(3,3,10,10);g.fillStyle='#0a3c1e';g.fillRect(4,5,8,1);g.fillRect(4,8,6,1);g.fillStyle='#ffb627';g.fillRect(7,15,2,2);});
  IMG.barrel=art(22,30,g=>{g.fillStyle='#b8901f';g.fillRect(2,3,18,26);g.fillStyle='#d9ae35';g.fillRect(5,3,4,26);g.fillStyle='#1a1a1a';g.fillRect(2,11,18,6);g.fillStyle='#c41a24';for(let x=2;x<20;x+=6)g.fillRect(x,11,3,6);g.fillStyle='#55606a';g.fillRect(1,1,20,3);g.fillRect(1,27,20,2);});
  IMG.crate=art(32,30,g=>{g.fillStyle='#4b4f42';g.fillRect(1,1,30,29);g.fillStyle='#363a30';g.fillRect(1,1,30,3);g.fillRect(1,27,30,3);g.fillRect(1,1,3,29);g.fillRect(28,1,3,29);g.strokeStyle='#363a30';g.lineWidth=2;g.beginPath();g.moveTo(3,3);g.lineTo(29,28);g.stroke();g.fillStyle='#c9a227';g.font='bold 7px monospace';g.fillText('GCX',10,18);});
  IMG.pile=art(40,16,g=>{g.fillStyle='#5a0810';ell(g,20,13,19,3);g.fillStyle=C.skinD;ell(g,14,10,7,4);g.fillStyle=C.suit;ell(g,24,10,7,4);g.fillStyle=C.bone;g.fillRect(8,9,8,1);g.fillRect(28,8,7,1);g.fillStyle=C.gore;ell(g,19,9,4,3);});
  IMG.table=art(48,22,g=>{g.fillStyle='#4a535c';g.fillRect(0,4,48,5);g.fillStyle='#6d7882';g.fillRect(0,4,48,1);g.fillStyle='#2b3035';g.fillRect(4,9,4,13);g.fillRect(40,9,4,13);g.fillStyle='#8a0c14';g.fillRect(14,2,6,2);g.fillStyle='#c8ccd0';g.fillRect(30,1,4,3);});
  IMG.arcade=art(26,48,g=>{g.fillStyle='#2a1840';g.fillRect(2,2,22,46);g.fillStyle='#e0337a';g.fillRect(2,2,22,7);g.fillStyle='#ffe0f0';g.font='bold 5px monospace';g.fillText('STAR',5,6);g.fillText('REPO',5,9);g.fillStyle='#071a10';g.fillRect(4,11,18,14);g.fillStyle='#39ff88';g.fillRect(12,20,3,2);g.fillRect(8,13,2,1);g.fillRect(16,14,2,1);g.fillRect(11,15,2,1);g.fillStyle='#1b0f2a';poly(g,[[2,26],[24,26],[24,32],[2,32]]);g.fillStyle='#d21d2b';circ(g,8,29,1.5);g.fillStyle='#ffb627';circ(g,15,29,1.2);circ(g,19,29,1.2);});
  IMG.sign=art(30,18,g=>{g.fillStyle='rgba(44,255,106,1)';g.font='bold 9px monospace';g.fillText('TRAM',3,9);poly(g,[[8,11],[20,11],[20,9],[25,13],[20,17],[20,15],[8,15]]);},true);
  IMG.corpse=drawHusk({mask:0,f:0,atk:0,pose:'lie',flash:0}).c; IMG.corpse=imgFrom(IMG.corpse);
}
const ECACHE=new Map();
function enemyImg(e){
  let pose='stand',atk=0,f=Math.floor(e.phase*8)&7;
  if(e.state==='dormant')pose='lie';
  else if(e.state==='rise')pose=e.t<.35?'lie':e.t<.75?'crouch':'stand';
  else if(e.state==='spit'){atk=Math.min(1,e.t/.5);}
  else if(e.state==='attack'){const k=e.t/e.wind;atk=k<1?k:Math.max(0,.6-(e.t-e.wind)*4);}
  if(e.state==='stagger')f=2;
  const aq=Math.round(clamp(atk,0,1)*3), fl=e.flash>0?1:0;
  const key=e.type+'|'+e.mask+'|'+pose+'|'+f+'|'+aq+'|'+fl;
  let v=ECACHE.get(key);
  if(!v){
    const o={mask:e.mask,f,atk:aq/3,pose,flash:fl,brute:e.type==='brute',kind:e.type};
    const r=e.type==='crawler'?drawCrawler(o):drawHusk(o); let c=r.c;
    if(e.type==='brute'){const c2=canvasOf(80,96),g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;g2.drawImage(c,0,0,80,96);c=c2;}
    v=imgFrom(c); v.regs=r.regs;
    if(ECACHE.size>900)ECACHE.clear();
    ECACHE.set(key,v);
  }
  return v;
}

const SPAL=fl=>({skin:fl?'#fff':'#8a9a72',skinD:fl?'#ddd':'#56633f',suit:fl?'#fff':'#3d4b44',suitD:fl?'#ccc':'#1f2a24',bone:fl?'#fff':'#e3e8c4',gore:'#3d6a12',goreD:'#1e3a08',eye:'#b8ff4a'});
const BLPAL=fl=>({skin:fl?'#fff':'#c9bf86',skinD:fl?'#ddd':'#8c8150',suit:fl?'#fff':'#7a6a50',suitD:fl?'#ccc':'#4a3f2a',bone:fl?'#fff':'#efe6c4',gore:'#7d0b14',goreD:'#3d0408',eye:'#ffd23c'});
function buildArt2(){
  IMG.guide=art(6,6,g=>{const gr=g.createRadialGradient(3,3,0,3,3,3);gr.addColorStop(0,'#e0f8ff');gr.addColorStop(.55,'#8cf0ff');gr.addColorStop(1,'rgba(140,240,255,0)');g.fillStyle=gr;g.fillRect(0,0,6,6);});
  IMG.glob=art(8,8,g=>{const gr=g.createRadialGradient(4,4,0,4,4,4);gr.addColorStop(0,'#eaffd0');gr.addColorStop(.55,'#7dff4a');gr.addColorStop(1,'rgba(40,120,20,0)');g.fillStyle=gr;g.fillRect(0,0,8,8);},true);
  IMG.glob2=art(2,2,g=>{g.fillStyle='#7dff4a';g.fillRect(0,0,2,2);},true);
  IMG.bombp=art(8,10,g=>{g.fillStyle='#3d454e';g.fillRect(1,2,6,8);g.fillStyle='#c9a227';g.fillRect(1,5,6,2);g.fillStyle='#ff3030';g.fillRect(3,0,2,2);});
  IMG.rivets=art(22,16,g=>{g.fillStyle='#4a535c';g.fillRect(1,4,20,11);g.fillStyle='#6d7882';g.fillRect(1,4,20,2);g.fillStyle='#d9761e';g.fillRect(3,8,16,3);g.fillStyle='#c8ccd0';for(let i=0;i<5;i++)g.fillRect(3+i*4,1,2,4);});
  IMG.bombs=art(22,18,g=>{for(const x of [2,12]){g.fillStyle='#3d454e';g.fillRect(x,4,8,13);g.fillStyle='#c9a227';g.fillRect(x,9,8,3);g.fillStyle='#ff3030';g.fillRect(x+3,1,2,3);}});
  IMG.rivetgun=art(40,18,g=>{g.fillStyle='#2b3035';g.fillRect(2,4,28,8);g.fillStyle='#d9761e';g.fillRect(6,6,20,2);g.fillStyle='#1a1f24';circ(g,30,11,6);g.fillStyle='#3a434c';circ(g,30,11,3);g.fillStyle='#16191c';g.fillRect(0,6,4,4);g.fillStyle='#4a535c';g.fillRect(12,12,6,6);});
  IMG.satchel=art(28,20,g=>{g.fillStyle='#4a4636';g.fillRect(1,6,26,13);g.fillStyle='#5f5a46';g.fillRect(1,6,26,3);g.fillStyle='#c9a227';g.fillRect(10,11,8,4);g.fillStyle='#ff3030';g.fillRect(21,9,3,3);g.strokeStyle='#2a281f';g.lineWidth=2;g.beginPath();g.arc(14,6,6,Math.PI,0);g.stroke();});
  const card=c=>art(16,14,g=>{g.fillStyle='#ffd23c';g.fillRect(0,0,16,14);g.fillStyle=c;g.fillRect(1,1,14,12);g.fillStyle='#e8edf1';g.fillRect(1,4,14,2);g.fillStyle='#ffd23c';g.fillRect(3,8,4,3);});
  IMG.keyB=card('#2456d8');IMG.keyY=card('#d8a400');IMG.keyR=card('#c41a24');
  IMG.asset=art(20,24,g=>{g.strokeStyle='#ffc23a';g.lineWidth=1.6;g.beginPath();g.moveTo(10,1);g.lineTo(18,6);g.lineTo(18,18);g.lineTo(10,23);g.lineTo(2,18);g.lineTo(2,6);g.closePath();g.stroke();
    g.fillStyle='#ffc23a';g.font='bold 12px monospace';g.textAlign='center';g.fillText('$',10,16);},true);
  IMG.bunk=art(48,40,g=>{g.fillStyle='#3a444b';g.fillRect(2,0,3,40);g.fillRect(43,0,3,40);g.fillStyle='#5a646d';g.fillRect(2,9,44,4);g.fillRect(2,29,44,4);
    g.fillStyle='#6b5a4a';g.fillRect(5,4,38,5);g.fillRect(5,24,38,5);g.fillStyle='#8a8f7a';g.fillRect(6,22,10,3);g.fillStyle='#7d0b14';g.fillRect(20,26,10,2);});
}

/* ================= MAP & LIGHTS ================= */
let MW=32,MH=24,MAPN=MW*MH,map,floorT,ceilT,zoneAt,seenMap,doorAt=[],doors=[],LMW,LMH,LMr,LMg,LMb,flow,LIGHTS=[];
const I=(x,y)=>y*MW+x;
function setDims(w,h){
  MW=w;MH=h;MAPN=w*h;map=new Uint8Array(MAPN);floorT=new Uint8Array(MAPN);ceilT=new Uint8Array(MAPN);
  zoneAt=new Int16Array(MAPN).fill(-1);seenMap=new Uint8Array(MAPN);doorAt=new Array(MAPN).fill(null);doors=[];
  LMW=w*2;LMH=h*2;LMr=new Float32Array(LMW*LMH);LMg=new Float32Array(LMW*LMH);LMb=new Float32Array(LMW*LMH);flow=new Int16Array(MAPN);
}
setDims(32,24);
function addDoor(x,y,lock,tex){
  const i=I(x,y),h=map[I(x-1,y)]!==0&&map[I(x+1,y)]!==0;
  const d={x,y,i,h,open:0,lock,hold:0,msgT:0};
  map[i]=tex||(lock==='key'||lock==='R'?T.LOCK:lock==='B'?T.BLUE:lock==='Y'?T.YEL:lock==='power'?T.PWR:lock==='override'?T.OVR:lock==='secret'?T.SECRET:T.DOOR);
  doorAt[i]=d;doors.push(d);return d;
}
// The trailer still uses the original small map.
function buildTrailerMap(){
  setDims(32,24);map.fill(255);
  const rooms=[];
  const room=(x1,y1,x2,y2,wt,ft)=>{rooms.push({x1,y1,x2,y2,wt});for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){map[I(x,y)]=0;floorT[I(x,y)]=ft;}};
  room(1,16,8,22,T.HAZ,0);room(10,19,20,20,T.PIPE,2);room(11,8,19,14,T.HULL,0);room(15,16,15,18,T.PIPE,2);room(2,8,9,13,T.MED,1);
  room(4,4,7,6,T.HULL2,2);room(22,16,29,22,T.HULL,0);room(25,8,25,14,T.PIPE,2);room(21,10,24,10,T.VENT,2);room(21,2,29,6,T.TRAM,0);
  for(const r of rooms)for(let y=r.y1-1;y<=r.y2+1;y++)for(let x=r.x1-1;x<=r.x2+1;x++){if(x<0||y<0||x>=MW||y>=MH)continue;const i=I(x,y);if(map[i]===255)map[i]=r.wt;}
  for(let i=0;i<MAPN;i++)if(map[i]===255)map[i]=T.HULL;
  const set=(x,y,t)=>map[I(x,y)]=t;
  for(let y=17;y<=21;y++)set(0,y,T.WIN);
  set(0,19,T.WINMOON);
  for(let x=22;x<=28;x++)set(x,1,T.WIN);
  set(6,15,T.TERM);set(3,15,T.TERM);set(9,22,T.BLOOD);
  set(21,20,T.SCRAWL);set(12,18,T.BLOOD);set(18,21,T.BLOOD);set(19,18,T.BLOOD);
  set(11,7,T.BLOOD);set(20,13,T.BLOOD);set(16,7,T.SCRAWL);set(17,15,T.BLOOD);
  set(23,15,T.TERM);set(27,15,T.TERM);set(30,19,T.TERM);set(30,21,T.TERM);
  set(24,23,T.VENT);set(28,23,T.VENT);set(30,17,T.VENT);set(1,7,T.BLOOD);
  addDoor(9,19,'none');addDoor(15,15,'none');addDoor(10,11,'none');addDoor(21,19,'none');
  addDoor(25,15,'none');addDoor(20,10,'none');addDoor(5,7,'secret');addDoor(25,7,'key');
}
const LDEF=[
  [4.5,18,[.75,.85,1],5.5,'flicker'],[6.5,21,[1,.4,.3],3.5,'steady'],[6,16,[.25,1,.5],2.4,'steady',1],
  [13,19.5,[.7,.8,1],4.5,'dying'],[18.5,19.5,[.7,.8,1],4.5,'flicker'],
  [13,10.5,[.9,.88,.75],5.5,'steady'],[17.5,12,[.9,.88,.75],5.5,'dying'],
  [5,10.5,[.8,.95,1],6,'steady'],[8.5,12.5,[.8,.95,1],3,'flicker'],
  [5.5,5,[1,.72,.38],4,'steady',1],
  [24,18,[.6,.7,1],5,'steady'],[28,20.5,[.6,.7,1],5,'flicker'],[23.5,15.8,[.25,1,.5],2.5,'steady',1],
  [22.5,10.5,[1,.5,.15],3,'dying'],[25.5,12,[.7,.8,1],4,'flicker'],
  [23,4,[1,.85,.5],5,'steady'],[28,4,[1,.85,.5],5,'steady'],
  [4.5,19,[1,.08,.06],6,'alarm'],[16,19.5,[1,.08,.06],6,'alarm'],[15,11,[1,.08,.06],7,'alarm'],[5.5,10.5,[1,.08,.06],5,'alarm'],
  [26,19,[1,.08,.06],8,'alarm'],[25.5,9.5,[1,.08,.06],5,'alarm'],[25.5,4,[1,.08,.06],7,'alarm'],[22.5,10.5,[1,.08,.06],4,'alarm']
];
// ---- Deck 01 ----
function solidCell(x,y){if(x<0||y<0||x>=MW||y>=MH)return true;const t=map[I(x,y)];return t!==0&&!doorAt[I(x,y)];}
function initLights(defs){
  LIGHTS=defs.map(([x,y,c,rad,type,keep,grp],n)=>{
    const L={x,y,c,rad,type,keep:!!keep,grp:grp||'',ph:n*3.7,idx:[],w:[]};
    if(type!=='alarm'&&type!=='emerg'&&!keep)ceilT[I(x|0,y|0)]=1;
    for(let j=Math.max(0,((y-rad)*2)|0);j<Math.min(LMH,((y+rad)*2)|0+1);j++)for(let i=Math.max(0,((x-rad)*2)|0);i<Math.min(LMW,((x+rad)*2)|0+1);i++){
      const cx=(i+.5)/2,cy=(j+.5)/2,d=Math.hypot(cx-x,cy-y);if(d>rad)continue;
      let blocked=false;const st=Math.ceil(d*6);
      for(let s=1;s<st;s++){const tx=x+(cx-x)*s/st,ty=y+(cy-y)*s/st;if(solidCell(tx|0,ty|0)){if(!((tx|0)===(cx|0)&&(ty|0)===(cy|0))){blocked=true;break;}}}
      if(blocked)continue;
      const w=1-d/rad;L.idx.push(j*LMW+i);L.w.push(w*w*1.5);
    }
    return L;
  });
}
const G={state:'boot',clock:0,flash:0,flashC:[1,.8,.5],shake:0,lightsOut:false,alarm:false,power:true,sound:true,voice:true,idle:0,diff:2,said:{},events:[],playTime:0};
function updateLights(t){
  LMr.fill(.028);LMg.fill(.032);LMb.fill(.044);
  for(const L of LIGHTS){
    let k=1;
    if(L.type==='flicker'){const n=hash(Math.floor(t*14+L.ph));k=n>.93?.15:n>.88?.6:1;}
    else if(L.type==='dying'){const n=hash(Math.floor(t*9+L.ph));k=n>.55?(.7+hash(n*9)*.4):.04;}
    else if(L.type==='alarm'){k=G.alarm?.3+.7*Math.max(0,Math.sin(t*4.2+L.ph*.3)):0;}
    else if(L.type==='emerg'){k=G.power?0:.5+.2*Math.sin(t*1.3+L.ph);}
    if(OPT.flash&&(L.type==='flicker'||L.type==='dying'))k=.7+.3*k;   // reduce flashing: lamps waver instead of strobing
    if(L.grp==='power'&&!G.power)k*=.05;
    if(G.lightsOut&&L.type!=='alarm'&&!L.keep)k*=.08;
    if(k<=.001)continue;
    const r=L.c[0]*k,g=L.c[1]*k,b=L.c[2]*k,ix=L.idx,w=L.w;
    for(let n=0;n<ix.length;n++){const i=ix[n],ww=w[n];LMr[i]+=r*ww;LMg[i]+=g*ww;LMb[i]+=b*ww;}
  }
}

/* ================= AUDIO ================= */
const A={c:null,justUnlocked:false};
function unlockSpeech(){
  if(A.speechOK||!('speechSynthesis' in window))return;
  try{const u=new SpeechSynthesisUtterance('.');u.volume=0;u.rate=2;speechSynthesis.speak(u);A.speechOK=true;}catch(e){}
}
function auInit(){
  unlockSpeech();
  if(A.c){if(A.c.state!=='running')A.c.resume().catch(()=>{});return;}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  try{A.c=new C();}catch(e){return;}
  const c=A.c;
  A.master=c.createGain();A.master.gain.value=G.sound?.9:0;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-12;comp.knee.value=10;comp.ratio.value=5;comp.attack.value=.003;comp.release.value=.2;
  A.lp=c.createBiquadFilter();A.lp.type='lowpass';A.lp.frequency.value=20000;A.master.connect(A.lp);A.lp.connect(comp);comp.connect(c.destination);
  A.sfx=c.createGain();A.sfx.connect(A.master);
  A.mus=c.createGain();A.mus.gain.value=0;A.mus.connect(A.master);
  A.amb=c.createGain();A.amb.gain.value=0;A.amb.connect(A.master);
  const len=c.sampleRate*2,b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;A.nb=b;
  const n=1024,curve=new Float32Array(n);for(let i=0;i<n;i++){const x=i*2/n-1;curve[i]=(1+60)*x/(1+60*Math.abs(x));}A.curve=curve;
  if(c.state!=='running')c.resume().catch(()=>{});
  A.justUnlocked=true;
  A.vo=c.createGain();A.vo.gain.value=1.15;A.vo.connect(A.master);voDecode();
  A.logG=c.createGain();A.logG.gain.value=1.05;A.logG.connect(A.master);
  startAmbient();setInterval(musTick,40);HBP.audio.attach(c);if(PACKS.core)preloadVoices();
  $('#tchip').hidden=true;
}
const AOK=()=>A.c&&A.c.state==='running';
function dest(pan,vol){const c=A.c,g=c.createGain();g.gain.value=vol==null?1:vol;if(pan&&c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(A.sfx);}else g.connect(A.sfx);return g;}
function osc(type,f,t,dur,out){const o=A.c.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(out);o.start(t);o.stop(t+dur+.05);return o;}
function nz(t,dur,out){const s=A.c.createBufferSource();s.buffer=A.nb;s.loop=true;s.connect(out);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);return s;}
function vca(t,a,peak,d,out){const g=A.c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(out);return g;}
function filt(type,f,q,out){const b=A.c.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||1;b.connect(out);return b;}
const S={
  cutter(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.5);const v=vca(t,.004,.6,.22,o),f=filt('bandpass',2400,1.5,v);
    const a=osc('sawtooth',1600,t,.25,f);a.frequency.exponentialRampToValueAtTime(220,t+.22);const b=osc('square',2400,t,.18,f);b.frequency.exponentialRampToValueAtTime(400,t+.16);
    nz(t,.15,filt('highpass',3000,.7,vca(t,.002,.35,.12,o)));osc('sine',90,t,.32,vca(t,.01,.4,.3,o));},
  shotgun(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,1);const lp=filt('lowpass',3200,.7,vca(t,.002,1.2,.45,o));lp.frequency.exponentialRampToValueAtTime(300,t+.4);nz(t,.5,lp);
    const s=osc('sine',140,t,.3,vca(t,.002,1.1,.25,o));s.frequency.exponentialRampToValueAtTime(38,t+.25);
    const t2=t+.5;nz(t2,.07,filt('bandpass',2500,3,vca(t2,.001,.35,.05,o)));nz(t2+.13,.08,filt('bandpass',1700,3,vca(t2+.13,.001,.4,.06,o)));},
  kick(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.9);const s=osc('sine',120,t,.18,vca(t,.003,1,.15,o));s.frequency.exponentialRampToValueAtTime(40,t+.15);nz(t,.08,filt('lowpass',900,1,vca(t,.002,.7,.07,o)));},
  whoosh(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.3);const f=filt('bandpass',500,1.5,vca(t,.05,.5,.15,o));f.frequency.exponentialRampToValueAtTime(1600,t+.18);nz(t,.22,f);},
  hit(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.7);nz(t,.12,filt('bandpass',700,4,vca(t,.003,.9,.1,o)));const s=osc('sine',260,t,.12,vca(t,.003,.5,.1,o));s.frequency.exponentialRampToValueAtTime(90,t+.1);},
  sever(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v);const f=filt('bandpass',2400,2,vca(t,.003,1,.28,o));f.frequency.exponentialRampToValueAtTime(250,t+.28);nz(t,.32,f);
    osc('square',70,t,.06,vca(t,.001,.4,.05,o));nz(t+.06,.2,filt('lowpass',600,1,vca(t+.06,.01,.6,.18,o)));},
  death(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.8);const s=osc('sawtooth',130,t,.6,filt('lowpass',500,2,vca(t,.02,.7,.55,o)));s.frequency.exponentialRampToValueAtTime(38,t+.55);nz(t,.4,filt('lowpass',400,1,vca(t,.01,.6,.35,o)));},
  shriek(p,v,pitch){if(!AOK())return;pitch=pitch||1;const t=A.c.currentTime,o=dest(p,v*.5);const bp=filt('bandpass',1500*pitch,2.5,vca(t,.04,.7,.9,o));
    for(const det of [0,7,-11]){const s=osc('sawtooth',500*pitch,t,1,bp);s.detune.value=det*10;s.frequency.linearRampToValueAtTime(950*pitch,t+.18);s.frequency.exponentialRampToValueAtTime(280*pitch,t+.95);
      const l=A.c.createOscillator(),lg=A.c.createGain();l.frequency.value=28+det;lg.gain.value=60*pitch;l.connect(lg);lg.connect(s.frequency);l.start(t);l.stop(t+1);}
    nz(t,.8,filt('bandpass',3500,4,vca(t,.02,.35,.7,o)));},
  groan(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.6);const g=vca(t,.15,.6,1.1,o),f=filt('lowpass',380,3,g);const s=osc('sawtooth',85,t,1.3,f);s.frequency.exponentialRampToValueAtTime(56,t+1.2);
    const l=A.c.createOscillator(),lg=A.c.createGain();l.frequency.value=7;lg.gain.value=200;l.connect(lg);lg.connect(f.frequency);l.start(t);l.stop(t+1.3);},
  roar(p,v){if(!AOK())return;S.groan(p,v*1.4);S.shriek(p,v*1.2,.5);const t=A.c.currentTime,o=dest(p,v);const s=osc('sawtooth',55,t,1.4,filt('lowpass',300,4,vca(t,.1,.9,1.2,o)));s.frequency.exponentialRampToValueAtTime(35,t+1.3);},
  explode(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*1.2);const f=filt('lowpass',1500,1,vca(t,.003,1.5,1.3,o));f.frequency.exponentialRampToValueAtTime(60,t+1.3);nz(t,1.4,f);
    const s=osc('sine',75,t,1,vca(t,.003,1.2,.9,o));s.frequency.exponentialRampToValueAtTime(22,t+.9);nz(t,.3,filt('highpass',2500,1,vca(t,.002,.5,.25,o)));},
  pickup(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.3);[660,990,1320].forEach((f,i)=>osc('triangle',f,t+i*.06,.09,vca(t+i*.06,.003,.6,.08,o)));},
  key(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.35);osc('sine',880,t,.2,vca(t,.003,.6,.18,o));osc('sine',1320,t+.15,.5,vca(t+.15,.003,.6,.45,o));osc('triangle',1760,t+.15,.4,vca(t+.15,.003,.2,.4,o));},
  door(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.35);const f=filt('bandpass',500,2,vca(t,.04,.8,.42,o));f.frequency.linearRampToValueAtTime(1400,t+.2);f.frequency.linearRampToValueAtTime(450,t+.45);nz(t,.5,f);osc('sine',80,t+.42,.12,vca(t+.42,.003,.9,.1,o));},
  denied(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.25);osc('square',160,t,.1,vca(t,.003,.5,.08,o));osc('square',160,t+.16,.1,vca(t+.16,.003,.5,.08,o));},
  clang(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.5);[[480,.9],[1190,.6],[1960,.45],[2870,.3]].forEach(([f,d])=>osc('sine',f,t,d,vca(t,.002,.5,d,o)));nz(t,.06,filt('highpass',1500,1,vca(t,.001,.7,.05,o)));},
  step(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.1);nz(t,.05,filt('bandpass',1800,3,vca(t,.002,1,.04,o)));osc('sine',140,t,.05,vca(t,.002,.8,.04,o));},
  hurt(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.6);const s=osc('sawtooth',170,t,.25,filt('lowpass',900,1,vca(t,.01,.7,.22,o)));s.frequency.exponentialRampToValueAtTime(105,t+.22);nz(t,.1,filt('lowpass',1200,1,vca(t,.002,.6,.08,o)));},
  heart(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.55);[0,.24].forEach(d=>{const s=osc('sine',62,t+d,.15,vca(t+d,.005,1,.14,o));s.frequency.exponentialRampToValueAtTime(40,t+d+.14);});},
  stinger(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.55);const f=filt('lowpass',3000,1,vca(t,.02,.8,1.6,o));[233,247,330,466,622].forEach(fr=>osc('sawtooth',fr,t,1.7,f));
    const sc=osc('sawtooth',1900,t,1.2,filt('bandpass',2400,3,vca(t,.01,.5,1.1,o)));const l=A.c.createOscillator(),lg=A.c.createGain();l.frequency.value=9;lg.gain.value=90;l.connect(lg);lg.connect(sc.frequency);l.start(t);l.stop(t+1.2);
    nz(t,.5,filt('highpass',1800,1,vca(t,.01,.6,.45,o)));},
  braam(dur){if(!AOK())return;dur=dur||3;const t=A.c.currentTime,o=dest(0,.85);const g=vca(t,.08,.9,dur,o),f=filt('lowpass',150,6,g);f.frequency.exponentialRampToValueAtTime(1700,t+.5);f.frequency.exponentialRampToValueAtTime(160,t+dur);
    [43.65,43.95,65.4,87.3].forEach(fr=>osc('sawtooth',fr,t,dur+.1,f));osc('sine',32,t,dur,vca(t,.05,.9,dur,o));},
  riser(dur){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.4);const g=A.c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.8,t+dur);g.gain.linearRampToValueAtTime(0,t+dur+.05);g.connect(o);
    const f=filt('highpass',300,2,g);f.frequency.exponentialRampToValueAtTime(8000,t+dur);nz(t,dur,f);const s=osc('sawtooth',90,t,dur,filt('lowpass',2000,1,g));s.frequency.exponentialRampToValueAtTime(700,t+dur);},
  drum(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,1);const s=osc('sine',160,t,.6,vca(t,.003,1.3,.55,o));s.frequency.exponentialRampToValueAtTime(40,t+.5);nz(t,.2,filt('lowpass',1500,1,vca(t,.002,.8,.18,o)));nz(t,1.2,filt('bandpass',300,.6,vca(t,.01,.25,1.1,o)));},
  staticN(dur){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.22);const g=A.c.createGain();g.connect(o);for(let k=0;k<dur/.04;k++)g.gain.setValueAtTime(Math.random()<.3?.05:.2+Math.random()*.6,t+k*.04);g.gain.setValueAtTime(0,t+dur);nz(t,dur,filt('bandpass',1800,.8,g));},
  beep(f){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.15);osc('sine',f||1000,t,.09,vca(t,.003,.7,.08,o));},
  tick(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.12);nz(t,.02,filt('highpass',4000,1,vca(t,.001,.8,.015,o)));},
  whisper(p){if(!AOK())return;const t=A.c.currentTime,o=dest(p,.22);const g=A.c.createGain();g.connect(o);g.gain.setValueAtTime(0,t);for(let k=0;k<20;k++)g.gain.setValueAtTime(Math.random()*Math.sin(k/20*Math.PI),t+k*.09);g.gain.setValueAtTime(0,t+1.9);nz(t,1.9,filt('bandpass',2800,6,g));},
  klaxon(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.18);for(let k=0;k<3;k++){const s=osc('square',460,t+k*.7,.6,filt('lowpass',1400,1,vca(t+k*.7,.02,.7,.55,o)));s.frequency.linearRampToValueAtTime(330,t+k*.7+.6);}},
  swap(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.3);nz(t,.04,filt('bandpass',2000,4,vca(t,.001,.8,.03,o)));nz(t+.1,.05,filt('bandpass',1300,4,vca(t+.1,.001,.8,.04,o)));},
  glass(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.7);nz(t,.18,filt('highpass',3200,1,vca(t,.001,1,.16,o)));nz(t,.5,filt('bandpass',5200,3,vca(t,.002,.5,.45,o)));[[2630,.35],[3870,.28],[4410,.22],[5960,.3],[7120,.18]].forEach(([f,d],k)=>osc('sine',f,t+k*.05,d,vca(t+k*.05,.001,.3,d,o)));const s=osc('sine',180,t,.12,vca(t,.002,.6,.1,o));s.frequency.exponentialRampToValueAtTime(60,t+.1);},
  dry(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.3);nz(t,.03,filt('bandpass',3000,6,vca(t,.001,.8,.025,o)));}
};
function startAmbient(){
  const c=A.c,lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=150;lp.connect(A.amb);
  for(const f of [36,36.35,54.3]){const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=c.createGain();g.gain.value=.2;o.connect(g);g.connect(lp);o.start();}
  const l=c.createOscillator(),lg=c.createGain();l.frequency.value=.07;lg.gain.value=60;l.connect(lg);lg.connect(lp.frequency);l.start();
  const n=c.createBufferSource();n.buffer=A.nb;n.loop=true;const nf=c.createBiquadFilter();nf.type='lowpass';nf.frequency.value=240;const ng=c.createGain();ng.gain.value=.22;n.connect(nf);nf.connect(ng);ng.connect(A.amb);n.start();
}
function ambLevel(v){if(A.c)A.amb.gain.setTargetAtTime(v,A.c.currentTime,.5);}
const MUS={level:0,target:0,step:0,next:0,bpm:138};
const RIFF=[0,0,0,3,0,0,5,3,0,0,0,3,6,5,3,-2];
function musTick(){
  if(!A.c)return;const now=A.c.currentTime;
  MUS.level+=(MUS.target-MUS.level)*.08;const logOn=logPlay&&!logPlay.paused;A.mus.gain.setTargetAtTime(MUS.level*.42*(now<(MUS.duckUntil||0)?.4:logOn?.5:1),now,.08);
  if(MUS.level<.02){MUS.next=now+.05;return;}
  const spb=60/MUS.bpm/2;
  if(MUS.next<now)MUS.next=now+.02;
  while(MUS.next<now+.16){playNote(MUS.step,MUS.next);MUS.next+=spb;MUS.step=(MUS.step+1)%32;}
}
function playNote(st,t){
  const c=A.c,n=RIFF[st%16]+(st>=16&&st%16>=12?2:0),f=41.2*Math.pow(2,n/12);
  const v=c.createGain();v.gain.setValueAtTime(.0001,t);v.gain.exponentialRampToValueAtTime(.6,t+.005);v.gain.exponentialRampToValueAtTime(.0001,t+.15);v.connect(A.mus);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1000;lp.connect(v);const ws=c.createWaveShaper();ws.curve=A.curve;ws.connect(lp);
  for(const [ty,m] of [['sawtooth',1],['sawtooth',2],['square',1.498]]){const o=c.createOscillator();o.type=ty;o.frequency.value=f*m;const g=c.createGain();g.gain.value=.35;o.connect(g);g.connect(ws);o.start(t);o.stop(t+.17);}
  if(st%8===0||st%8===3){const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(1,t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+.25);g.connect(A.mus);const o=c.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.2);o.connect(g);o.start(t);o.stop(t+.3);}
  if(st%8===4){const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.7,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.18);g.connect(A.mus);const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=1800;b.connect(g);const s=c.createBufferSource();s.buffer=A.nb;s.connect(b);s.start(t,Math.random());s.stop(t+.2);}
  {const g=c.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.001);g.gain.exponentialRampToValueAtTime(.0001,t+.04);g.connect(A.mus);const b=c.createBiquadFilter();b.type='highpass';b.frequency.value=7000;b.connect(g);const s=c.createBufferSource();s.buffer=A.nb;s.connect(b);s.start(t,Math.random());s.stop(t+.05);}
}

Object.assign(S,{
  rivet(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.42);nz(t,.03,filt('highpass',2500,1,vca(t,.001,.9,.03,o)));const s=osc('square',900,t,.05,filt('bandpass',1200,3,vca(t,.001,.6,.05,o)));s.frequency.exponentialRampToValueAtTime(300,t+.05);osc('sine',120,t,.06,vca(t,.002,.6,.05,o));},
  spit(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.6);const f=filt('bandpass',900,3,vca(t,.01,.9,.25,o));f.frequency.exponentialRampToValueAtTime(300,t+.25);nz(t,.3,f);const s=osc('sine',300,t,.2,vca(t,.005,.5,.18,o));s.frequency.exponentialRampToValueAtTime(90,t+.18);},
  splat(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.5);nz(t,.2,filt('lowpass',700,1,vca(t,.003,.9,.18,o)));},
  bounce(p,v){if(!AOK())return;const t=A.c.currentTime,o=dest(p,v*.35);[700,1650].forEach(f=>osc('sine',f,t,.15,vca(t,.001,.5,.14,o)));},
  save(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.35);[523,659,784,1047].forEach((f,i)=>osc('triangle',f,t+i*.08,.25,vca(t+i*.08,.005,.6,.22,o)));},
  breaker(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.8);nz(t,.12,filt('lowpass',500,1,vca(t,.002,1,.1,o)));osc('sine',70,t,.3,vca(t,.003,1,.28,o));const h=osc('sawtooth',60,t+.1,1.2,filt('lowpass',300,2,vca(t+.1,.2,.4,1,o)));h.frequency.linearRampToValueAtTime(120,t+1.2);},
  powerup(){if(!AOK())return;const t=A.c.currentTime,o=dest(0,.7);const f=filt('lowpass',200,4,vca(t,.3,.9,3,o));f.frequency.exponentialRampToValueAtTime(3000,t+2);[55,55.4,110].forEach(fr=>{const s=osc('sawtooth',fr*.5,t,3.3,f);s.frequency.exponentialRampToValueAtTime(fr*2,t+2.2);});}
});
/* ================= VOICE / TEXT UI ================= */
let subT=0;
function showSub(text,dur,line){const sp=(line&&SPEAKER[line.speaker||'buck'])||SPEAKER.buck,el=$('#sub');el.innerHTML='<b style="color:'+sp.color+'">'+sp.name+':</b> '+text;el.classList.toggle('radio',!!sp.radio);el.hidden=false;subT=dur||3.4;}
const VO={};   // Buck lines now load from the packs (by text), see packs.js
const VOB={};let voSrc=null;
function voDecode(){return;
  for(const t in VO){const bin=atob(VO[t]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    try{const pr=A.c.decodeAudioData(u.buffer,b=>{VOB[t]=b;},()=>{});if(pr&&pr.catch)pr.catch(()=>{});}catch(e){}}
}
function stopVoice(){if(voSrc){try{voSrc.stop();}catch(e){}voSrc=null;}if('speechSynthesis' in window){try{speechSynthesis.cancel();}catch(e){}}}
function playVO(text){const b=VOB[text];if(!b||!AOK())return false;if(voSrc){try{voSrc.stop();}catch(e){}}
  const s=A.c.createBufferSource();s.buffer=b;s.connect(A.vo);s.start();voSrc=s;MUS.duckUntil=A.c.currentTime+b.duration;s.onended=()=>{if(voSrc===s)voSrc=null;};return true;}
let VOICES=[];
if('speechSynthesis' in window){const lv=()=>{try{VOICES=speechSynthesis.getVoices()||[];}catch(e){}};lv();try{speechSynthesis.addEventListener('voiceschanged',lv);}catch(e){}}
function speak(text,line){
  if(!G.voice||!A.c)return;
  if(playVO(text))return;
  if(line){packAudio(line.pack,line.file,b=>{if(b){VOB[text]=b;playVO(text);}});return;}
  if(!('speechSynthesis' in window))return;
  try{const ss=speechSynthesis,u=new SpeechSynthesisUtterance(text);u.rate=.96;u.pitch=.4;u.volume=1;
    const vs=VOICES.length?VOICES:ss.getVoices();const v=vs.find(v=>/^en/i.test(v.lang)&&/(male|david|fred|daniel|alex|guy|george|aaron|arthur|ralph)/i.test(v.name))||vs.find(v=>/^en/i.test(v.lang));
    if(v)u.voice=v;
    if(ss.speaking||ss.pending){ss.cancel();setTimeout(()=>{try{ss.speak(u);}catch(e){}},90);}else ss.speak(u);}catch(e){}
}
let quipCD=0;
let SAYQ=[];
function say(text,dur,force,line){const logOn=(logPlay&&!logPlay.paused)||!$('#log').hidden;
  if(logOn&&G.state==='play'){if(force&&SAYQ.length<3)SAYQ.push([text,dur,line]);return;}
  if(!force&&quipCD>0)return;quipCD=6;showSub(text,dur,line);speak(text,line);}
const MSGS=[];function msg(t){const old=MSGS.find(m=>m.t===t);if(old){old.life=4;return;}MSGS.push({t,life:4});if(MSGS.length>4)MSGS.shift();}
const POPS=[];function pop(t,c){POPS.push({t,c:c||'#ffb627',life:.9});}
let logT=0,logText='',logRate=42,logVoiced=false;
function showLog(h,b){$('#log-h').textContent=h;logText=b;$('#log-b').textContent='';$('#log').hidden=false;logT=0;logRate=42;logVoiced=false;}
const LOGB={};let logPlay=null;
function startLogAt(key,b,off){
  const s=A.c.createBufferSource();s.buffer=b;s.connect(A.logG);s.start(0,off);
  logPlay={key,b,src:s,start:A.c.currentTime-off,paused:false};
  s.onended=()=>{if(logPlay&&logPlay.src===s)logPlay=null;};
}
function playLog(key,h,body){
  stopLog();showLog(h,body);
  if(!G.voice||!AOK())return;
  const want=key;
  logDecode(key,b=>{if(!b||$('#log').hidden||logText!==body||want!==key)return;
    logRate=Math.max(12,body.length/Math.max(2,b.duration-1.2));logVoiced=true;logT=Math.min(logT,.3);startLogAt(key,b,0);});
}
function stopLog(){if(logPlay){try{logPlay.src.onended=null;logPlay.src.stop();}catch(e){}logPlay=null;}}
function pauseLog(){if(logPlay&&!logPlay.paused&&A.c){logPlay.off=A.c.currentTime-logPlay.start;try{logPlay.src.onended=null;logPlay.src.stop();}catch(e){}logPlay.paused=true;}}
function resumeLog(){if(logPlay&&logPlay.paused){const {key,b,off}=logPlay;if(off<b.duration-.15&&AOK())startLogAt(key,b,off);else logPlay=null;}}

/* ================= INPUT ================= */
const IN={k:Object.create(null),edges:new Set(),mdx:0,mdy:0,lmb:false,touchMode:false,
  joy:{id:null,ox:0,oy:0,x:0,y:0},look:{id:null,lx:0,ly:0,dx:0,dy:0},tfire:false,pad:{on:false,prev:[],ax:[0,0,0,0],rt:false,pay:0,pax:0}};
const KEYMAP={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',
  KeyE:'use',KeyF:'kick',Backquote:'console',KeyQ:'swap',Tab:'map',KeyM:'map',KeyG:'guide',Digit1:'w1',Digit2:'w2',Digit3:'w3',Digit4:'w4',Escape:'pause',KeyP:'pause',Enter:'confirm',Space:'confirm'};
function anyInput(){G.idle=0;}
addEventListener('keydown',e=>{
  auInit();anyInput();
  if(G.sub==='console')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter','PageUp','PageDown'].includes(e.code))e.preventDefault();
  if(!e.repeat){IN.edges.add('any');const a=KEYMAP[e.code];if(a)IN.edges.add(a);if(e.code==='Escape'||e.code==='Backspace')IN.edges.add('back');if(e.code==='Space')IN.edges.add('fireE');}
  IN.k[e.code]=true;
});
addEventListener('keyup',e=>{IN.k[e.code]=false;});
addEventListener('blur',()=>{IN.k=Object.create(null);IN.lmb=false;IN.tfire=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
frame.addEventListener('contextmenu',e=>e.preventDefault());
frame.addEventListener('pointerdown',e=>{
  auInit();anyInput();
  if(e.pointerType==='touch'){setTouch(true);IN.edges.add('any');return;}
  IN.edges.add('any');
  if(G.state==='play'){
    if(document.pointerLockElement!==cv){try{const r=cv.requestPointerLock&&cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}
    if(e.button===0){IN.lmb=true;IN.edges.add('fireE');}if(e.button===2)IN.edges.add('kick');
  }
});
addEventListener('pointerup',e=>{if(e.pointerType!=='touch'&&e.button===0)IN.lmb=false;});
addEventListener('mousemove',e=>{if(document.pointerLockElement===cv){IN.mdx+=e.movementX;IN.mdy+=e.movementY;}});
function setTouch(v){if(IN.touchMode===v)return;IN.touchMode=v;document.body.classList.toggle('touch',v);}
// touch controls
const tzm=$('#tz-move'),tzl=$('#tz-look'),joyEl=$('#joy'),knob=$('#knob');
tzm.addEventListener('pointerdown',e=>{e.preventDefault();auInit();setTouch(true);const j=IN.joy;j.id=e.pointerId;j.ox=e.clientX;j.oy=e.clientY;j.x=j.y=0;joyEl.hidden=false;joyEl.style.left=e.clientX+'px';joyEl.style.top=e.clientY+'px';knob.style.transform='';try{tzm.setPointerCapture(e.pointerId);}catch(err){}});
tzm.addEventListener('pointermove',e=>{const j=IN.joy;if(e.pointerId!==j.id)return;let dx=e.clientX-j.ox,dy=e.clientY-j.oy;const l=Math.hypot(dx,dy),mx=50;if(l>mx){dx*=mx/l;dy*=mx/l;}j.x=dx/mx;j.y=dy/mx;knob.style.transform=`translate(${dx}px,${dy}px)`;});
const joyEnd=e=>{const j=IN.joy;if(e.pointerId!==j.id)return;j.id=null;j.x=j.y=0;joyEl.hidden=true;};
tzm.addEventListener('pointerup',joyEnd);tzm.addEventListener('pointercancel',joyEnd);
tzl.addEventListener('pointerdown',e=>{e.preventDefault();auInit();setTouch(true);const L=IN.look;L.id=e.pointerId;L.lx=e.clientX;L.ly=e.clientY;try{tzl.setPointerCapture(e.pointerId);}catch(err){}});
tzl.addEventListener('pointermove',e=>{const L=IN.look;if(e.pointerId!==L.id)return;L.dx+=e.clientX-L.lx;L.dy+=e.clientY-L.ly;L.lx=e.clientX;L.ly=e.clientY;});
const lookEnd=e=>{if(e.pointerId===IN.look.id)IN.look.id=null;};
tzl.addEventListener('pointerup',lookEnd);tzl.addEventListener('pointercancel',lookEnd);
function tbtn(id,down,up){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();auInit();el.classList.add('down');down();try{el.setPointerCapture(e.pointerId);}catch(err){}});
  const u=e=>{el.classList.remove('down');if(up)up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);}
tbtn('#b-fire',()=>{IN.tfire=true;IN.edges.add('fireE');},()=>{IN.tfire=false;});
tbtn('#b-kick',()=>IN.edges.add('kick'));tbtn('#b-use',()=>IN.edges.add('use'));tbtn('#b-swap',()=>IN.edges.add('swap'));tbtn('#b-pause',()=>IN.edges.add('pause'));tbtn('#b-map',()=>IN.edges.add('map'));tbtn('#b-path',()=>IN.edges.add('guide'));
function pollPad(){
  const gps=navigator.getGamepads?navigator.getGamepads():[];let gp=null;for(const g of gps)if(g&&g.connected){gp=g;break;}
  const P=IN.pad;if(!gp){P.on=false;return;}P.on=true;
  const b=gp.buttons.map(x=>x&&(x.pressed||x.value>.5)),pv=P.prev;
  const E=(i,n)=>{if(b[i]&&!pv[i]){IN.edges.add(n);IN.edges.add('any');anyInput();auInit();setTouch(false);}};
  E(0,'confirm');E(0,'use');E(1,'back');E(1,'kick');E(2,'kick');E(3,'swap');E(5,'swap');E(4,'kick');E(6,'kick');E(9,'pause');E(11,'guide');E(10,'guide');E(8,'back');E(8,'map');E(12,'up');E(13,'down');E(14,'left');E(15,'right');E(13,'padMap');E(14,'padPrev');E(15,'padNext');
  if(b[7]&&!pv[7]){IN.edges.add('any');anyInput();}
  const dz=v=>Math.abs(v)<.18?0:(v-Math.sign(v)*.18)/.82;
  P.ax=[dz(gp.axes[0]||0),dz(gp.axes[1]||0),dz(gp.axes[2]||0),dz(gp.axes[3]||0)];P.rt=!!b[7];
  const ay=gp.axes[1]||0;if(ay<-.6&&P.pay>=-.6)IN.edges.add('up');if(ay>.6&&P.pay<=.6)IN.edges.add('down');P.pay=ay;
  if(Math.abs(P.ax[0])+Math.abs(P.ax[1])+Math.abs(P.ax[2])+Math.abs(P.ax[3])>.3)anyInput();
  P.prev=b;
}
function gather(dt){
  const k=IN.k;let mx=0,my=0,turn=0,lx=0,ly=0,pr=0,run=!!(k.ShiftLeft||k.ShiftRight);
  if(k.KeyW||k.ArrowUp)my+=1;if(k.KeyS||k.ArrowDown)my-=1;if(k.KeyD)mx+=1;if(k.KeyA)mx-=1;
  if(k.ArrowRight)turn+=1;if(k.ArrowLeft)turn-=1;if(k.PageUp)pr+=1;if(k.PageDown)pr-=1;
  lx+=IN.mdx*.0026;ly+=-IN.mdy*.55;
  const j=IN.joy;if(j.id!=null){mx+=j.x;my+=-j.y;if(Math.hypot(j.x,j.y)>.9)run=true;}
  const L=IN.look;lx+=L.dx*.0068;ly+=-L.dy*.5;L.dx=L.dy=0;
  const P=IN.pad;if(P.on){mx+=P.ax[0];my+=-P.ax[1];turn+=P.ax[2]*1.15;pr+=-P.ax[3];if(Math.hypot(P.ax[0],P.ax[1])>.93)run=true;}
  mx=clamp(mx,-1,1);my=clamp(my,-1,1);
  const fire=!!(k.Space||IN.lmb||IN.tfire||P.rt);
  return {mx,my,turn,lx,ly,pr,fire,run};
}
const edge=n=>IN.edges.has(n);

/* ================= MENUS ================= */
let curMenu=null,menuIdx=0;
function setMenu(id){curMenu=id?$(id):null;menuIdx=0;markSel();}
function menuBtns(){return curMenu?[...curMenu.querySelectorAll('.btn')].filter(b=>!b.hidden):[];}
function markSel(){menuBtns().forEach((b,i)=>b.classList.toggle('sel',i===menuIdx));if(typeof updateDiffDesc==='function')updateDiffDesc();
  if(curMenu&&curMenu.id==='m-decks'){const b=menuBtns()[menuIdx];if(b){try{b.scrollIntoView({block:'nearest'});}catch(e){}if(b.dataset.act.startsWith('dk:'))previewDeck(+b.dataset.act.slice(3));}}
  if(curMenu&&curMenu.id==='m-logs'){const b=menuBtns()[menuIdx];if(b){try{b.scrollIntoView({block:'nearest'});}catch(e){}if(b.dataset.act.startsWith('lg:'))previewArchive(+b.dataset.act.slice(3));}}}
function menuNav(){
  if(!curMenu)return;const bs=menuBtns();if(!bs.length)return;
  if(edge('up')){menuIdx=(menuIdx-1+bs.length)%bs.length;markSel();S.tick();}
  if(edge('down')){menuIdx=(menuIdx+1)%bs.length;markSel();S.tick();}
  if(edge('confirm'))bs[menuIdx].click();
}
let lastTouchAct=0,touchBtn=null;
function selectBtn(b){const bs=menuBtns();const i=bs.indexOf(b);if(i>=0){menuIdx=i;markSel();}}
function bindBtn(b){
  b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')selectBtn(b);});
  b.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){touchBtn=b;auInit();anyInput();}});
  b.addEventListener('pointerup',e=>{
    if(e.pointerType==='mouse'||touchBtn!==b)return;touchBtn=null;e.preventDefault();
    lastTouchAct=performance.now();auInit();anyInput();selectBtn(b);act(b.dataset.act);
  });
  b.addEventListener('pointercancel',()=>{touchBtn=null;});
  b.addEventListener('click',e=>{if(performance.now()-lastTouchAct<900){e.preventDefault();return;}auInit();anyInput();b.blur();act(b.dataset.act);});
}
document.querySelectorAll('.btn').forEach(bindBtn);
function refreshToggles(){document.querySelectorAll('[data-act="hints"]').forEach(b=>b.textContent='Hints: '+(G.hintsOff?'Off':'On'));document.querySelectorAll('[data-act="quips"]').forEach(b=>b.textContent='Achievement quips: '+(G.voiceQuips===false?'Off':'On'));document.querySelectorAll('[data-act="sound"]').forEach(b=>b.textContent='Sound: '+(G.sound?'On':'Off'));document.querySelectorAll('[data-act="voice"]').forEach(b=>b.textContent='Voice: '+(G.voice?'On':'Off'));}
function savePrefs(){HBP.store.set('hb-prefs',{sound:G.sound,voice:G.voice,hints:!G.hintsOff,quips:G.voiceQuips!==false});}
{const p=HBP.store.get('hb-prefs');if(p){G.sound=p.sound!==false;G.voice=p.voice!==false;G.hintsOff=p.hints===false;G.voiceQuips=p.quips!==false;}}
let helpFrom='title';
function act(a){
  S.beep(700);
  if(a&&a.startsWith('lg:')){playArchive(+a.slice(3));return;}
  if(a&&a.startsWith('dk:')){pickDeck(+a.slice(3));return;}
  switch(a){
    case 'newgame':confirmNewGame();break;
    case 'decks':openDecks();break;
    case 'd0':case 'd1':case 'd2':case 'd3':case 'd4':newCampaign(+a[1]);break;
    case 'retry':case 'restart':startGame(G.diff,deckNum());break;
    case 'continue':{const sv=readSave(curDeck());if(sv)loadAndPlay(sv);else{const c=readCampaign();startGame(Math.max(0,DIFF.findIndex(d=>d.name===c.diff)),c.cur||1);}break;}
    case 'load':loadAndPlay(readSave(deckNum()));break;
    case 'next':{const c=readCampaign();startGame(G.diff,deckNum()+1);break;}
    case 'hints':G.hintsOff=!G.hintsOff;refreshToggles();savePrefs();break;
    case 'quips':G.voiceQuips=G.voiceQuips===false;refreshToggles();savePrefs();break;
    case 'console':openConsole();break;
    case 'controls':helpFrom=G.state==='pause'?'pause':'title';showOnly('#help');setMenu('#m-help');G.sub='help';break;
    case 'trailer':startTrailer();break;
    case 'help':helpFrom=G.state==='pause'?'pause':'title';showOnly('#help');setMenu('#m-help');G.sub='help';break;
    case 'back':if(helpFrom==='pause'){showOnly('#pause');setMenu('#m-pause');}else{showOnly('#title');setMenu('#m-title');}G.sub=null;break;
    case 'sound':G.sound=!G.sound;if(A.c)A.master.gain.setTargetAtTime(G.sound?.9:0,A.c.currentTime,.05);refreshToggles();savePrefs();break;
    case 'voice':G.voice=!G.voice;if(!G.voice){stopVoice();stopLog();}refreshToggles();savePrefs();break;
    case 'resume':resumeGame();break;
    case 'stay':stayDeck();break;
    case 'depart':showOnly(null);winGame();break;
    case 'logs':openArchive();break;
    case 'logsback':closeArchive();break;
    case 'title':toTitle();break;
  }
}
const OVS=['#title','#tcap','#intro','#pause','#over','#help','#diff','#logs-ov','#decks-ov','#depart'];
function showOnly(id){for(const o of OVS)$(o).hidden=o!==id;}

/* ================= WORLD STATE ================= */
let ENTS=[],PARTS=[],PL=PARTS,P=null,PROJ=[];
const FX={beam:0,hurt:0,hdir:0,pick:0,hit:0};
const PBIT={head:1,armL:2,armR:4,legL:8,legR:16,torso:0};
const DIFF=[
  {name:'Very Easy',dmg:.45,hp:.7,spd:.85,ammo:1.7,heal:1.6,spawn:.5,cells:30,save:'area',revive:0,
   desc:'For the story and the scenery. Enemies are weak and slow, supplies are everywhere, and the game saves in every new area.'},
  {name:'Easy',dmg:.7,hp:.85,spd:.93,ammo:1.3,heal:1.3,spawn:.75,cells:24,save:'area',revive:.1,
   desc:'A relaxed run. Fewer enemies, extra ammo and health, and a save in every new area. Once in a while, a body gets back up.'},
  {name:'Normal',dmg:1.1,hp:1,spd:1,ammo:1,heal:1,spawn:1,cells:18,save:'events',revive:.33,
   desc:'The intended experience. Every enemy shows up, ammo has to be earned, and about a third of the bodies get back up. The game saves after big moments.'},
  {name:'Hard',dmg:1.5,hp:1.25,spd:1.12,ammo:.8,heal:.75,spawn:1.35,cells:14,save:'stations',revive:.66,
   desc:'Extra enemies, tougher limbs, thinner supplies, and most bodies get back up. The game only saves at save stations.'},
  {name:'Nightmare',dmg:2.1,hp:1.5,spd:1.22,ammo:.6,heal:.55,spawn:1.7,cells:10,save:'never',revive:1,
   desc:'Everything hits like a freight hauler and supplies are scarce. No saves: die and the deck starts over. Every body gets back up unless you stomp it.'}
];
let D=DIFF[2];
const ETYPE={
  husk:{hp:12,lhp:[3,3,3,4,4],speed:1.35,dmg:13,reach:.95,wind:.42,r:.27},
  crawler:{hp:5,lhp:[2,2,2,9,9],speed:2.5,dmg:8,reach:.75,wind:.25,r:.24},
  brute:{hp:42,lhp:[8,9,9,10,10],speed:1.3,dmg:24,reach:1.15,wind:.55,r:.36},
  spitter:{hp:10,lhp:[3,3,3,3,3],speed:1.15,dmg:9,reach:.9,wind:.4,r:.26},
  bloater:{hp:8,lhp:[2,2,2,3,3],speed:.95,dmg:0,reach:1.1,wind:.7,r:.3}
};
const WH={husk:1,brute:1.3,crawler:.42,spitter:1,bloater:1.06};
function makeEnemy(type,x,y,o){
  o=o||{};const T0=ETYPE[type],hm=D.hp;
  const e={kind:'enemy',type,x,y,z:0,r:T0.r,mask:0,hp:T0.hp*hm,
    lhp:{head:T0.lhp[0]*hm,armL:T0.lhp[1]*hm,armR:T0.lhp[2]*hm,legL:T0.lhp[3]*hm,legR:T0.lhp[4]*hm},
    state:o.dormant?'dormant':'idle',t:0,cd:0,phase:R(),flash:0,berserk:false,crawl:false,wake:o.wake||2.4,
    speed:T0.speed*D.spd,dmg:T0.dmg,reach:T0.reach,wind:T0.wind/Math.sqrt(D.spd),kx:0,ky:0,vx:0,vy:0,groanT:2+R()*6,hit:false,sid:o.sid==null?-1:o.sid};
  if(o.drop){e.state='drop';e.z=.9;}
  return e;
}
function spawnEnemy(type,x,y,o){const e=makeEnemy(type,x,y,o);ENTS.push(e);G.total++;return e;}
function pickup(t,x,y,o){const e=Object.assign({kind:'pickup',t,x,y,ph:R()*6,sid:-1},o||{});ENTS.push(e);return e;}
function decor(t,x,y,solid,r,o){const e=Object.assign({kind:'decor',t,x,y,solid:!!solid,r:r||.3,sid:-1},o||{});ENTS.push(e);return e;}
function barrel(x,y,sid){ENTS.push({kind:'barrel',x,y,hp:2,r:.22,solid:true,sid:sid==null?-1:sid});}
/* ================= COLLISION / NAV ================= */
function solidAt(x,y){
  if(x<0||y<0||x>=MW||y>=MH)return true;
  const i=I(x|0,y|0);if(map[i]===0)return false;const d=doorAt[i];if(d)return d.open<.85;return true;
}
function blockedCircle(x,y,r){return solidAt(x-r,y-r)||solidAt(x+r,y-r)||solidAt(x-r,y+r)||solidAt(x+r,y+r);}
function moveEnt(e,dx,dy,r){
  const s=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.15));dx/=s;dy/=s;
  for(let k=0;k<s;k++){if(!blockedCircle(e.x+dx,e.y,r))e.x+=dx;if(!blockedCircle(e.x,e.y+dy,r))e.y+=dy;}
}
function los(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/.2);for(let i=1;i<n;i++){const t=i/n;if(solidAt(x0+(x1-x0)*t,y0+(y1-y0)*t))return false;}return true;}
function passable(i){if(map[i]===0)return true;const d=doorAt[i];return !!d&&(d.lock==='none'||d.lock==='opened');}
function buildFlow(){
  flow.fill(-1);const q=new Int16Array(MAPN);let h=0,t=0;const s=I(P.x|0,P.y|0);flow[s]=0;q[t++]=s;
  while(h<t){const i=q[h++],x=i%MW,y=(i/MW)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=I(nx,ny);if(flow[ni]>=0||!passable(ni))continue;flow[ni]=flow[i]+1;q[t++]=ni;}}
}
function panOf(x,y){const dx=x-P.x,dy=y-P.y,ca=Math.cos(P.ang),sa=Math.sin(P.ang),lat=-dx*sa+dy*ca,d=Math.hypot(dx,dy);return [clamp(lat/(d+.3),-1,1),clamp(1.5/(1+d*.35),0,1)];}

/* ================= PARTICLES ================= */
function addPart(o){if(PL.length>340)PL.shift();PL.push(o);}
function bleed(x,y,z,n,sp){sp=sp||1.6;for(let i=0;i<n;i++)addPart({x,y,z,vx:(R()-.5)*sp,vy:(R()-.5)*sp,vz:R()*2.4,img:R()<.5?IMG.blood:IMG.blood2,wh:.05,life:2+R(),t:'blood'});}
function gibs(x,y,z,n){for(let i=0;i<n;i++)addPart({x,y,z:z+R()*.3,vx:(R()-.5)*3.5,vy:(R()-.5)*3.5,vz:1+R()*3.5,img:IMG.chunk,wh:.1,life:8+R()*4,t:'chunk'});bleed(x,y,z,n,3);}
function limbPart(x,y,z,part,fx,fy){const im=part==='head'?IMG.g_head:part.indexOf('arm')===0?IMG.g_arm:IMG.g_leg;addPart({x,y,z,vx:fx*1.8+(R()-.5)*2,vy:fy*1.8+(R()-.5)*2,vz:2.4+R()*1.8,img:im,wh:part==='head'?.16:.26,life:14,t:'limb'});}
function flames(x,y,n){for(let i=0;i<n;i++)addPart({x:x+(R()-.5)*.6,y:y+(R()-.5)*.6,z:R()*.6,vx:(R()-.5)*3,vy:(R()-.5)*3,vz:R()*2,g:-.25,img:IMG.fire,wh:.22+R()*.25,life:.4+R()*.5,t:'fire'});}
function sparks(x,y,z,n){for(let i=0;i<n;i++)addPart({x,y,z,vx:(R()-.5)*3,vy:(R()-.5)*3,vz:R()*3,img:IMG.spark,wh:.03,life:.5,t:'spark'});}
function updateParts(list,dt){
  for(let i=list.length-1;i>=0;i--){
    const p=list[i];p.life-=dt;if(p.life<=0){list.splice(i,1);continue;}
    if(p.rest)continue;
    p.vz-=9.8*dt*(p.g==null?1:p.g);
    let nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
    if(solidAt(nx,p.y)){p.vx*=-.4;nx=p.x;}if(solidAt(p.x,ny)){p.vy*=-.4;ny=p.y;}
    p.x=nx;p.y=ny;p.z+=p.vz*dt;
    if(p.z<=0){p.z=0;
      if(p.t==='blood'){p.rest=true;p.img=IMG.splat;p.wh=.035;p.life=Math.min(p.life+30,30);}
      else if(p.t==='fire'||p.t==='spark'){p.life=0;}
      else{p.vz=-p.vz*.35;p.vx*=.55;p.vy*=.55;if(Math.abs(p.vz)<.6){p.rest=true;p.vz=0;if(p.t==='limb'||p.t==='chunk')p.life=Math.max(p.life,20);}}
    }
    if(p.t==='limb')p.flip=((p.life*9)|0)%2===0;
  }
}

/* ================= COMBAT ================= */
function severCount(e){const m=e.mask;return e.type==='crawler'?((m>>1)&1)+((m>>2)&1):((m>>1)&1)+((m>>2)&1)+((m>>3)&1)+((m>>4)&1);}
function needSever(e){return e.type==='brute'?4:e.type==='crawler'||e.type==='bloater'?2:3;}
function wake(e){
  if(G.notarget&&e.state==='idle')return;
  if(e.state==='dormant'){e.state='rise';e.t=0;const [p,v]=panOf(e.x,e.y);S.shriek(p,v,1.1);}
  else if(e.state==='idle'){e.state='chase';const [p,v]=panOf(e.x,e.y);
    if(e.type==='brute'){S.roar(p,v);e.intro='brute';}
    else if(e.type==='crawler')S.shriek(p,v,1.6);
    else if(e.type==='spitter'){S.shriek(p,v,1.3);e.intro='spitter';}
    else if(e.type==='bloater'){S.groan(p,v*1.2);e.intro='bloater';}
    else S.groan(p,v);}
}
// The first time you actually see a brute, spitter or bloater, Buck reacts (tuning.enemyIntro).
function enemyIntro(e){const k=e.intro;e.intro=null;if(G.said['intro_'+k])return;G.said['intro_'+k]=1;
  const ie=(PACKS.core.tuning.enemyIntro||{})[k];if(!ie)return;if(ie.line)sayLine('core:'+ie.line,3,true);if(ie.msg)msg(ie.msg);}
function sever(e,part,hx,hy,hz){
  const sst=e.state==='spit'?'spit':e.state==='attack'?'attack':'other';
  e.mask|=PBIT[part];G.limbs++;addStat('limbsSevered');
  const fx=Math.cos(P.ang),fy=Math.sin(P.ang);
  limbPart(hx,hy,hz,part,fx,fy);bleed(hx,hy,hz,10,2.4);
  const [p,v]=panOf(e.x,e.y);S.sever(p,v);pop('SEVERED');
  if(part==='head'&&e.type!=='crawler'){e.berserk=true;if(!G.tipHead){G.tipHead=true;msg("HEADSHOTS DON'T STOP THEM. CUT THE LIMBS.");say("Huh. Didn't need that, apparently.",3,true);}}
  if((e.mask&24)===24&&!e.crawl)e.crawl=true;
  fireEvent('sever',{},{enemy:e.type,limb:part,state:sst});
}
let HITCAUSE='cutter';
function damageEnemy(e,part,dmg,hz){
  if(e.state==='dead')return;
  if(e.state==='dormant'||e.state==='idle')wake(e);
  e.flash=.09;FX.hit=.12;
  if(e.type==='bloater'&&part==='torso'){killEnemy(e,hz);return;}
  bleed(e.x,e.y,hz,3);
  let sev=false;const bit=PBIT[part];
  if(bit&&!(e.mask&bit)){e.lhp[part]-=dmg;if(e.lhp[part]<=0){sever(e,part,e.x,e.y,hz);sev=true;}else{const [p,v]=panOf(e.x,e.y);S.hit(p,v);}}
  else{e.hp-=part==='torso'?dmg:dmg*.4;const [p,v]=panOf(e.x,e.y);S.hit(p,v);}
  if(e.hp<=0||severCount(e)>=needSever(e)){killEnemy(e,hz);return;}
  if(e.state==='drop'||e.state==='rise')return;
  if(sev&&e.type!=='brute'){e.state='stagger';e.t=.35;}
  else if(e.type!=='brute'&&R()<.3&&e.state!=='attack'&&e.state!=='spit'){e.state='stagger';e.t=.2+R()*.15;}
}
const KILLQ=["Your contract's been terminated.","Disarming. Literally.","Ninety days late, and falling apart.","Should've read the fine print.","Hold still. I'm itemizing.","That's a limb-ited warranty.","Repossessed.","Nobody skips out on Gorgon. Not even the dead."];
function killEnemy(e,hz,big){
  if(e.state==='dead')return;
  e.state='dead';e.gone=true;G.kills++;
  const cause=HITCAUSE;if(cause==='kick'||cause==='stomp')addStat('kickKills');if(G.blastKills!=null)G.blastKills++;
  fireEvent('kill',{},{enemy:e.type,cause,boss:!!(ETYPE[e.type]&&ETYPE[e.type].boss),state:e.killState||'other'});
  const [p,v]=panOf(e.x,e.y);
  if(e.type==='bloater'){S.splat(p,v);pop('POP','#c8ff3c');G.events.push({t:G.playTime+.06,fn:()=>explode({x:e.x,y:e.y,sid:-1},{r:2.8,dmg:46,src:'bloater'})});return;}
  S.death(p,v);bleed(e.x,e.y,.5,14,2.6);if(big)gibs(e.x,e.y,.5,14);
  const pile=decor('pile',e.x,e.y);
  if(D.revive>0&&R()<D.revive&&!big&&(e.type==='husk'||e.type==='spitter'||e.type==='sleeper'))pile.revive=12+R()*8;
  if(e.type==='super'){pile.big=true;}
  drops(e);
  if(R()<.4)say(KILLQ[(R()*KILLQ.length)|0],2.6);
  pop(e.type==='brute'?'BRUTE DOWN':'KILL','#3fe0c5');
}
function drops(e){const a=D.ammo,r=R();
  if(r<.2*a)pickup('cells',e.x+.2,e.y);
  else if(r<.32*a&&P.has[1])pickup('shells',e.x+.2,e.y);
  else if(r<.44*a&&P.has[2])pickup('rivets',e.x+.2,e.y);
  else if(r<.44*a+.07*D.heal)pickup('med',e.x+.2,e.y);}
function projectEnt(e,cam){
  const ca=Math.cos(cam.ang),sa=Math.sin(cam.ang),dx=e.x-cam.x,dy=e.y-cam.y,depth=dx*ca+dy*sa;if(depth<.15)return null;
  const lat=-dx*sa+dy*ca,sx=RW/2+F*lat/depth,sp=getSprite(e);if(!sp)return null;
  const h=F*sp.wh/depth,w=h*sp.img.w/sp.img.h,hor=RH/2+cam.pitch,bottom=hor+(.5+(cam.z||0)-(sp.z||0))*F/depth;
  return {depth,x0:sx-w/2,y0:bottom-h,w,h,sp};
}
let CAM={x:0,y:0,ang:0,pitch:0,z:0,lamp:1};
function trace(offX,offY,halfWorld){
  const cx=RW/2+offX,cy=RH/2+offY;let best=null;
  for(const e of ENTS){
    if(!((e.kind==='enemy'&&e.state!=='dead')||e.kind==='barrel')||e.gone)continue;
    const dxp=e.x-CAM.x,dyp=e.y-CAM.y;if(dxp*dxp+dyp*dyp>900)continue;
    const pr=projectEnt(e,CAM);if(!pr)continue;
    const hw=halfWorld?F*halfWorld/pr.depth:0;
    if(cx+hw<pr.x0||cx-hw>pr.x0+pr.w||cy<pr.y0||cy>pr.y0+pr.h)continue;
    const col=clamp(Math.round(clamp(cx,pr.x0,pr.x0+pr.w)),0,RW-1);if(pr.depth>ZB[col]+.05)continue;
    const v=(cy-pr.y0)/pr.h,u0=(cx-hw-pr.x0)/pr.w,u1=(cx+hw-pr.x0)/pr.w;
    const regs=pr.sp.img.regs||[{p:'torso',x0:0,y0:0,x1:1,y1:1}];
    const parts=[];for(const r of regs){if(v<r.y0||v>r.y1||u1<r.x0||u0>r.x1)continue;parts.push(r.p);}
    if(!parts.length)continue;
    if(!best||pr.depth<best.depth)best={e,parts,depth:pr.depth,hz:(1-v)*pr.sp.wh+(pr.sp.z||0)};
  }
  return best;
}
function noise(rad){for(const e of ENTS)if(e.kind==='enemy'&&e.state==='idle'&&Math.hypot(e.x-P.x,e.y-P.y)<rad)wake(e);}
function hurtTarget(h,part,dmg){if(h.e.kind==='barrel'){h.e.hp-=dmg;sparks(h.e.x,h.e.y,.3,4);if(h.e.hp<=0&&!h.e.gone)explode(h.e);}else damageEnemy(h.e,part,dmg,h.hz);}
const WNAME=['CUTTER','BOOMSTICK','RIVET DRIVER','CHARGES'];
function ammoOf(w){return w===0?P.cells:w===1?P.shells:w===2?P.rivets:P.bombs;}
function selectWeapon(w){if(!P.has[w]||P.wpn===w)return;P.wpn=w;P.switchT=.3;S.swap();}
function cycleWeapon(dir){dir=dir||1;for(let k=1;k<=4;k++){const w=((P.wpn+dir*k)%4+4)%4;if(P.has[w]){selectWeapon(w);return;}}}
function dryFire(){S.dry();msg('OUT OF AMMO');for(const w of [2,1,0,3])if(P.has[w]&&ammoOf(w)>0&&w!==P.wpn){P.wpn=w;P.switchT=.3;break;}P.cd=.4;}
function fire(){
  if(P.cd>0||P.switchT>0)return;
  const w=P.wpn;if(ammoOf(w)<=0){dryFire();return;}
  if(w===0){
    P.cells--;P.cd=.5;P.anim=.2;S.cutter();G.flash=Math.max(G.flash,.55);G.flashC=[.35,1,1.1];FX.beam=.16;noise(8);
    const h=trace(0,0,.42);
    HITCAUSE='cutter';G.used.cutter=1;
    if(h){const parts=h.e.kind==='barrel'?['torso']:h.parts;for(const p of parts)hurtTarget(h,p,p==='torso'?2:4);
      if(h.e.kind==='enemy'){h.e.kx+=Math.cos(P.ang)*.6;h.e.ky+=Math.sin(P.ang)*.6;}}
  }else if(w===1){
    HITCAUSE='boomstick';G.used.boomstick=1;P.shells--;P.cd=.9;P.anim=.35;S.shotgun();G.flash=1.4;G.flashC=[1.2,.85,.5];G.shake=Math.max(G.shake,.3);noise(14);
    for(let i=0;i<9;i++){const h=trace((R()-.5)*RH*.13,(R()-.5)*RH*.1,0);if(!h)continue;
      let part='torso';for(const p of ['head','armL','armR','legL','legR','torso'])if(h.parts.includes(p)){part=p;break;}
      hurtTarget(h,part,h.depth<2?2.6:1.8);if(h.e.kind==='enemy'){h.e.kx+=Math.cos(P.ang)*.35;h.e.ky+=Math.sin(P.ang)*.35;}}
  }else if(w===2){
    HITCAUSE='rivet';G.used.rivet=1;P.rivets--;P.cd=.095;P.anim=.08;S.rivet();G.flash=Math.max(G.flash,.22);G.flashC=[1.1,.9,.6];noise(9);
    const h=trace((R()-.5)*4,(R()-.5)*4,0);
    if(h){if(h.e.kind==='barrel')hurtTarget(h,'torso',1);
      else{let part='torso';for(const p of ['armL','armR','legL','legR','head','torso'])if(h.parts.includes(p)){part=p;break;}
        hurtTarget(h,part,part==='torso'?1:1.25);h.e.kx+=Math.cos(P.ang)*.06;h.e.ky+=Math.sin(P.ang)*.06;}}
  }else{
    G.used.charges=1;P.bombs--;P.cd=.75;P.anim=.3;S.whoosh();
    const ca=Math.cos(P.ang),sa=Math.sin(P.ang),pv=P.pitch/(RH*.42);
    PROJ.push({kind:'bomb',x:P.x+ca*.35,y:P.y+sa*.35,z:.45,vx:ca*5.6,vy:sa*5.6,vz:2+pv*3,fuse:1.9,life:8});
  }
}
function kick(){if(P.kcd>0||P.dead)return;P.kcd=.6;P.kick=.42;P.kickDone=false;S.whoosh();}
function applyKick(){
  const fx=Math.cos(P.ang),fy=Math.sin(P.ang);let hitAny=false;HITCAUSE='kick';G.used.kick=1;
  for(const e of ENTS){
    if(e.gone)continue;
    const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d>1.35||d<.01)continue;if((dx*fx+dy*fy)/d<.5)continue;
    if(e.kind==='enemy'&&e.state!=='dead'){hitAny=true;
      if(e.type==='bloater'){damageEnemy(e,'torso',1,.5);continue;}
      if(e.crawl||e.type==='crawler'||e.state==='dormant'||e.state==='rise'){pop('STOMP');damageEnemy(e,'torso',((PACKS.core.tuning.kick||{}).damage||3.5)*3.2,.15);}
      else{const K=PACKS.core.tuning.kick||{},B=P.boots&&K.boots||{};damageEnemy(e,'torso',(K.damage||3.5)*(B.dmgMul||1),.5);
        e.kx+=fx*2.2*(B.push||1);e.ky+=fy*2.2*(B.push||1);if(e.state!=='dead'&&e.type!=='brute'){e.state='stagger';e.t=.55;}}}
    else if(e.kind==='decor'&&(e.t==='pile'||e.t==='corpse')){hitAny=true;gibs(e.x,e.y,.1,10);e.gone=true;addStat('bodiesKicked');if(e.revive&&!G.said.stay){G.said.stay=1;say("Stay down this time.",2.2,true);}}
    else if(e.kind==='barrel'){hitAny=true;moveEnt(e,fx*.4,fy*.4,e.r);}
  }
  if(hitAny){if(P.boots&&S.clank)S.clank();else S.kick();G.shake=Math.max(G.shake,P.boots?.2:.15);}
}
function explode(b,o){
  o=o||{};const r=o.r||2.7,dmg=o.dmg||42,src=o.src||'barrel',outer=G.blastKills;G.blastKills=0;HITCAUSE=src;
  b.gone=true;if(b.sid>=0&&G.taken)G.taken[b.sid]=1;
  const [p,v]=P?panOf(b.x,b.y):[0,1];S.explode(p,v);G.flash=Math.max(G.flash,2.6);G.flashC=o.src==='bloater'?[.9,1.2,.35]:[1.3,.7,.3];G.shake=Math.max(G.shake,.7);
  flames(b.x,b.y,32);sparks(b.x,b.y,.4,14);if(o.src==='bloater')gibs(b.x,b.y,.6,18);
  for(const e of ENTS){
    if(e===b||e.gone)continue;const d=Math.hypot(e.x-b.x,e.y-b.y);
    if(e.kind==='enemy'&&e.state!=='dead'&&d<r){const k=1-d/r;
      if(e.type==='bloater'){killEnemy(e,.5,true);continue;}
      const lim=['armL','armR','legL','legR'].filter(q=>!(e.mask&PBIT[q]));for(let n=0;n<(e.type==='brute'?1:2)&&lim.length;n++){const q=lim.splice((R()*lim.length)|0,1)[0];e.lhp[q]=0;sever(e,q,e.x,e.y,.5);}
      if(e.state!=='dead'){e.hp-=24*k;if(e.state==='dormant'||e.state==='idle')wake(e);
        if(e.hp<=0||severCount(e)>=needSever(e))killEnemy(e,.5,true);else{e.kx+=(e.x-b.x)/(d+.1)*3;e.ky+=(e.y-b.y)/(d+.1)*3;}}}
    else if(e.kind==='barrel'&&d<1.9){const eb=e;G.events.push({t:G.playTime+.18,fn:()=>{if(!eb.gone)explode(eb);}});}
    else if(e.kind==='decor'&&(e.t==='pile'||e.t==='corpse')&&d<r*.7){e.gone=true;gibs(e.x,e.y,.1,6);}
  }
  if(P&&G.state==='play'){const d=Math.hypot(P.x-b.x,P.y-b.y);if(d<r)hurtPlayer(dmg*(1-d/r)*(o.src==='bloater'?D.dmg:Math.sqrt(D.dmg)),b,true,src);}
  const n=G.blastKills||0;G.blastKills=outer;if(G.state==='play')fireEvent('blast',{},{source:src,kills:n});
}
function hurtPlayer(dmg,src,raw,cause){
  if(P.dead||G.state!=='play'||G.god||G.scene)return;
  if(!raw)dmg*=D.dmg;G.damageTaken+=dmg;
  const ab=Math.min(P.armor,dmg*.6);P.armor-=ab;P.hp-=dmg-ab;
  FX.hurt=Math.min(1,FX.hurt+.6);FX.hdir=Math.atan2(src.y-P.y,src.x-P.x)-P.ang;G.shake=Math.max(G.shake,.35);S.hurt();
  if(P.hp<=0){if(G.buddha){P.hp=1;}else{P.hp=0;die(cause||'enemy');}}
  else if(P.hp<30&&!G.saidLow){G.saidLow=true;say("Ouch! That's coming out of my commission.",3,true);}
}
function die(cause){addStat('deaths');fireEvent('death',{},{cause:cause||'enemy'});P.dead=true;P.deathT=0;MUS.target=0;S.death(0,1);if(document.pointerLockElement)document.exitPointerLock();say("Great. Repossessed.",3,true);}

/* ================= GAME UPDATE ================= */
function updateEnemy(e,dt,dPlayer){
  if(e.flash>0)e.flash-=dt;if(e.cd>0)e.cd-=dt;
  const dx=P.x-e.x,dy=P.y-e.y,d=dPlayer;
  if(e.intro&&d<11&&Math.cos(Math.atan2(-dy,-dx)-P.ang)>.55&&los(e.x,e.y,P.x,P.y))enemyIntro(e);
  if(Math.abs(e.kx)+Math.abs(e.ky)>.02){moveEnt(e,e.kx*dt,e.ky*dt,e.r);const f=Math.pow(.004,dt);e.kx*=f;e.ky*=f;}
  switch(e.state){
    case 'dormant':if(d<e.wake&&los(e.x,e.y,P.x,P.y))wake(e);break;
    case 'idle':e.phase+=dt*.1;if(d<14&&((d<(G.diff>=3?10:8.5)&&los(e.x,e.y,P.x,P.y))||d<2.2))wake(e);break;
    case 'drop':e.t+=dt;e.z=Math.max(0,.9-e.t*2.2);if(e.t>.55){e.z=0;e.state='chase';}break;
    case 'rise':e.t+=dt;if(e.t>1)e.state='chase';break;
    case 'stagger':e.t-=dt;if(e.t<=0)e.state='chase';break;
    case 'chase':{
      if(d>40||G.notarget){break;}
      const canSpit=e.type==='spitter'&&!(e.mask&1);
      if(canSpit&&e.cd<=0&&d>2.2&&d<9&&!P.dead&&los(e.x,e.y,P.x,P.y)){e.state='spit';e.t=0;e.hit=false;break;}
      const reach=e.reach*(e.crawl?.8:1);
      if(d<reach&&e.cd<=0&&!P.dead){e.state='attack';e.t=0;e.hit=false;break;}
      let sp=e.speed*(e.crawl?.42:1)*(e.berserk?1.55:1);let tx=P.x,ty=P.y,away=false;
      const see=d<2.2||(d<7&&los(e.x,e.y,P.x,P.y));
      if(canSpit&&d<3.4&&see){away=true;sp*=.75;}
      else if(!see){
        const cx=e.x|0,cy=e.y|0,ci=I(cx,cy);let bv=flow[ci]<0?1e9:flow[ci],bx=cx,by=cy;
        for(const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+ox,ny=cy+oy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=I(nx,ny);if(flow[ni]<0||flow[ni]>=bv)continue;
          if(ox&&oy&&(flow[I(cx+ox,cy)]<0||flow[I(cx,cy+oy)]<0))continue;bv=flow[ni];bx=nx;by=ny;}
        tx=bx+.5;ty=by+.5;
      }
      let mx=tx-e.x,my=ty-e.y;if(away){mx=-mx;my=-my;}
      const l=Math.hypot(mx,my)||1,k=Math.min(1,dt*6);
      e.vx=lerp(e.vx,mx/l*sp,k);e.vy=lerp(e.vy,my/l*sp,k);moveEnt(e,e.vx*dt,e.vy*dt,e.r);e.phase+=dt*sp*.9;
      e.groanT-=dt;if(e.groanT<=0){e.groanT=4+R()*6;if(d<12){const [p,v]=panOf(e.x,e.y);(e.type==='brute'?S.roar:e.type==='crawler'||e.type==='spitter'?S.shriek:S.groan)(p,v*.7,e.type==='spitter'?1.3:1.5);}}
      break;}
    case 'spit':{
      e.t+=dt;
      if(!e.hit&&e.t>=.5){e.hit=true;
        const a=Math.atan2(P.y-e.y,P.x-e.x)+(R()-.5)*.1/D.spd;
        PROJ.push({kind:'spit',x:e.x+Math.cos(a)*.35,y:e.y+Math.sin(a)*.35,z:.62,vx:Math.cos(a)*6.5,vy:Math.sin(a)*6.5,life:3});
        const [p,v]=panOf(e.x,e.y);S.spit(p,v);}
      if(e.t>=.85){e.state='chase';e.cd=(2.2+R()*.8)/D.spd;}
      break;}
    case 'attack':{
      e.t+=dt;
      if(!e.hit&&e.t>=e.wind){e.hit=true;
        if(e.type==='bloater'){HITCAUSE='self';killEnemy(e,.5,true);break;}
        if(d<e.reach+.4&&!P.dead){let dmg=e.dmg;if(e.type!=='crawler'){const arms=((e.mask>>1)&1)+((e.mask>>2)&1);dmg*=arms===2?.35:arms===1?.65:1;}hurtPlayer(dmg,e);}}
      if(e.t>=e.wind+.3){e.state='chase';e.cd=(e.type==='brute'?1.1:.7)/D.spd;}
      break;}
  }
  if(e.state!=='dormant'&&e.state!=='ceiling'&&e.state!=='playdead'&&d<e.r+P.r+.05&&d>.001){const push=(e.r+P.r+.05-d)*.5;moveEnt(P,dx/d*push,dy/d*push,P.r);}
}
function updateProj(dt){
  for(let i=PROJ.length-1;i>=0;i--){
    const p=PROJ[i];p.life-=dt;
    if(p.kind==='spit'){
      const nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
      if(solidAt(nx,ny)||p.life<=0){splash(p);PROJ.splice(i,1);continue;}
      p.x=nx;p.y=ny;
      if(!P.dead&&Math.hypot(P.x-p.x,P.y-p.y)<.38){hurtPlayer(11,p,false,'spit');splash(p);PROJ.splice(i,1);continue;}
    }else{
      p.fuse-=dt;p.vz-=9.8*.75*dt;let nx=p.x+p.vx*dt,ny=p.y+p.vy*dt;
      if(solidAt(nx,p.y)){p.vx*=-.45;nx=p.x;bounceSnd(p);}
      if(solidAt(p.x,ny)){p.vy*=-.45;ny=p.y;bounceSnd(p);}
      p.x=nx;p.y=ny;p.z+=p.vz*dt;
      if(p.z<=0){p.z=0;if(Math.abs(p.vz)>1.2)bounceSnd(p);p.vz=-p.vz*.4;p.vx*=.6;p.vy*=.6;}
      let hit=false;for(const e of ENTS)if(e.kind==='enemy'&&!e.gone&&e.state!=='dead'&&Math.hypot(e.x-p.x,e.y-p.y)<e.r+.2&&p.z<1.1){hit=true;break;}
      if(p.fuse<=0||hit||p.life<=0){PROJ.splice(i,1);explode({x:p.x,y:p.y,sid:-1},{r:2.9,dmg:46,src:'bomb'});continue;}
    }
  }
}
function bounceSnd(p){if(G.clock-(p.bt||0)<.12)return;p.bt=G.clock;const [pn,v]=panOf(p.x,p.y);S.bounce(pn,v);}
function splash(p){const [pn,v]=panOf(p.x,p.y);S.splat(pn,v);for(let k=0;k<8;k++)addPart({x:p.x,y:p.y,z:p.z||.5,vx:(R()-.5)*2,vy:(R()-.5)*2,vz:R()*2,img:IMG.glob2,wh:.04,life:.6,t:'spark'});}
function ventCells(zids){
  const out=[];
  zids.forEach(zid=>{const z=LEVEL.zones.find(q=>q.id===zid);if(!z)return;
    for(let y=z.y1-1;y<=z.y2+1;y++)for(let x=z.x1-1;x<=z.x2+1;x++){if(map[I(x,y)]!==T.VENT)continue;
      for(const [dx,dy] of [[0,-1],[-1,0],[1,0],[0,1]]){const nx=x+dx,ny=y+dy;if(nx>=z.x1&&nx<=z.x2&&ny>=z.y1&&ny<=z.y2&&map[I(nx,ny)]===0){out.push([nx+.5,ny+.5]);break;}}}});
  return out;
}
function pickVent(v){const ok=v.filter(c=>Math.hypot(c[0]-P.x,c[1]-P.y)>3);const arr=ok.length?ok:v;return arr[(R()*arr.length)|0];}
function ventSpawnAt(c,type){
  const e=spawnEnemy(type,c[0],c[1],{drop:true});const [p,v]=panOf(c[0],c[1]);S.clang(p,v);
  setTimeout(()=>S.shriek(p,v,type==='crawler'?1.5:type==='spitter'?1.3:1),250);sparks(c[0],c[1],.9,10);
}
function autoSave(level){if(D.save==='area'||(D.save==='events'&&level==='events')){saveGame();msg('CHECKPOINT SAVED');}}
function playUpdate(dt){
  if(G.scene){updateScene(dt);return;}
  G.playTime+=dt;updateToasts(dt);updateHints(dt);
  if(edge('pause')){pauseGame();return;}
  if(edge('map')||edge('padMap'))G.mapOn=!G.mapOn;
  if(edge('guide')&&!P.dead)showGuide();
  if(G.guide){G.guide.t+=dt;G.guide.life-=dt;if(G.guide.life<=0)G.guide=null;}
  if(G.roomTag){G.roomTag.life-=dt;if(G.roomTag.life<=0)G.roomTag=null;}
  const inp=gather(dt);
  if(quipCD>0)quipCD-=dt;
  if(P.dead){
    P.deathT+=dt;updateLights(G.clock);updateParts(PARTS,dt);updateProj(dt);
    for(const e of ENTS)if(e.kind==='enemy'&&!e.gone)updateEnemy(e,dt,Math.hypot(P.x-e.x,P.y-e.y));
    if(P.deathT>2&&$('#over').hidden)showDeath();
    return;
  }
  if(G.guideTurn){if(inp.turn||inp.lx)G.guideTurn=null;else{const q=G.guideTurn;q.t+=dt;const u=Math.min(1,q.t/.33);P.ang=q.from+q.d*u*u*(3-2*u);if(u>=1)G.guideTurn=null;}}
  P.ang+=inp.turn*TURNS[OPT.turn][1]*dt+inp.lx;
  P.pitch=OPT.lookLock?0:clamp(P.pitch+inp.pr*110*dt+inp.ly,-RH*.42,RH*.42);
  const sp=(inp.run?4.6:3.0)*(G.water===2?.55:G.water===1?.72:1),ca=Math.cos(P.ang),sa=Math.sin(P.ang);
  let mvx=ca*inp.my-sa*inp.mx,mvy=sa*inp.my+ca*inp.mx;const ml=Math.hypot(mvx,mvy);if(ml>1){mvx/=ml;mvy/=ml;}
  const ox=P.x,oy=P.y;if(G.noclip){P.x=clamp(P.x+mvx*sp*dt*1.4,1,MW-1);P.y=clamp(P.y+mvy*sp*dt*1.4,1,MH-1);}else moveEnt(P,mvx*sp*dt,mvy*sp*dt,P.r);
  for(const e of ENTS)if(e.solid&&!e.gone){const dx=P.x-e.x,dy=P.y-e.y;if(Math.abs(dx)>1||Math.abs(dy)>1)continue;const d=Math.hypot(dx,dy),m=P.r+e.r;if(d<m&&d>.001)moveEnt(P,dx/d*(m-d),dy/d*(m-d),P.r);}
  const moved=Math.hypot(P.x-ox,P.y-oy);
  P.bobAmt=lerp(P.bobAmt,moved>.001?1:0,Math.min(1,dt*8));P.bob+=moved*3.4;
  const st=Math.floor(P.bob/Math.PI);if(st!==P.stepPh){P.stepPh=st;if(moved>.001)S.step();}
  if(edge('swap')||edge('padNext'))cycleWeapon(1);if(edge('padPrev'))cycleWeapon(-1);
  if(edge('w1'))selectWeapon(0);if(edge('w2'))selectWeapon(1);if(edge('w3'))selectWeapon(2);if(edge('w4'))selectWeapon(3);
  if(inp.fire||edge('fireE'))fire();
  if(edge('console')){pauseGame();openConsole();return;}
  if(edge('kick'))kick();
  if(edge('use'))use();
  if(P.cd>0)P.cd-=dt;if(P.kcd>0)P.kcd-=dt;if(P.anim>0)P.anim-=dt;if(P.switchT>0)P.switchT-=dt;
  if(P.kick>0){P.kick-=dt;if(!P.kickDone&&P.kick<.28){P.kickDone=true;applyKick();}}
  for(const e of ENTS)if(e.kind==='pickup'&&!e.gone&&Math.abs(e.x-P.x)<.7&&Math.abs(e.y-P.y)<.7&&Math.hypot(e.x-P.x,e.y-P.y)<.6){
    if(e.sid>=0)G.taken[e.sid]=1;if(take(e))e.gone=true;else if(e.sid>=0)delete G.taken[e.sid];}
  // zones, banners, ambushes
  const zi=zoneAt[I(P.x|0,P.y|0)];
  if(zi>=0&&zi!==G.curZone){G.curZone=zi;const z=LEVEL.zones[zi];if(!z.secret&&z.name!==G.lastRoom&&G.visited[z.name])G.roomTag={t:z.name,life:2.6};if(!z.secret)G.lastRoom=z.name;
    if(!G.vz[z.id]){G.vz[z.id]=1;G.lastProgress=G.playTime;fireEvent('enterZone',{zone:z.id});}
    if(!G.visited[z.name]){G.visited[z.name]=1;if(!z.secret){G.banner={t:z.name,life:3.2};if(G.playTime>2)autoSave('area');}}}
  for(const r of DK.deck.rules){const on=r.on;if(on.event!=='region'||G.won)continue;const z2=zoneAtXY(P.x,P.y);if(z2&&z2.id===on.zone&&P.y>=(on.minY||-1)&&cond(r.if))runActions(r.do,null);}
  updateWater(dt);
  G.flowT-=dt;if(G.flowT<=0){G.flowT=.35;buildFlow();}
  updateDoors(dt);
  const near=[];
  for(const e of ENTS)if(e.kind==='enemy'&&!e.gone){const d=Math.hypot(P.x-e.x,P.y-e.y);updateEnemy(e,dt,d);if(d<14&&e.state!=='dormant'&&e.state!=='ceiling'&&e.state!=='playdead')near.push(e);}
  for(let i=0;i<near.length;i++)for(let j=i+1;j<near.length;j++){const a=near[i],b=near[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r;if(d<m&&d>.001){const p=(m-d)/2;moveEnt(a,-dx/d*p,-dy/d*p,a.r);moveEnt(b,dx/d*p,dy/d*p,b.r);}}
  updateProj(dt);
  if(D.revive)for(const e of ENTS)if(e.kind==='decor'&&e.revive&&!e.gone){e.revive-=dt;if(e.revive<=0){
    if(Math.hypot(e.x-P.x,e.y-P.y)<16){e.gone=true;const c=spawnEnemy('crawler',e.x,e.y);c.state='rise';c.t=0;const [p,v]=panOf(e.x,e.y);S.shriek(p,v,1.4);
      if(!G.reviveTip){G.reviveTip=true;msg(PACKS.core.strings.reviveTip);showHint('stayDown');}}
    else e.revive=3;}}
  if(G.events.length){const due=G.events.filter(v=>v.t<=G.playTime);G.events=G.events.filter(v=>v.t>G.playTime);due.forEach(v=>v.fn());}
  if(ENTS.some(e=>e.gone))ENTS=ENTS.filter(e=>!e.gone);
  updateParts(PARTS,dt);updateLights(G.clock);
  let engaged=false;for(const e of near)if(e.state==='chase'||e.state==='attack'||e.state==='spit'){engaged=true;break;}
  if(!(MUS.hold>G.playTime))MUS.target=engaged?1:G.alarm?.35:0;
  G.ambT-=dt;if(G.ambT<=0){G.ambT=5+R()*8;const r=R(),pn=(R()-.5)*1.6;if(r<.35)S.groan(pn,.25);else if(r<.65)S.clang(pn,.2);else S.whisper(pn);}
  if(P.hp<30){P.heartT-=dt;if(P.heartT<=0){P.heartT=.9;S.heart();}}
  if(G.banner){G.banner.life-=dt;if(G.banner.life<=0)G.banner=null;}
}
// ---- saving ----
function packSeen(){let s='';for(let i=0;i<MAPN;i+=8){let b=0;for(let k=0;k<8;k++)if(seenMap[i+k])b|=1<<k;s+=String.fromCharCode(b);}return btoa(s);}
function unpackSeen(str){try{const s=atob(str);for(let j=0;j<s.length;j++){const b=s.charCodeAt(j);for(let k=0;k<8;k++)if(b&(1<<k))seenMap[j*8+k]=1;}}catch(e){}}
/* ================= SPRITES FOR RENDER ================= */
const PWH={med:.26,medbig:.3,cells:.28,shells:.24,shotgun:.18,key:.2,keyB:.2,keyY:.2,keyR:.2,armor:.32,log:.24,rivets:.22,bombs:.24,rivetgun:.2,satchel:.26,asset:.32};
const DWH={crate:.62,table:.42,arcade:.95,pile:.22,corpse:1,sign:.3,bunk:.62};
function getSprite(e){
  if(e.kind==='enemy')return {img:enemyImg(e),wh:WH[e.type],z:e.z||0};
  if(e.kind==='barrel')return {img:IMG.barrel,wh:.55,z:0};
  if(e.kind==='pickup'){const it=PACKS.core.tuning.items[e.t]||{};return {img:IMG[it.sprite||e.t]||IMG.med,wh:it.height||PWH[e.t]||.25,z:.06+Math.sin(G.clock*3+e.ph)*.04+(e.t==='asset'?.12:0),glow:e.t==='asset'?1:.55};}
  if(e.kind==='decor'){const t=e.t,dd=PACKS.core.tuning.decor[t]||{};return {img:IMG[dd.sprite||t]||IMG.pile,wh:dd.height||DWH[t]||.3,z:t==='sign'?.55:0,glow:t==='sign'?1:t==='arcade'?.25:0};}
  return null;
}
function buildSprites(ents,parts,cam,proj){
  const out=[],ca=Math.cos(cam.ang),sa=Math.sin(cam.ang);
  for(const e of ents){if(e.gone)continue;const dx=e.x-cam.x,dy=e.y-cam.y;if(dx*dx+dy*dy>900)continue;const depth=dx*ca+dy*sa;if(depth<.12)continue;
    const sp=getSprite(e);if(!sp)continue;out.push({x:e.x,y:e.y,depth,img:sp.img,wh:sp.wh,z:sp.z,glow:sp.glow||0,flip:false});}
  for(const p of parts){const dx=p.x-cam.x,dy=p.y-cam.y,depth=dx*ca+dy*sa;if(depth<.12||depth>24)continue;out.push({x:p.x,y:p.y,depth,img:p.img,wh:p.wh,z:p.z,glow:p.t==='fire'||p.t==='spark'?1:0,flip:!!p.flip});}
  if(proj)for(const p of proj){const dx=p.x-cam.x,dy=p.y-cam.y,depth=dx*ca+dy*sa;if(depth<.12||depth>24)continue;
    out.push({x:p.x,y:p.y,depth,img:p.kind==='spit'?IMG.glob:IMG.bombp,wh:p.kind==='spit'?.14:.1,z:p.z,glow:p.kind==='spit'?1:(((G.clock*8)|0)%2?.9:.4),flip:false});}
  out.sort((a,b)=>b.depth-a.depth);
  return out;
}

/* ================= RENDERER ================= */
function renderWorld(cam,sprites){
  const W=RW,H=RH,buf=BUF,z=ZB,cone=CONE,LR=LMr,LG=LMg,LB=LMb;
  const ca=Math.cos(cam.ang),sa=Math.sin(cam.ang),px=cam.x,py=cam.y;
  const hor=(H>>1)+cam.pitch,eye=.5+(cam.z||0),lamp=cam.lamp==null?1:cam.lamp;
  const fl=G.flash*(OPT.flash?.3:1),fr=G.flashC[0]*fl,fg=G.flashC[1]*fl,fb=G.flashC[2]*fl;
  const camL=-W/2/F,lpR=1.2*lamp,lpG=1.1*lamp,lpB=.92*lamp;
  for(let y=0;y<H;y++){
    let dy=y-hor+.5;const isF=dy>0;if(!isF)dy=-dy;const ro=y*W;
    if(dy<.6){buf.fill(0xff000000,ro,ro+W);continue;}
    const dist=(isF?eye:(1-eye))*F/dy;
    if(dist>36){buf.fill(0xff000000,ro,ro+W);continue;}
    let wx=px+dist*(ca-sa*camL),wy=py+dist*(sa+ca*camL);
    const stx=-dist*sa/F,sty=dist*ca/F,att=1/(1+dist*dist*.09),fatt=1/(1+dist*dist*.2);
    const ta=isF?FLO:CEI,tf=isF?floorT:ceilT,cm=isF?1:.78;
    for(let x=0;x<W;x++,wx+=stx,wy+=sty){
      if(wx<0||wy<0||wx>=MW||wy>=MH){buf[ro+x]=0xff000000;continue;}
      const mx=wx|0,my=wy|0,tx=((wx-mx)*64)|0,ty=((wy-my)*64)|0;
      const c=ta[tf[my*MW+mx]].px[(ty<<6)|tx],li=((wy*2)|0)*LMW+((wx*2)|0),cn=cone[ro+x]*att;
      const lr=(LR[li]+cn*lpR+fr*fatt)*cm,lg=(LG[li]+cn*lpG+fg*fatt)*cm,lb=(LB[li]+cn*lpB+fb*fatt)*cm;
      const r=(c&255)*lr,g=((c>>8)&255)*lg,b=((c>>16)&255)*lb;
      buf[ro+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);
    }
  }
  for(let x=0;x<W;x++){
    const camX=camL+x/F,rdx=ca-sa*camX,rdy=sa+ca*camX;
    let mapX=px|0,mapY=py|0;
    const ddx=rdx===0?1e30:Math.abs(1/rdx),ddy=rdy===0?1e30:Math.abs(1/rdy);
    let stepX,stepY,sdx,sdy;
    if(rdx<0){stepX=-1;sdx=(px-mapX)*ddx;}else{stepX=1;sdx=(mapX+1-px)*ddx;}
    if(rdy<0){stepY=-1;sdy=(py-mapY)*ddy;}else{stepY=1;sdy=(mapY+1-py)*ddy;}
    let hit=0,side=0,dist=40,tu=0,tid=0,lcx=0,lcy=0;
    for(let n=0;n<64;n++){
      if(sdx<sdy){sdx+=ddx;mapX+=stepX;side=0;}else{sdy+=ddy;mapY+=stepY;side=1;}
      if(mapX<0||mapY<0||mapX>=MW||mapY>=MH)break;
      const i=mapY*MW+mapX,t=map[i];seenMap[i]=1;if(!t)continue;
      const d=doorAt[i];
      if(d){
        if(d.h){if(rdy===0)continue;const tt=(mapY+.5-py)/rdy;if(tt<0)continue;const hx=px+tt*rdx;if(hx<mapX||hx>=mapX+1)continue;const u=hx-mapX;if(u<d.open)continue;dist=tt;tu=u-d.open;side=1;}
        else{if(rdx===0)continue;const tt=(mapX+.5-px)/rdx;if(tt<0)continue;const hy=py+tt*rdy;if(hy<mapY||hy>=mapY+1)continue;const u=hy-mapY;if(u<d.open)continue;dist=tt;tu=u-d.open;side=0;}
        tid=t;hit=1;lcx=mapX+.5;lcy=mapY+.5;
        if(d.h)lcy-=stepY*.6;else lcx-=stepX*.6;
        break;
      }
      if(side===0){dist=sdx-ddx;tu=py+dist*rdy;tu-=Math.floor(tu);if(rdx<0)tu=1-tu;lcx=mapX-stepX*.25+.5;lcy=py+dist*rdy;}
      else{dist=sdy-ddy;tu=px+dist*rdx;tu-=Math.floor(tu);if(rdy>0)tu=1-tu;lcx=px+dist*rdx;lcy=mapY-stepY*.25+.5;}
      tid=t;hit=1;break;
    }
    z[x]=dist;if(!hit)continue;
    const lh=F/dist,top=hor-(1-eye)*lh,bot=hor+eye*lh;
    const y0=Math.max(0,Math.ceil(top)),y1=Math.min(H-1,Math.floor(bot));if(y1<y0)continue;
    const tex=TEX[tid],tx=Math.min(63,(tu*64)|0),txp=tex.px,tem=tex.em;
    const li=clamp((lcy*2)|0,0,LMH-1)*LMW+clamp((lcx*2)|0,0,LMW-1);
    const sh=side?.76:1,att=1/(1+dist*dist*.09),fatt=1/(1+dist*dist*.2);
    const br=LR[li]*sh+fr*fatt,bg=LG[li]*sh+fg*fatt,bb=LB[li]*sh+fb*fatt;
    const st=64/lh;let tp=(y0-top)*st;
    for(let y=y0;y<=y1;y++,tp+=st){
      const ti=((tp&63)<<6)|tx,c=txp[ti];let lr,lg,lb;
      if(tem[ti]){lr=lg=lb=1.15;}else{const cn=cone[y*W+x]*att*sh;lr=br+cn*lpR;lg=bg+cn*lpG;lb=bb+cn*lpB;}
      const r=(c&255)*lr,g=((c>>8)&255)*lg,b=((c>>16)&255)*lb;
      buf[y*W+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);
    }
  }
  for(const s of sprites){
    const dx=s.x-px,dy=s.y-py,depth=s.depth,lat=-dx*sa+dy*ca,sx=W/2+F*lat/depth;
    const img=s.img,h=F*s.wh/depth,w=h*img.w/img.h,bot=hor+(eye-(s.z||0))*F/depth,top=bot-h,x0=sx-w/2;
    const xs=Math.max(0,Math.ceil(x0)),xe=Math.min(W-1,Math.floor(x0+w));if(xe<xs)continue;
    const ys=Math.max(0,Math.ceil(top)),ye=Math.min(H-1,Math.floor(bot));if(ye<ys)continue;
    const li=clamp((s.y*2)|0,0,LMH-1)*LMW+clamp((s.x*2)|0,0,LMW-1);
    const att=1/(1+depth*depth*.09),fatt=1/(1+depth*depth*.2);
    const cn=cone[clamp(((top+bot)/2)|0,0,H-1)*W+clamp(sx|0,0,W-1)]*att;
    let lr=LR[li]+cn*lpR+fr*fatt,lg=LG[li]+cn*lpG+fg*fatt,lb=LB[li]+cn*lpB+fb*fatt;
    if(s.glow){lr=Math.max(lr,s.glow);lg=Math.max(lg,s.glow);lb=Math.max(lb,s.glow);}
    const vst=img.h/h,iw=img.w,ip=img.px,ia=img.a,ie=img.em;
    for(let x=xs;x<=xe;x++){
      if(depth>=z[x])continue;
      let u=((x-x0)/w*iw)|0;if(u>=iw)u=iw-1;if(s.flip)u=iw-1-u;
      let v=(ys-top)*vst;
      for(let y=ys;y<=ye;y++,v+=vst){
        const pi=(v|0)*iw+u;if(!ia[pi])continue;const c=ip[pi];
        let r,g,b;if(ie[pi]){r=c&255;g=(c>>8)&255;b=(c>>16)&255;}else{r=(c&255)*lr;g=((c>>8)&255)*lg;b=((c>>16)&255)*lb;}
        buf[y*W+x]=0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r);
      }
    }
  }
  ctx.putImageData(IMGD,0,0);
}

/* ================= VIEWMODEL ================= */
function lightAtPlayer(x,y){const li=clamp((y*2)|0,0,LMH-1)*LMW+clamp((x*2)|0,0,LMW-1);return clamp((LMr[li]+LMg[li]+LMb[li])/3*1.3+.32+G.flash*.35,.25,1.15);}
function drawVM(w,o){
  const g=vmg,s=RH/180;g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,RW,RH);
  const lift=o.lift==null?(IN.touchMode?4:19):o.lift;const bx=RW*.5+o.bobX*s,by=RH-lift*s+o.bobY*s+(o.switchT>0?o.switchT*170*s:0);
  const rec=o.anim>0?o.anim*(w===0?55:w===2?30:70):0;
  g.save();
  if(w===0){
    g.translate(bx+34*s,by+rec*s);g.scale(s,s);
    g.fillStyle='#3d454e';poly(g,[[-46,-58],[22,-58],[34,2],[-58,2]]);
    g.fillStyle='#59626c';poly(g,[[-44,-58],[20,-58],[17,-49],[-41,-49]]);
    g.fillStyle='#d9761e';poly(g,[[-52,-27],[28,-27],[30,-18],[-55,-18]]);
    g.fillStyle='#16191c';for(let x=-52;x<30;x+=12)poly(g,[[x,-27],[x+5,-27],[x+2,-18],[x-3,-18]]);
    g.fillStyle='#22272c';g.fillRect(-42,-70,60,13);g.fillStyle='#2f363d';g.fillRect(-42,-70,60,3);
    g.fillStyle='#0e1114';for(const ex of [-34,-16,2])g.fillRect(ex,-75,12,6);
    g.fillStyle='#262321';poly(g,[[-74,2],[-62,-30],[-48,-34],[-42,2]]);g.fillStyle='#a4581f';g.fillRect(-76,-4,32,6);
    g.fillStyle='#262321';poly(g,[[18,2],[24,-24],[40,-22],[50,2]]);g.fillStyle='#3a3532';g.fillRect(26,-20,12,3);
  }else if(w===1){
    g.translate(bx+6*s,by+(rec+20)*s);g.scale(s,s);
    g.fillStyle='#24282c';poly(g,[[-34,2],[-14,-88],[14,-88],[34,2]]);
    g.fillStyle='#5b636b';poly(g,[[-27,2],[-11,-88],[-8,-88],[-19,2]]);poly(g,[[19,2],[8,-88],[11,-88],[27,2]]);
    g.fillStyle='#14171a';poly(g,[[-3,2],[-1,-88],[1,-88],[3,2]]);g.fillStyle='#3a4148';poly(g,[[-6,2],[-2.5,-88],[-1,-88],[-3,2]]);
    g.fillStyle='#0a0a0a';ell(g,-7,-88,6,2.6);ell(g,7,-88,6,2.6);g.fillStyle='#8a96a1';g.fillRect(-1,-92,2,3);
    g.fillStyle='#6b3a1e';poly(g,[[-44,-12],[44,-12],[52,2],[-52,2]]);g.fillStyle='#4e2a15';for(let i=-40;i<44;i+=10)g.fillRect(i,-10,6,1);
    g.fillStyle='#262321';poly(g,[[-60,2],[-44,-26],[-24,-22],[-28,2]]);g.fillStyle='#a4581f';g.fillRect(-64,-4,34,6);
  }else if(w===2){
    g.translate(bx+18*s,by+(rec+6)*s);g.scale(s,s);
    g.fillStyle='#2b3035';poly(g,[[-34,2],[-24,-64],[12,-64],[24,2]]);
    g.fillStyle='#4a535c';poly(g,[[-26,-64],[10,-64],[8,-72],[-24,-72]]);
    g.fillStyle='#d9761e';g.fillRect(-28,-40,46,6);g.fillStyle='#16191c';for(let x=-26;x<16;x+=9)g.fillRect(x,-40,4,6);
    g.fillStyle='#16191c';g.fillRect(-14,-86,14,16);g.fillStyle='#5b636b';g.fillRect(-14,-86,14,3);
    g.fillStyle='#1a1f24';ell(g,22,-30,15,15);g.fillStyle='#3a434c';ell(g,22,-30,10,10);g.fillStyle='#c8ccd0';for(let k=0;k<6;k++){const an=k/6*Math.PI*2;g.fillRect(22+Math.cos(an)*6-1,-30+Math.sin(an)*6-1,2,2);}
    g.fillStyle='#262321';poly(g,[[-52,2],[-40,-28],[-22,-24],[-24,2]]);g.fillStyle='#a4581f';g.fillRect(-56,-4,34,6);
  }else{
    g.translate(bx+42*s,by+(rec*.6)*s);g.scale(s,s);
    if(o.bombs>0){g.fillStyle='#3d454e';g.fillRect(-4,-82,30,40);g.fillStyle='#59626c';g.fillRect(-4,-82,30,4);g.fillStyle='#c9a227';g.fillRect(-4,-64,30,6);g.fillStyle='#1a1d20';g.fillRect(6,-90,10,8);}
    g.fillStyle='#262321';poly(g,[[-14,2],[-6,-50],[34,-50],[44,2]]);g.fillStyle='#3a3532';g.fillRect(-2,-46,32,4);g.fillStyle='#a4581f';g.fillRect(-18,-4,64,6);
  }
  g.restore();
  if(o.kick>0){
    const p=1-o.kick/.42,lift=Math.sin(clamp(p,0,1)*Math.PI);
    g.save();g.translate(RW*.4,RH+70*s-lift*105*s);g.scale(s*(1+lift*.35),s*(1+lift*.35));
    g.fillStyle='#2c3a55';poly(g,[[-26,60],[22,60],[18,0],[-20,0]]);
    g.fillStyle='#4a2e1a';poly(g,[[-30,4],[26,4],[30,-34],[-34,-34]]);g.fillStyle='#3a2414';g.fillRect(-28,-12,54,4);
    g.fillStyle='#7c8892';poly(g,[[-34,-34],[30,-34],[24,-48],[-28,-48]]);
    g.fillStyle='#16110c';g.fillRect(-36,-38,70,5);for(let i=-30;i<30;i+=8)g.fillRect(i,-42,4,3);
    g.restore();
  }
  const L=o.light;
  g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(0,0,0,${clamp(1-L,0,.85).toFixed(3)})`;g.fillRect(0,0,RW,RH);
  if(G.flash>.2){g.fillStyle=`rgba(${(G.flashC[0]*180)|0},${(G.flashC[1]*140)|0},${(G.flashC[2]*110)|0},${Math.min(OPT.flash?.12:.4,G.flash*(OPT.flash?.05:.15)).toFixed(3)})`;g.fillRect(0,0,RW,RH);}
  g.globalCompositeOperation='source-over';
  if(w===0){
    g.save();g.translate(bx+34*s,by+rec*s);g.scale(s,s);
    const gl=o.anim>0?1:.75;g.fillStyle=`rgba(95,246,255,${gl})`;for(const ex of [-34,-16,2])g.fillRect(ex+3,-74,6,3);
    g.font='8px Silkscreen, monospace';g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(95,246,255,.9)';g.fillText(String(o.ammo).padStart(2,'0'),-14,-53);
    g.restore();
  }else if(w===2&&o.anim>0){
    g.save();g.translate(bx+18*s,by+(rec+6)*s);g.scale(s,s);g.globalCompositeOperation='lighter';
    const gr=g.createRadialGradient(-7,-90,0,-7,-90,16);gr.addColorStop(0,'rgba(255,250,210,1)');gr.addColorStop(.5,'rgba(255,170,40,.7)');gr.addColorStop(1,'rgba(255,80,0,0)');g.fillStyle=gr;g.fillRect(-23,-106,32,32);g.restore();
  }else if(w===3&&o.bombs>0){
    g.save();g.translate(bx+42*s,by+(rec*.6)*s);g.scale(s,s);g.fillStyle=((G.clock*4)|0)%2?'#ff3030':'#5a0a0a';g.fillRect(8,-89,6,4);g.restore();
  }else if(w===1&&o.anim>.2){
    g.save();g.translate(bx+6*s,by+(rec+20)*s);g.scale(s,s);g.globalCompositeOperation='lighter';
    for(const mx of [-7,7]){const gr=g.createRadialGradient(mx,-98,0,mx,-98,30);gr.addColorStop(0,'rgba(255,250,210,1)');gr.addColorStop(.4,'rgba(255,170,40,.8)');gr.addColorStop(1,'rgba(255,80,0,0)');g.fillStyle=gr;g.fillRect(mx-30,-128,60,60);}
    g.restore();
  }
  ctx.drawImage(vmc,0,0);
}
function drawBeam(){
  if(FX.beam<=0)return;const p=1-FX.beam/.16,cy=RH/2,w=RW*.95*(1-p)+10;
  ctx.save();ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=`rgba(95,246,255,${(1-p)*.45})`;ctx.fillRect(RW/2-w/2,cy-2,w,5);
  ctx.fillStyle=`rgba(230,255,255,${1-p*.6})`;ctx.fillRect(RW/2-w/2,cy,w,1);
  ctx.restore();
}

/* ================= FACE / HUD ================= */
function drawFace(g,x,y,s,hp,mood,look){
  const Px=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(x+px*s,y+py*s,w*s,h*s);};
  const skin='#d39a63',dk='#a8743f';
  Px(3,1,10,2,'#2a1b12');Px(2,2,12,2,'#2a1b12');
  Px(3,4,10,9,skin);Px(2,6,1,4,dk);Px(13,6,1,4,dk);
  Px(3,3,10,2,'#1d2b30');Px(4,3,3,2,'#3fe0c5');Px(9,3,3,2,'#3fe0c5');Px(5,3,1,1,'#bfffff');Px(10,3,1,1,'#bfffff');
  Px(4,6,3,1,'#3a2718');Px(9,6,3,1,'#3a2718');
  const lx=look||0;Px(4,7,3,1,'#f1efe8');Px(9,7,3,1,'#f1efe8');Px(5+lx,7,1,1,'#1a1410');Px(10+lx,7,1,1,'#1a1410');
  Px(7,8,2,2,dk);
  Px(4,10,8,3,'#b98552');for(let i=0;i<6;i++)Px(4+((i*5)%8),10+(i%3),1,1,'#7a5a3a');
  if(mood==='grin'){Px(5,11,6,1,'#5a1a10');Px(6,11,4,1,'#f4f1ea');}
  else if(mood==='pain'){Px(5,11,6,2,'#3a0c08');Px(6,11,4,1,'#f4f1ea');}
  else{Px(5,11,6,1,'#5a1a10');}
  Px(11,11,3,1,'#d9c08a');
  Px(5,13,6,2,skin);Px(6,15,4,1,dk);
  if(hp<60){Px(3,8,2,2,'#6a4a7a');}
  if(hp<30){Px(10,4,1,5,'#a0101a');Px(11,8,1,3,'#a0101a');Px(4,12,1,2,'#a0101a');}
}
function txt(g,t,x,y,c,font,align){g.font=font||'8px Silkscreen, monospace';g.textAlign=align||'left';g.fillStyle='rgba(0,0,0,.85)';g.fillText(t,x+1,y+1);g.fillStyle=c;g.fillText(t,x,y);}
let faceLook=0,faceT=0,grinT=0;
function drawKeys(g,x,y){
  for(const [k,c] of Object.entries(DK&&DK.deck.keys||{}).map(([k,v])=>[k,v.color])){
    if(P.keys[k]){g.fillStyle=c;g.fillRect(x,y,9,6);g.fillStyle='#e8edf1';g.fillRect(x,y+2,9,1);}
    else{g.strokeStyle='rgba(139,152,165,.35)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,8,5);}
    x+=11;
  }
}
function drawHUD(dt){
  const g=ctx;g.textBaseline='top';const touch=IN.touchMode,cx=RW>>1,cy=RH>>1;
  g.fillStyle=FX.hit>0?'#ff3048':'rgba(95,246,255,.9)';
  if(P.wpn===0){g.fillRect(cx-10,cy,6,1);g.fillRect(cx+5,cy,6,1);g.fillRect(cx,cy-3,1,2);g.fillRect(cx,cy+2,1,2);}
  else if(P.wpn===1){for(const [a,b] of [[-5,0],[5,0],[0,-5],[0,5],[-4,-3],[4,-3],[-4,3],[4,3]])g.fillRect(cx+a,cy+b,1,1);}
  else if(P.wpn===2){g.fillRect(cx-4,cy,3,1);g.fillRect(cx+2,cy,3,1);g.fillRect(cx,cy-4,1,3);g.fillRect(cx,cy+2,1,3);}
  else{g.fillRect(cx-1,cy-1,3,3);}
  if(OPT.dot){g.fillStyle='rgba(0,0,0,.8)';g.fillRect(cx-1,cy-1,3,3);g.fillStyle='#ffffff';g.fillRect(cx,cy,1,1);}
  for(let i=POPS.length-1;i>=0;i--){const p=POPS[i];p.life-=dt;if(p.life<=0){POPS.splice(i,1);continue;}txt(g,p.t,cx,cy-12-(1-p.life)*14,p.c,'8px Silkscreen, monospace','center');}
  if(FX.hurt>0){g.fillStyle=`rgba(170,0,18,${(FX.hurt*(OPT.flash?.18:.45)).toFixed(3)})`;g.fillRect(0,0,RW,RH);
    const a=FX.hdir-Math.PI/2;g.strokeStyle=`rgba(255,40,60,${FX.hurt.toFixed(3)})`;g.lineWidth=3;g.beginPath();g.arc(cx,cy,34,a+Math.PI/2-.45,a+Math.PI/2+.45);g.stroke();}
  if(FX.pick>0){g.fillStyle=`rgba(255,182,39,${(FX.pick*(OPT.flash?.12:.35)).toFixed(3)})`;g.fillRect(0,0,RW,RH);}
  if(P.hp<30){const pul=.25+.2*Math.sin(G.clock*6);const gr=g.createRadialGradient(cx,cy,RH*.3,cx,cy,RW*.7);gr.addColorStop(0,'rgba(120,0,10,0)');gr.addColorStop(1,`rgba(120,0,10,${pul.toFixed(3)})`);g.fillStyle=gr;g.fillRect(0,0,RW,RH);}
  faceT-=dt;if(faceT<=0){faceT=1.2+R()*2;faceLook=[-1,0,0,1][(R()*4)|0];}if(grinT>0)grinT-=dt;
  const mood=FX.hurt>.3?'pain':grinT>0||FX.hit>0?'grin':'';
  const hc=P.hp>60?'#3fe0c5':P.hp>30?'#ffb627':'#ff3048',am=ammoOf(P.wpn),wn=WNAME[P.wpn];
  if(!touch){
    const by=RH-21;g.fillStyle='rgba(10,12,15,.9)';g.fillRect(0,by,RW,21);g.fillStyle='#39424c';g.fillRect(0,by,RW,1);
    txt(g,String(Math.ceil(P.hp)),8,by+3,hc,'16px Silkscreen, monospace');
    txt(g,'ARMOR '+(P.armor|0),44,by+3,'#9aa7b3');
    for(let i=0;i<10;i++){g.fillStyle=i<Math.ceil(P.hp/10)?hc:'#1f262d';g.fillRect(44+i*5,by+13,4,4);}
    g.fillStyle='#0a0c0f';g.fillRect(cx-14,by-7,28,28);g.fillStyle='#39424c';g.fillRect(cx-14,by-7,28,1);g.fillRect(cx-14,by-7,1,28);g.fillRect(cx+13,by-7,1,28);
    drawFace(g,cx-12,by-5,1.5,P.hp,mood,faceLook);
    txt(g,String(am),RW-8,by+3,'#ffb627','16px Silkscreen, monospace','right');
    txt(g,wn,RW-44,by+3,'#9aa7b3','8px Silkscreen, monospace','right');
    drawKeys(g,cx+20,by+12);
    if(P.has[3]&&P.wpn!==3)txt(g,'CHG '+P.bombs,RW-44,by+12,'#9aa7b3','8px Silkscreen, monospace','right');
  }else{
    txt(g,String(Math.ceil(P.hp)),8,6,hc,'16px Silkscreen, monospace');
    txt(g,'ARM '+(P.armor|0),50,6,'#9aa7b3');
    for(let i=0;i<10;i++){g.fillStyle=i<Math.ceil(P.hp/10)?hc:'#1f262d';g.fillRect(50+i*4,16,3,3);}
    txt(g,String(am),RW-8,20,'#ffb627','16px Silkscreen, monospace','right');
    txt(g,wn,RW-8,36,'#9aa7b3','8px Silkscreen, monospace','right');
    drawKeys(g,RW-40,47);
  }
  const my0=touch?26:5;let n=0;
  for(let i=MSGS.length-1;i>=0;i--){const m=MSGS[i];m.life-=dt;if(m.life<=0){MSGS.splice(i,1);continue;}}
  for(const m of MSGS){g.globalAlpha=Math.min(1,m.life*2);txt(g,m.t,6,my0+n*10,'#e8edf1');n++;}
  g.globalAlpha=1;
  if(G.roomTag&&!G.banner&&!G.mapOn){const rt=G.roomTag,a=Math.min(1,rt.life*2,(2.6-rt.life)*5);g.globalAlpha=Math.max(0,a);g.font='8px Silkscreen, monospace';
    const w=g.measureText(rt.t).width+10,X=6,Y=touch?RH-16:my0+n*10+2;g.fillStyle='rgba(4,6,10,.7)';g.fillRect(X,Y,w,12);g.fillStyle='#3fe0c5';g.fillRect(X,Y,2,12);
    txt(g,rt.t,X+5,Y+2,'#e8edf1','8px Silkscreen, monospace','left');g.globalAlpha=1;}
  if(G.banner&&!G.mapOn){const a2=Math.min(1,G.banner.life*1.5,(3.2-G.banner.life)*4);g.globalAlpha=Math.max(0,a2);
    txt(g,'DECK '+deckNN(),cx,RH*.32,'#8b98a5','8px Silkscreen, monospace','center');txt(g,G.banner.t,cx,RH*.32+9,'#e8edf1','8px Silkscreen, monospace','center');g.globalAlpha=1;}
  if(G.objT>0&&G.obj&&!G.mapOn){G.objT-=dt;g.globalAlpha=Math.min(1,G.objT*2);drawObjective(g,touch);g.globalAlpha=1;}
  drawHint(g);drawToast(g);
}
// The objective sits in a small box in the top-right corner (left of the touch PATH button on phones).
function drawObjective(g,touch){
  g.font='8px Silkscreen, monospace';const w=Math.min(150,RW*.46),x=RW-w-4,y=touch?40:4,lines=[];let line='';
  for(const wd of ('OBJECTIVE: '+G.obj.toUpperCase()).split(' ')){const t=line?line+' '+wd:wd;if(g.measureText(t).width>w-8&&line){lines.push(line);line=wd;}else line=t;}if(line)lines.push(line);
  const h=lines.length*9+5;g.fillStyle='rgba(4,6,10,.72)';g.fillRect(x,y,w,h);g.fillStyle='#ffb627';g.fillRect(x,y,2,h);
  lines.forEach((l,k)=>txt(g,l,x+5,y+3+k*9,k===0?'#ffb627':'#e8edf1','8px Silkscreen, monospace'));
}
function wrapTxt(g,t,x,y,w,c){g.font='8px Silkscreen, monospace';const words=t.split(' ');let line='',yy=y;
  for(const wd of words){const test=line?line+' '+wd:wd;if(g.measureText(test).width>w&&line){txt(g,line,x,yy,c,null,'center');line=wd;yy+=10;}else line=test;}
  if(line)txt(g,line,x,yy,c,null,'center');}
const MAP_ITEMS={has:t=>{const it=PACKS.core.tuning.items[t];return !!(it&&it.mapItem);}};
function mapStatus(){
  const zs=LEVEL.zones.map(()=>({items:0,secrets:0}));
  for(const e of ENTS)if(e.kind==='pickup'&&!e.gone&&MAP_ITEMS.has(e.t)){const z=zoneAt[I(e.x|0,e.y|0)];if(z>=0)zs[z].items++;}
  for(const d of doors){if(d.lock!=='secret')continue;
    for(const j of [I(d.x-1,d.y),I(d.x+1,d.y),I(d.x,d.y-1),I(d.x,d.y+1)]){const z=zoneAt[j];if(z>=0&&!LEVEL.zones[z].secret)zs[z].secrets++;}}
  return zs;
}
function drawAutomap(){
  const g=ctx,cs=3,touch=IN.touchMode,cx=RW/2,cy=RH/2+(touch?6:-6);
  g.fillStyle='rgba(2,6,9,.88)';g.fillRect(0,0,RW,RH);
  const ox=Math.round(cx-P.x*cs),oy=Math.round(cy-P.y*cs);
  const x0=Math.max(0,Math.floor(P.x-cx/cs)-1),x1=Math.min(MW-1,Math.ceil(P.x+cx/cs)+1),y0=Math.max(0,Math.floor(P.y-cy/cs)-1),y1=Math.min(MH-1,Math.ceil(P.y+(RH-cy)/cs)+1);
  const zs=mapStatus(),Z=LEVEL.zones;
  const visited=Z.map(z=>!!G.vz[z.id]);
  const DC={none:'#c8d0d8',opened:'#c8d0d8'};for(const [k,l] of Object.entries(DK.deck.locks))if(l.map)DC[k]=l.map;
  // floors: explored rooms are filled whole, tinted by status; elsewhere only what you've seen
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=I(x,y),t=map[i];if(t!==0||doorAt[i])continue;
    const z=zoneAt[i];let c=null;
    if(z>=0&&visited[z])c=zs[z].items>0?'#6a1e28':'#1c3f6e';
    else if(seenMap[i])c='#1f2c36';
    else if(G.mapReal&&KNOWN[i])c='#17222b';
    if(c&&WATER[i])c=WATER[i]===2?'#173f66':'#2a5f86';
    if(c){g.fillStyle=c;g.fillRect(ox+x*cs,oy+y*cs,cs,cs);}
  }
  // Gorgon's schematic: faint dotted floor and outline wherever Buck hasn't been, until a floor-plan terminal replaces it
  if(SCHEM&&!G.mapReal)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=I(x,y);if(seenMap[i]||(zoneAt[i]>=0&&visited[zoneAt[i]]&&map[i]===0))continue;
    if(SCHEM[i]){if((x+y)%2===0){g.fillStyle='#24566a';g.fillRect(ox+x*cs+1,oy+y*cs+1,1,1);}continue;}
    if(SCHEM[i-1]||SCHEM[i+1]||SCHEM[i-MW]||SCHEM[i+MW]){g.fillStyle='#3f8aa0';g.fillRect(ox+x*cs+1,oy+y*cs+1,1,1);}
  }
  // walls and doors that border explored rooms or that you've seen
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const i=I(x,y),t=map[i],d=doorAt[i];if(t===0&&!d)continue;
    let show=seenMap[i];
    if(!show)for(const j of [i-1,i+1,i-MW,i+MW]){const z=zoneAt[j];if(z>=0&&visited[z]&&map[j]===0&&!doorAt[j]){show=1;break;}}
    let dim=false;
    if(!show&&G.mapReal&&(d?d.lock!=='secret':(KNOWN[i-1]||KNOWN[i+1]||KNOWN[i-MW]||KNOWN[i+MW]))){show=1;dim=true;}
    if(!show)continue;
    let c;
    if(d)c=d.lock==='secret'?'#5d6873':(d.ready?'#2cff6a':DC[d.lock]||'#c8d0d8');
    else c=DK.mapColor[t]||'#5d6873';
    g.fillStyle=c;if(dim)g.globalAlpha=.55;g.fillRect(ox+x*cs,oy+y*cs,cs,cs);g.globalAlpha=1;
  }
  // secret hints: a blinking ? in explored rooms that still hide one
  const blink=((G.clock*2)|0)%2===0;
  g.textBaseline='middle';
  Z.forEach((z,zi)=>{if(!visited[zi]||z.secret||!zs[zi].secrets)return;if(G.diff>=2&&zs[zi].items>0)return;
    const mx=ox+(z.x1+z.x2+1)/2*cs,my=oy+(z.y1+z.y2+1)/2*cs;if(mx<-8||my<-8||mx>RW+8||my>RH+8)return;
    g.fillStyle=blink?'#ffb627':'#8a6a20';g.font='8px Silkscreen, monospace';g.textAlign='center';g.fillText('?',mx,my);});
  // player
  const px=ox+P.x*cs,py=oy+P.y*cs,a=P.ang;
  if(G.guide){const ln=G.guide.line;g.strokeStyle='rgba(95,246,255,.9)';g.lineWidth=1.5;g.setLineDash([3,2]);g.beginPath();ln.forEach((q,k)=>{const X=ox+q[0]*cs,Y=oy+q[1]*cs;k?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();g.setLineDash([]);
    const e=ln[ln.length-1];g.fillStyle=((G.clock*4)|0)%2?'#5ff6ff':'#1a6f7a';g.fillRect(ox+e[0]*cs-2,oy+e[1]*cs-2,4,4);}
  g.fillStyle='#ffb627';g.beginPath();g.moveTo(px+Math.cos(a)*5,py+Math.sin(a)*5);g.lineTo(px+Math.cos(a+2.5)*3.5,py+Math.sin(a+2.5)*3.5);g.lineTo(px+Math.cos(a-2.5)*3.5,py+Math.sin(a-2.5)*3.5);g.closePath();g.fill();
  // header, totals, legend
  g.textBaseline='top';const zc=zoneAtXY(P.x,P.y),ty=touch?26:5;
  g.fillStyle='rgba(2,6,9,.95)';g.fillRect(0,0,RW,ty+20);
  txt(g,'DECK '+deckNN()+' MAP',6,ty,'#ffb627');if(zc&&!zc.secret)txt(g,zc.name,6,ty+10,'#e8edf1');
  const n=o=>Object.keys(o||{}).length;
  const tot=`SECRETS ${n(G.secrets)}/${G.secretTotal}  LOGS ${n(G.logs)}/${G.logTotal}  ASSETS ${n(G.assets)}/${G.assetTotal}`;
  txt(g,tot,RW-6,ty,'#8b98a5','8px Silkscreen, monospace','right');
  const ly=touch?RH-12:RH-32;g.font='8px Silkscreen, monospace';
  g.fillStyle='rgba(2,6,9,.95)';g.fillRect(0,ly-4,RW,touch?16:36);
  // legend entries wrap onto a second row (the strip is two rows tall except in touch mode)
  const ents=[...[['CLEARED','#2f6fbf'],['ITEMS LEFT','#b8303f'],...(DK.deck.mapLegend||[]).filter(m=>m[0]!=='WATER')].map(([t,c])=>({t,draw:(x,y)=>{g.fillStyle=c;g.fillRect(x,y+2,4,4);}})),
    {t:'SECRET',draw:(x,y)=>txt(g,'?',x-1,y,'#ffb627')}];
  if(SCHEM&&!G.mapReal)ents.push({t:"GORGON'S PLAN",draw:(x,y)=>{g.fillStyle='#3f8aa0';for(let k=0;k<3;k++)g.fillRect(x-1+k*2,y+3,1,1);}});
  let lx=6,lr=ly;
  for(const e of ents){const w=g.measureText(e.t).width+6;if(lx+w>RW-6&&lx>6){if(touch)break;lx=6;lr+=12;}e.draw(lx,lr);txt(g,e.t,lx+6,lr,'#8b98a5');lx+=w+8;}
}

/* ================= PLAY RENDER ================= */
function playRender(dt){
  const sh=OPT.shake?G.shake:0;
  const bobY=OPT.bob?Math.abs(Math.sin(P.bob))*2*P.bobAmt:0;
  CAM={x:P.x,y:P.y,ang:P.ang+(R()-.5)*sh*.05,pitch:P.pitch+(R()-.5)*sh*8-bobY+1+(G.water===2?Math.sin(G.clock*2.1)*2:0),z:P.dead?-Math.min(.36,P.deathT*.4):G.water===2?-.3:G.water===1?-.14:0,lamp:P.dead?Math.max(0,1-P.deathT*.5):1};
  seenMap[I(P.x|0,P.y|0)]=1;
  renderWorld(CAM,buildSprites(ENTS,PARTS,CAM,PROJ));
  drawGuideLine(CAM);
  drawBeam();
  drawWaterFX(ctx);
  if(G.scene){drawScene(ctx);return;}
  if(!P.dead)drawVM(P.wpn,{bobX:OPT.bob?Math.sin(P.bob*.5)*7*P.bobAmt:0,bobY:OPT.bob?Math.abs(Math.cos(P.bob*.5))*5*P.bobAmt:0,anim:P.anim,kick:P.kick,switchT:P.switchT,ammo:P.cells,bombs:P.bombs,light:lightAtPlayer(P.x,P.y)});
  if(P.dead){ctx.fillStyle=`rgba(90,0,8,${Math.min(.6,P.deathT*.35).toFixed(3)})`;ctx.fillRect(0,0,RW,RH);}
  else{drawHUD(dt);if(G.mapOn)drawAutomap();}
}
function decayFX(dt){
  if(SAYQ.length&&G.state==='play'&&!(logPlay&&!logPlay.paused)&&$('#log').hidden){const [t,du,l]=SAYQ.shift();say(t,du,true,l);}
  G.flash*=Math.pow(.004,dt);if(G.flash<.01)G.flash=0;G.shake*=Math.pow(.02,dt);if(G.shake<.01)G.shake=0;
  if(FX.beam>0)FX.beam-=dt;if(FX.hurt>0)FX.hurt-=dt*1.2;if(FX.pick>0)FX.pick-=dt;if(FX.hit>0)FX.hit-=dt;
  if(subT>0){subT-=dt;if(subT<=0)$('#sub').hidden=true;}
  if(!$('#log').hidden){logT+=dt;const n=Math.min(logText.length,Math.floor(logT*logRate));const el=$('#log-b');if(el.textContent.length!==n)el.textContent=logText.slice(0,n);if(!(logPlay&&!logPlay.paused)&&logT>logText.length/logRate+(logVoiced?2.5:6))$('#log').hidden=true;}
}

/* ================= SPACE SCENE ================= */
const STARS=Array.from({length:260},()=>({x:R(),y:R(),z:R()*.9+.1,b:R()}));
const CRATERS=Array.from({length:14},()=>({a:R()*6.28,d:R()*.8,r:.04+R()*.12}));
const CRACK=(()=>{const k=[[-1,.12],[-.62,.2],[-.44,.04],[-.18,.14],[0,-.04],[.2,.1],[.36,-.1],[.56,0],[.74,-.18],[1,-.1]],o=[];for(let i=0;i<k.length-1;i++)for(let j=0;j<4;j++){const t=j/4;o.push([lerp(k[i][0],k[i+1][0],t)+(R()-.5)*.03,lerp(k[i][1],k[i+1][1],t)+(R()-.5)*.06]);}o.push(k[k.length-1]);return o;})();
const BRANCH=[[-.18,.14],[-.1,.3],[-.14,.42],[-.04,.55]],BRANCH2=[[.36,-.1],[.42,-.28],[.38,-.4]];
function drawSpace(t,mode){
  const g=ctx,W=RW,H=RH;g.save();
  g.fillStyle='#020306';g.fillRect(0,0,W,H);
  const ng=g.createRadialGradient(W*.25,H*.3,0,W*.25,H*.3,W*.7);ng.addColorStop(0,'rgba(70,20,45,.38)');ng.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=ng;g.fillRect(0,0,W,H);
  for(const s of STARS){const x=(((s.x*W-t*5*s.z)%W)+W)%W,y=s.y*H;g.fillStyle=`rgba(220,230,255,${(.25+.75*s.b*s.z).toFixed(2)})`;g.fillRect(x|0,y|0,s.z>.8?2:1,1);}
  let mx=W*.7,my=H*.62,mr=H*.46;
  if(mode==='approach'){mr=H*.46*(1+t*.035);}
  if(mode==='moon'){const z=1+t*.32;mx=W*.5;my=H*.5+H*.15*z;mr=H*.75*z;}
  if(mode==='title'){mx=W*.78;my=H*.7;mr=H*.55;}
  const mg=g.createRadialGradient(mx-mr*.45,my-mr*.45,mr*.05,mx,my,mr);mg.addColorStop(0,'#7a7068');mg.addColorStop(.5,'#3c3430');mg.addColorStop(1,'#0b0909');g.fillStyle=mg;circ(g,mx,my,mr);
  for(const c of CRATERS){g.fillStyle='rgba(0,0,0,.28)';ell(g,mx+Math.cos(c.a)*c.d*mr,my+Math.sin(c.a)*c.d*mr,c.r*mr,c.r*mr*.75);}
  const pulse=mode==='moon'?.6+.4*Math.sin(t*3.2):.45+.25*Math.sin(t*1.7);
  g.save();g.beginPath();g.arc(mx,my,mr*.985,0,Math.PI*2);g.clip();g.globalCompositeOperation='lighter';
  for(const [lw,al] of [[mr*.05,.16*pulse],[mr*.016,.45*pulse],[Math.max(1,mr*.005),1]]){
    g.strokeStyle=`rgba(255,${al>.9?130:40},30,${al.toFixed(3)})`;g.lineWidth=lw;g.lineJoin='miter';g.lineCap='round';
    for(const path of [CRACK,BRANCH,BRANCH2]){g.beginPath();path.forEach(([cx,cy],i)=>{const X=mx+cx*mr,Y=my+cy*mr;i?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();}}
  g.restore();
  if(mode!=='moon'){const s=H/180,sx=mode==='title'?W*.08+Math.sin(t*.12)*6:-W*.55+t*W*.13,sy=mode==='title'?H*.36:H*.4;drawShip(g,sx,sy,s*(mode==='title'?.85:1),t);}
  g.restore();
}
function drawShip(g,x,y,s,t){
  g.save();g.translate(x,y);g.scale(s,s);g.fillStyle='#07090c';
  poly(g,[[0,0],[150,-9],[192,-4],[202,6],[150,15],[20,17],[-12,8]]);
  g.fillRect(38,-20,42,13);g.fillRect(88,-15,26,8);g.fillRect(60,-28,4,10);
  poly(g,[[192,-4],[232,-15],[238,-9],[207,2],[238,12],[232,19],[200,8]]);
  g.strokeStyle='rgba(150,70,45,.7)';g.lineWidth=1;g.beginPath();g.moveTo(-12,8);g.lineTo(0,0);g.lineTo(150,-9);g.lineTo(192,-4);g.lineTo(232,-15);g.stroke();
  g.fillStyle='rgba(90,190,255,.95)';g.fillRect(-16,2,5,3);g.fillRect(-16,8,5,3);
  for(let i=0;i<12;i++){g.fillStyle=hash(i*3.1+Math.floor(t*2))>.4?'#ffd27a':'#2a1d0a';g.fillRect(24+i*11,4,2,1);}
  g.fillStyle=Math.sin(t*5)>0?'#ff3020':'#300';g.fillRect(62,-29,2,2);
  g.restore();
}

/* ================= TRAILER ================= */
const TR={t:0,i:-1,parts:[],ents:[],shake:0,vm:{anim:0,kick:0,switchT:0},fired:false,typed:0};
const tcard=$('#tcard'),tsub=$('#tsub'),tterm=$('#tterm'),tlogo=$('#tlogo');
function setCard(text,cls){tcard.className='card';tcard.textContent=text||'';if(text){if(cls)cls.split(' ').forEach(c=>tcard.classList.add(c));requestAnimationFrame(()=>tcard.classList.add('on'));}}
function setTSub(text){if(text){tsub.innerHTML='<b>BUCK:</b> '+text;tsub.hidden=false;}else tsub.hidden=true;}
function trSay(text){setTSub(text);speak(text);}
function trWorld(cam,dt,vm){
  updateLights(G.clock);for(const e of TR.ents)if(e.flash>0)e.flash-=dt;updateParts(TR.parts,dt);
  const sh=OPT.shake?TR.shake:0;
  CAM={x:cam.x,y:cam.y,ang:cam.ang+(R()-.5)*sh*.05,pitch:(cam.pitch||0)+(R()-.5)*sh*8,z:cam.z||0,lamp:cam.lamp==null?1:cam.lamp};
  renderWorld(CAM,buildSprites(TR.ents,TR.parts,CAM));drawBeam();
  if(vm!=null){const v=TR.vm;if(v.anim>0)v.anim-=dt;if(v.kick>0)v.kick-=dt;drawVM(vm,{bobX:0,bobY:0,anim:v.anim,kick:v.kick,switchT:0,ammo:24,light:.75,lift:0});}
  TR.shake*=Math.pow(.05,dt);
}
function trCut(o){TR.ents=[];TR.parts=[];PL=TR.parts;TR.fired=false;TR.vm={anim:0,kick:0,switchT:0};G.lightsOut=!!(o&&o.dark);G.alarm=!!(o&&o.alarm);G.flash=0;}
function trSever(e,part){e.mask|=PBIT[part];limbPart(e.x,e.y,part==='head'?.9:part.startsWith('arm')?.65:.3,part,-1,0);bleed(e.x,e.y,.6,10,2.4);e.flash=.1;}
function black(){ctx.fillStyle='#000';ctx.fillRect(0,0,RW,RH);}
const BEACON=['> INCOMING DISTRESS BEACON','> CSV BRIMSTONE MAIDEN','> DEEP-CORE MINING VESSEL // 12 DECKS','> CREW 4,120 // RELIEF SHIFT IN CRYO 2,800','> LAST CONTACT: 9 DAYS AGO','> MESSAGE FRAGMENT: ". . . singing . . . in the walls . . ."'].join('\n');
const SHOTS=[
  {d:7,enter(){trCut();setCard('');tterm.textContent='';tterm.hidden=false;S.staticN(5.6);TR.typed=0;},
   draw(lt){black();for(let i=0;i<16;i++){ctx.fillStyle=`rgba(80,255,140,${(R()*.07).toFixed(3)})`;ctx.fillRect(0,R()*RH|0,RW,1);}
     const n=Math.min(BEACON.length,Math.floor(lt*34));if(n>TR.typed){TR.typed=n;if(n%2===0)S.tick();if(BEACON[n-1]==='\n')S.beep(1400);}
     tterm.textContent=BEACON.slice(0,n)+((lt*3|0)%2?'_':' ');}},
  {d:6,enter(){tterm.hidden=true;setCard('THEY CRACKED OPEN A MOON CALLED RUIN.','low');S.braam(5.5);},draw(lt){drawSpace(lt,'approach');}},
  {d:5,enter(){setCard('SOMETHING INSIDE CRACKED BACK.','low');S.braam(4.5);setTimeout(()=>S.heart(),1500);setTimeout(()=>S.heart(),2600);},draw(lt){drawSpace(lt,'moon');}},
  {d:6,enter(){trCut();TR.ents=[makeEnemy('husk',17.5,19.55,{dormant:true})];setCard('6,920 ABOARD. NO SURVIVORS.','low');S.whisper(-.5);setTimeout(()=>S.whisper(.6),2200);setTimeout(()=>S.groan(.2,.3),3800);},
   draw(lt,dt){trWorld({x:10.4+lt*.7,y:19.55,ang:0,pitch:0},dt);}},
  {d:2.8,enter(){setCard('');setTimeout(()=>{if(G.state==='trailer'&&TR.i===4)setCard('CORRECTION:','low');},1000);},
   draw(lt,dt){const e=TR.ents[0];if(lt>1.3&&((lt*10)|0)%3===0){e.state='rise';e.t=.5;}else e.state='dormant';if(lt>1.3&&!TR.fired){TR.fired=true;S.hit(0,.5);}trWorld({x:14.6,y:19.55,ang:0,pitch:0},dt);}},
  {d:1.9,enter(){const e=makeEnemy('husk',17,19.55);e.state='attack';e.t=.1;TR.ents=[e];setCard('');S.shriek(0,1.3,1);S.stinger();},
   draw(lt,dt){const e=TR.ents[0];e.x=14.6+Math.max(.5,2.6-lt*1.6);e.t=Math.min(.38,.1+lt*.25);TR.shake=Math.max(TR.shake,lt*.7);trWorld({x:14.6,y:19.55,ang:0,pitch:0},dt);
     if(lt>1.25){if(!TR.fired){TR.fired=true;setCard('NO LIVING SURVIVORS.','punch');}ctx.fillStyle=`rgba(150,0,15,${Math.min(.85,(lt-1.25)*2).toFixed(3)})`;ctx.fillRect(0,0,RW,RH);}}},
  {d:1.2,enter(){setCard('');trCut();},draw(){black();}},
  {d:3.4,enter(){setCard("GORGON CONSOLIDATED DOESN'T SEND MARINES.");S.drum();},draw(lt){black();}},
  {d:4.6,enter(){setCard('');S.drum();S.braam(3);},
   draw(lt){black();const s=RW<300?4:5,px=Math.min(RW*.08,-100+lt*500),py=RH*.2;ctx.fillStyle='#0d1216';ctx.fillRect(px-6,py-6,16*s+12,16*s+12);
     const gr=ctx.createLinearGradient(0,0,RW,0);gr.addColorStop(0,'rgba(208,20,47,.15)');gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,RW,RH);
     drawFace(ctx,px,py,s,100,lt>2.4?'grin':'',lt>3?1:0);
     const tx=px+16*s+18;const lines=[['THEY SEND A REPO MAN.','#ffffff',(RW<300?'10px':'12px')+' Silkscreen, monospace'],['BUCK HAMMERSMITH','#ffb627'],['LICENSED REPOSSESSION AGENT','#9aa7b3'],['SHIPS RECOVERED: 41','#9aa7b3'],['PAYMENT PLANS OFFERED: 0','#3fe0c5']];
     ctx.textBaseline='top';lines.forEach((l,i)=>{if(lt>.5+i*.45)txt(ctx,l[0],tx,py+4+i*16+(i?8:0),l[1],l[2]);});}},
  {d:4.6,enter(){trCut();TR.ents=[makeEnemy('husk',16.4,10.2),makeEnemy('husk',17.6,12.4),makeEnemy('crawler',15.6,12.9)];TR.ents.forEach(e=>e.state='chase');setCard('');trSay('Says here your payments are ninety days late.');S.groan(.3,.6);},
   draw(lt,dt){for(const e of TR.ents){e.x-=dt*.55;e.y+=dt*.1;e.phase+=dt*1.1;}trWorld({x:12.1,y:13.3,ang:-.42,pitch:0},dt,0);}},
  {d:1.45,enter(){setTSub('');trCut();const e=makeEnemy('husk',14.3,19.55);e.state='chase';TR.ents=[e];setCard('SEVER THE LIMBS.','punch');MUS.target=1;MUS.step=0;},
   draw(lt,dt){const e=TR.ents[0];e.x-=dt*.5;e.phase+=dt*1.2;if(lt>.42&&!TR.fired){TR.fired=true;FX.beam=.16;S.cutter();S.sever(0,1);TR.vm.anim=.2;G.flash=.8;G.flashC=[.35,1,1.1];trSever(e,'armL');trSever(e,'armR');}
     G.flash*=Math.pow(.01,dt);if(FX.beam>0)FX.beam-=dt;trWorld({x:12,y:19.55,ang:0,pitch:0},dt,0);}},
  {d:1.45,enter(){trCut();const e=makeEnemy('husk',6.1,10.5);e.state='chase';TR.ents=[e];setCard('BRING A BIGGER GUN.','punch');},
   draw(lt,dt){const e=TR.ents[0];e.phase+=dt;if(!TR.fired)e.x-=dt*.6;if(lt>.35&&!TR.fired){TR.fired=true;S.shotgun();TR.vm.anim=.35;G.flash=1.6;G.flashC=[1.2,.85,.5];TR.shake=.4;trSever(e,'legL');trSever(e,'legR');gibs(e.x,e.y,.4,10);e.x+=.5;}
     G.flash*=Math.pow(.01,dt);trWorld({x:3.6,y:10.5,ang:0,pitch:0},dt,1);}},
  {d:1.45,enter(){trCut();const e=makeEnemy('husk',13.55,11.1);e.mask=24;e.state='chase';TR.ents=[e];setCard('KICK EVERYTHING.','punch');},
   draw(lt,dt){const e=TR.ents[0];e.phase+=dt*.6;if(lt>.1&&TR.vm.kick<=0&&!TR.fired){TR.vm.kick=.42;S.whoosh();TR.fired=true;}
     if(lt>.35&&!e.gone){e.gone=true;gibs(e.x,e.y,.15,24);S.kick();S.death(0,1);TR.shake=.3;}trWorld({x:12.65,y:11.1,ang:0,pitch:-14},dt,0);}},
  {d:1.45,enter(){trCut();const e=makeEnemy('husk',25.5,11.6);e.state='chase';TR.ents=[e];setCard('HEADSHOTS ARE A WASTE OF AMMO.','punch');},
   draw(lt,dt){const e=TR.ents[0];e.phase+=dt*(e.berserk?2.2:1.1);e.y+=dt*(e.berserk?1.6:.5);if(lt>.3&&!TR.fired){TR.fired=true;FX.beam=.16;S.cutter();TR.vm.anim=.2;G.flash=.8;G.flashC=[.35,1,1.1];trSever(e,'head');e.berserk=true;S.shriek(0,.9,1.2);}
     G.flash*=Math.pow(.01,dt);if(FX.beam>0)FX.beam-=dt;trWorld({x:25.5,y:14.3,ang:-Math.PI/2,pitch:16},dt,0);}},
  {d:1.45,enter(){trCut();TR.ents=[{kind:'barrel',x:23.2,y:17.3,hp:2,r:.22},makeEnemy('husk',23.9,17.9),makeEnemy('husk',22.7,18.3)];TR.ents[1].state=TR.ents[2].state='chase';setCard('READ THE FINE PRINT.','punch');},
   draw(lt,dt){for(const e of TR.ents)if(e.kind==='enemy')e.phase+=dt;if(lt>.3&&!TR.fired){TR.fired=true;S.explode(0,1);G.flash=2.6;G.flashC=[1.3,.7,.3];TR.shake=.8;TR.ents.forEach(e=>e.gone=true);flames(23.2,17.3,34);gibs(23.6,17.9,.5,14);gibs(22.8,18.2,.5,12);limbPart(23.6,17.9,.6,'armL',-.6,.5);limbPart(22.8,18.2,.8,'head',-.6,.4);}
     G.flash*=Math.pow(.05,dt);trWorld({x:27.4,y:21.2,ang:Math.atan2(17.4-21.2,23.2-27.4),pitch:0},dt);}},
  {d:1.7,enter(){trCut({dark:true,alarm:true});const e=makeEnemy('brute',25.5,4.3);e.state='attack';e.t=0;e.wind=1.2;TR.ents=[e];setCard('OVERDUE.','punch');S.roar(0,1);},
   draw(lt,dt){const e=TR.ents[0];e.t=Math.min(1.1,lt*.9);TR.shake=Math.max(TR.shake,.2);trWorld({x:25.5,y:6.7,ang:-Math.PI/2,pitch:10},dt);}},
  {d:2.8,enter(){trCut();setCard('12 DECKS. 6,920 ACCOUNTS PAST DUE.');MUS.target=0;S.drum();S.braam(2.5);},draw(lt){black();}},
  {d:2.8,enter(){setCard('');trCut();S.drum();trSay("Guess I'll take payment in limbs.");},draw(lt){black();drawFace(ctx,RW-16*3-14,RH*.3,3,100,'grin',-1);}},
  {d:8,enter(){setTSub('');setCard('');tlogo.hidden=false;S.drum();S.braam(6);},draw(lt){drawSpace(lt+30,'title');ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,0,RW,RH);}}
];
let SHOT_START=[];(()=>{let a=0;SHOT_START=SHOTS.map(s=>{const v=a;a+=s.d;return v;});})();
function startTrailer(){
  showOnly('#tcap');setMenu(null);G.state='trailer';TR.t=0;TR.i=-1;tlogo.hidden=true;tterm.hidden=true;setCard('');setTSub('');
  $('#tchip').hidden=!!A.c;A.justUnlocked=false;buildTrailerMap();initLights(LDEF);G.power=true;ambLevel(.25);MUS.target=0;setTouchPlaying(false);
}
function endTrailer(){stopVoice();MUS.target=0;G.lightsOut=false;G.alarm=false;toTitle();}
function trailerUpdate(dt){
  if(IN.edges.has('any')){if(A.justUnlocked){A.justUnlocked=false;$('#tchip').hidden=false;$('#tchip').textContent='SOUND ON';setTimeout(()=>$('#tchip').hidden=true,1600);}else{endTrailer();return;}}
  TR.t+=dt;let i=TR.i;while(i+1<SHOTS.length&&TR.t>=SHOT_START[i+1])i++;
  if(TR.t>=SHOT_START[SHOTS.length-1]+SHOTS[SHOTS.length-1].d){endTrailer();return;}
  if(i!==TR.i){TR.i=i;if(i>=0)SHOTS[i].enter();}
  if(i>=0)SHOTS[i].draw(TR.t-SHOT_START[i],dt);
}

/* ---- objective locator (Dead Space style) ---- */
function pathOK(i){if(map[i]===0)return true;const d=doorAt[i];if(!d)return false;return d.lock==='none'||d.lock==='opened'||(d.lock!=='secret'&&lockOK(d.lock));}
function pathTo(tx,ty){
  const s=I(P.x|0,P.y|0),t=I(tx,ty),prev=new Int32Array(MAPN).fill(-1),q=[s];prev[s]=s;
  for(let h=0;h<q.length;h++){const i=q[h];if(i===t)break;const x=i%MW,y=(i/MW)|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=I(nx,ny);if(prev[ni]>=0||!pathOK(ni))continue;prev[ni]=i;q.push(ni);}}
  if(prev[t]<0)return null;const path=[];for(let i=t;i!==s;i=prev[i])path.push(i);path.push(s);return path.reverse();
}
function clearLine(ax,ay,bx,by){const d=Math.hypot(bx-ax,by-ay),n=Math.ceil(d/.25);for(let k=1;k<n;k++){const x=ax+(bx-ax)*k/n,y=ay+(by-ay)*k/n,i=I(x|0,y|0);if(!(map[i]===0&&!doorAt[i]))return false;}return true;}
function showGuide(){
  if(G.obj)G.objT=Math.max(G.objT,6);
  const tg=objTarget();if(!tg){msg('NO ROUTE FOUND');S.denied();return;}
  const cells=pathTo(tg[0],tg[1]);if(!cells){msg('NO ROUTE FOUND');S.denied();return;}
  const pts=cells.map(i=>[i%MW+.5,((i/MW)|0)+.5]);pts[0]=[P.x,P.y];
  const sm=[pts[0]];let a=0;
  while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!clearLine(pts[a][0],pts[a][1],pts[b][0],pts[b][1]))b--;sm.push(pts[b]);a=b;}
  const dots=[];let along=0;
  for(let k=0;k<sm.length-1;k++){const [x0,y0]=sm[k],[x1,y1]=sm[k+1],l=Math.hypot(x1-x0,y1-y0);
    for(let u=(k===0?.6:0);u<l;u+=.4){dots.push({x:x0+(x1-x0)*u/l,y:y0+(y1-y0)*u/l,d:along+u});}along+=l;}
  G.guide={dots,line:sm,t:0,life:9,len:along};
  S.beep(880);setTimeout(()=>S.beep(1320),90);
  const dist=Math.round(along*2.5);msg('ROUTE TO OBJECTIVE: '+dist+' M');
  // Turn Buck toward the next stretch of the route (engine 1.3): over a third of a second, any look input cancels it,
  // and with the device's Reduce Motion on it snaps.
  const ahead=dots.find(d=>d.d>=1.4)||(sm[1]?{x:sm[1][0],y:sm[1][1]}:null);
  if(ahead){let d=Math.atan2(ahead.y-P.y,ahead.x-P.x)-P.ang;d=Math.atan2(Math.sin(d),Math.cos(d));
    if(reduceMotion){P.ang+=d;G.guideTurn=null;}else G.guideTurn={from:P.ang,d,t:0};}
}
function drawGuideLine(cam){
  const gd=G.guide;if(!gd)return;const ca=Math.cos(cam.ang),sa=Math.sin(cam.ang),hor=RH/2+cam.pitch,eye=.5+(cam.z||0),head=gd.t*9,fade=Math.min(1,gd.life/1.5);
  const g=ctx;g.save();g.globalCompositeOperation='lighter';g.lineCap='round';
  let prev=null;
  for(const p of gd.dots){
    if(p.d>head)break;
    const dx=p.x-cam.x,dy=p.y-cam.y,depth=dx*ca+dy*sa;
    if(depth<.25||depth>24){prev=null;continue;}
    const sx=RW/2+F*(-dx*sa+dy*ca)/depth,sy=hor+eye*F/depth,col=sx|0;
    const vis=col>=0&&col<RW&&depth<ZB[col]+.05;
    if(vis&&prev){
      const pulse=Math.max(0,1-Math.abs(((head-p.d)%7)-.8)/1.4),w=clamp(F*.032/depth,1,4);
      g.strokeStyle=`rgba(70,200,255,${(.28*fade).toFixed(3)})`;g.lineWidth=w*2.6;g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(sx,sy);g.stroke();
      g.strokeStyle=`rgba(170,245,255,${((.55+.45*pulse)*fade).toFixed(3)})`;g.lineWidth=w;g.beginPath();g.moveTo(prev[0],prev[1]);g.lineTo(sx,sy);g.stroke();
    }
    prev=vis?[sx,sy]:null;
  }
  g.restore();
}
function guideSprites(out,cam){
  const gd=G.guide;if(!gd)return;const ca=Math.cos(cam.ang),sa=Math.sin(cam.ang),head=gd.t*9;
  const fade=Math.min(1,gd.life/1.5);
  for(const p of gd.dots){if(p.d>head)break;const dx=p.x-cam.x,dy=p.y-cam.y,depth=dx*ca+dy*sa;if(depth<.15||depth>22)continue;
    const pulse=.55+.45*Math.max(0,1-Math.abs(((head-p.d)%6)-.6)/1.2);
    out.push({x:p.x,y:p.y,depth,img:IMG.guide,wh:.12,z:.01,glow:pulse*fade,flip:false});}
}

/* ---- audio log archive (pause menu) ---- */
let arcSrc=null;
function stopArchive(){if(arcSrc){try{arcSrc.onended=null;arcSrc.stop();}catch(e){}arcSrc=null;}}
function openArchive(){
  stopLog();G.sub='logs';const nav=$('#m-logs');nav.innerHTML='';
  const found=LOGLIST.filter(l=>G.logs[l.sid]).sort((x,y)=>x.order-y.order);
  $('#lg-count').textContent=found.length+' OF '+LOGLIST.length+' FOUND ON DECK '+deckNN();
  found.forEach(l=>{const b=document.createElement('button');b.className='btn';b.tabIndex=-1;b.dataset.act='lg:'+l.sid;
    b.textContent=l.log[0].replace('AUDIO LOG // ','');bindBtn(b);nav.appendChild(b);});
  const back=document.createElement('button');back.className='btn';back.tabIndex=-1;back.dataset.act='logsback';back.textContent='Back';bindBtn(back);nav.appendChild(back);
  if(!found.length){$('#lg-h').textContent='NO LOGS YET';$('#lg-b').textContent='Audio logs you pick up on the deck appear here so you can replay them.';}
  showOnly('#logs-ov');setMenu('#m-logs');
}
function previewArchive(sid){const l=LOGLIST.find(q=>q.sid===sid);if(!l)return;$('#lg-h').textContent=l.log[0]+(l.where?'  ·  '+l.where:'');$('#lg-b').textContent=l.log[1];}
function playArchive(sid){
  const l=LOGLIST.find(q=>q.sid===sid);if(!l)return;previewArchive(sid);stopArchive();auInit();
  if(!G.voice||!A.c)return;
  logDecode(l.id,b=>{if(!b||G.sub!=='logs')return;stopArchive();const s=A.c.createBufferSource();s.buffer=b;s.connect(A.logG);s.start();arcSrc=s;s.onended=()=>{if(arcSrc===s)arcSrc=null;};});
}
function closeArchive(){stopArchive();G.sub=null;showOnly('#pause');setMenu('#m-pause');}


/* ---- campaign: 12 decks, gated by completion ---- */
/* ================= STATES ================= */
function setTouchPlaying(v){document.body.classList.toggle('playing',v);}
function fmtTime(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=Math.floor(s%60);return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(ss).padStart(2,'0');}
function toTitle(){
  stopLog();
  G.state='title';G.idle=0;G.sub=null;showOnly('#title');setTouchPlaying(false);$('#sub').hidden=true;$('#log').hidden=true;
  if(document.pointerLockElement)document.exitPointerLock();MUS.target=0;ambLevel(.3);G.lightsOut=false;G.alarm=false;G.power=true;PL=PARTS;
  const s=PACKS.core?readSave(curDeck()):null,c=PACKS.core?readCampaign():{cleared:{}},cb=document.querySelector('#m-title [data-act="continue"]');
  const nextUp=!s&&c.cur&&c.cleared[c.cur-1]&&c.cur>1&&deckAvailability(c.cur)==='open'?c.cur:0;
  cb.hidden=!s&&!nextUp;
  if(s)cb.textContent='Continue · Deck '+String(s.deck||1).padStart(2,'0')+' · '+DIFF[s.diff].name+' · '+fmtTime(s.time);
  else if(nextUp)cb.textContent='Continue · Deck '+String(nextUp).padStart(2,'0')+' · '+c.diff;
  const lc=PACKS.core?lastClear():null,el=$('#t-last');if(el){el.hidden=!lc;if(lc)el.textContent='LAST CLEAR: DECK '+String(lc.n).padStart(2,'0')+' · '+lc.diff.toUpperCase()+(lc.byCode?'':' · '+lc.pct+'% · '+fmtTime(lc.time));}
  setMenu('#m-title');
}
function showDiff(){G.state='diff';G.sub='diff';showOnly('#diff');setMenu('#m-diff');menuIdx=2;markSel();}
function updateDiffDesc(){if(!curMenu||curMenu.id!=='m-diff')return;const b=menuBtns()[menuIdx];const n=b&&b.dataset.act[0]==='d'?+b.dataset.act.slice(1):-1;
  $('#d-desc').textContent=n>=0?DIFF[n].desc:'';}
function statsHTML(){
  const n=o=>Object.keys(o||{}).length;
  return `<dt>DIFFICULTY</dt><dd>${D.name.toUpperCase()}</dd><dt>TIME</dt><dd>${fmtTime(G.playTime)}</dd><dt>KILLS</dt><dd>${G.kills} / ${G.total}</dd>`+
    `<dt>SECRETS</dt><dd>${n(G.secrets)} / ${G.secretTotal}</dd><dt>AUDIO LOGS</dt><dd>${n(G.logs)} / ${G.logTotal}</dd><dt>ASSETS TAGGED</dt><dd>${n(G.assets)} / ${G.assetTotal}</dd>`;
}
function pauseGame(){pauseLog();G.state='pause';showOnly('#pause');setMenu('#m-pause');$('#p-obj').textContent='Objective: '+G.obj;$('#p-stats').innerHTML=statsHTML();
  setTouchPlaying(false);if(document.pointerLockElement)document.exitPointerLock();MUS.target=0;stopVoice();}
function resumeGame(){stopArchive();G.sub=null;showOnly(null);G.state='play';setTouchPlaying(true);IN.edges.clear();resumeLog();}
/* ================= MAIN LOOP ================= */
let last=performance.now();
const idlebar=$('#idlebar'),IDLE_TRAILER=8;
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;G.clock+=dt;pollPad();
  switch(G.state){
    case 'title':
      drawSpace(G.clock,'title');G.idle+=dt;idlebar.style.width=Math.min(100,G.idle/IDLE_TRAILER*100)+'%';
      if(!['help','settings','photo'].includes(G.sub)&&G.idle>IDLE_TRAILER)startTrailer();
      if(edge('back')&&G.sub==='help')act('back');
      else if(edge('back')&&G.sub==='settings')act('setback');
      else if(edge('back')&&G.sub==='confirm')act('cfno');
      menuNav();break;
    case 'diff':
      drawSpace(G.clock,'title');
      if(edge('back'))toTitle();else menuNav();break;
    case 'trailer':trailerUpdate(dt);break;
    case 'loading':drawSpace(G.clock,'title');break;
    case 'intro':
      black();G.introT+=dt;if((G.introT>.6&&IN.edges.has('any'))||G.introT>6)beginPlay();break;
    case 'play':playUpdate(dt);if(G.state==='play'||G.state==='dead'||G.state==='win')playRender(dt);decayFX(dt);break;
    case 'pause':
      if(G.sub==='logs'){if(edge('back'))closeArchive();else if(edge('pause')){closeArchive();resumeGame();}else menuNav();break;}
      if(G.sub==='console')break;
      if(G.sub==='ach'){if(edge('back')||edge('pause'))act('achback');else menuNav();break;}
      if(edge('console')){openConsole();break;}
      if(G.sub==='settings'){if(edge('back'))act('setback');else if(edge('pause'))resumeGame();else menuNav();break;}
      if(edge('pause')||(edge('back')&&G.sub!=='help'))resumeGame();else if(edge('back')&&G.sub==='help')act('back');else menuNav();break;
    case 'depart':if(edge('back')||edge('pause'))act('stay');else menuNav();break;
    case 'dead':case 'win':
      if(G.state==='dead'){updateParts(PARTS,dt);P.deathT+=dt;}playRender(dt);decayFX(dt);menuNav();break;
  }
  IN.edges.clear();IN.mdx=IN.mdy=0;
  requestAnimationFrame(loop);
}
function boot(){
  try{if('gamepadInputEmulation' in navigator)navigator.gamepadInputEmulation='gamepad';}catch(e){}
  if(/Xbox/i.test(navigator.userAgent)){const f=document.getElementById('t-foot-txt');if(f)f.textContent='XBOX: PRESS A ON THIS SCREEN FOR SOUND, THEN HOLD ☰ AND PICK "USE GAME CONTROLS"';}
  resize();buildTextures();buildTextures2();buildArt();buildArt2();buildTrailerMap();initLights(LDEF);refreshToggles();
  if(document.fonts&&document.fonts.load){document.fonts.load('8px Silkscreen').catch(()=>{});}
  if('speechSynthesis' in window){try{speechSynthesis.getVoices();}catch(e){}}
  showOnly('#loading');G.state='loading';requestAnimationFrame(loop);
  loadCore().then(()=>{buildTextures3();toTitle();}).catch(err=>{console.error(err);$('#load-msg').textContent='Could not load the game data. Check your connection and reload.';});
  if(window.matchMedia&&(matchMedia('(pointer:coarse)').matches||(navigator.maxTouchPoints>0&&matchMedia('(hover:none)').matches)))setTouch(true);
}
// boot() runs at the end of features.js, once every engine file is loaded.
