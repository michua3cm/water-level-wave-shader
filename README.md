# Water Level Wave Shader

🔗 [Live demo](https://michua3cm.github.io/water-level-wave-shader/)

A custom GLSL shader for Three.js that simulates animated surface waves with real-time water level control, designed for arbitrary 3D geometry using stencil masking.

## Description

### Abstract

The main purpose of this project is to create a water surface with **both level control** and **wave effects** using GLSL in Three.js.

While the goal sounds simple and intuitive, existing approaches each have tradeoffs:

1. We can control the water level using a clip plane — but without wave effects.
2. We can apply both level and wave effects — but only by scaling the geometry.

Neither method satisfies the visual and technical requirements for arbitrary 3D geometry. This project seeks to overcome those limitations by combining custom vertex shader logic, depth and stencil control, and dynamic rendering strategies.

### Motivation

This project originated from my professional experience, where I worked on WebGL-based 3D SCADA visualization involving fluid-like behaviors. To better understand and simulate realistic water surfaces, I started a personal experiment using pure GLSL shaders, without relying on any external libraries. The goal was to explore the core mechanics of wave simulation, depth masking, and spatial decoupling of logic and rendering.

### Goal

To develop a water effect that:

- Allows dynamic water **level control** (without geometry scaling)
- Supports realistic **wave simulation** on the surface

All of this should be done through GLSL shaders, with clean integration into a Three.js scene.

In this way, the effect can be applied to **any arbitrary geometry**, not just simple planes, cylinders, or boxes — making it versatile for tanks, pools, rivers, or even stylized effects.

## Project Structure

```text
├── docs/                        ← Technical notes and internal references
│   ├── dev-log.md
│   ├── math-notes.md
│   └── threejs-shader-builtins.md
├── public/
│   └── images/
├── src/
│   ├── assets/                  ← 3D model files (.glb)
│   ├── components/              ← Visual and simulation logic
│   │   ├── SceneSetup.js
│   │   ├── ModelLoader.js
│   │   ├── LiquidEffect.js
│   │   ├── LiquidControlPanel.js
│   │   ├── WaterShader.js
│   │   └── Animation.js
│   └── App.js                   ← Entry point
├── index.html                   ← Root HTML file (used by Vite)
├── vite.config.js               ← Vite project configuration
├── README.md
└── LICENSE
```

## How To Use

This project uses [Node.js](https://nodejs.org/en) and Vite to serve and build the application.

### 1. Clone the repository

```bash
git clone https://github.com/michua3cm/water-level-wave-shader.git
cd water-level-wave-shader
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the local development server

```bash
npm run dev
```

### 4. Open your browser at

```bash
http://localhost:8888
```

## Future Work

1. **WebGL2**: Add support for 3D textures using WebGL2 to enhance realism and enable volume-based effects.
2. **WebGPU**: Explore migrating to WebGPU as a longer-term upgrade path for leveraging modern graphics capabilities.

## See Also

- [Dev Log](./docs/dev-log.md)
- [Math Notes](./docs/math-notes.md)
- [Three.js Shader Built-ins](./docs/threejs-shader-builtins.md)
