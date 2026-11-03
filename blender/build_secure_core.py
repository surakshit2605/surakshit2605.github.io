"""
Builds the Secure Core in Blender and exports public/models/core.glb for the website.

Run (Blender 4.x / 5.x):
  - In Blender: Scripting workspace, open this file, Run. It also saves blender/secure-core.blend.
  - Or: blender --background --python blender/build_secure_core.py

The mesh names matter: the website recolours them by name so the core follows the chosen accent colour
and the dark/light theme.
    Plates   dark metal panels (inset faces on an icosahedron)
    Frame    thin glowing edge frame
    Nodes    a small node at every vertex
    Inner    glowing inner core
    Shell    faint outer lattice
Rings and the orbiting network are drawn by the site, so they are not in the file.
Keep the file small (target < 500 KB). Draco is not used (the site has no decoder).
"""
import math
import os

import bpy
import bmesh
import mathutils

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
ROOT = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.environ.get("CORE_OUT") or os.path.join(ROOT, "public", "models", "core.glb")
BLEND = os.environ.get("CORE_BLEND") or os.path.join(ROOT, "blender", "secure-core.blend")

R = 1.4  # core radius, in the site's units

# ---- clean scene -------------------------------------------------------------
bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
for coll in list(bpy.data.collections):
    bpy.data.collections.remove(coll)
scene = bpy.context.scene


def material(name, color, metallic=0.0, roughness=0.5, emission=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = roughness
    b.inputs["Alpha"].default_value = alpha
    if emission:
        b.inputs["Emission Color"].default_value = color
        b.inputs["Emission Strength"].default_value = emission
    return m


def new_object(name, bm, mat):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.data.materials.append(mat)
    scene.collection.objects.link(ob)
    return ob


def bake_modifiers(ob):
    """Apply all modifiers without needing a UI context (works headless and in a live Blender)."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def ico(radius, subdiv):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=radius)
    return bm


# ---- Plates: dark metal panels ---------------------------------------------------
bm = ico(R, 2)
bmesh.ops.inset_individual(bm, faces=bm.faces[:], thickness=0.13, depth=-0.07, use_even_offset=True)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
plates = new_object("Plates", bm, material("mat_plates", (0.04, 0.075, 0.19, 1), metallic=0.85, roughness=0.3))
bev = plates.modifiers.new("Bevel", "BEVEL")
bev.width = 0.012
bev.segments = 1
bev.limit_method = "ANGLE"
for p in plates.data.polygons:
    p.use_smooth = False

# ---- Frame: edge tubes -------------------------------------------------------------
bm = ico(R * 1.035, 2)
frame_src = new_object("FrameSrc", bm, material("mat_frame", (0.18, 0.48, 1.0, 1), emission=3.0))
wf = frame_src.modifiers.new("Wire", "WIREFRAME")
wf.thickness = 0.022
wf.use_even_offset = True
wf.use_boundary = True
wf.use_replace = True
bake_modifiers(frame_src)
frame_src.name = "Frame"

# ---- Nodes: one small sphere at each vertex -----------------------------------------
src = ico(R * 1.035, 2)
verts = [v.co.copy() for v in src.verts]
src.free()
bm = bmesh.new()
for co in verts:
    mat = mathutils.Matrix.Translation(co)
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.045, matrix=mat)
nodes = new_object("Nodes", bm, material("mat_nodes", (0.56, 0.78, 1.0, 1), emission=4.0))

# ---- Inner core ----------------------------------------------------------------------
bm = ico(R * 0.5, 2)
inner = new_object("Inner", bm, material("mat_inner", (0.18, 0.48, 1.0, 1), emission=2.0))
for p in inner.data.polygons:
    p.use_smooth = True

# ---- Shell: faint outer lattice --------------------------------------------------------
bm = ico(R * 1.57, 3)
shell = new_object("Shell", bm, material("mat_shell", (0.56, 0.78, 1.0, 1), emission=1.0, alpha=0.3))
wf = shell.modifiers.new("Wire", "WIREFRAME")
wf.thickness = 0.008
wf.use_even_offset = True
wf.use_replace = True
bake_modifiers(shell)

# apply remaining modifiers on plates
bake_modifiers(plates)

# ---- Lighting / camera for the .blend preview (not exported) ----------------------------
cam_data = bpy.data.cameras.new("PreviewCam")
cam = bpy.data.objects.new("PreviewCam", cam_data)
scene.collection.objects.link(cam)
cam.location = (0, -7.5, 1.2)
cam.rotation_euler = (math.radians(82), 0, 0)
scene.camera = cam
light_data = bpy.data.lights.new("Key", "POINT")
light_data.energy = 900
light = bpy.data.objects.new("Key", light_data)
light.location = (4, -4, 5)
scene.collection.objects.link(light)

# ---- Export ----------------------------------------------------------------------------------
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
for ob in (plates, frame_src, nodes, inner, shell):
    ob.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_draco_mesh_compression_enable=False,
)
try:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
except Exception as e:  # saving the .blend is optional
    print("could not save .blend:", e)

tris = sum(len(o.data.polygons) for o in (plates, frame_src, nodes, inner, shell))
print("exported", OUT, os.path.getsize(OUT), "bytes, approx faces", tris)
