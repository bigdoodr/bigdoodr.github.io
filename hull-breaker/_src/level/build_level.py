# Builds Deck 01 of Hull Breaker as two ASCII layers (geometry + objects) and zone data.
import json
W,H=90,78
G=[['#']*W for _ in range(H)]
O=[[' ']*W for _ in range(H)]
ZONES=[]
def room(zid,name,x1,y1,x2,y2,wall='#',floor=0,power=False,secret=False,dark=False):
    for y in range(y1-1,y2+2):
        for x in range(x1-1,x2+2):
            if x1<=x<=x2 and y1<=y<=y2: G[y][x]='.'
            elif G[y][x]=='#' : G[y][x]=wall
    ZONES.append(dict(id=zid,name=name,x1=x1,y1=y1,x2=x2,y2=y2,floor=floor,power=power,secret=secret,dark=dark))
def block(x1,y1,x2,y2,ch):
    for y in range(y1,y2+1):
        for x in range(x1,x2+1): G[y][x]=ch
def hollow(x1,y1,x2,y2):
    for y in range(y1,y2+1):
        for x in range(x1,x2+1): G[y][x]='.'
def door(x,y,ch='D'): G[y][x]=ch
def wall(x,y,ch): G[y][x]=ch
def put(s):
    for tok in s.split():
        ch,xy=tok[0],tok[1:]; x,y=map(int,xy.split(','))
        assert O[y][x]==' ', ('dup',ch,x,y,O[y][x]); O[y][x]=ch

# ---------- rooms ----------
room('dock','DOCKING BAY',2,58,22,74,'h',2)
room('dockoffice','DOCK OFFICE',2,52,8,56,'#',0)
room('closet1','MAINTENANCE CLOSET',19,53,22,56,'=',0,secret=True)
room('transit','TRANSIT CORRIDOR',15,49,17,56,'p',0)
room('transit2','TRANSIT CORRIDOR',18,49,31,51,'p',0)
room('hub','CENTRAL ATRIUM',33,38,55,56,'#',2)
room('medcorr','MED BAY',26,42,31,42,'m',1)
room('reception','MED BAY',14,36,24,46,'m',1)
room('surgery','SURGERY',2,36,12,46,'m',1)
room('morgue','MORGUE',2,24,12,34,'m',1,dark=True)
room('quarantine','QUARANTINE',14,24,24,34,'m',1)
room('lab','HIDDEN LAB',26,26,30,32,'=',0,secret=True)
room('hydro','HYDROPONICS',2,4,28,22,'g',3)
room('hydrocloset','SEED VAULT',3,1,8,2,'=',0,secret=True)
room('hydrocorr','CREW DECK',30,12,32,12,'q',4)
room('bunks','CREW BUNKS',34,4,44,16,'q',4)
room('bunkcloset','STORAGE NOOK',34,1,37,2,'=',0,secret=True)
room('showers','LOCKER ROOM',46,4,56,16,'k',1)
room('captain',"CAPTAIN'S QUARTERS",58,4,66,12,'q',4)
room('capcloset',"CAPTAIN'S STASH",58,14,61,15,'=',0,secret=True)
room('crewcorr','CREW DECK',43,31,45,36,'#',0)
room('commons','CREW MESS',34,18,56,29,'q',4)
room('redcorr','SECURITY CHECKPOINT',58,23,66,25,'u',0)
room('security','SECURITY',68,16,80,28,'u',2)
room('armory','ARMORY',82,16,88,28,'u',2)
room('armcloset','WEAPONS LOCKER',84,30,88,32,'=',0,secret=True)
room('bridge','BRIDGE',68,2,88,14,'u',2)
room('engcorr','ENGINEERING',57,46,60,48,'p',0,power=True)
room('hall','ENGINEERING',62,38,76,56,'p',0,power=True)
room('coolant','COOLANT PUMPS',62,31,70,36,'p',0,power=True)
room('chief','CHIEF ENGINEER',72,31,80,36,'#',2,power=True)
room('reactor','REACTOR',78,38,88,56,'p',2,power=True)
room('engcloset','PUMP CLOSET',62,58,65,61,'=',0,secret=True)
room('tramcorr','TRAM ACCESS',68,58,70,63,'h',0,power=True)
room('tram','TRAM STATION',62,65,88,76,'T',2,power=True)
room('tramcloset','BAGGAGE ROOM',80,60,87,63,'=',0,secret=True)
room('cargo','CARGO HOLD',24,58,52,76,'c',2,dark=True)
room('cargooffice','CARGO OFFICE',54,58,60,66,'#',0)
room('annex','CARGO ANNEX',54,68,60,76,'c',2,dark=True)

# ---------- obstacles ----------
block(10,68,15,72,'=')                                  # docked shuttle
for x,y in [(36,41),(51,41),(36,52),(51,52)]: block(x,y,x+1,y+1,'#')   # atrium pillars
block(42,45,46,49,'t'); hollow(43,46,45,48)              # kiosk with hidden interior
ZONES.append(dict(id='kiosk',name='KIOSK',x1=43,y1=46,x2=45,y2=48,floor=2,power=False,secret=True,dark=False))
for y in (8,13,18):                                        # planter rows
    block(6,y,12,y+1,'G'); block(15,y,24,y+1,'G')
block(50,19,55,20,'k')                                     # galley counter
block(72,19,75,20,'=')                                     # security desks
block(72,6,84,7,'n'); block(77,10,79,11,'n')               # bridge consoles
block(66,42,68,44,'p'); block(70,50,72,52,'p')             # engineering machinery
block(81,44,85,50,'r')                                     # reactor core
for (x1,y1,x2,y2,c) in [(27,61,30,63,'c'),(34,61,40,62,'C'),(44,61,50,63,'c'),(27,67,31,70,'C'),(44,67,49,71,'C'),(28,73,34,75,'c'),(40,74,48,75,'C')]:
    block(x1,y1,x2,y2,c)
block(36,66,40,69,'c'); hollow(37,67,39,68)               # hollow container
ZONES.append(dict(id='container',name='SEALED CONTAINER',x1=37,y1=67,x2=39,y2=68,floor=2,power=False,secret=True,dark=True))
block(63,74,87,76,'T')                                     # the tram car

# ---------- doors ----------
for (x,y,c) in [(5,57,'D'),(20,57,'X'),(16,57,'D'),(32,50,'D'),(32,42,'D'),(25,42,'D'),(13,41,'D'),(7,35,'D'),(19,35,'D'),
 (25,29,'X'),(7,23,'D'),(5,3,'X'),(29,12,'D'),(33,12,'D'),(36,3,'X'),(39,17,'D'),(51,17,'D'),(45,10,'D'),(57,8,'D'),(59,13,'X'),
 (44,37,'D'),(44,30,'D'),(57,24,'3'),(67,24,'D'),(81,22,'D'),(86,29,'X'),(74,15,'D'),(56,47,'1'),(61,47,'D'),(66,37,'D'),
 (76,37,'4'),(77,47,'D'),(63,57,'X'),(69,57,'5'),(69,64,'D'),(84,64,'X'),(44,57,'2'),(53,62,'D'),(53,72,'D'),(44,49,'X'),(38,69,'X')]:
    door(x,y,c)

# ---------- special walls ----------
for y in range(60,73): wall(1,y,'w')
for x in list(range(69,77))+list(range(80,88)): wall(x,1,'w')
wall(78,1,'O')                                             # tram override console
for x in range(64,63+23,3): wall(x,77,'w') if G[77][x]!='.' else None
for (x,y) in [(1,54),(44,45),(25,38),(33,24),(61,52),(30,57),(67,19),(67,61)]: wall(x,y,'Q')   # save stations
for (x,y) in [(61,40),(89,47),(64,30)]: wall(x,y,'Z')                                         # breakers
VENTS=[(38,37),(50,37),(32,54),(56,53),(14,47),(24,47),(26,3),(1,12),(10,23),(33,21),(57,20),(47,30),(62,37),(77,53),(65,57),
 (23,70),(35,77),(53,66),(40,57),(70,15),(80,29),(67,10),(87,1),(61,70),(89,70),(75,64),(2,51),(25,40),(1,30),(12,47)]
for (x,y) in VENTS:
    assert G[y][x] not in '.DX12345QZO', ('vent on bad cell',x,y,G[y][x]); wall(x,y,'v')
for (x,y,c) in [(9,57,'b'),(23,61,'s'),(32,46,'b'),(56,44,'s'),(13,38,'b'),(1,27,'b'),(13,30,'s'),(25,33,'b'),(29,18,'s'),(45,6,'b'),
 (34,30,'s'),(57,27,'b'),(67,27,'b'),(81,26,'s'),(61,44,'s'),(77,40,'b'),(70,37,'b'),(89,52,'s'),(23,75,'b'),(53,60,'s'),(53,75,'b'),
 (61,73,'s'),(89,68,'b'),(18,48,'b'),(3,51,'t'),(7,51,'t'),(14,35,'t'),(23,35,'t'),(55,17,'t'),(67,4,'t'),(89,20,'t'),(89,24,'t'),
 (71,30,'t'),(81,33,'t'),(61,32,'t'),(56,57,'t'),(61,60,'t'),(48,37,'t'),(1,40,'t'),(1,44,'t')]:
    if G[y][x] not in '.DX12345QZOv': wall(x,y,c)

# ---------- objects ----------
# @ start | enemies: h husk c crawler s spitter x bloater z brute d dormant  (lowercase = every difficulty)
# uppercase H C S X Z D = Normal and up | digits 6 husk 7 crawler 8 spitter 9 bloater 5 brute = Hard and up
# pickups: + med  * trauma kit  a cells  e shells  i rivets  o charge bombs  & armor  ! boomstick  ? rivet driver  % bomb satchel
#          B Y R keycards  l audio log  $ ship asset | decor: K crate  O barrel  t table  k corpse  p remains  m arcade  b bunk
put("@4,66 d8,60 d18,70 h14,63 K3,59 K4,59 K3,60 K21,59 K21,60 K12,74 O10,59 O20,73 k6,71 p17,66 +2,73 a18,59")
put("l4,53 +7,55 &20,54 a21,55 H16,52 h25,50 k22,50")
put("h38,40 h50,44 c40,54 H54,50 648,40 S48,55 O34,39 O54,55 k45,42 p39,47 e?0,0".replace(" e?0,0",""))
put("h16,38 D22,44 C17,45 +15,45 *23,37 l20,40 $14,36 k18,42")
put("d5,40 d9,44 H4,45 x10,38 t6,42 +3,37 a11,46 $8,37")
put("d4,28 D8,28 d11,30 D4,32 d9,33 66,30 l11,25 $2,34 +12,24 t7,30 k3,25")
put("c16,26 c22,26 C19,30 715,33 x23,33 a24,24 $20,33 p17,28")
put("*28,29 l27,27 $29,31 e27,31")
put("s10,6 s22,11 h5,16 H18,16 c26,20 C12,21 S25,6 88,11 x16,11 X4,20 l27,5 $14,4 $3,21 +20,21 a13,16 e25,16 O27,21 k9,15")
put("e4,1 $7,1 i6,2")
put("d36,6 d42,6 h38,14 H43,12 c35,15 640,10 b35,8 b38,8 b41,8 b44,8 l44,15 $34,4 +39,4")
put("m35,1 $37,1 *36,2")
put("h48,6 x54,12 H50,14 S55,5 747,11 &56,16 $52,4 e46,15 k49,9")
put("H64,10 c59,11 B65,5 l60,5 $62,8 *66,12 t62,10")
put("e58,14 $60,15 +61,14")
put("h36,20 h52,27 H42,22 H48,26 c38,28 S55,22 645,19 835,27 t40,24 t44,24 t48,24 t40,27 !35,19 e55,28 +46,28 l56,23 $50,22 O56,29 k47,21")
put("C44,33 H62,24 S65,23")
put("h70,18 H78,20 s74,26 S69,27 576,22 l79,17 $68,16 e80,28 i70,28 *73,22 O80,16")
put("H84,18 x86,26 &88,16 e82,16 e88,24 i85,22 o83,27 a87,20 $86,17")
put("&85,31 o87,31 $84,30")
put("h70,4 h86,4 H78,12 S72,13 S84,13 680,8 870,10 x87,12 l69,3 $88,2 +75,13 *88,13")
put("h59,47")
put("s66,40 s74,54 h63,44 H72,46 c70,55 C64,54 x75,41 X63,50 668,48 874,50 966,52 i76,56 +62,56 l75,39 $62,38 O63,39 O76,49")
put("h64,33 c68,35 S69,32 763,35 ?66,33 i62,31 i70,36 $70,31")
put("Y79,33 l73,32 *80,36 $76,34 i72,36")
put("s80,40 s86,54 h79,52 H87,42 x80,47 X86,48 684,40 782,53 +79,39 e88,56 $88,38 i78,56 l87,51 O88,40 O79,55")
put("i63,59 *64,60 $62,61")
put("z75,68 Z82,70 568,70 h64,66 c86,67 S70,66 x80,66 +63,72 *87,72 e63,67 i87,66 $62,75 O72,66 O84,66")
put("*81,61 &86,61 $83,62")
put("h26,59 h42,60 H33,64 H50,66 c26,72 c42,72 C35,76 x31,65 x46,65 X40,71 s51,75 S25,66 633,71 750,59 843,65 935,60 e24,76 a52,58 +30,72 i38,64 l25,58 $51,76 $24,62 O30,66 O25,74 O52,70 O33,59 K24,68 K52,64 K38,58")
put("o37,67 $39,67 l38,68")
put("R59,59 l55,59 *60,66 $58,63 D57,61")
put("%57,74 o55,70 o59,70 x58,76 X55,75 $60,76 e54,76")

LEVEL=dict(w=W,h=H,geo=[''.join(r) for r in G],obj=[''.join(r) for r in O],zones=ZONES)
json.dump(LEVEL,open('level.json','w'))
print('built')
