import { visualizeFlow } from "../rendering/flowVisualization.js";
import { createFlowDomain, calculateWallAngles, initializeFlow, simulationState, rows, cols } from "./state.js";
import { createNozzleGeometry } from "../rendering/nozzleGeometry.js";
import { setupCanvas } from "./canvas.js";

//canvas resizing
export function setupResize(canvas) {
    window.addEventListener('resize', () => {
        const oldRows = rows;
        const oldCols = cols;
        
        setupCanvas();
        createFlowDomain();
        calculateWallAngles();

        const gridChanged = (rows !== oldRows || cols !== oldCols);

        if (simulationState === 'stopped' && gridChanged) {
            initializeFlow();
        }

        visualizeFlow();
        createNozzleGeometry();
    });
}