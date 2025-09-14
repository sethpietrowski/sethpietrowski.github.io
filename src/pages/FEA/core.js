import { createFlowDomain } from "./geometry.js";
import { initializeFlow, updateFlowStabilized } from "./physics.js";
import { visualizeFlow, createNozzleGeometry } from "./rendering.js";
import { startAnimationLoop, stopAnimationLoop, updateSimulationStatus } from "./ui.js";

//simulation state management

export const simulation = { 
    state: 'stopped',
    timeStep: 0,
    totalIterations: 0,
    animationId: null,
};

let _animationId = null;
export function setAnimationId(id) { _animationId = id; }
export function getAnimationId() { return _animationId; }

//convergence tracking
export const convergenceHistory = {
    velocity: [],
    pressure: [],
    mass: [],
    maxHistory: 200
};

export let convergenceTolerances = {
    velocity: 1e-6,
    pressure: 1e-6,
    mass: 1e-6
};

//global sim data container
let simulationData = null;
let callbacks = null;

//initialization
export function initFEA(canvas, inputSimulationData) {
    console.log('=== FEA initialization starting ===');

    if (!canvas) {
        console.error('Canvas is null or undefined');
        return null;
    };

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context');
        return null;
    };

    simulationData = inputSimulationData.current;

    console.log('Canvas Dimensions: ', canvas.width, 'x', canvas.height);
    console.log('Simulation Data: ', simulationData);

    //clear canvas and show test
    // ctx.fillStyle = 'red';
    // ctx.fillRect(10, 10, 50, 50);
    // console.log('Red test square drawn at (10,10)');

    //initialize after a short delay
    setTimeout(() => {
        try {
            initializeSimulation(canvas, ctx);
            console.log('=== FEA initialization complete ===');
        } catch (error) {
            console.error('Failed to initialize FEA: ', error);
            updateSimulationStatus('error');
        }
    }, 100);

    return createSimulationControl(canvas);
}

function initializeSimulation(canvas, ctx) {
    ctx.clearRect(0,0, canvas.width, canvas.height);

    //setup canvas dims in simualtion data
    setupCanvasDimensions(canvas);

    //create geometry
    console.log('Creating flow domain...');
    createFlowDomain(simulationData);
    console.log('Flow domain created. isInside length: ', simulationData.isInside?.length);
    
    initializeFlowArrays();

    initializeFlow(simulationData); 

    renderCurrentState(ctx);

    updateSimulationStatus('ready');
}

function setupCanvasDimensions(canvas) {
    simulationData.canvasWidth = canvas.width;
    simulationData.canvasHeight = canvas.height;

    const maxNozzleWidth = simulationData.cointrolPoints.exit_x;
    const scaleX = (canvas.width * 0.9) / maxNozzleWidth;

    //scale control points with Canvas
    Object.keys(simulationData.controlPoints).forEach(key => {
        if (key.includes('_x' || key === 'exit_x')) {
            simulationData.controlPoints[key] *= scaleX;
        }
    });

    //adjust scaleY to fit canvas height
    const maxRadius = Math.max(
        simulationData.controlPoints.inlet_radius,
        simulationData.controlPoints.exit_radius,
        simulationData.controlPoints.throat_radius
    );
    simulationData.scaleY = (canvas.height * 0.35) / maxRadius;

    simulationData.cellWidth = simulationData.canvasWidth / simulationData.cols;
    simulationData.cellHeight = simulationData.canvasHeight / simulationData.rows;
}

function initializeFlowArrays() {
    const { rows, cols } = simulationData;

    //force re-initialization even if arrays already exist
    simulationData.velocityX = [];
    simulationData.velocityY = [];
    simulationData.pressure = [];
    simulationData.temperature = [];
    simulationData.density = [];

    for (let row = 0; row < rows; row++) {
        simulationData.velocityX[row] = new Array(cols).fill(0);
        simulationData.velocityY[row] = new Array(cols).fill(0);
        simulationData.pressure[row] = new Array(cols).fill(101325);
        simulationData.temperature[row] = new Array(cols).fill(300);
        simulationData.density[row] = new Array(cols).fill(1.225);
    }
}

// function createTestData() {
//     const { rows, cols, isInside } = simulationData;

//     for (let row = 0; row < rows; row++) {
//         for (let col = 0; col < cols; col++) {
//             if (isInside && isInside[row] && isInside[row][col]) {
//                 const progress = col / (cols - 1);
//                 simulationData.velocityX[row][col] = 50 + progress * 100;
//                 simulationData.velocityY[row][col] = Math.sin(progress * Math.PI) * 5;
//                 simulationData.pressure[row][col] = 101325 + (1 - progress * 0.3);
//                 simulationData.temperature[row][col] = 300 - progress * 50;
//                 simulationData.density[row][col] = 1.225 * (1 - progress * 0.2);
//             }
//         }
//     }
// }

function renderCurrentState(ctx) {
    try {
        createNozzleGeometry(ctx, simulationData);

        visualizeFlow(ctx, simulationData, callbacks);

        console.log('Initial rendering complete');
    } catch (error) {
        console.error('Error rendering initial state: ', error);
    }
}

//simulation control interface

function createSimulationControl(canvas) {
    return {
        start: () => startSimulation(canvas),
        pause: () => pauseSimulation(),
        reset: () => resetSimulation(canvas),
        setTolerance: (type, value) => setTolerance(type, value),
        setCallbacks: (newCallbacks) => setCallbacks(newCallbacks),
        updateVisualization: () => updateVisualization(canvas),
        cleanup: () => cleanupSimulation()
    };
}

function startSimulation(canvas) {
    console.log('Starting simulation...');
    simulation.state = 'running';
    updateSimulationStatus('running');

    if (callbacks?.onStatusUpdate) {
        callbacks.onStatusUpdate('running');
    }

    startAnimationLoop(canvas, simulationData, callbacks);
}

function pauseSimulation() {
    console.log('Pausing simulation...');
    simulation.state = 'paused';
    updateSimulationStatus('paused');

    if (callbacks?.onStatusUpdate) {
        callbacks.onStatusUpdate('paused');
    }

    stopAnimationLoop();
}

function resetSimulation(canvas) {
    console.log('Resetting simulation...');

    stopAnimationLoop();

    simulation.state = 'stopped';
    simulation.timeStep = 0;
    simulation.totalIterations = 0;

    //clear conv hist
    convergenceHistory.velocity = [];
    convergenceHistory.pressure = [];
    convergenceHistory.mass = [];

    //reset flow arrays -> reinitialize flow
    initializeFlowArrays();

    try {
        initializeFlow(simulationData);
        // createTestData();
    } catch (error) {
        console.log('Error reinitializing flow: ', error);
    }

    updateSimulationStatus('ready');
    
    if (callbacks?.onStatusUpdate) {
        callbacks.onStatusUpdate('ready');
    }

    if (callbacks?.onConvergenceUpdate) {
        callbacks.onConvergenceUpdate({
            timeStep: 0,
            totalIterations: 0,
            velocityResidual: '-',
            pressureResidual: '-',
            massResidual: '-',
        });
    }

    const ctx = canvas.getContext('2d');
    renderCurrentState(ctx);
}

function setTolerance(type, value) {
    console.log(`Setting ${type} tolerance to ${value}`);
    if (type in convergenceTolerances) {
        convergenceTolerances[type] = value;
    }
}

function setCallbacks(newCallbacks) {
    callbacks = newCallbacks;
    console.log('Callbacks set: ', Object.keys(callbacks || {}));
}

function updateVisualization(canvas) {
    const ctx = canvas.getContext('2d');
    renderCurrentState(ctx);
}

function cleanupSimulation() {
    console.log('Cleaning up simulation...');
    simulation.state = 'stopped';
    stopAnimationLoop();
}

//export getters for other files

export function getSimulationData() {
    return simulationData;
}

export function getCallbacks() {
    return callbacks;
}

export function setConvergenceTolerance(type, value) {
    if (type in convergenceTolerances) {
        convergenceTolerances[type] = value;
    }
}