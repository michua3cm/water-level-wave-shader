import * as THREE from 'three';

// wave function + damping
const waveUtilsGLSL = `
    float computeWave(vec3 pos, vec3 direction, float time, float frequency, float speed) {
        vec3 d = normalize(direction);
        return sin(dot(pos, d) * frequency + time * speed);
    }

    float computeDampedWave(
        vec3 pos,
        vec3 direction,
        float time,
        float frequency,
        float speed,
        float amplitude,
        float level,
        float minY,
        float maxY
    ) {
        float wave = computeWave(pos, direction, time, frequency, speed);
        float distToTop = maxY - level;
        float distToBottom = level - minY;
        float maxWaveRoom = min(distToTop, distToBottom);
        float damping = clamp(maxWaveRoom / amplitude, 0.0, 1.0);
        return wave * amplitude * damping;
    }
`;

// general uniforms and varyings
const sharedHeader = `
    uniform float time;
    uniform float waveFrequency;
    uniform float waveSpeed;
    uniform float waveAmplitude;
    uniform vec3 waveDirection;
    uniform vec3 surfaceNormal;

    uniform float liquidLevel;
    uniform float tankMinY;
    uniform float tankMaxY;

    uniform bool enableWave;
    uniform bool freeze;

    varying float vWaveSurface;
    varying vec3 vWorldPosition;
`;

// Shader footer
const sharedFooter = `
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
`;

// wave logic for stencil
const waveForStencil = `
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);

    // Vector rejection to get the wave direction on the surface
    vec3 N = normalize(surfaceNormal);
    vec3 waveDir = normalize(waveDirection - dot(waveDirection, N) * N);

    float wave = float(enableWave) * computeDampedWave(worldPos.xyz, waveDir, time, waveFrequency, waveSpeed, waveAmplitude, liquidLevel, tankMinY, tankMaxY);
    vWaveSurface = liquidLevel + wave;
`;

// wave logic for cap
const waveForCap = `
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);

    // Vector rejection to get the wave direction on the surface
    vec3 N = normalize(surfaceNormal);
    vec3 waveDir = normalize(waveDirection - dot(waveDirection, N) * N);

    float wave = computeDampedWave(worldPos.xyz, waveDir, time, waveFrequency, waveSpeed, waveAmplitude, liquidLevel, tankMinY, tankMaxY);
    worldPos.y = liquidLevel + wave;
`;

// Fragment shader：stencil mask logic
const stencilFragmentShader = `
    varying float vWaveSurface;
    varying vec3 vWorldPosition;
    void main() {
        if (vWorldPosition.y > vWaveSurface) discard;
        gl_FragColor = vec4(0.0); // not written anyway
    }
`;

// Fragment shader：cap surface & liquid share the same logic
const liquidFragmentShader = `
    uniform float iorIn;
    uniform float iorOut;
    uniform float refractionStrength;
    uniform sampler2D backgroundTexture;

    uniform vec2 resolution;
    uniform float blendFactor;
    uniform vec3 color;
    uniform float opacity;

    varying vec3 vWorldPosition;

    void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        vec2 offset = refract(viewDir, vec3(0.0, 1.0, 0.0), iorIn / iorOut).xz * refractionStrength;
        vec2 uv = gl_FragCoord.xy / resolution + offset;

        vec4 bg = texture2D(backgroundTexture, uv);
        vec4 liquid = vec4(color, opacity);
        gl_FragColor = mix(liquid, bg, blendFactor * opacity);
    }
`;

// Vertex shader: simple shader for liquid geometry
const liquidVertexShader = `
    varying vec3 vWorldPosition;
    void main() {
        vec3 pos = position;
        vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

// Vertex shader builder
function buildVertexShader({ waveLogic }) {
    return `
        ${sharedHeader}
        ${waveUtilsGLSL}
        void main() {
            vec3 pos = position;
            ${waveLogic}
            ${sharedFooter}
        }
    `;
}

const stencilVertexShader = buildVertexShader({ waveLogic: waveForStencil });
const capVertexShader = buildVertexShader({ waveLogic: waveForCap });

export function useLiquidShader(uniforms, options = {}) {
    const {
        enableWave = false,
        side = THREE.DoubleSide,
        transparent = true,
        wireframe = false
    } = options;

    const stencilMaterial = new THREE.ShaderMaterial({
        vertexShader: stencilVertexShader,
        fragmentShader: enableWave ? liquidFragmentShader : stencilFragmentShader,
        uniforms,
        side,
        transparent,
        colorWrite: false,
        depthTest: false,
        depthWrite: false
    });

    const capMaterial = new THREE.ShaderMaterial({
        vertexShader: enableWave ? liquidVertexShader : capVertexShader,
        fragmentShader: liquidFragmentShader,
        uniforms,
        side,
        transparent,
        wireframe: false,
        depthTest: true,
        depthWrite: true
    });

    const liquidMaterial = new THREE.ShaderMaterial({
        vertexShader: liquidVertexShader,
        fragmentShader: liquidFragmentShader,
        uniforms,
        side,
        transparent,
        wireframe,
        depthTest: true,
        depthWrite: true
    });

    return {
        stencilMaterial,
        capMaterial,
        liquidMaterial
    };
}
