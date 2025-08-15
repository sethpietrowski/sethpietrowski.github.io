//import { initializeState } from './simulation/state.js';
import { createFlowDomain } from './geometry/flowDomain.js';
import { createNozzleGeometry } from './rendering/nozzleRender.js';
import { visualizeFlow } from './rendering/flowVisualization.js';
import { setupVisualizationModeControls, setupToleranceControls } from './ui/controls.js';
import { setupCanvas } from './rendering/canvasSetup.js';
import { updateSimulationStatus } from './simulation/loop.js';

export function initFEA() {
    const feaCanvas = document.getElementById('fea-canvas');
    const ctx = canvas.getContext('2d');

    setupVisualizationModeControls();
    setupToleranceControls();
    setupCanvas(feaCanvas);

    // Run simulation
    createFlowDomain(100, 200);
    CalculateWallAngles();
    //initializeState(100,200);
    createNozzleGeometry(ctx);
    updateSimulationStatus('stopped');

    //initial property
    visualizeFlow('velocity');

    //Initial display
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    visualizeFlow();
    createNozzleGeometry();
}