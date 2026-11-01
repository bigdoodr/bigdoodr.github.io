'use strict';
/* Hull Breaker: the platform layer. This is the only file that touches the device directly:
   storage, keeping audio alive, display, and achievements. A native or wrapped build swaps
   this file (or its insides) and nothing else changes.
   Every storage key keeps the hb- prefix (one origin hosts other pages too). */
const HBP=(()=>{
  const ls=(()=>{try{const k='hb-probe';localStorage.setItem(k,'1');localStorage.removeItem(k);return localStorage;}catch(e){return null;}})();
  const mem={};
  const store={
    persistent:!!ls,
    get(key){try{const v=ls?ls.getItem(key):mem[key];return v==null?null:JSON.parse(v);}catch(e){return null;}},
    set(key,val){const s=JSON.stringify(val);try{if(ls)ls.setItem(key,s);else mem[key]=s;}catch(e){mem[key]=s;}},
    remove(key){try{if(ls)ls.removeItem(key);}catch(e){}delete mem[key];},
  };

  /* Audio: browsers suspend or interrupt an AudioContext (idle tabs, other apps taking the
     audio device, Bluetooth headphones sleeping, iOS interruptions). Resume it on any input
     and whenever the page becomes visible again, so sound never needs a page refresh. */
  let audioCtx=null;
  const kick=()=>{const c=audioCtx;if(c&&c.state!=='running'&&c.state!=='closed'){try{const p=c.resume();if(p&&p.catch)p.catch(()=>{});}catch(e){}}};
  for(const ev of ['pointerdown','keydown','touchend','mousedown','gamepadconnected'])addEventListener(ev,kick,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')kick();});
  addEventListener('focus',kick);addEventListener('pageshow',kick);
  setInterval(()=>{if(document.visibilityState==='visible')kick();},2000);   // gamepad-only play sends no DOM events
  const audio={
    attach(ctx){audioCtx=ctx;try{ctx.addEventListener('statechange',()=>{if(ctx.state!=='running'&&document.visibilityState==='visible')setTimeout(kick,50);});}catch(e){}},
    resume:kick,
  };

  /* Achievements and running totals, kept apart from the campaign so New Game never erases them.
     The Apple apps report the same ids to Game Center; the web stores them here. */
  const AK='hb-achievements';
  const ach={
    data(){const d=store.get(AK)||{};d.earned=d.earned||{};d.stats=d.stats||{};return d;},
    isEarned(id){return !!this.data().earned[id];},
    unlock(id){const d=this.data();if(d.earned[id])return false;d.earned[id]=Date.now();store.set(AK,d);return true;},
    // Running totals are kept per difficulty (index 0-4), like the Apple apps, so an achievement
    // with a minimum difficulty only counts runs on that difficulty or harder.
    stat(name,minDiff){const a=this.data().stats[name]||[];let t=0;for(let i=minDiff||0;i<a.length;i++)t+=a[i]||0;return t;},
    addStat(name,diff,n){const d=this.data(),a=d.stats[name]=Array.isArray(d.stats[name])?d.stats[name]:[];while(a.length<5)a.push(0);a[diff]+=(n||1);store.set(AK,d);},
  };

  const display={
    fullscreen(){const el=document.documentElement;if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else if(el.requestFullscreen)el.requestFullscreen().catch(()=>{});},
  };
  return {name:'web',store,audio,achievements:ach,display};
})();
