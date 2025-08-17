import { visualizeFlow } from "../rendering/flowVisualization.js";
import { createFlowDomain} from "../geometry/flowDomain.js";
import { calculateWallAngles } from "../geometry/nozzleGeometry.js";
import { initializeFlow, simulation } from "../simulation/state.js";
import { createNozzleGeometry } from "../rendering/nozzleRender.js";
import { setupCanvas } from "../rendering/canvasSetup.js";

let simulationData = null;

export function setSimulationDataForResize(data) {
    simulationData = data;
}

//canvas resizing
export function setupResize(canvas) {
    window.addEventListener('resize', () => {
        if (!simulationData) return;

        const oldRows = simulationData.rows;
        const oldCols = simulationData.cols;
        
        const colorbarCanmvas = document.getElementById('colorbar');
        const convergenceCanvas = document.getElementById('convergence-canvas');
        setupCanvas(canvas, colorbarCanmvas, convergenceCanvas);

        createFlowDomain(simulationData.cols, simulationData.rows, simulationData);
        
        calculateWallAngles(
            simulationData.cols,
            simulationData.cellWidth,
            simulationData.controlPoints,
            simulationData.scaleY,
            cimulationData.canvasHeight
        );

        const gridChanged = (simulationData.rows !== oldRows || simulationData.cols !== oldCols);

        if (simulation.state === 'stopped' && gridChanged) {
            initializeFlow();
        }

        const ctx = canvas.getContext('2d');
        visualizeFlow(
            ctx, 
            simulationData.controlPoints,
            simulationData.scaleY,
            simulationData.rows,
            simulationData.cols,
            simulationData.velocityX,
            simulationData.velocityY,
            simulationData.pressure,
            simulationData.density,
            simulationData.temperature,
            simulationData.isInside,
            simulationData.isBoundary,
            simulationData.cellWidth,
            simulationData.cellHeight,
            simulationData.visualizationMode
        );

        createNozzleGeometry(ctx, simulationData.controlPoints, simulationData.scaleY);
    });
}