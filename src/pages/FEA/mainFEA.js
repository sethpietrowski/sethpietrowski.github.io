import { createFlowDomain } from './geometry/flowDomain.js';
// import { calculateWallAngles } from "./geometry/nozzleGeometry.js";
import { createNozzleGeometry } from './rendering/nozzleRender.js';
import { visualizeFlow } from './rendering/flowVisualization.js';
import { setupVisualizationModeControls, setupToleranceControls, setupControlButtons, setSimulationData } from './ui/controls.js';
import { setupCanvas } from './rendering/canvasSetup.js';
import { updateSimulationStatus, setSimulationDataForLoop } from './simulation/loop.js';
import { setSimulationDataForPhysics } from './simulation/physics.js';
import { setSimulationDataForResize, setupResize } from './ui/resize.js';
import { simulation } from './simulation/state.js';

export function initFEA(canvas, simulationData) {
    console.log('=== FEA debugging ===');
    console.log('Canvas: ', canvas);
    console.log('Simulation Data: ', simulationData);

    if (!canvas) {
        console.error('Canvas is null or undefined');
        return;
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return;
    };

    console.log('Canvas Dimensions: ', canvas.width, 'x', canvas.height);

    console.log('Testing basic canvas drawing...');
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 10, 50, 50);
    console.log('Red test square drawn at (10,10)');

    //clear for actual content
    setTimeout(() => {
        ctx.clearRect(0,0, canvas.width, canvas.height);

        console.log('Setting simulation data for modules...');
        setSimulationData(simulationData);
        setSimulationDataForLoop(simulationData);
        setSimulationDataForResize(simulationData);
        setSimulationDataForPhysics(simulationData);

        console.log('Setting up UI controls...');
        try {
            setupVisualizationModeControls();
            setupToleranceControls();
            setupControlButtons();
        } catch (e) {
            console.error('Error setting up UI controls: ', e);
        }
        
        console.log('Setting up canvas...');
        const colorbarCanvas = document.getElementById('colorbar');
        const convergenceCanvas = document.getElementById('convergence-canvas');
        console.log('Colorbar canvas: ', colorbarCanvas);
        console.log('Convergence canvas: ', convergenceCanvas);

        try {
            setupCanvas(canvas, colorbarCanvas, convergenceCanvas);
        } catch (e) {
            console.error('Error setting up canvas: ', e);
        }

        console.log('Setting up resize handling...');
        try {
            setupResize(canvas);
            console.log('Resize setup complete');
        } catch (e) {
            console.error('Error setting up resize: ', e);
        }

        // Run simulation
        console.log('Creating flow domain...');
        console.log('Domain params: ', simulationData.cols, simulationData.rows);
        try {
            createFlowDomain(simulationData.cols, simulationData.rows, simulationData);
            console.log('Flow domain created');
            console.log('isInside array length: ', simulationData.isInside?.length);
            console.log('velocityX array length: ', simulationData.velocityX?.length);
        } catch (e) {
            console.error('Error creating flow domain: ', e);
        }
        
        console.log('Drawing nozzle geometry...');
        console.log('Control points: ', simulationData.controlPoints);
        console.log('Scale Y: ', simulationData.scaleY);

        // const wallAngles = calculateWallAngles(
        //     simulationData.cols,
        //     simulationData.cellWidth,
        //     simulationData.controlPoints,
        //     simulationData.scaleY,
        //     canvas.height
        // );

        try {
            createNozzleGeometry(ctx, simulationData.controlPoints, simulationData.scaleY);
            console.log('Nozzle geometry drawn');
        } catch (e) {
            console.error('Error drawing nozzle geometry: ', e);
        }

        console.log('Initializingtest flow data...');
        const rows = simulationData.rows;
        const cols = simulationData.cols;

        if (!simulationData.velocityX ||simulationData.velocityX.length === 0) {
            console.log('Initializing velocity arrays...');
            simulationData.velocityX = Array.from({ length: rows }, () => Array(cols).fill(0));
            simulationData.velocityY = Array.from({ length: rows }, () => Array(cols).fill(0));
            simulationData.pressure = Array.from({ length: rows }, () => Array(cols).fill(101325));
            simulationData.temperature = Array.from({ length: rows }, () => Array(cols).fill(300));
            simulationData.density = Array.from({ length: rows }, () => Array(cols).fill(1.225));
        }

        //test data
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (simulationData.isInside && simulationData.isInside[row] && simulationData.isInside[row][col]) {
                    simulationData.velocityX[row][col] = 100 + col * 2;
                    simulationData.pressure[row][col] = 101325 + row * 1000;
                }
            }
        }

        console.log('Test data visualized');

        console.log('Visualizing flow...');
        console.log('Visualization mode: ', simulationData.visualizationMode);
        
        try {
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
            console.log('Flow visualization completed');
        } catch (e) {
            console.error('Error visualizing flow: ', e);
        }

        //update status
        try {
            updateSimulationStatus('stopped');
            console.log('Status updated');
        } catch (e) {
            console.error('Error updating status: ', e);
        }

        console.log('=== FEA initialization complete ===');
    }, 100); //small delay to see test square
}