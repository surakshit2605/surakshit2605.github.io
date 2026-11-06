"""Builds the PSR-S970-style arranger keyboard from blender/layout.py (measured from the manufacturer photo) and exports
public/models/psr-s970.glb + baked ambient occlusion.   python blender/layout.py && python blender/build_psr_s970.py   (needs `pip install bpy`)
Units: 1 = 100 mm.  Blender (x, y, z) = site (x, -z, y).  Control nodes are named E000.. with the control id stored in extras."""
import bpy, bmesh, math, os, sys, json
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'public', 'models'); os.makedirs(OUT, exist_ok=True)
LAY = json.load(open(os.path.join(HERE, '..', 'src', 'keyboard', 'layout.json')))
S = LAY['S']; T = LAY['tiers']; K = LAY['keys']
X = lambda px: (px - 1000) * S
Zc = lambda py: py * S - 2.45
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene

MIDI_LO, MIDI_HI = 36, 96
black = lambda m: m % 12 in (1, 3, 6, 8, 10)
nWhite = sum(1 for m in range(MIDI_LO, MIDI_HI + 1) if not black(m))
KX0, KX1 = X(K['px0']), X(K['px1'])
WK = (KX1 - KX0) / nWhite
KEY_LEN, KEY_TOP, PIVOT_Z = K['key_len'], K['top'], K['pivot_z']
BX0, BX1 = X(10), X(1990)
def J(x, y, z): return Vector((x, -z, y))

def mat(name, base, rough=0.4, metal=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*base, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    for k in ('Coat Weight', 'Clearcoat'):
        if k in b.inputs: b.inputs[k].default_value = coat; break
    return m
M = {k: mat(k, *v) for k, v in {
    'Body': ((0.03, 0.03, 0.034), 0.5, 0.3, 0.2), 'Panel': ((0.04, 0.04, 0.045), 0.6), 'KeyWhite': ((0.93, 0.91, 0.86), 0.3, 0, 0.5),
    'KeyBlack': ((0.012, 0.012, 0.014), 0.16, 0, 1), 'CapLight': ((0.6, 0.6, 0.62), 0.45), 'CapDark': ((0.02, 0.02, 0.024), 0.5),
    'Metal': ((0.7, 0.72, 0.76), 0.25, 1), 'Rubber': ((0.02, 0.02, 0.024), 0.8), 'Led': ((0.05, 0.05, 0.05), 0.4), 'LCD': ((0.02, 0.05, 0.12), 0.5), 'Glass': ((0, 0, 0), 0.05, 0, 1),
}.items()}

def finish(name, bm, material, loc=(0, 0, 0), parent=None, angle=32, extras=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    me.set_sharp_from_angle(angle=math.radians(angle)); me.materials.append(material)
    ob = bpy.data.objects.new(name, me); scn.collection.objects.link(ob); ob.location = loc
    if parent: ob.parent = parent
    for k, v in (extras or {}).items(): ob[k] = v
    return ob
def empty(name, loc=(0, 0, 0), parent=None, rot=None, extras=None):
    e = bpy.data.objects.new(name, None); scn.collection.objects.link(e); e.location = loc
    if rot: e.rotation_euler = rot
    if parent: e.parent = parent
    for k, v in (extras or {}).items(): e[k] = v
    return e
def add_box(bm, size, center, bevel=0.0, seg=3):
    r = bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(center) @ Matrix.Diagonal((*size, 1)))
    if bevel > 0:
        es = list({e for v in r['verts'] for e in v.link_edges}); bmesh.ops.bevel(bm, geom=es, offset=bevel, segments=seg, profile=0.55, affect='EDGES')
    return r['verts']
def add_cyl(bm, radius, depth, center, segs=40, axis='Z', bevel=0.0, knurl=0.0):
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=radius, radius2=radius, depth=depth); vs = r['verts']
    if knurl:
        for v in vs:
            a = math.atan2(v.co.y, v.co.x); k = 1 - knurl * (0.5 + 0.5 * math.cos(a * segs / 2)); v.co.x *= k; v.co.y *= k
    rot = {'Z': Matrix.Identity(4), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}[axis]
    bmesh.ops.transform(bm, matrix=Matrix.Translation(center) @ rot, verts=vs)
    if bevel > 0:
        es = list({e for v in vs for e in v.link_edges}); bmesh.ops.bevel(bm, geom=es, offset=bevel, segments=2, profile=0.6, affect='EDGES')
    return vs

# ---------------------------------------------------------------- body: two tiers + tapered ends, one mesh, baked AO
zU, zL = T['upper']['z0'], T['ledge']['z0']
yUf, yLf = T['upper']['y0'], T['ledge']['y0']
yLb = yLf + (zL - zU) * math.tan(T['ledge']['angle'])
yUb = yUf + (zU + 2.45) * math.tan(T['upper']['angle'])
prof = [(-2.45, 0), (2.05, 0), (2.05, 0.62), (1.9, 0.62), (1.9, 0.55), (zL, 0.55), (zL, yLf), (zU, yLb), (zU, yUf), (-2.45, yUb)]
bm = bmesh.new()
vs = [bm.verts.new(J(BX0, y, z)) for z, y in prof]
f = bm.faces.new(vs)
if f.normal.x < 0: f.normal_flip()
ext = bmesh.ops.extrude_face_region(bm, geom=[f])
bmesh.ops.translate(bm, vec=(BX1 - BX0, 0, 0), verts=[e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
for v in bm.verts:   # ends lean inwards going up, like the real chassis
    t = max(0.0, (v.co.z - 0.55) / 0.87); v.co.x *= 1 - 0.03 * t
bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.035, segments=3, profile=0.55, affect='EDGES')
cy = T['cheek']['y0'] - 0.01
add_box(bm, (KX0 - BX0, 1.9, cy), J((BX0 + KX0) / 2, cy / 2, (Zc(445) + 2.05) / 2), 0.05)
add_box(bm, (BX1 - KX1, 1.9, cy), J((BX1 + KX1) / 2, cy / 2, (Zc(445) + 2.05) / 2), 0.05)
add_box(bm, (KX1 - KX0, 0.12, 0.06), J((KX0 + KX1) / 2, KEY_TOP - 0.02, 0.4), 0.01)
body = finish('Body', bm, M['Body'])

# ---------------------------------------------------------------- tier frames, print planes
frames = {}
for name, t in T.items():
    frames[name] = empty('Frame_' + name, J(0, t['y0'] + 0.004, t['z0']), rot=(t['angle'], 0, 0))
    bm = bmesh.new()
    x0, x1 = X(t['px0']), X(t['px1']); zb, zf = Zc(t['py0']) - t['z0'], Zc(t['py1']) - t['z0']
    vv = [bm.verts.new(J(x, 0, z)) for x, z in ((x0, zf), (x1, zf), (x1, zb), (x0, zb))]
    fc = bm.faces.new(vv); uvl = bm.loops.layers.uv.new('UVMap')
    for l, uv in zip(fc.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): l[uvl].uv = uv
    if fc.normal.z < 0: fc.normal_flip()
    finish('Panel_' + name, bm, M['Panel'], parent=frames[name])

# display: raised bezel, screen, glass
bx0, by0, bx1, by1 = LAY['display']['bezel']; sx0, sy0, sx1, sy1 = LAY['display']['screen']
bm = bmesh.new(); add_box(bm, ((bx1 - bx0) * S, (by1 - by0) * S, 0.1), J(0, 0, 0), 0.03)
finish('Bezel', bm, M['CapDark'], loc=J(X((bx0 + bx1) / 2), 0.05, Zc((by0 + by1) / 2) - zU), parent=frames['upper'])
for nm, z, m in (('LCD', 0.103, M['LCD']), ('Glass', 0.106, M['Glass'])):
    bm = bmesh.new(); cx, cz = X((sx0 + sx1) / 2), Zc((sy0 + sy1) / 2) - zU; hw, hd = (sx1 - sx0) * S / 2, (sy1 - sy0) * S / 2
    vv = [bm.verts.new(J(cx + dx, z, cz + dz)) for dx, dz in ((-hw, hd), (hw, hd), (hw, -hd), (-hw, -hd))]
    fc = bm.faces.new(vv); uvl = bm.loops.layers.uv.new('UVMap')
    for l, uv in zip(fc.loops, [(0, 0), (1, 0), (1, 1), (0, 1)]): l[uvl].uv = uv
    if fc.normal.z < 0: fc.normal_flip()
    finish(nm, bm, m, parent=frames['upper'])

# ---------------------------------------------------------------- controls
for i, e in enumerate(LAY['elements']):
    fr = frames[e['tier']]; nm = 'E%03d' % i; k = e['kind']; ex = {'id': e['id'], 'kind': k}
    loc = J(e['x'], 0, e['z'])
    if k in ('btn', 'btnflat', 'flat', 'sq', 'led'):
        h = {'btn': 0.045, 'btnflat': 0.04, 'flat': 0.025, 'sq': 0.04, 'led': 0.075}[k]
        cap = M['CapDark'] if k in ('flat', 'sq') else M['CapLight']
        bm = bmesh.new(); add_box(bm, (e['w_u'], e['h_u'], h), J(0, 0, h / 2), min(0.02, h * 0.45))
        ob = finish(nm, bm, cap, loc=loc + Vector((0, 0, 0)), parent=fr, extras=ex)
        ob.location = J(e['x'], 0, e['z'])
        if k in ('btn', 'led', 'btnflat'):
            bm = bmesh.new()
            if k == 'led': add_box(bm, (e['w_u'] * 0.34, e['w_u'] * 0.2, 0.006), J(0, h + 0.002, -e['h_u'] * 0.34), 0.001, 1)
            else: add_box(bm, (e['w_u'] * 0.45, 0.02, 0.006), J(0, h + 0.002, 0), 0.001, 1)
            finish('L%03d' % i, bm, M['Led'], parent=ob)
    elif k in ('round', 'jog'):
        r = e['r_u'] if 'r_u' in e else 0.07; hh = 0.14 if k == 'jog' else 0.05
        bm = bmesh.new(); add_cyl(bm, r, hh, J(0, hh / 2, 0), 48, 'Z', 0.012 if k == 'round' else 0.02, knurl=0 if k == 'round' else 0.0)
        ob = finish(nm, bm, M['Metal'] if k == 'jog' else M['CapDark'], loc=loc, parent=fr, extras=ex)
        if k == 'jog':
            bm = bmesh.new(); add_cyl(bm, r * 0.35, 0.01, J(0, hh + 0.001, 0), 24, 'Z', 0.003)
            finish('Dimple', bm, M['Rubber'], parent=ob)
    elif k == 'knob':
        r = e['r_u']; g = empty(nm, loc=loc, parent=fr, extras=ex)
        hh = 0.13 if r > 0.1 else 0.1
        bm = bmesh.new(); add_cyl(bm, r, hh, J(0, hh / 2, 0), 48, 'Z', 0.01, knurl=0.04)
        finish('KnobBody_' + nm, bm, M['Rubber'], parent=g)
        bm = bmesh.new(); add_box(bm, (r * 0.18, r * 0.9, 0.012), J(0, hh + 0.003, -r * 0.45), 0.002, 1)
        finish('KnobTick_' + nm, bm, M['CapLight'], parent=g)
    elif k == 'wheel':
        g = empty(nm, loc=loc, parent=fr, extras=ex)
        w, l = e['w_u'], e['h_u']
        bm = bmesh.new(); add_box(bm, (w + 0.06, l + 0.06, 0.03), J(0, 0.0, 0), 0.01)   # recessed slot surround
        finish('Slot_' + nm, bm, M['CapDark'], parent=g)
        R = 0.5; wm = empty('Wm_' + nm, loc=J(0, -R + 0.1, 0), parent=g)
        bm = bmesh.new(); add_cyl(bm, R, w * 0.9, J(0, 0, 0), 64, 'X', 0.006)
        for j in range(60):
            a = j / 60 * math.tau
            add_box(bm, (w * 0.92, 0.03, 0.012), J(0, math.cos(a) * (R + 0.002), math.sin(a) * (R + 0.002)), 0.002, 1)
        finish('WheelMesh_' + nm, bm, M['Rubber'], parent=wm)

# ---------------------------------------------------------------- keys (origin = hinge)
for m in range(MIDI_LO, MIDI_HI + 1):
    wi = sum(1 for k in range(MIDI_LO, m) if not black(k)); bm = bmesh.new()
    if not black(m):
        x = KX0 + (wi + 0.5) * WK
        add_box(bm, (WK - 0.014, KEY_LEN, 0.28), J(0, -0.14, KEY_LEN / 2), 0.02)
        finish('Key_%d' % m, bm, M['KeyWhite'], loc=J(x, KEY_TOP, PIVOT_Z), extras={'midi': m, 'black': 0})
    else:
        sh = {1: -0.12, 3: 0.12, 6: -0.14, 8: 0, 10: 0.14}[m % 12]
        x = KX0 + wi * WK + WK + sh * WK - WK * 0  # boundary after the previous white key
        x = KX0 + (wi) * WK + sh * WK
        L, y0, y1 = KEY_LEN * 0.62, -0.18, 0.16; bw, fw, tb = 0.135, 0.105, 0.8
        pts = []
        for yy, kk in ((y0, 1.0), (y1, tb)):
            pts += [J(-bw / 2 * kk, yy, 0), J(bw / 2 * kk, yy, 0), J(fw / 2 * kk, yy, L), J(-fw / 2 * kk, yy, L)]
        vv = [bm.verts.new(p) for p in pts]
        for q in ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)): bm.faces.new([vv[i] for i in q])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.028, segments=3, profile=0.55, affect='EDGES')
        finish('Key_%d' % m, bm, M['KeyBlack'], loc=J(x, KEY_TOP, PIVOT_Z), extras={'midi': m, 'black': 1})

# ---------------------------------------------------------------- bake ambient occlusion into the body
def bake_ao(size=2048, samples=48):
    scn.render.engine = 'CYCLES'; scn.cycles.device = 'CPU'; scn.cycles.samples = samples; scn.cycles.use_denoising = True
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = body; body.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new('BodyAO', size, size); nt = body.data.materials[0].node_tree
    tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = img; nt.nodes.active = tn
    bpy.ops.object.bake(type='AO', margin=6, use_clear=True)
    img.filepath_raw = os.path.join(OUT, 'psr-s970-ao.png'); img.file_format = 'PNG'; img.save(); nt.nodes.remove(tn)
if '--noao' not in sys.argv: bake_ao()

bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'psr-s970.glb'), export_format='GLB', export_apply=True, export_extras=True, export_yup=True, export_cameras=False, export_lights=False)
print('exported', len(LAY['elements']), 'controls')
