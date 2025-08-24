//geometry and flow domain creation

//import { simulation } from './core.js';

// Bézier interpolation helper
function bezierQuadratic(t, p0, p1, p2) {
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
}

//geometry functions

/**
 * 
 * @param {number} x - Horizontal coordinate
 * @param {boolean} top - Whether to return the top or bottom of the wall
 * @param {object} controlPoints - Nozzle geometry control points
 * @param {number} scaleY - Vertical Scaling factor
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {number} Y coordinate of the wall
 */

export function getWallY(x, top, controlPoints, scaleY, canvasHeight) {
    
    //clamp x to valid range
    x = Math.max(0, Math.min(x, controlPoints.exit_x));

    const t = x / controlPoints.exit_x;
    const cp = controlPoints;

    const y = bezierQuadratic(
        t,
        bezierQuadratic(t, cp.inlet_radius, cp.cp1y, cp.throat_radius),
        bezierQuadratic(t, cp.throat_radius, cp.cp2y, cp.switcher_y),
        bezierQuadratic(t, cp.switcher_y, cp.cp3y, cp.exit_radius)
    );

    const scaledY = y * scaleY;

    return top 
        ? canvas.height / 2 - scaledY 
        : canvas.height / 2 + scaledY;
}

/**
 * Calculate wall angles to allow for flow expansion tracking (for each column)
 * 
 * @param {number} cols - Number of columns
 * @param {number} cellWidth - Width of each grid cell
 * @param {object} controlPoints - Nozzle control points
 * @param {number} scaleY - Vertical scaling factor
 * @param {number} canvasHeight - Canvas height in pixels
 * @returns {object} Arrays of top and bottom wall angles
 */

export function calculateWallAngles(cols, cellWidth, controlPoints, scaleY, canvasHeight) {
    const wallAngleTop = Array(cols).fill(0);
    const wallAngleBottom = Array(cols).fill(0);

    for (let col = 0; col < cols; col++) {
        const x = col * cellWidth + cellWidth / 2;
        const dx = cellWidth;

        if (col < cols - 1) {
            const y1_top = getWallY(x, true, controlPoints, scaleY, canvasHeight);
            const y1_bot = getWallY(x, false, controlPoints, scaleY, canvasHeight);
            const y2_top = getWallY(x + dx, true, controlPoints, scaleY, canvasHeight);
            const y2_bot = getWallY(x + dx, false, controlPoints, scaleY, canvasHeight);

            wallAngleTop[col] = Math.atan2(y2_top - y1_top, dx);
            wallAngleBottom[col] = Math.atan2(y2_bot - y1_bot, dx);
        } else {
            wallAngleTop[col] = wallAngleTop[col - 1] || 0;
            wallAngleBottom[col] = wallAngleBottom[col - 1] || 0;
        }
    }

    return { top: wallAngleTop, bottom: wallAngleBottom };
}

/**
 * Get local nozzle radius at a given x.
 * 
 * @param {number} x - Horizontal coordinate
 * @param {object} controlPoints - Nozzle geometry control points
 * @param {number} scaleY - Vertical scaling factor
 * @param {number} canvasHeight - Canvas height
 * @returns {number} Local radius
 */

export function getLocalRadius(x, controlPoints, scaleY, canvasHeight) {
    if (x <= 0) return controlPoints.inlet_radius * scaleY;
    if (x >= controlPoints.exit_x) return controlPoints.exit_radius * scaleY;

    const topY = getWallY(x, true, controlPoints, scaleY, canvasHeight);
    const bottomY = getWallY(x, false, controlPoints, scaleY, canvasHeight);
    return Math.abs(bottomY - topY) / 2;
}

//flow domain

// Create nozzle domain (hourglass shape TO BE EDITED TO COINCIDE WITH NOZZLE GEOMETRY)
export function createFlowDomain(simulationData) {
    const { rows, cols, cellWidth, cellHeight, controlPoints, scaleY, canvasHeight } = simulationData;
    
    console.log('Creating flow domain with dimensions:', cols, 'x', rows);

    simulationData.isInside = Array.from({ length: ny }, () => Array(cols).fill(false));
    simulationData.isBoundary = Array.from({ length: ny }, () => Array(cols).fill(false));

    const wallAngles = calculateWallAngles(cols, cellWidth, controlPoints, scaleY, canvasHeight);
    simulationData.wallAngleTop = wallAngles.top;
    simulationData.wallAngleBottom = wallAngles.bottom;

    //determine if each cell is inside nozzle
    for (let row = 0; row < rows; row++) {    
        for (let col = 0; col < cols; col++) {
            const xCanvas = col * cellWidth + cellWidth / 2;
            const yCanvas = row * cellHeight + cellHeight / 2;

            if (xCanvas <= controlPoints.exit_x) {
                const topY = getWallY(xCanvas, true, controlPoints, scaleY, canvasHeight);
                const bottomY = getWallY(xCanvas, false, controlPoints, scaleY, canvasHeight);

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

    //count interior cells for debugging
    let interiorCount = 0;
    let boundaryCount = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (simulationData.isInside[row][col]) {
                if (simulationData.isBoundary[row][col]) {
                    boundaryCount++;
                } else {
                    interiorCount++;
                }
            }
        }
    }
    console.log(`Domain created: ${interiorCount} interior cells, ${boundaryCount} boundary cells`);
}

//geometry utilities

/**
 * Check if a point is inside the nozzle geometry
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {object} controlPoints - Control points
 * @param {number} scaleY - Y scaling
 * @param {number} canvasHeight - Canvas height
 * @returns {boolean} True if inside nozzle
 */
export function isPointInsideNozzle(x, y, controlPoints, scaleY, canvasHeight) {
    if (x < 0 || x > controlPoints.exit_x) return false;

    const topY = getWallY(x, true, controlPoints, scaleY, canvasHeight);
    const bottomY = getWallY(x, false, controlPoints, scaleY, canvasHeight);

    return y >= topY && y <= bottomY;
}

/**
 * Get the centerline Y coordinate (always canvas height / 2)
 * @param {number} canvasHeight - Canvas height
 * @returns {number} Centerline Y coordinate
 */
export function getCenterlineY(canvasHeight) {
    return canvasHeight / 2;
}