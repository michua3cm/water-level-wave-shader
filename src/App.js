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
    { file: "ChemicalIndustry.glb", liquid: "WaterBody" },
    // { file: "model.glb", liquid: "WaterBody" },
    // { file: "Suzanne.glb", liquid: "WaterBody" },
    // { file: "suzanne2.glb", liquid: "Suzanne" },
    // { file: "Tank.glb", liquid: "Tank001" }
];

const { liquidEffects } = await loadModels(models, scene, renderTarget);

for (const liquid of liquidEffects) {
    createLiquidPane(liquid.uniforms);
}

animateScene({
    scene,
    camera,
    controls,
    renderer,
    renderTarget,
    liquidEffects
});