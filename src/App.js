import { createScene } from './components/SceneSetup.js';
import { loadModels } from './components/ModelLoader.js';
import { createLiquidPane } from './components/LiquidControlPanel.js';
import { animateScene } from './components/Animation.js';

const {
    scene,
    camera,
    renderer,
    renderTarget,
    controls
} = createScene();

const models = [
    "Diamond.glb",
    "Flask.glb",
    "Icosphere.glb",
    "Suzanne.glb",
    "Torus.glb"
];

const { liquidEffects } = await loadModels(models, scene, renderTarget);

animateScene({
    scene,
    camera,
    controls,
    renderer,
    renderTarget,
    liquidEffects
});