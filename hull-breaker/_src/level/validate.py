import json, collections
from PIL import Image, ImageDraw
L=json.load(open('level.json')); W,H=L['w'],L['h']; G=L['geo']; O=L['obj']
FLOOR='.'; DOORS='DX12345'; errs=[]
fl=lambda x,y: 0<=x<W and 0<=y<H and G[y][x] in FLOOR+DOORS
for y in range(H):
    for x in range(W):
        c=G[y][x]
        if c in DOORS:
            h=G[y][x-1]=='.' and G[y][x+1]=='.'; v=G[y-1][x]=='.' and G[y+1][x]=='.'
            if not (h or v): errs.append(f'door {c} at {x},{y} not between floors')
        o=O[y][x]
        if o!=' ' and c!='.': errs.append(f'object {o} at {x},{y} on {c}')
        if c=='.' and (x in(0,W-1) or y in(0,H-1)): errs.append(f'floor on border {x},{y}')
# progression BFS
start=next((x,y) for y in range(H) for x in range(W) if O[y][x]=='@')
def reach(have):
    seen={start}; q=collections.deque([start])
    while q:
        x,y=q.popleft()
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if (nx,ny) in seen or not(0<=nx<W and 0<=ny<H): continue
            c=G[ny][nx]
            if c=='.' or c in 'DX' or (c=='1' and 'B' in have) or (c=='2' and 'Y' in have) or (c=='3' and 'R' in have) or (c=='4' and 'P' in have) or (c=='5' and 'V' in have):
                seen.add((nx,ny)); q.append((nx,ny))
    return seen
def adjwall(seen,ch): return [(x,y) for y in range(H) for x in range(W) if G[y][x]==ch and any((x+dx,y+dy) in seen for dx,dy in((1,0),(-1,0),(0,1),(0,-1)))]
have=set(); order=[]
for _ in range(10):
    s=reach(have); new=set()
    for (x,y) in s:
        if O[y][x] in 'BYR': new.add(O[y][x])
    if len(adjwall(s,'Z'))==3 and 'B' in have: new.add('P')
    if adjwall(s,'O') and 'R' in have and 'P' in have: new.add('V')
    if new<=have: break
    for n in sorted(new-have): order.append((n,len(s)))
    have|=new
s=reach(have)
print('progression:',order)
floor=sum(r.count('.') for r in G); print('floor cells',floor,'reachable',len([p for p in s if G[p[1]][p[0]]=='.']))
unreach=[(O[y][x],x,y) for y in range(H) for x in range(W) if O[y][x]!=' ' and (x,y) not in s]
print('unreachable objects',unreach[:20])
tram=[z for z in L['zones'] if z['id']=='tram'][0]; print('tram reachable',(tram['x1']+5,tram['y1']+3) in s)
cnt=collections.Counter(c for r in O for c in r if c!=' ')
E={'all':'hcsxzd','normal':'HCSXZD','hard':'67895'}
for k,v in E.items(): print(k,'enemies',sum(cnt[c] for c in v))
print({c:cnt[c] for c in '$l+*aei o&!?%BYRKOtkpmb' if c!=' '})
print('secret doors',sum(r.count('X') for r in G),'saves',sum(r.count('Q') for r in G),'vents',sum(r.count('v') for r in G))
# log order
print('log order:',[(next(z['id'] for z in L['zones'] if z['x1']<=x<=z['x2'] and z['y1']<=y<=z['y2'])) for y in range(H) for x in range(W) if O[y][x]=='l'])
print('asset order:',[(next(z['id'] for z in L['zones'] if z['x1']<=x<=z['x2'] and z['y1']<=y<=z['y2'])) for y in range(H) for x in range(W) if O[y][x]=='$'])
print('ERRORS',errs)
S=8; im=Image.new('RGB',(W*S,H*S),(0,0,0)); d=ImageDraw.Draw(im)
col={'.':(40,44,50),'D':(200,200,200),'X':(255,0,255),'1':(60,120,255),'2':(255,220,0),'3':(255,40,40),'4':(255,140,0),'5':(0,255,120),'Q':(0,255,0),'Z':(255,255,255),'O':(0,255,255),'v':(120,120,0)}
for y in range(H):
    for x in range(W):
        c=G[y][x]; d.rectangle([x*S,y*S,x*S+S-1,y*S+S-1],fill=col.get(c,(85,90,100) if c!='.' else (40,44,50)))
        o=O[y][x]
        if o!=' ':
            cc=(255,60,60) if o in 'hcsxzdHCSXZD67895' else (255,200,0) if o in 'BYR$' else (0,200,255) if o=='l' else (90,255,90) if o=='@' else (160,160,160) if o in 'KOtkpmb' else (255,255,255)
            d.ellipse([x*S+1,y*S+1,x*S+S-2,y*S+S-2],fill=cc)
for z in L['zones']: d.text((z['x1']*S+2,z['y1']*S+1),z['id'],fill=(140,255,200))
im.save('map.png')
