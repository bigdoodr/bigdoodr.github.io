# Clean (dry) base recordings + glottal pulse marks for the in-browser voice lab.
import json, base64, sys, numpy as np, parselmouth
from parselmouth.praat import call
from kokoro_onnx import Kokoro
k=Kokoro('kok/kokoro-v1.0.onnx','kok/voices-v1.0.bin')
SR=24000
SAY={"Now THIS is a payment plan.":"Now this... is a payment plan.","That's a limb-ited warranty.":"That's a limb... ited warranty.",
"Brimstone Maiden. Ninety days overdue. Let's go collect.":"Brimstone Maiden. Ninety days overdue... Let's go collect.",
"Guess I'll take payment in limbs.":"Guess I'll take payment... in limbs.","Ship's repossessed. Mostly.":"Ship's repossessed... Mostly.",
"Huh. Didn't need that, apparently.":"Huh... Didn't need that, apparently.","Tram's open. Somebody's waiting, aren't they.":"Tram's open. Somebody's waiting... aren't they.",
"Consider that a footnote.":"Consider that... a footnote."}
VOICES={ 'onyx_adam':('Onyx + Adam','Deep, smooth with a little edge. The base for the current game voice.',lambda: 0.8*k.get_voice_style('am_onyx')+0.2*k.get_voice_style('am_adam'),'en-us'),
 'onyx':('Onyx','The deepest American voice. Calm and even.',lambda:'am_onyx','en-us'),
 'adam':('Adam','Mid-range and naturally rough.',lambda:'am_adam','en-us'),
 'michael':('Michael','Flat, matter-of-fact delivery.',lambda:'am_michael','en-us'),
 'fenrir':('Fenrir','Brighter and punchier. Takes heavy processing well.',lambda:'am_fenrir','en-us'),
 'lewis':('Lewis','Deep British voice with built-in gravel.',lambda:'bm_lewis','en-gb')}

REPO='ɹˌiːpəzˈɛst'
BUCKSEG={
 "Ship's repossessed. Mostly.":[('ph','ʃˈɪps '+REPO+'.',.88),.5,"Mostly."],
 "Great. Repossessed.":["Great.",.55,('ph',REPO+'.')],
 "Repossessed.":[('ph',REPO+'.')],
 "Oh, hello... what's this?":["Oh, hello.",.5,"What's this?"],
 "No power, no tram. Figures.":["No power, no tram.",.75,"Figures."],
 "Oh. You must be the co-signer.":["Oh.",.55,"You must be the co-signer."],
 "Spitters. Great.":["Spitters.",.7,"Great."],
 "Ouch! That's coming out of my commission.":["Ouch!",.45,"That's coming out of my commission."],
 "Should've read the fine print.":["Should've red the fine print."],
}
def segtrim(a):
    a=a.astype(np.float64);pk=np.abs(a).max()+1e-9;e=np.convolve(np.abs(a),np.ones(240)/240,'same');on=np.where(e>pk*0.02)[0]
    return a[max(0,on[0]-80):on[-1]+160] if len(on) else a
def synth_buck(text,voice):
    style,lang=VOICES[voice][2](),VOICES[voice][3]
    if text not in BUCKSEG:
        a,sr=k.create(SAY.get(text,text),voice=style,speed=1.0,lang=lang);return a.astype(np.float64)
    parts=[]
    for it in BUCKSEG[text]:
        if isinstance(it,float):parts.append(np.zeros(int(SR*it)));continue
        if isinstance(it,tuple):a,sr=k.create(it[1],voice=style,speed=(it[2] if len(it)>2 else 1.0),lang=lang,is_phonemes=True)
        else:a,sr=k.create(it,voice=style,speed=1.0,lang=lang)
        parts.append(segtrim(a)/ (np.abs(a).max()+1e-9))
    return np.concatenate(parts)
def dry(text,voice):
    x=synth_buck(text,voice); pk=np.abs(x).max()
    e=np.convolve(np.abs(x),np.ones(240)/240,'same'); on=np.where(e>pk*10**(-45/20))[0]
    x=x[max(0,on[0]-120):min(len(x),on[-1]+240)]; x=x/np.abs(x).max()*.95
    s=parselmouth.Sound(x,SR); pitch=call(s,"To Pitch (cc)",0,60,15,"no",0.03,0.45,0.01,0.35,0.14,320)
    pp=call([s,pitch],"To PointProcess (cc)"); n=call(pp,"Get number of points")
    m=[int(round(call(pp,"Get time from index",i)*SR)) for i in range(1,n+1)]
    d=[m[0]]+[m[i]-m[i-1] for i in range(1,len(m))] if m else []
    y=np.sign(x)*np.log1p(255*np.abs(x))/np.log(256); b=np.clip(np.round((y+1)/2*255),0,255).astype(np.uint8)
    return {'pcm':base64.b64encode(b.tobytes()).decode(),'marks':','.join(map(str,d)),'n':len(x)}
if __name__=='__main__':
    mode=sys.argv[1]
    if mode=='lab':
        LINES=["Brimstone Maiden. Ninety days overdue. Let's go collect.","Oh. You must be the co-signer.","Nobody skips out on Gorgon. Not even the dead.","Now THIS is a payment plan.","Ow. That's coming out of my commission."]
        out={'sr':SR,'lines':LINES,'voices':{v:{'name':VOICES[v][0],'desc':VOICES[v][1],'clips':[dry(t,v) for t in LINES]} for v in VOICES}}
        json.dump(out,open('lab_stems.json','w'))
        print('lab stems KB',len(json.dumps(out))//1024, 'secs per voice', round(sum(c['n'] for c in out['voices']['onyx'].values() if False) or sum(c['n'] for c in out['voices']['onyx']['clips'])/SR,1))
    else:  # bake: all game lines for one voice
        v=sys.argv[2]; LINES=list(json.load(open(sys.argv[3])) if len(sys.argv)>3 else json.load(open('vo.json')).keys())
        json.dump({'sr':SR,'lines':LINES,'clips':[dry(t,v) for t in LINES]},open(sys.argv[4] if len(sys.argv)>4 else f'bake_stems_{v}.json','w')); print('bake stems ok')
