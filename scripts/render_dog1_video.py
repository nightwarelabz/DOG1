"""Render the fictional DOG1 model, its continuous routes, and abstract game events."""
from pathlib import Path
import argparse,bisect,json,math,shutil,subprocess,tempfile,wave,os
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--work-dir',type=Path);args=parser.parse_args()
work=args.work_dir or Path(tempfile.mkdtemp(prefix='dog1-video-'));work.mkdir(parents=True,exist_ok=True)
subprocess.run(['node',str(ROOT/'scripts/build_dog1_video.mjs'),str(work)],check=True)
data=json.loads((work/'frames.json').read_text());frames=data['frames'];W,H,FPS,DURATION=1920,1080,24,60
GX,GY,CELL=80,208,24;GW,GH=42*CELL,32*CELL
BG=(8,17,23);FG=(225,238,230);MUTED=(140,174,166);LINE=(44,66,68);PANEL=(16,31,39)
C={'F1':(172,232,190),'F2':(184,182,244),'F3':(237,189,123)};G=C['F1'];Y=(245,197,116)
font=os.environ.get('DOG1_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');monofont=os.environ.get('DOG1_MONO_FONT','/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
f={s:ImageFont.truetype(font,s) for s in [9,12,14,15,16,17,18,19,20,21,22,24,26,28,30,32,34,38,42,48]}
m={s:ImageFont.truetype(monofont,s) for s in [8,9,10,12,13,14,15,16,17,18,19,20,21,22,24,26,28,30,34,38,42,48]}
audio=np.zeros(48000*60,dtype=np.float32)
for event in data['audio']:
 freq={'identify':620,'neutralize':880,'refuel-start':440,'power-allocation':1175}[event['type']]
 length=.15 if event['type']!='power-allocation' else .35
 t=np.arange(int(length*48000))/48000;env=np.sin(np.pi*t/length)**2
 samples=.11*env*(np.sin(2*np.pi*freq*t)+.25*np.sin(2*np.pi*freq*1.5*t))
 at=int(event['time']*48000);audio[at:at+len(samples)]+=samples
peak=float(np.max(np.abs(audio)));audio*=min(1,.42/max(peak,1e-9))
with wave.open(str(work/'audio.wav'),'wb') as out:out.setnchannels(1);out.setsampwidth(2);out.setframerate(48000);out.writeframes((audio*32767).astype('<i2').tobytes())
BASE=Image.new('RGB',(W,H),BG);draw=ImageDraw.Draw(BASE)
def text(d,xy,value,size=20,color=FG,anchor=None,mono=False):d.text(xy,str(value),font=(m if mono else f)[size],fill=color,anchor=anchor)
def box(d,coords,fill=PANEL,outline=LINE):d.rounded_rectangle(coords,radius=8,fill=fill,outline=outline,width=1)
text(draw,(59,28),'DOG1',48);text(draw,(229,42),'GLOBAL GRID / TABLETOP NETWORK',21,MUTED,mono=True)
text(draw,(1861,39),'42 × 32 / A1–AP32',24,FG,'ra',True)
text(draw,(59,102),'POSITION  /  POWER POINTS  /  CONTINUOUS TRAJECTORY',18,MUTED,mono=True)
draw.line((58,139,1862,139),fill=LINE,width=2);draw.line((1120,165,1120,1030),fill=LINE)
text(draw,(80,163),'R0–R3 / P1–P3',17,MUTED,mono=True);text(draw,(1088,163),'AP ↔ A',17,MUTED,'ra',True)
for x in range(42):
 n=x+1;label=''
 while n:n-=1;label=chr(65+n%26)+label;n//=26
 text(draw,(GX+(x+.5)*CELL,195),label,12,MUTED,'mm',True)
for y in range(32):text(draw,(GX-10,GY+(y+.5)*CELL),str(y+1),14,MUTED,'rm',True)
for x,label,color in [(80,'A-cell',G),(235,'T-cell',Y),(390,'Plateau', (133,113,65)),(570,'Refuel node',FG),(805,'Continuous wrap',MUTED)]:
 draw.rectangle((x,996,x+12,1008),fill=color);text(draw,(x+23,990),label,17,MUTED)
draw.line((58,1040,1862,1040),fill=LINE)
text(draw,(60,1052),'FICTIONAL WORLD · ABSTRACT DISTANCE, FUEL AND POWER UNITS',15,MUTED,mono=True)
text(draw,(1860,1052),'NODES N1–N7 / ALLEGIANCES F1–F3',15,MUTED,'ra',True)
terrainBase=Image.new('RGB',(GW,GH),BG);gd=ImageDraw.Draw(terrainBase)
for c in data['terrain']:
 color=(88,78,46) if c['plateau'] else {'R0':(16,37,48),'R1':(36,62,58),'R2':(45,68,54),'R3':(50,59,78)}[c['region']]
 x=(c['x']-.5)*CELL;y=(c['y']-.5)*CELL;gd.rectangle((x+1,y+1,x+CELL-2,y+CELL-2),fill=color)
 gd.text((x+CELL/2,y+CELL/2),c['cell'],font=m[8],fill=(107,132,123),anchor='mm')

def drawframe(time):
 index=max(0,min(1200,round((time-3)*24)));s=frames[index];final=time>=53
 im=BASE.copy();d=ImageDraw.Draw(im);grid=terrainBase.copy();g=ImageDraw.Draw(grid)
 text(d,(1860,102),f'STEP {s["tick"]:05.1f} / 240  ·  {int(time):02d} / 60 s',18,MUTED,'ra',True)
 def segment(a,b,color,width=1):
  base=math.floor(a['ux']/42)*42
  for shift in [-42,0,42]:g.line(((a['ux']-base+shift)*CELL,a['y']*CELL,(b['ux']-base+shift)*CELL,b['y']*CELL),fill=color,width=width)
 for i,a in enumerate(data['nodes']):
  b=data['nodes'][(i+1)%len(data['nodes'])];segment({'ux':a['x'],'y':a['y']},{'ux':b['x']+(42 if b['x']<a['x'] else 0),'y':b['y']},(113,151,155),2)
 for u in s['units']:
  for a,b in zip(u['trail'],u['trail'][1:]):segment(a,b,tuple(int(v*.55) for v in C[u['faction']]),2)
 for n in data['nodes']:
  x=n['x']*CELL;y=n['y']*CELL;g.rectangle((x-6,y-6,x+6,y+6),outline=FG if n['refuel'] else MUTED,width=2)
  if n['refuel']:g.rectangle((x-2,y-2,x+2,y+2),fill=FG)
  g.text((x-10 if x>GW-100 else x+10,y+13),n['id'],font=m[14],fill=FG,anchor='ra' if x>GW-100 else 'la',stroke_width=2,stroke_fill=BG)
 for token in s['tokens']:
  if token['status']=='hidden':continue
  x=token['x']*CELL;y=token['y']*CELL;active=token['status']=='identified';color=Y if active else (127,168,144)
  if active:g.polygon([(x,y-7),(x+7,y),(x,y+7),(x-7,y)],outline=color,width=2)
  else:g.line((x-5,y,x-1,y+4,x+6,y-4),fill=color,width=2)
  g.text((x-11 if x>GW-140 else x+11,y-21),token['id']+' '+token['cell'],font=m[13],fill=color,anchor='ra' if x>GW-140 else 'la',stroke_width=2,stroke_fill=BG)
 for u in s['units']:
  x=u['x']*CELL;y=u['y']*CELL;color=C[u['faction']]
  for shift in [-GW,0,GW]:g.ellipse((x+shift-2*CELL,y-2*CELL,x+shift+2*CELL,y+2*CELL),outline=tuple(int(v*.46) for v in color),width=1)
  g.polygon([(x+9,y),(x-6,y-6),(x-6,y+6)],fill=color)
  g.text((min(GW-34,x+12),min(GH-20,y+12)),u['id'],font=m[15],fill=color,stroke_width=2,stroke_fill=BG)
  if u['state']=='refueling':g.arc((x-12,y-12,x+12,y+12),-90,-90+360*u['fuel']/u['capacity'],fill=color,width=3)
 im.paste(grid,(GX,GY))
 tick=s['tick']
 if final:title='DOG1 / RUN REVIEW';line1='Every circuit follows the connected route.';line2='Refuelling and token changes are recorded.'
 elif tick<55:title='POSITION + POWER';line1='An opposing unit must reach an adjacent tile.';line2='Its game power must meet the token defense.'
 elif tick<120:title='TRAJECTORY + FUEL';line1='The AP/A seam wraps the display only.';line2='Refuelling takes time at designated nodes.'
 elif tick<170:
  title='M1 / POWER 4 → 6';line1='Scripted game allocation at step 120.'
  cleared=next(t for t in s['tokens'] if t['id']=='T5')['status']=='neutralized'
  line2='T5 cleared after M1 reached an adjacent tile.' if cleared else 'T5 remains active until M1 reaches position.'
 else:title='CIRCUMNAVIGATION';line1='Distance and fuel follow actual movement.';line2='Each unit keeps its own relative speed.'
 text(d,(1150,164),'FICTIONAL GAME STATE',16,G,mono=True);text(d,(1150,195),title,30)
 text(d,(1150,246),line1,19,MUTED);text(d,(1150,274),line2,19,MUTED)
 for j,(label,value) in enumerate([('ACTIVE T',s['totals']['activeT']),('NEUTRALIZED',s['totals']['neutralized']),('REFUELS',s['totals']['refuels'])]):
  x=1150+j*239;box(d,(x,318,x+222,413));text(d,(x+16,332),label,15,MUTED,mono=True);text(d,(x+16,358),value,38,Y if j==0 else FG,mono=True)
 for i,u in enumerate(s['units']):
  y=436+i*103;box(d,(1150,y,1850,y+89));d.line((1151,y+9,1151,y+80),fill=C[u['faction']],width=3)
  text(d,(1168,y+10),u['id']+' / '+u['faction'],20,C[u['faction']],mono=True)
  text(d,(1395,y+12),u['cell']+' → '+u['nextCell']+f' / {u["legRemaining"]:.1f}c',17,FG,mono=True)
  text(d,(1831,y+12),u['state'].upper(),15,MUTED,'ra',True)
  text(d,(1168,y+42),f'{u["speed"]:.2f} c/step',16,MUTED,mono=True)
  text(d,(1395,y+42),f'{u["distance"]:.1f} c  /  {u["lap"]} circuits',16,MUTED,mono=True)
  text(d,(1831,y+42),f'POWER {u["power"]}  FUEL {u["fuel"]:.1f}',16,C[u['faction']],'ra',True)
  d.rectangle((1168,y+75,1831,y+79),fill=LINE);d.rectangle((1168,y+75,1168+663*u['fuel']/u['capacity'],y+79),fill=C[u['faction']])
 text(d,(1150,867),f'A-CELLS {s["totals"]["areaCells"]:4d} / 1344    DISTANCE {s["totals"]["distance"]:.1f} c',18,FG,mono=True)
 text(d,(1150,905),'Power = game points / F1–F3 = allegiances',17,MUTED)
 text(d,(1150,934),'Plateau terrain alone does not establish opposition.',17,MUTED)
 event=s['events'][-1] if s['events'] else None
 if event:
  value=f'{event["unit"]}  {event["type"].upper()}  {event.get("token",event.get("node",""))}'
  text(d,(1150,979),value,18,G,mono=True)
 else:text(d,(1150,979),'N1–N7 / CONTINUOUS ROUTE READY',18,G,mono=True)
 return im

for t in [7,19,31,43,57]:drawframe(t).save(work/f'review-{t:02d}.png')
output=ROOT/'media/DOG1.mp4'
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080','-r','24','-i','-',
 '-i',str(work/'audio.wav'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-t','60','-movflags','+faststart','-metadata','title=DOG1 — Fictional global grid game',str(output)]
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
try:
 for i in range(1440):
  p.stdin.write(drawframe(i/24).tobytes())
  if i%120==0:print(f'Rendered {i//24:02d} / 60 seconds',flush=True)
finally:p.stdin.close()
if p.wait():raise RuntimeError('Video encoding failed')
shutil.copyfile(work/'manifest.json',ROOT/'media/DOG1-video.json')
print(output,flush=True)
if not args.work_dir:shutil.rmtree(work)
