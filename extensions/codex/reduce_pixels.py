"""Reduce the existing large Legendary animation without redrawing its anatomy.
Input: unchanged 320x320-frame RGBA atlas and its manifest, copied into source/.
"""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source'
LEVELS=[64,96,128]
DISPLAY=384
BG='#0b1925'

def save_gif(frames,path,duration=50):
    sample=Image.new('RGB',(frames[0].width,frames[0].height*16))
    for i in range(16):sample.paste(frames[i*len(frames)//16],(0,i*frames[0].height))
    palette=sample.quantize(colors=240,dither=Image.Dither.NONE)
    indexed=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
    indexed[0].save(path,save_all=True,append_images=indexed[1:],duration=duration,loop=0,disposal=2,optimize=False)
    with Image.open(path) as gif:
        total=0
        for i in range(gif.n_frames):gif.seek(i);total+=gif.info['duration']
        assert total==len(frames)*duration

def main():
    meta=json.loads((SOURCE/'legendary.json').read_text())
    atlas=Image.open(SOURCE/'legendary-atlas.png').convert('RGBA')
    original=[]
    for i in range(meta['frameCount']):
        x=(i%meta['columns'])*meta['width'];y=(i//meta['columns'])*meta['height']
        original.append(atlas.crop((x,y,x+meta['width'],y+meta['height'])))
    all_versions={}
    for size in LEVELS:
        native=[frame.resize((size,size),Image.Resampling.NEAREST) for frame in original]
        native[0].save(ROOT/f'legendary-{size}px.png')
        small_atlas=Image.new('RGBA',(size*meta['columns'],size*10))
        display=[]
        for i,frame in enumerate(native):
            small_atlas.paste(frame,((i%meta['columns'])*size,(i//meta['columns'])*size))
            enlarged=frame.resize((DISPLAY,DISPLAY),Image.Resampling.NEAREST)
            bg=Image.new('RGBA',(DISPLAY,DISPLAY),BG)
            display.append(Image.alpha_composite(bg,enlarged).convert('RGB'))
        small_atlas.save(ROOT/f'legendary-{size}px-atlas.png',optimize=True)
        reduced={**meta,'width':size,'height':size,'atlas':f'legendary-{size}px-atlas.png',
                 'reduction':'nearest-neighbor from unchanged large animation; no redrawing'}
        (ROOT/f'legendary-{size}px.json').write_text(json.dumps(reduced,indent=2)+'\n')
        save_gif(display,ROOT/f'legendary-{size}px.gif')
        all_versions[size]=display
    try:font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
    except OSError:font=ImageFont.load_default()
    compare=[]
    for i in range(meta['frameCount']):
        surface=Image.new('RGB',(DISPLAY*3,DISPLAY+54),BG);d=ImageDraw.Draw(surface)
        for j,size in enumerate(LEVELS):
            surface.paste(all_versions[size][i],(j*DISPLAY,54))
            d.text((j*DISPLAY+20,18),f'{size} x {size} logical pixels',font=font,fill='#ffd35f')
        compare.append(surface)
    save_gif(compare,ROOT/'legendary-pixel-comparison.gif')
    compare[0].save(ROOT/'legendary-pixel-comparison.png')
    print('Reduced unchanged large animation to 64 / 96 / 128 px, retaining its 8-second loop.')

if __name__=='__main__':main()
