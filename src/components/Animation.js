import { createLiquidPane } from "./LiquidControlPanel";

export function animateScene({
    scene,
    camera,
    controls,
    renderer,
    renderTarget,
    liquidEffects
}) {
    const delta = 0.01;
    let height = 0;
    let direction = 1;

    function animation() {
        controls.update();

        // const gl = renderer.getContext();

        // renderer.setRenderTarget(renderTarget);
        // gl.clearColor(0.0, 0.0, 0.0, 1.0);
        // gl.clearDepth(1.0);
        // gl.clearStencil(0);

        // gl.clear(gl.COLOR_BUFFER_BIT |
        //     gl.DEPTH_BUFFER_BIT |
        //     gl.STENCIL_BUFFER_BIT);

        // renderer.render(scene, camera);
        // renderer.setRenderTarget(null);

        renderer.render(scene, camera);

        if (height > 1 - delta) direction = -1;
        else if (height < 0 + delta) direction = 1;
        height += direction * delta;

        renderer.clearDepth();
        for (const liquid of liquidEffects) {
            if (liquid.visible) continue;
            liquid.setHeight(height);
            liquid.uniforms.time.value = performance.now() / 1000;
            liquid.uniforms.backgroundTexture.value = renderTarget.texture;
            liquid.render(renderer, camera);
        }
    }

    renderer.setAnimationLoop(animation);
}