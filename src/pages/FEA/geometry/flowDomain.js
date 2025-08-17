import { getWallY } from '../geometry/nozzleGeometry.js';

export let velocityField = [];
export let pressureField = [];
export let temperatureField = [];
export let densityField = [];

// Create nozzle domain (hourglass shape TO BE EDITED TO COINCIDE WITH NOZZLE GEOMETRY)
export function createFlowDomain(width, height, simulationData) {
    const nx = width;
    const ny = height;

    simulationData.velocityX = Array.from({ length: ny }, () => Array(cols).fill(0));
    simulationData.velocityY = Array.from({ length: ny }, () => Array(cols).fill(0));
    simulationData.pressure = Array.from({ length: ny }, () => Array(cols).fill(101325));
    simulationData.temperature = Array.from({ length: ny }, () => Array(cols).fill(300));
    simulationData.density = Array.from({ length: ny }, () => Array(cols).fill(1.225));

    simulationData.nx = nx;
    simulationData.ny = ny;

    simulationData.isInside = Array.from({ length: ny }, () => Array(cols).fill(false));
    simulationData.isBoundary = Array.from({ length: ny }, () => Array(cols).fill(false));

    const rows = simulationData.rows;
    const cols = simulationData.cols;
    const cellWidth = simulationData.cellWidth;
    const cellHeight = simulationData.cellHeight;
    const controlPoints = simulationData.controlPoints;

    //determine if each cell is inside nozzle
    for (let row = 0; row < rows; row++) {    
        for (let col = 0; col < cols; col++) {
            const xCanvas = col * cellWidth + cellWidth / 2;
            const yCanvas = row * cellHeight + cellHeight / 2;

            if (xCanvas <= controlPoints.exit_x) {
                const topY = getWallY(xCanvas, true, controlPoints, simulationData.scaleY, simulationData.canvasHeight || 500);
                const bottomY = getWallY(xCanvas, false, controlPoints, simulationData.scaleY, simulationData.canvasHeight || 500);

                if (yCanvas >= topY && yCanvas <= bottomY) {
                    simulationData.isInside[row][col] = true;

                    //use boundary layers from wall
                    const distToTopWall = Math.abs(yCanvas - topY);
                    const distToBottomWall = Math.abs(yCanvas - bottomY);
                    const minDistToWall = Math.min(distToTopWall, distToBottomWall);
                    
                    //Boundary zone of 1.5 cells from wall
                    const boundaryThickness = Math.max(cellWidth, cellHeight) * 1.5;
                    if (minDistToWall < boundaryThickness) {
                        simulationData.isBoundary[row][col] = true;
                    }
                }
            }
        }
    }
}