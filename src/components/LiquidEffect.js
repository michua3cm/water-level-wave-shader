import * as THREE from 'three';
import { useLiquidShader } from './LiquidShader.js';

export class LiquidEffect {
    constructor(
        object3D,
        {
            // Wave parameters
            waveFrequency = 2.0,
            waveSpeed = 5.0,
            waveAmplitude = 0.025,
            waveDirection = new THREE.Vector3(1, 0, 1),
            surfaceNormal = new THREE.Vector3(0, 1, 0),

            // Height control parameters
            liquidLevel = 0.0,
            tankMinY = -1.0,
            tankMaxY = 1.0,

            // Opticlal parameters
            iorIn = 1.0, // Index of refraction: air = 1.0
            iorOut = 1.33, // Index of refraction: water = 1.33
            refractionStrength = 0.1,
            backgroundTexture = null,

            // Rendering parameters
            resolution = new THREE.Vector2(window.innerWidth, window.innerHeight),
            blendFactor = 0.25,
            color = "#33aaff",
            opacity = 0.8,

            // Effect toggles
            enableWave = true,
            freeze = false
        } = {}
    ) {
        this.object3D = object3D;
        this.parent = this.object3D?.parent;

        this.uniforms = {
            // Wave parameters
            time: { value: 0 },
            waveFrequency: { value: waveFrequency },
            waveSpeed: { value: waveSpeed },
            waveAmplitude: { value: waveAmplitude },
            waveDirection: { value: waveDirection.clone().normalize() },
            surfaceNormal: { value: surfaceNormal.clone().normalize() },

            // Height control parameters
            liquidLevel: { value: liquidLevel },
            tankMinY: { value: tankMinY },
            tankMaxY: { value: tankMaxY },

            // Optical parameters
            iorIn: { value: iorIn },
            iorOut: { value: iorOut },
            refractionStrength: { value: refractionStrength },
            backgroundTexture: { value: backgroundTexture },

            // Rendering parameters
            resolution: { value: resolution },
            blendFactor: { value: blendFactor },
            color: { value: new THREE.Color(color) },
            opacity: { value: opacity },

            // Effect toggles
            enableWave: { value: enableWave },
            freeze: { value: freeze }
        };
        this.bbox = new THREE.Box3();

        this._init();
    }

    /**
     * Initialize the liquid effect by creating the liquid shader materials and setting up the object3D.
     * @private
     */
    _init() {
        // Create liquid shader materials. Stencil, cap, and liquid.
        this.materials = useLiquidShader(this.uniforms, { transparent: true });

        // Get the bounding box of the object3D, and set the wave parameters
        this.object3D.updateMatrixWorld(true);
        this.bbox.setFromObject(this.object3D);
        this.uniforms.tankMinY.value = this.bbox.min.y;
        this.uniforms.tankMaxY.value = this.bbox.max.y;
        const height = this.bbox.max.y - this.bbox.min.y;
        this.uniforms.waveFrequency.value += 1.0 / height;
        this.uniforms.waveSpeed.value = Math.sqrt(height * 9.81);
        this.uniforms.waveAmplitude.value *= height;

        this._applyMaterial();
    }

    /**
     * Apply materials, stencil mask, and cap plane to the object3D.
     * @private
     */
    _applyMaterial() {
        // Get the original material of the object3D
        const originalMaterial = this.object3D.material;

        // Get the geometry of the object3D
        const geometry = this.object3D.geometry;

        // Create stencil mesh
        this.stencilMesh = new THREE.Mesh(geometry, this.materials.stencilMaterial);
        this.stencilMesh.name = 'stencil';
        this.stencilMesh.renderOrder = 1;

        // Create cap geometry, PlaneGeometry lies in the XY plane, so we need to rotate it
        // Default normal vector points in +Z direction
        const capGeometry = new THREE.PlaneGeometry(
            this.bbox.max.x - this.bbox.min.x,
            this.bbox.max.z - this.bbox.min.z,
            32,
            32
        );
        const eulerAngle = new THREE.Euler(
            -Math.PI / 2,
            0,
            -Math.PI / 2,
            'XYZ'
        );  // Rotate the plane to lie in the XZ plane, points in +Y direction
        const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(eulerAngle);
        capGeometry.applyMatrix4(rotationMatrix);
        capGeometry.computeVertexNormals();
        // Create cap mesh, invisible when liquid is frozen
        this.capMesh = new THREE.Mesh(capGeometry, this.materials.capMaterial);
        this.capMesh.name = 'cap';
        this.capMesh.visible = !this.uniforms.freeze.value;
        this.capMesh.renderOrder = 2;

        // Apply liquid shader material to the object3D
        this.object3D.material = this.materials.liquidMaterial;
        this.object3D.name = 'liquid';
        this.object3D.renderOrder = 3;

        // Set the stencil and cap meshes to the same position and rotation as the object3D
        this._applyTransform(this.stencilMesh);
        this._applyTransform(this.capMesh);

        // Record the original material for recovery
        this.recovery = { material: originalMaterial };
    }

    /**
     * Apply the transformation to the stencil and cap meshes.
     * @private
     * 
     * @param {THREE.Mesh} mesh 
     */
    _applyTransform(mesh) {
        // Get the world position, rotation, and scale of the object3D
        const worldPosition = new THREE.Vector3();
        const worldRotation = new THREE.Quaternion();
        const worldScale = new THREE.Vector3();
        this.object3D.getWorldPosition(worldPosition);
        this.object3D.getWorldQuaternion(worldRotation);
        this.object3D.getWorldScale(worldScale);

        // Set the position, rotation, and scale of the stencil and cap meshes
        if (mesh.name === 'cap') {
            mesh.position.setX(worldPosition.x);
            mesh.position.setZ(worldPosition.z);
        } else {
            mesh.position.copy(worldPosition);
            mesh.quaternion.copy(worldRotation);
            mesh.scale.copy(worldScale);
        }
    }

    /**
     * Renders the liquid effect using a multi-pass rendering technique.
     * Stencil mask -> cap plane -> liquid body.
     * 
     * @param {THREE.WebGLRenderer} renderer The renderer to use for rendering the liquid effect.
     * @param {THREE.Camera} camera The camera through which the scene is viewed. 
     */
    render(renderer, camera) {
        // Access raw WebGL context for manual buffer/stencil operations
        const gl = renderer.getContext();

        // Enable stencil test
        gl.enable(gl.STENCIL_TEST);

        // Block the color and depth buffer
        // To prevent the stencil buffer from being affected by the color and depth buffer
        gl.colorMask(false, false, false, false);
        gl.depthMask(false);

        // Pass 1: write stencil using geometry (no depth)
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        renderer.render(this.stencilMesh, camera);

        // Restore color and depth buffer
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);

        // Pass 2: render cap (only where stencil == 1)
        gl.stencilFunc(gl.EQUAL, 1, 0xff);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        renderer.render(this.capMesh, camera);

        // Pass 3: render liquid body (only where stencil == 1)
        renderer.render(this.object3D, camera);

        // Disable stencil test
        gl.disable(gl.STENCIL_TEST);
    }

    /**
     * Set the liquid level height.
     * 
     * @param {number} percentage Height percentage of the liquid level, between 0 and 1.
     */
    setHeight(percentage) {
        // Validate the percentage parameter
        if (typeof percentage !== "number" || isNaN(percentage)) {
            console.warn("Invalid height parameter: must be a number");
            return;
        }

        // Clamp the percentage to the range [0, 1]
        if (percentage < 0 || percentage > 1) {
            console.warn("Height parameter out of range: must be between 0 and 1");
            percentage = Math.max(0, Math.min(1, percentage));
        }

        // Update the liquid level based on the bounding box of the object3D
        this.object3D.updateMatrixWorld(true);

        // Get the size of the object3D
        const worldMin = new THREE.Vector3(
            this.bbox.min.x,
            this.bbox.min.y,
            this.bbox.min.z
        );
        const worldSize = new THREE.Vector3(
            this.bbox.max.x - this.bbox.min.x,
            this.bbox.max.y - this.bbox.min.y,
            this.bbox.max.z - this.bbox.min.z
        );

        // Calculate the actual height based on the percentage
        const targetSize = worldMin
            .clone()
            .add(worldSize.clone().multiplyScalar(percentage));
        const height = targetSize.dot(this.uniforms.surfaceNormal.value);
        this.uniforms.liquidLevel.value = height;
    }

    /**
     * Recover the original material of the object3D and dispose of the liquid effect.
     */
    dispose() {
        // Restore the original material
        if (this.recovery.material) {
            this.object3D.material = this.recovery.material;
        }

        // Dispose stencil mesh
        if (this.stencilMesh) {
            this.stencilMesh.geometry.dispose();
            this.stencilMesh.material.dispose();
            this.stencilMesh = null;
        }

        // Dispose cap mesh
        if (this.capMesh) {
            this.capMesh.geometry.dispose();
            this.capMesh.material.dispose();
            this.capMesh = null;
        }
    }
}
