'use strict';
/* Hull Breaker: pack loading (format 1, see _src/pack/FORMAT.md).
   The web game reads the same packs as the native apps: catalog, core, one pack per deck.
   Files come from packs-1.3/ next to the page, or from window.HB_BUNDLE (path -> JSON object or
   base64 string) when the whole game is inlined into one file for a preview. */
const ENGINE_VERSION='1.3';
// Engine 1.3 packs live in packs-1.3/ until the Apple apps reach 1.3; packs/ stays at 1.2 for the TestFlight build.
const PACKS={base:'packs-1.3/',catalog:null,core:null,decks:{},audio:{},img:{}};
let LEVEL=null, DECK=null;          // the deck being played: its level.json and deck.json
const verOK=v=>{const a=String(v||'0').split('.').map(Number),b=ENGINE_VERSION.split('.').map(Number);return a[0]<b[0]||(a[0]===b[0]&&(a[1]||0)<=b[1]);};
function b64buf(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer;}
async function packFetch(path,kind){
  const B=window.HB_BUNDLE;
  if(B&&Object.prototype.hasOwnProperty.call(B,path)){const v=B[path];return kind==='json'?(typeof v==='string'?JSON.parse(v):v):b64buf(v);}
  const r=await fetch(PACKS.base+path,{cache:'no-cache'});
  if(!r.ok)throw new Error('pack file '+path+': HTTP '+r.status);
  return kind==='json'?r.json():r.arrayBuffer();
}
async function loadCatalog(){
  if(PACKS.catalog)return PACKS.catalog;
  PACKS.catalog=await packFetch('catalog.json','json');return PACKS.catalog;
}
async function loadCore(){
  if(PACKS.core)return PACKS.core;
  const cat=await loadCatalog(),e=cat.packs.find(p=>p.id==='core');
  if(!e||!verOK(e.minEngine))throw new Error('core pack needs a newer engine');
  const core={id:'core'};
  for(const k of ['tuning','lines','strings','achievements','art','sfx'])core[k]=await packFetch('core/'+k+'.json','json');
  core.sfxDefs=core.sfx.sounds;
  core.lineById={};core.lineByText={};
  for(const l of core.lines.lines){l.pack='core';core.lineById[l.id]=l;core.lineByText[l.text]=l;}
  PACKS.core=core;return core;
}
function deckEntry(n){const c=PACKS.catalog;if(!c)return null;const d=c.decks.find(x=>x.deck===n);if(!d||!d.pack)return {deck:d,pack:null};return {deck:d,pack:c.packs.find(p=>p.id===d.pack)};}
// 'open' = playable here, 'dev' = not built yet, 'update' = needs a newer engine
function deckAvailability(n){const e=deckEntry(n);if(!e||!e.pack)return 'dev';return verOK(e.pack.minEngine)?'open':'update';}
async function loadDeck(n){
  const key='deck-'+String(n).padStart(2,'0');
  if(PACKS.decks[key])return PACKS.decks[key];
  await loadCore();
  const d={id:key};
  for(const k of ['deck','level','logs','lines'])d[k]=await packFetch(key+'/'+k+'.json','json');
  d.lineById={};d.lineByText={};
  for(const l of d.lines.lines){l.pack=key;d.lineById[l.id]=l;d.lineByText[l.text]=l;}
  d.logById={};for(const l of d.logs.logs){l.pack=key;d.logById[l.id]=l;}
  PACKS.decks[key]=d;return d;
}
// Look up a line by id ('core:x' always means core) or by its exact text, deck first.
function findLine(idOrText){
  const core=PACKS.core,dk=DECK&&PACKS.decks[DECK.id];if(!core)return null;
  if(idOrText.startsWith('core:'))return core.lineById[idOrText.slice(5)]||null;
  return (dk&&(dk.lineById[idOrText]||dk.lineByText[idOrText]))||core.lineById[idOrText]||core.lineByText[idOrText]||null;
}
// Decode a pack audio file once (needs the AudioContext). cb(AudioBuffer|null).
function packAudio(pack,file,cb){
  const k=pack+'/'+file,c=PACKS.audio[k];
  if(c&&c.buf)return cb(c.buf);
  if(c&&c.wait){c.wait.push(cb);return;}
  if(!A.c)return cb(null);
  const ent={wait:[cb]};PACKS.audio[k]=ent;
  const done=b=>{ent.buf=b;const w=ent.wait;ent.wait=null;if(!b)delete PACKS.audio[k];w.forEach(f=>f(b));};
  packFetch(k,'buf').then(ab=>{try{const pr=A.c.decodeAudioData(ab,done,()=>done(null));if(pr&&pr.catch)pr.catch(()=>{});}catch(e){done(null);}},()=>done(null));
}
// A pack image as a canvas (for textures and sprites the engine doesn't draw itself).
function packImage(pack,file){
  const k=pack+'/'+file;if(PACKS.img[k])return PACKS.img[k];
  PACKS.img[k]=packFetch(k,'buf').then(ab=>new Promise((res,rej)=>{
    const url=URL.createObjectURL(new Blob([ab],{type:'image/png'})),im=new Image();
    im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);URL.revokeObjectURL(url);res(c);};
    im.onerror=()=>{URL.revokeObjectURL(url);rej(new Error('image '+k));};im.src=url;}));
  return PACKS.img[k];
}
