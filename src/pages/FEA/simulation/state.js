
const colorbarCanvas = document.getElementById('colorbar');
const colorbarCtx = colorbarCanvas.getContext('2d');
const convergenceCanvas = document.getElementById('convergence-canvas');
const convergenceCtx = convergenceCanvas.getContext('2d');

//simulation state
export const simulation = { 
    state: 'stopped',
    timeStep: 0,
    totalIterations: 0,
    animationId: null,
};

export let timeStep = 0;
export let totalIterations = 0;
export let animationId = null;

export let visualizationMode = 'velocity';

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

export const nozzleWidth = 700;
export const canvasSize = setupCanvas();
export const scaleX = canvasSize.width / nozzleWidth;

//grid setup
export const rows = 100;
export const cols = 150;
export const cellWidth = canvasSize.width / cols;
export const cellHeight = canvasSize.height / rows;

// Flow field variables
export const velocityX     = Array(rows).fill().map(() => Array(cols).fill(0));
export const velocityY     = Array(rows).fill().map(() => Array(cols).fill(0));
export const pressure      = Array(rows).fill().map(() => Array(cols).fill(1));
export const density       = Array(rows).fill().map(() => Array(cols).fill(1));
export const temperature   = Array(rows).fill().map(() => Array(cols).fill(1));
export const isInside      = Array(rows).fill().map(() => Array(cols).fill(false));
export const isBoundary    = Array(rows).fill().map(() => Array(cols).fill(false));

//convergence storage from previous iteration
export const prevVelocityX = Array(rows).fill().map(() => Array(cols).fill(0));
export const prevVelocityY = Array(rows).fill().map(() => Array(cols).fill(0));
export const prevPressure = Array(rows).fill().map(() => Array(cols).fill(1));

//wall angle arrays for boundary interactions
export const wallAngleTop = Array(cols).fill(0);
export const wallAngleBottom = Array(cols).fill(0);

// Global control point definitions (X-values scaled to canvas width)
export const controlPoints = {
    inlet_length: 75 * scaleX,
    inlet_radius: 75,
    cp1x: 150 * scaleX, cp1y: 40,
    throat_x: 175 * scaleX, throat_radius: 37.5,
    cp2x: 225 * scaleX, cp2y: 30,
    switcher_x: 275 * scaleX, switcher_y: 50,
    cp3x: 450 * scaleX, cp3y: 125,
    exit_x: 700 * scaleX, exit_radius: 150
};

export const scaleY = canvasSize.height / 2 / controlPoints.exit_radius;

export function setupCanvas() {
    const canvas = document.getElementById('fea-canvas');
    const width = canvas ? canvas.canvas.width : 1000;
    const height = canvas ? canvas.canvas.height : 500;

    colorbarCanvas.width = 30;
    colorbarCanvas.height = 400;
    convergenceCanvas.width = 400;
    convergenceCanvas.height = 250;

    return {width, height};
}

// Basic flow simulation (need to update with real physics)
export function initializeFlow() {
    //inlet conditions
    const P_inlet = 3.0; //generic vals
    const V_inlet = 0.8; 
    const T_inlet = 2.0;
    const rho_inlet = 1.5;

    //giving interior cells basic vals
    for (let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                //linear interpolation from inlet to exit
                const progress = col / (cols - 1);
                velocityX[row][col] = V_inlet * (1 + progress * 0.5);
                velocityY[row][col] = 0.0;
                pressure[row][col] = P_inlet * (1 - progress * 0.3);
                density[row][col] = rho_inlet * (1 - progress * 0.2);
                temperature[row][col] = T_inlet * (1 - progress * 0.1);
            } else if (isBoundary[row][col]) {
                velocityX[row][col] = 0.0;
                velocityY[row][col] = 0.0;
            }
        }
    }

    //reset convergence tracking
    timeStep = 0;
    totalIterations = 0;
    convergenceHistory.velocity = [];
    convergenceHistory.pressure = [];
    convergenceHistory.mass = [];

    updateSimulationStatus('running');
}