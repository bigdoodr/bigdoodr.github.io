import json, re, subprocess, base64, os, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from kokoro_onnx import Kokoro
k=Kokoro('kok/kokoro-v1.0.onnx','kok/voices-v1.0.bin')
LOGS=json.load(open('logs_text.json'))
VOICE={'dockoffice':('am_eric','en-us',1.0),'reception':('af_nicole','en-us',.95),'morgue':('bf_emma','en-gb',.97),'lab':('bf_emma','en-gb',.92),
 'hydro':('am_puck','en-us',1.02),'bunks':('am_echo','en-us',1.0),'captain':('af_kore','en-us',.95),'commons':('am_adam','en-us',.98),
 'security':('am_fenrir','en-us',.96),'bridge':('af_nova','en-us',.94),'hall':('bm_daniel','en-gb',.97),'chief':('bm_daniel','en-gb',.95),
 'reactor':('am_liam','en-us',1.04),'cargo':('am_onyx','en-us',.98),'container':('bm_lewis','en-gb',.88),'cargooffice':('af_sarah','en-us',1.07)}
rng=np.random.default_rng(11)
def bp(x,lo,hi,sr):return sosfilt(butter(3,[lo,hi],'band',fs=sr,output='sos'),x)
def clean(t):
    t=re.sub(r'\([^)]*\)\s*','',t); t=t.replace('LIMBS','limbs'); return t

SEGS={
 'dockoffice':["Shuttle traffic's frozen. The captain locked down the ring after the drill crew came back from Ruin. That strands four thousand crew on twelve decks, plus twenty-eight hundred relief miners asleep in cryo. Somebody keeps knocking on the inside of cargo container nine.",1.0,'GASP',.3,("Nobody is in container nine.",1.0,1.0,{'trem':(6,.12),'breathy':.16})],
 'hydro':["The plants grow toward the vents now instead of the lamps. I pulled one up and the roots were warm.",1.1,"I sealed the seed vault behind the cracked panel in the north wall.",1.0,"Don't tell the captain."],
 'bunks':["Night shift says Miller got up after the medics bagged him and walked right out of the morgue. I told them they were drunk.",.35,'BREATH',.25,("Then I heard him.",1.0,1.0,{'trem':(6,.08),'breathy':.14,'gain':.9}),.35,("In the vent over my bunk.",1.02,1.0,{'trem':(6,.1),'breathy':.16,'gain':.85})],
 'captain':["Day three. The drill broke into the cavity under Ruin at oh four hundred. Gorgon wants samples, not questions.",1.2,"My blue card opens Engineering.",.55,("If I don't make it, get the power up and get my people on that tram.",.93,1.0,{'trem':(5,.1),'breathy':.14,'gain':.92})],
 'chief':["If you're in my office, the power's back. Good.",.7,"That means they're awake too.",1.1,"The yellow card opens Cargo. Rhee has the red one.",1.1,"Stay away from the containers."],
 'reactor':["The reactor's fine. The reactor's always fine. It's the shielding. Something is growing on the inside of the shielding,",.75,"and it's warm,",.75,"and it's moving toward the core,",.6,'BREATH',.15,("like it wants to be fed.",.95,1.0,{'trem':(6,.12),'breathy':.18,'gain':.86})],
 'security':["Red card stays with the cargo master so nobody hits the tram override in a panic. The override needs main power and that card.",1.1,"If you're hearing this, I'm the one in the vents now.",1.0,'SIGH',.2,("I'm so sorry.",.9,.95,{'voice':'fenrir_echo','breathy':.22,'gain':.85})],
 'bridge':[("Distress beacon's on a loop. Gorgon replied in four minutes. Maintain quarantine, asset recovery team en route.",.94,.93,{'breathy':.18,'gain':.92}),1.1,'SIGH',.3,("Asset recovery.",.9,.9,{'breathy':.26,'gain':.85}),.9,("They're sending someone for the ship...",.9,.9,{'breathy':.24,'gain':.88}),.6,("Not for us...",.88,.87,{'breathy':.32,'gain':.78})]}
def breath(sr,dur,amp,sigh=False):
    n=int(sr*dur);t=np.linspace(0,1,n);env=(np.sin(np.pi*t)**(1.6 if not sigh else 1.0))*(1-0.4*t if sigh else 1)
    x=bp(rng.standard_normal(n),350 if sigh else 600,1800 if sigh else 2600,sr)
    x/=np.abs(x).max()+1e-9;return x*env*amp
from scipy.signal import stft, istft
def whisp(x,sr):
    f,t,Z=stft(x,sr,nperseg=512,noverlap=384);Z=np.abs(Z)*np.exp(1j*rng.uniform(0,2*np.pi,Z.shape))
    _,y=istft(Z,sr,nperseg=512,noverlap=384);y=np.pad(y[:len(x)],(0,max(0,len(x)-len(y))));y=bp(y,700,5000,sr);return y/(np.abs(y).max()+1e-9)
def gasp(sr):
    n=int(sr*.32);t=np.linspace(0,1,n);env=np.minimum(1,t*8)*np.exp(-t*3.5);x=bp(rng.standard_normal(n),900,3200,sr);return x/np.abs(x).max()*env*.32
def trimx(a):
    a=a.astype(np.float64);pk=np.abs(a).max()+1e-9;e=np.convolve(np.abs(a),np.ones(240)/240,'same');on=np.where(e>pk*0.02)[0]
    return a[max(0,on[0]-100):on[-1]+200]/pk if len(on) else a
def synth(key,v,lang,spd):
    if key not in SEGS:
        a,sr=k.create(clean(LOGS[key][1]),voice=v,speed=spd,lang=lang);return a.astype(np.float64),sr
    parts=[];sr=24000
    for it in SEGS[key]:
        if isinstance(it,float):parts.append(np.zeros(int(sr*it)))
        elif it=='BREATH':parts.append(breath(sr,.55,.16))
        elif it=='SIGH':parts.append(breath(sr,.9,.2,True))
        elif it=='GASP':parts.append(gasp(sr))
        else:
            if isinstance(it,str):txt,sp,pitch,fx=it,spd,1.0,{}
            else:txt,sp,pitch=it[:3];fx=it[3] if len(it)>3 else {}
            vv=(.75*k.get_voice_style('am_fenrir')+.25*k.get_voice_style('am_echo')) if fx.get('voice')=='fenrir_echo' else v
            a,sr=k.create(txt,voice=vv,speed=sp,lang=lang);a=trimx(a)
            if pitch!=1.0:
                sf.write('tmp_ps.wav',a,sr);subprocess.run(['ffmpeg','-y','-loglevel','error','-i','tmp_ps.wav','-af','asetrate=%d,aresample=%d,atempo=%.4f'%(int(sr*pitch),sr,1/pitch*1.0),'tmp_ps2.wav'],check=True);a,_=sf.read('tmp_ps2.wav')
            if fx.get('vib'):
                f0,d=fx['vib'];sf.write('tmp_v.wav',a,sr);subprocess.run(['ffmpeg','-y','-loglevel','error','-i','tmp_v.wav','-af','vibrato=f=%g:d=%g,tremolo=f=%g:d=%g'%(f0,d,f0*.9,d*.6),'tmp_v2.wav'],check=True);a,_=sf.read('tmp_v2.wav')
            if fx.get('trem'):
                f0,d=fx['trem'];tt=np.arange(len(a))/sr;a=a*(1-d*(0.5+0.5*np.sin(2*np.pi*f0*tt+rng.uniform(0,6))))
            if fx.get('breathy'):
                env=np.convolve(np.abs(a),np.ones(480)/480,'same');env/=env.max()+1e-9;a=a/np.abs(a).max()+fx['breathy']*whisp(a,sr)*np.sqrt(env)
            a=a/np.abs(a).max()*fx.get('gain',1.0)
            parts.append(a)
    return np.concatenate(parts),sr
os.makedirs('logvo',exist_ok=True); res={}; tot=0; durs={}
import sys
ONLY=set(sys.argv[1:])
for key,(h,body) in LOGS.items():
    if ONLY and key not in ONLY: continue
    v,lang,spd=VOICE[key]
    x,sr=synth(key,v,lang,spd); x/=np.abs(x).max()
    n=len(x)
    if key=='container':
        # slowed, echoing, with a faint wordless choir underneath
        t=np.arange(int(n/0.9)+sr*3)/sr
        sf.write('tmp_c.wav',x,sr)
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i','tmp_c.wav','-af','asetrate=%d,aresample=%d,aecho=0.8:0.7:90|210|380:0.3|0.18|0.1,tremolo=f=4.5:d=0.25'%(int(sr*0.93),sr),'tmp_c2.wav'],check=True)
        y,_=sf.read('tmp_c2.wav'); y=np.pad(y,(int(sr*1.2),int(sr*1.2)))
        tt=np.arange(len(y))/sr; choir=np.zeros_like(y)
        for f0,ph in [(196,0),(233.1,1.3),(293.7,2.1),(392,0.7)]:
            vib=1+0.006*np.sin(2*np.pi*5.2*tt+ph); choir+=np.sin(2*np.pi*np.cumsum(f0*vib)/sr)*(0.5+0.5*np.sin(2*np.pi*0.13*tt+ph))
        choir=bp(choir,150,1200,sr); choir/=np.abs(choir).max()
        y=y/np.abs(y).max()+choir*0.09
        hiss=bp(rng.standard_normal(len(y)),400,3800,sr); hiss/=np.abs(hiss).max(); y+=hiss*0.05*(0.6+0.4*np.sin(2*np.pi*0.7*tt))
    else:
        y=x
    # recorder clicks and static bursts around the message, low hiss underneath
    pre=bp(rng.standard_normal(int(sr*.28)),500,3600,sr);pre/=np.abs(pre).max();pre*=np.linspace(1,.2,len(pre))*0.35
    post=bp(rng.standard_normal(int(sr*.22)),500,3600,sr);post/=np.abs(post).max();post*=np.linspace(.2,1,len(post))*0.3
    gap=np.zeros(int(sr*.12)); y=np.concatenate([pre,gap,y/np.abs(y).max()*.9,gap*2,post])
    hiss=bp(rng.standard_normal(len(y)),300,3800,sr);hiss/=np.abs(hiss).max();y+=hiss*0.018
    for _ in range(int(len(y)/sr*1.5)):
        p=rng.integers(0,len(y)-40);y[p:p+3]+=rng.uniform(-.25,.25)
    sf.write('tmp_l.wav',y/np.abs(y).max()*.95,sr)
    af="highpass=f=260,lowpass=f=3700,equalizer=f=1600:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4,asoftclip=type=tanh:threshold=0.9,loudnorm=I=-16:TP=-1.5"
    out=f'logvo/{key}.mp3'
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i','tmp_l.wav','-af',af,'-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k',out],check=True)
    b=open(out,'rb').read();tot+=len(b);res[key]=base64.b64encode(b).decode()
    durs[key]=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',out],capture_output=True,text=True).stdout)
    print(f'{key:12s} {v:10s} {durs[key]:5.1f}s')
prev=json.load(open('logvo.json'));prev.update(res);json.dump(prev,open('logvo.json','w'));print('total',round(sum(durs.values())),'s,',tot//1024,'KB')
