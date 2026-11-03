"""
Generates the "Secure Core" hero asset and exports it for the website.

HOW TO RUN (Blender 3.6+ or 4.x):
  1. Open Blender, go to the Scripting workspace, open this file, press Run.
     Or from a terminal:
       blender --background --python blender/generate_core.py
  2. It writes public/models/core.glb (path relative to this script's repo).
  3. Reload the site: Three.js picks the model up automatically and replaces
     the built-in procedural core. Delete the file to go back to the fallback.

NOTE: this script was written without access to Blender and has NOT been run.
If it errors on your Blender version, the site still works (procedural core).
Treat it as a starting point and build on it in Blender (materials, bevels,
extra geometry). Keep the final file under ~500 KB.
"""
import bpy
import bmesh
import math
import os

OUT = os.path.abspath(
    os.path.join(os.path.dirname(bpy.data.filepath or __file__), "..", "public", "models", "core.glb")
) if bpy.data.filepath else os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "public", "models", "core.glb")
)

# --- clean scene -------------------------------------------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()


def make_material(name, color, metallic, roughness, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission:
        # Input is called "Emission Color" in 4.x, "Emission" in 3.x
        key = "Emission Color" if "Emission Color" in bsdf.inputs else "Emission"
        bsdf.inputs[key].default_value = color
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission
    return mat


navy = make_material("CoreNavy", (0.02, 0.05, 0.16, 1), 0.85, 0.3)
blue = make_material("EdgeBlue", (0.18, 0.48, 1.0, 1), 0.0, 0.4, emission=2.0)

# --- faceted core ------------------------------------------------------------
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.4)
core = bpy.context.active_object
core.name = "Core"
core.data.materials.append(navy)
bpy.ops.object.shade_flat()

# --- glowing frame: wireframe modifier over a slightly larger copy -------------
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.46)
frame = bpy.context.active_object
frame.name = "CoreFrame"
wf = frame.modifiers.new("Wire", "WIREFRAME")
wf.thickness = 0.015
frame.data.materials.append(blue)

# --- orbit rings ---------------------------------------------------------------
for i, (rx, ry, radius) in enumerate([(math.pi / 2.4, 0, 2.9), (math.pi / 3, math.pi / 5, 3.3)]):
    bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.01, major_segments=96, minor_segments=6)
    ring = bpy.context.active_object
    ring.name = f"Ring{i + 1}"
    ring.rotation_euler = (rx, ry, 0)
    ring.data.materials.append(blue)

# --- nodes on a Fibonacci sphere -------------------------------------------------
N, R = 46, 3.6
for i in range(N):
    y = 1 - (i / (N - 1)) * 2
    r = math.sqrt(1 - y * y)
    t = i * math.pi * (3 - math.sqrt(5))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.06,
                                         location=(math.cos(t) * r * R, y * R, math.sin(t) * r * R))
    n = bpy.context.active_object
    n.name = f"Node{i:02d}"
    n.data.materials.append(blue)

# --- export ------------------------------------------------------------------------
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,        # apply modifiers (wireframe)
    export_yup=True,
    export_draco_mesh_compression_enable=False,  # keep OFF: the site loader has no Draco decoder
)
print("Exported:", OUT)
