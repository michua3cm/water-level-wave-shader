import { Pane } from 'tweakpane';

export function createLiquidPane(uniforms, { label = "Water Settings" } = {}) {
    const pane = new Pane();
    const folder = pane.addFolder({ title: label });

    const params = {
        waveAmplitude: uniforms.waveAmplitude.value
    }

    folder.addInput(params, 'roughness', {
        min: 0,
        max: 1,
        step: 0.01,
    }).on('change', (event) => {
        uniforms.waveAmplitude.value = event.value;
    });
    // folder.addInput(uniforms, 'distortionScale', {
    //     min: 0,
    //     max: 1,
    //     step: 0.01,
    // });
    // folder.addInput(uniforms, 'distortionBias', {
    //     min: -1,
    //     max: 1,
    //     step: 0.01,
    // });
    // folder.addInput(uniforms, 'speed', {
    //     min: -10,
    //     max: 10,
    //     step: 0.01,
    // });
}
