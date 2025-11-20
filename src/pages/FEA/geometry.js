//geometry and flow domain creation

// linear interpolation helper
function lerp(t, a, b) {
    return a + t * (b - a);
}

//geometry functions

/**
 * 
 * @param {number} x - Horizontal coordinate
 * @param {object} controlPoints - Nozzle geometry control points
 * @returns {number} Radius at this x position
 */

function getNozzleRadius(x, controlPoints) {
    const { inlet_radius, throat_x, throat_radius, exit_x, exit_radius } = controlPoints;

    //clamp x to valid range
    x = Math.max(0, Math.min(x, exit_x));

    if (x < throat_x) {
        //converging section
        const t = x / throat_x;
        const smoothT = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        return inlet_radius + smoothT * (throat_radius - inlet_radius);
    } else {
        //diverging section (Rao parabolic bell)
        const L_full = exit_x - throat_x;
        if (L_full <= 0) { //ivalid, no divergence length
            console.warn('getNozzleRadius: L <= 0, returning throat radius.',  { L, throat_x, exit_x });
            return throat_radius;
        }

        const dx = x - throat_x;

        //Angles
        const theta_n_deg = controlPoints.theta_n_deg ?? 30; //throat angle
        const theta_e_deg = controlPoints.theta_e_deg ?? 12; //exit angle
        const theta_n = theta_n_deg * Math.PI / 180; 
        const theta_e = theta_e_deg * Math.PI / 180; 

        const R_t = throat_radius;
        const R_e = exit_radius;

        const blendLength = L_full * 0.15;

        if (dx < blendLength) {
            const blendParam = dx / blendLength;

            //smooth s-curve
            const smoothBlend = 3 * blendParam * blendParam - 2 * blendParam * blendParam * blendParam;
            
            //linear expansion from throat
            const linearR = R_t + Math.tan(theta_n) * dx;

            //target radius from parabolic formula at blend end
            const x_blend = blendLength;
            const s_blend = x_blend / L_full;

            const k = (R_e - R_t - Math.tan(theta_n) * blendLength) / (L_full - blendLength);
            const parabolicR_at_blend = R_t + Math.tan(theta_n) * blendLength +
                k * (dx - blendLength) * (1 - 0.5 * (dx - blendLength) / L_full);

            //blend between linear and parabolic
            return linearR * (1 - smoothBlend) + parabolicR_at_blend * smoothBlend;
        } else {
            //parabolic curve
            const dx_eff = dx - blendLength;
            const L_eff = L_full - blendLength;
            const R_start = R_t + Math.tan(theta_n) * blendLength;

            const s = dx_eff  / L_eff; //0 to 1
            const curvature = 0.7; // 0.5 to 1

            const parabolicProfile = Math.pow(s, curvature);
            return R_start + (R_e - R_start) * parabolicProfile;
        }
    }
}

export function diagnoseDivergent(controlPoints, samples = 400) {
    const { throat_x, exit_x } = controlPoints;
    const dx = (exit_x - throat_x) / samples;
    let prevR = null;
    const problems = [];
    for (let i = 0; i <= samples; i++) {
        const x = throat_x + i * dx;
        const r = getNozzleRadius(x, controlPoints);
        if (prevR !== null) {
            const dr = r - prevR;
            if (dr < -1e-8) {
                // record location where radius decreases
                problems.push({ i, x, r, prevR, dr });
            }
        }
        prevR = r;
    }
    if (problems.length === 0) {
        console.log('diagnoseDivergent: diverging section monotonic (dr/dx >= 0) over sampled points.');
    } else {
        console.warn('diagnoseDivergent: detected non-monotonic points (first 10):', problems.slice(0, 10));
    }
    return problems;
}



export function getWallY(x, top, controlPoints, scaleY, canvasHeight) {
    const radius = getNozzleRadius(x, controlPoints);
    const scaledRadius = radius * scaleY;

    const centerY = canvasHeight / 2;
    
    return top
        ? centerY - scaledRadius
        : centerY + scaledRadius;
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
    const radius = getNozzleRadius(x, controlPoints);
    return radius * scaleY;
}

//flow domain

// Create nozzle domain (hourglass shape TO BE EDITED TO COINCIDE WITH NOZZLE GEOMETRY)
export function createFlowDomain(simulationData) {
    const { rows, cols, cellWidth, cellHeight, controlPoints, scaleY, canvasHeight } = simulationData;
    
    console.log('Creating flow domain with dimensions:', cols, 'x', rows);

    simulationData.isInside = Array.from({ length: rows }, () => Array(cols).fill(false));
    simulationData.isBoundary = Array.from({ length: rows }, () => Array(cols).fill(false));

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