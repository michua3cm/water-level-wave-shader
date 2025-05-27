import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LiquidEffect } from './LiquidEffect.js';

export function loadModels(models, scene) {
    const loader = new GLTFLoader();
    const modelMeshes = [];
    const liquidEffects = [];
    const tanks = [];
    const boundingBoxes = [];
    const axes = [];

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

    async function load() {
        function getObjectByBaseName(parent, baseName) {
            const result = [];
            parent.traverse((child) => {
                if (!child.isMesh) return;

                if (child.name.startsWith(baseName))
                    result.push(child);
                else {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });
            return result;
        }

        for (const model of models) {
            const gltf = await loadGLTF(`./src/assets/${model.file}`);
            const modelMesh = gltf.scene;
            modelMeshes.push(modelMesh);

            const liquidBodies = getObjectByBaseName(modelMesh, model.liquid);

            if (liquidBodies && liquidBodies.length > 0) {
                for (const liquidBody of liquidBodies) {
                    const liquidEffect = new LiquidEffect(liquidBody, {
                        color: 0x44aaff,
                        opacity: 0.5
                    });

                    const tank = liquidEffect.parent;
                    if (tank) tanks.push(tank);

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
