"""Single source of truth for the PSR-S970 panel: positions measured from the manufacturer's top-down photo.
Coordinates are photo pixels on a 2000 px wide image (x right, y down). Run:  python blender/layout.py
-> writes src/keyboard/layout.json, read by both the Blender build script and the website."""
import json, os

S = 10.22 / 1980.0   # model units per photo pixel (1 unit = 100 mm)
X = lambda px: round((px - 1000) * S, 4)
Z = lambda py: round(py * S - 2.45, 4)

E = []   # controls
def add(id, label, x, y, kind, tier, w=18, h=12, r=None, lab=None, dy=-14):
    E.append(dict(id=id, label=label, px=x, py=y, kind=kind, tier=tier, w=w, h=h, r=r, lab=lab if lab is not None else label, ldy=dy))

U = 'upper'; L = 'ledge'; C = 'cheek'
# ---- upper panel, left block
add('fn:power', '', 570, 177, 'round', U, r=15, lab='', dy=0)
song = [['SELECT', 'SCORE', 'LYRICS/TEXT', 'GUIDE'], ['REPEAT', 'EXTRA TR', 'TR 2', 'TR 1']]
for r, ys in enumerate((183, 213)):
    for c, x in enumerate((624, 664, 705, 746)): add('song:' + song[r][c], song[r][c], x, ys, 'btn', U)
for lbl, x in (('REC', 624), ('STOP', 658), ('PLAY', 688), ('REW', 718), ('FF', 746)):
    add('song:' + lbl, {'STOP': '■', 'PLAY': '▶/II', 'REW': '◀◀', 'FF': '▶▶'}.get(lbl, lbl), x, 243, 'btn', U)
style = [['POP&ROCK', 'SWING&JAZZ', 'LATIN', 'ENTERTAINER'], ['BALLAD', 'R&B', 'BALLROOM', 'WORLD'], ['DANCE', 'COUNTRY', 'MOVIE&SHOW', 'EXPANSION/\nUSER']]
for r, ys in enumerate((287, 318, 349)):
    for c, x in enumerate((624, 664, 705, 746)): add('style:' + style[r][c].replace('\n', ''), style[r][c], x, ys, 'btn', U)
add('fn:tempoDn', '−', 627, 388, 'btn', U, lab=''); add('fn:tempoUp', '+', 666, 388, 'btn', U, lab=''); add('fn:tap', 'TAP TEMPO', 705, 388, 'btn', U)
add('fn:trDn', '−', 627, 420, 'btn', U, lab=''); add('fn:trUp', '+', 666, 420, 'btn', U, lab=''); add('fn:metro', 'METRONOME', 705, 420, 'btn', U)
add('fn:demo', 'DEMO', 572, 348, 'btn', U, w=22, dy=-12)
add('fn:mic', 'MIC SETTING/\nVOCAL HARMONY', 572, 388, 'btn', U, w=22, dy=-20)
add('knob:master', 'MASTER\nVOLUME', 571, 262, 'knob', U, r=28, lab='', dy=0)
# ---- display surroundings
for i, y in enumerate((212, 233, 253, 273, 294)):
    add('soft:' + 'ABCDE'[i], 'ABCDE'[i], 797, y, 'flat', U, w=26, h=9, lab='')
    add('soft:' + 'FGHIJ'[i], 'FGHIJ'[i], 1197, y, 'flat', U, w=26, h=9, lab='')
add('fn:tabL', '', 1190, 183, 'btn', U, w=14, h=10, lab=''); add('fn:tabR', '', 1214, 183, 'btn', U, w=14, h=10, lab='')
add('fn:function', 'FUNCTION', 1191, 328, 'btn', U, w=14, h=10, dy=-12)
for i, (lbl, y) in enumerate((('PAGE', 328), ('PART', 348), ('PART', 368))):
    add('dsp:%d' % i, '', 803, y, 'flat', U, w=24, h=9, lab='')
add('knob:direct', 'DIRECT ACCESS', 803, 414, 'round', U, r=13, lab='', dy=0)
for i, x in enumerate((861, 900, 939, 977, 1016, 1055, 1094, 1133)):
    add('num:%dU' % (i + 1), '', x, 396, 'sq', U, w=19, h=14, lab='')
    add('num:%dD' % (i + 1), '', x, 418, 'sq', U, w=19, h=14, lab='')
add('fn:exit', 'EXIT', 1168, 413, 'round', U, r=12, lab='', dy=0)
add('fn:enter', 'ENTER', 1290, 414, 'round', U, r=16, lab='', dy=0)
add('fn:finder', 'MUSIC FINDER', 1290, 352, 'round', U, r=13, lab='', dy=0)
add('jog', '', 1228, 385, 'jog', U, r=42, lab='')
# ---- voice block
voices = [['PIANO', 'GUITAR', 'STRINGS', 'CHOIR&PAD', 'DRUM KIT'], ['E. PIANO', 'BASS', 'BRASS', 'SYNTH', 'ORGAN\nFLUTES'], ['ORGAN', 'ACCORDION', 'WOODWIND', 'PERCUSSION', 'EXPANSION/\nUSER']]
for r, ys in enumerate((214, 243, 272)):
    for c, x in enumerate((1251, 1294, 1338, 1381, 1424)):
        add('voice:' + voices[r][c].replace('\n', '').replace('. ', ''), voices[r][c], x, ys, 'btn', U, w=22, h=13, dy=-15)
add('fn:usbAudio', 'USB AUDIO PLAYER', 1381, 182, 'btn', U, w=22, h=13, lab='')
add('fn:usb', 'USB', 1424, 182, 'btn', U, w=22, h=13, lab='')
for lbl, x in (('HARMONY/\nARPEGGIO', 1250), ('TOUCH', 1284), ('SUSTAIN', 1320), ('MONO', 1355), ('DSP', 1390), ('VARI.', 1426)):
    add('fx:' + lbl.replace('\n', ''), lbl, x, 316, 'btn', U, w=22, h=13, dy=-15)
for i, x in enumerate((1362, 1393, 1424)): add('part:sel%d' % i, '', x, 364, 'btn', U, w=22, h=13, lab='')
for i, x in enumerate((1332, 1362, 1393, 1424)): add('part:onoff%d' % i, '', x, 408, 'btn', U, w=22, h=13, lab='')
# ---- ledge (style control, registration, multi pad, one touch)
LD = dict(w=25, h=39)
add('acmp', 'ACMP', 241, 497, 'led', L, w=22, h=46, lab='ACMP', dy=-34)
for id, lbl, x in (('fade', 'FADE\nIN/OUT', 272), ('ots', 'OTS\nLINK', 307), ('autofill', 'AUTO\nFILL IN', 342)):
    add('sc:' + id, lbl, x, 497, 'btnflat', L, w=22, h=12, lab=lbl, dy=-30)
for i, x in enumerate((387, 422, 458)): add('sc:intro%d' % (i + 1), '', x, 497, 'led', L, **LD, lab='', dy=0)
for i, x in enumerate((498, 533, 569, 604)): add('sc:main' + 'ABCD'[i], 'ABCD'[i], x, 497, 'led', L, **LD, lab='', dy=0)
add('sc:break', '', 641, 497, 'led', L, **LD, lab='')
for i, x in enumerate((701, 737, 772)): add('sc:end%d' % (i + 1), '', x, 497, 'led', L, **LD, lab='')
add('sc:syncStop', 'SYNC\nSTOP', 830, 497, 'led', L, **LD, dy=-34); add('sc:syncStart', 'SYNC\nSTART', 866, 497, 'led', L, **LD, dy=-34)
add('fn:startStop', 'START/STOP', 906, 497, 'led', L, **LD, dy=-34)
add('reg:bankDn', '−', 972, 497, 'led', L, **LD, lab=''); add('reg:bankUp', '+', 1000, 497, 'led', L, **LD, lab='')
add('reg:freeze', 'FREEZE', 1033, 497, 'led', L, **LD, lab='', dy=-34); add('reg:memory', 'MEMORY', 1061, 497, 'led', L, **LD, lab='')
for i, x in enumerate((1121, 1158, 1196, 1233, 1271, 1308, 1346, 1384)): add('reg:%d' % (i + 1), str(i + 1), x, 497, 'led', L, **LD, lab='')
add('pad:sync', '', 1446, 497, 'led', L, **LD, lab='')
for i, x in enumerate((1478, 1513, 1548, 1584)): add('pad:%d' % (i + 1), str(i + 1), x, 497, 'led', L, **LD, lab='')
add('pad:stop', 'STOP', 1616, 497, 'led', L, **LD, lab='', dy=-34)
for i, x in enumerate((1676, 1712, 1747, 1782)): add('ots:%d' % (i + 1), str(i + 1), x, 497, 'led', L, **LD, lab='')
add('oct:dn', '−', 1834, 497, 'led', L, **LD, lab=''); add('oct:up', '+', 1870, 497, 'led', L, **LD, lab='')
# ---- left cheek
add('fn:assign', 'ASSIGN', 82, 491, 'btnflat', C, w=26, h=13, lab='ASSIGN', dy=-16)
add('knob:live1', '1', 82, 545, 'knob', C, r=17, lab='')
add('knob:live2', '2', 152, 545, 'knob', C, r=17, lab='')
add('wheel:pitch', 'PITCH BEND', 87, 665, 'wheel', C, w=34, h=90, lab='')
add('wheel:mod', 'MODULATION', 152, 665, 'wheel', C, w=34, h=90, lab='')

TEXTS = [  # text, x, y, size(px at 2000 scale), align, colour
    ('SONG', 611, 160, 11, 'l'), ('STYLE', 626, 265, 12, 'l'), ('VOICE', 1238, 185, 11, 'l'), ('VOICE EFFECT', 1238, 287, 11, 'l'),
    ('PSR-S970', 1383, 148, 22, 'c', '#d5d8de'), ('DIGITAL WORKSTATION', 1383, 168, 7, 'c', '#a7acb6'),
    ('YAMAHA', 997, 151, 13, 'c', '#d5d8de'),
    ('MASTER\nVOLUME', 571, 226, 8, 'c'), ('MIN', 551, 296, 7, 'c'), ('MAX', 591, 296, 7, 'c'),
    ('DIRECT ACCESS', 803, 395, 7, 'c'), ('EXIT', 1168, 396, 7, 'c'), ('ENTER', 1290, 395, 7, 'c'), ('MUSIC FINDER', 1290, 338, 7, 'c'),
    ('PART SELECT', 1393, 350, 7, 'c'), ('PART ON/OFF', 1362, 422, 7, 'c'), ('LOWER', 1362, 394, 7, 'c'), ('UPPER', 1409, 394, 7, 'c'),
    ('LEFT\nHOLD', 1330, 380, 6, 'c'), ('LEFT', 1362, 382, 6, 'c'), ('RIGHT1', 1393, 382, 6, 'c'), ('RIGHT2', 1424, 382, 6, 'c'),
    ('NEW SONG', 618, 255, 5, 'c'), ('SYNC START', 660, 255, 5, 'c'),
    ('USB AUDIO PLAYER', 1381, 170, 6, 'c'), ('USB', 1424, 170, 6, 'c'),
    ('A', 826, 212, 8, 'c'), ('B', 826, 233, 8, 'c'), ('C', 826, 253, 8, 'c'), ('D', 826, 273, 8, 'c'), ('E', 826, 294, 8, 'c'),
    ('F', 1170, 212, 8, 'c'), ('G', 1170, 233, 8, 'c'), ('H', 1170, 253, 8, 'c'), ('I', 1170, 273, 8, 'c'), ('J', 1170, 294, 8, 'c'),
    ('BAL.', 836, 328, 6, 'l'), ('MIXER/\nEQ', 836, 348, 6, 'l'), ('CHANNEL\nON/OFF', 836, 368, 6, 'l'),
    ('1', 861, 433, 8, 'c'), ('2', 900, 433, 8, 'c'), ('3', 939, 433, 8, 'c'), ('4', 977, 433, 8, 'c'), ('5', 1016, 433, 8, 'c'), ('6', 1055, 433, 8, 'c'), ('7', 1094, 433, 8, 'c'), ('8', 1133, 433, 8, 'c'),
    ('TEMPO', 624, 374, 8, 'l'), ('TRANSPOSE', 624, 406, 8, 'l'),
    ('STYLE CONTROL', 583, 452, 9, 'c'), ('REGISTRATION MEMORY', 1178, 452, 9, 'c'), ('MULTI PAD CONTROL', 1528, 452, 9, 'c'), ('ONE TOUCH SETTING', 1725, 452, 9, 'c'),
    ('INTRO', 422, 468, 7, 'c'), ('MAIN VARIATION', 551, 468, 7, 'c'), ('BREAK', 640, 468, 7, 'c'), ('ENDING/rit.', 737, 468, 7, 'c'),
    ('REGIST BANK', 986, 463, 6, 'c'), ('FREEZE', 1033, 468, 6, 'c'), ('MEMORY', 1061, 468, 6, 'c'), ('UPPER OCTAVE', 1852, 468, 6, 'c'),
    ('LIVE CONTROL', 115, 514, 9, 'c'), ('PITCH BEND', 85, 610, 7, 'c'), ('MODULATION', 150, 610, 7, 'c'), ('PHONES', 120, 848, 7, 'c'),
]
LINES = [(611, 755, 168), (626, 755, 272), (1238, 1440, 193), (1238, 1440, 295), (1238, 1440, 205),
         (270, 360, 460), (440, 520, 460), (1423, 1630, 458), (1646, 1805, 458)]
SPEAKERS = [(57, 522, 105, 440), (1475, 1940, 105, 440)]
VENTS = [(60, 520, 70, 98), (1475, 1935, 70, 98)]

TIERS = {
    'upper': dict(px0=10, px1=1990, py0=0, py1=445, z0=Z(445), y0=1.12, angle=0.1297),
    'ledge': dict(px0=225, px1=1990, py0=445, py1=560, z0=Z(560), y0=0.96, angle=0.075),
    'cheek': dict(px0=10, px1=225, py0=445, py1=870, z0=Z(445), y0=0.99, angle=0.0),
}
KEYS = dict(px0=225, px1=1895, pivot_z=0.3, key_len=1.6, top=0.8)
DISPLAY = dict(bezel=[765, 108, 1230, 380], screen=[843, 168, 1147, 350])

def out():
    els = []
    for e in E:
        t = TIERS[e['tier']]
        d = dict(e)
        d['x'] = X(e['px']); d['z'] = round(Z(e['py']) - t['z0'], 4)   # local to tier frame
        d['w_u'] = round(e['w'] * S, 4); d['h_u'] = round(e['h'] * S, 4)
        if e['r']: d['r_u'] = round(e['r'] * S, 4)
        els.append(d)
    return dict(S=S, tiers=TIERS, keys=KEYS, display=DISPLAY, elements=els, texts=TEXTS, lines=LINES, speakers=SPEAKERS, vents=VENTS)

if __name__ == '__main__':
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'keyboard', 'layout.json')
    json.dump(out(), open(p, 'w'), ensure_ascii=False, indent=0)
    print(len(E), 'controls ->', p)
