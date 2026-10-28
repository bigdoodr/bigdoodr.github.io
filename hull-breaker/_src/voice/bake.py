import asyncio, base64, json, wave, os, subprocess
from playwright.async_api import async_playwright
F='file:///tmp/claude-0/-home-claude/27fce461-ca6e-581f-ac1b-fc2f8b33aa66/scratchpad/buck-voice-lab.html'
P={"voice":"michael","pitch":-11,"pace":95,"size":87,"inton":100,"hoarse":37,"growl":55,"breath":61,"grit":54,"low":9.5,"mud":3.5,"pres":6,"bright":5300,"comp":50}
import sys
stems=json.load(open(sys.argv[1]));OUT=sys.argv[2]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        pg=await b.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
        await pg.goto(F); await pg.wait_for_timeout(800)
        out=await pg.evaluate("""([st,P])=>st.lines.map((l,i)=>{const y=BuckDSP.render(BuckDSP.decodeClip(st.clips[i]),P,l);
            const b=new Int16Array(y.length);for(let k=0;k<y.length;k++)b[k]=Math.max(-32767,Math.min(32767,Math.round(y[k]*32767)));
            let s='';const u=new Uint8Array(b.buffer);for(let k=0;k<u.length;k+=8192)s+=String.fromCharCode.apply(null,u.subarray(k,k+8192));return btoa(s);})""",[stems,P])
        print('errors',errs); await b.close()
    os.makedirs(OUT,exist_ok=True); res={}; tot=0
    for i,(l,b64) in enumerate(zip(stems['lines'],out)):
        w=wave.open(f'{OUT}/{i}.wav','wb');w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(base64.b64decode(b64));w.close()
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',f'{OUT}/{i}.wav','-c:a','libmp3lame','-b:a','56k',f'{OUT}/{i}.mp3'],check=True)
        d=open(f'{OUT}/{i}.mp3','rb').read(); tot+=len(d); res[l]=base64.b64encode(d).decode()
    json.dump(res,open(OUT+'.json','w')); print('lines',len(res),'KB',tot//1024)
asyncio.run(main())
