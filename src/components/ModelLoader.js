import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LiquidEffect } from './LiquidEffect.js';

export function loadModels(models, scene) {
    const loader = new GLTFLoader();
    const modelMeshes = [];
    const liquidEffects = [];
    const boundingBoxes = [];
    const axes = [];

    /**
     * Load GLTF model from the given path
     * 
     * @param {string} path directory path to the GLTF model
     * @returns {Promise<THREE.GLTF>} A promise that resolves to the loaded GLTF model
     */
    function loadGLTF(path) {
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
            );
        });
    }

    // Load all models and create liquid effects
    async function load() {
        /**
         * Traverses the given parent object and collects child meshes based on their name.
         * 
         * @param {THREE.Object3D} parent - The root object to traverse.
         * @param {Object} [param1] - Optional parameters.
         * @param {string} [param1.baseName="WaterBody"] - The name prefix used to identify liquid meshes.
         * @returns {object} An object containing arrays of liquid bodies and transformed shells
         */
        function getObjectByBaseName(parent, { baseName = "WaterBody" } = {}) {
            const liquidBodies = [];
            const shells = [];

            parent.traverse((child) => {
                if (!child.isMesh) return;

                if (child.name.startsWith(baseName))
                    liquidBodies.push(child);
                else {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;

                    // Get the world position, rotation, and scale of the object3D
                    const worldPosition = new THREE.Vector3();
                    const worldRotation = new THREE.Quaternion();
                    const worldScale = new THREE.Vector3();
                    child.getWorldPosition(worldPosition);
                    child.getWorldQuaternion(worldRotation);
                    child.getWorldScale(worldScale);

                    child.position.copy(worldPosition);
                    child.quaternion.copy(worldRotation);
                    child.scale.copy(worldScale);

                    shells.push(child);
                }
            });
            return { liquidBodies, shells };
        }

        for (const model of models) {
            const gltf = await loadGLTF(`./assets/${model?.file || model}`);
            const modelMesh = gltf.scene;

            const { liquidBodies, shells } = getObjectByBaseName(modelMesh, { baseName: model.liquid });
            modelMeshes.push(...shells);

            if (liquidBodies && liquidBodies.length > 0) {
                for (const liquidBody of liquidBodies) {
                    const liquidEffect = new LiquidEffect(liquidBody, {
                        color: 0x44aaff,
                        opacity: 0.5
                    });

                    const boundingBox = new THREE.Box3().setFromObject(liquidBody);
                    const bboxHelper = new THREE.Box3Helper(boundingBox, 0xff0000);
                    boundingBoxes.push(bboxHelper);
                    liquidEffects.push(liquidEffect);

                    const axis = _createAxis(liquidBody);
                    axes.push(axis);
                }
            }
        }

        for (const mesh of modelMeshes)
            scene.add(mesh);
        for (const axis of axes)
            scene.add(axis);
        for (const box of boundingBoxes)
            scene.add(box);
    }

    load();

    return { liquidEffects };
}

/**
 * Creates a visual axis helper (X, Y, Z arrows) at the world position and orientation of a given Object3D.
 * This function is useful for debugging and visualizing the orientation of 3D objects in the scene.
 * 
 * The axes are color-coded:
 * - X axis: Red
 * - Y axis: Green
 * - Z axis: Blue
 * 
 * The axis arrows are not affected by depth testing, ensuring they are always visible.
 * 
 * @param {THREE.Object3D} object3D - The target object whose world transform will be used to position and orient the axes.
 * @returns {THREE.Group} A group containing the arrow helpers representing the local axes of the object.
 */
function _createAxis(object3D) {
    const worldPosition = new THREE.Vector3();
    const worldRotation = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    object3D.getWorldPosition(worldPosition);
    object3D.getWorldQuaternion(worldRotation);
    object3D.getWorldScale(worldScale);

    const axisX = new THREE.Vector3(1, 0, 0);
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisZ = new THREE.Vector3(0, 0, 1);
    const origin = new THREE.Vector3(0, 0, 0);
    const length = 1;
    const colorX = 0xff0000;
    const colorY = 0x00ff00;
    const colorZ = 0x0000ff;

    const arrowX = new THREE.ArrowHelper(axisX, origin, length, colorX);
    const arrowY = new THREE.ArrowHelper(axisY, origin, length, colorY);
    const arrowZ = new THREE.ArrowHelper(axisZ, origin, length, colorZ);

    arrowX.line.material.depthTest = false;
    arrowY.line.material.depthTest = false;
    arrowZ.line.material.depthTest = false;

    arrowX.cone.material.depthTest = false;
    arrowY.cone.material.depthTest = false;
    arrowZ.cone.material.depthTest = false;

    const axes = new THREE.Group();
    axes.add(arrowX, arrowY, arrowZ);

    axes.position.copy(worldPosition);
    axes.quaternion.copy(worldRotation);
    // axes.scale.copy(worldScale); // Uncomment if you want to apply the scale of the object3D to the axes

    return axes;
}
