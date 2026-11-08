import json, subprocess, base64, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
from kokoro_onnx import Kokoro
k=Kokoro('kok/kokoro-v1.0.onnx','kok/voices-v1.0.bin')
rng=np.random.default_rng(5)
def bp(x,lo,hi,sr):return sosfilt(butter(3,[lo,hi],'band',fs=sr,output='sos'),x)
TEXT="This is the Brimstone Maiden, deck one. If anyone can hear this, stay out of the vents."
voices=[v for v in sorted(k.get_voices()) if v[:2] in ('af','am','bf','bm')]
out={}
for v in voices:
    a,sr=k.create(TEXT,voice=v,speed=1.0,lang='en-us' if v[0]=='a' else 'en-gb');y=a.astype(np.float64);y/=np.abs(y).max()
    pre=bp(rng.standard_normal(int(sr*.2)),500,3600,sr);pre/=np.abs(pre).max();pre*=np.linspace(1,.2,len(pre))*.3
    y=np.concatenate([pre,np.zeros(int(sr*.1)),y*.9,np.zeros(int(sr*.15))]);h=bp(rng.standard_normal(len(y)),300,3800,sr);y+=h/np.abs(h).max()*.018
    sf.write('tmp_p.wav',y/np.abs(y).max()*.95,sr)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i','tmp_p.wav','-af',"highpass=f=260,lowpass=f=3700,equalizer=f=1600:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=4:attack=5:release=120:makeup=4,loudnorm=I=-16:TP=-1.5",'-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k','tmp_p.mp3'],check=True)
    out[v]=base64.b64encode(open('tmp_p.mp3','rb').read()).decode()
json.dump(out,open('pool.json','w'));print(len(out),'voices',sum(len(x) for x in out.values())//1024,'KB b64')
