# ✨ GLSL Shader Reference (Three.js + WebGL 1)

This section documents the key GPU-facing variables available when writing shaders in Three.js, including GLSL built-ins and Three.js-injected uniforms and attributes.

---

## 📌 Built-in Attributes (Per-Vertex Data)

These attributes are available in the vertex shader if present in your geometry:

| Attribute Name     | Type        | Description                                      |
|--------------------|-------------|--------------------------------------------------|
| `position`         | `vec3`      | Vertex position (required)                       |
| `normal`           | `vec3`      | Vertex normal (used for lighting)                |
| `uv`               | `vec2`      | First UV mapping coordinates                     |
| `uv2`              | `vec2`      | Secondary UVs (e.g., AO maps)                    |
| `color`            | `vec3/vec4` | Per-vertex color (if `vertexColors` is enabled)  |
| `tangent`          | `vec4`      | Tangent vector (for normal mapping)              |
| `skinIndex`        | `vec4`      | Indices for skeletal animation (bones)           |
| `skinWeight`       | `vec4`      | Bone weights for skeletal animation              |
| `morphTarget0~N`   | `vec3`      | Morph target positions                           |
| `morphNormal0~N`   | `vec3`      | Morph target normals                             |

> ⚠️ Only available if present in your `BufferGeometry`.

---

## 🧠 Injected Uniforms (Provided Automatically by Three.js)

These uniforms are automatically injected into your shader when referenced (except in `RawShaderMaterial`):

| Uniform Name               | Type       | Description                                       |
|----------------------------|------------|---------------------------------------------------|
| `modelMatrix`              | `mat4`     | Local → World transform                           |
| `viewMatrix`               | `mat4`     | World → Camera transform                          |
| `projectionMatrix`         | `mat4`     | Camera projection matrix                          |
| `modelViewMatrix`          | `mat4`     | Combined model * view matrix                      |
| `normalMatrix`             | `mat3`     | Inverse transpose of `modelViewMatrix`            |
| `cameraPosition`           | `vec3`     | Camera position in world space                    |
| `isOrthographic`           | `bool`     | Whether the camera is orthographic                |
| `boneMatrices[]`           | `mat4[]`   | Bone transforms (for skinned meshes)              |
| `morphTargetInfluences[]` | `float[]`  | Morph target weights                              |

> ✅ Injected automatically if referenced in GLSL.  
> ❌ Not available in `RawShaderMaterial` — must be passed manually.

---

## 🧬 GLSL Built-in GPU Variables

These are standard GLSL built-ins provided by the GPU. You can access them directly in vertex or fragment shaders.

### 🟦 Vertex Shader

| Variable         | Type      | Description                                                |
|------------------|-----------|------------------------------------------------------------|
| `gl_Position`    | `vec4`    | Clip-space position of the current vertex. Must be assigned. |
| `gl_PointSize`   | `float`   | Size of a point when rendering `gl.POINTS`.                |
| `gl_VertexID`    | `int`     | Index of the vertex (WebGL 2 only).                        |
| `gl_InstanceID`  | `int`     | Index of the instance in instanced rendering (WebGL 2).    |

---

### 🟨 Fragment Shader

| Variable           | Type     | Description                                                   |
|--------------------|----------|---------------------------------------------------------------|
| `gl_FragColor`     | `vec4`   | Final color of the fragment. Required in WebGL 1.             |
| `gl_FragCoord`     | `vec4`   | Screen-space coordinates of the fragment (x, y, z, 1/w).      |
| `gl_FrontFacing`   | `bool`   | True if the fragment is from a front-facing triangle.         |
| `gl_PointCoord`    | `vec2`   | Coordinate within a point sprite (only in `gl.POINTS`).       |

> 🧪 In WebGL 2, `gl_FragColor` is deprecated and replaced with a custom `out vec4` variable.

---

## 🔎 Example (vertex shader snippet)

```glsl
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```
