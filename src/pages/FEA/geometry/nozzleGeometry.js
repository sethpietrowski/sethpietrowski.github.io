// Bézier interpolation helper
function bezierQuadratic(t, p0, p1, p2) {
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
}

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
 * @param {number} cols - Number of columns.
 * @param {number} cellWidth - Width of each grid cell.
 * @param {object} controlPoints - Nozzle control points.
 * @param {number} scaleY - Vertical scaling factor.
 * @param {number} canvasHeight - Canvas height in pixels.
 * @returns {{top: number[], bottom: number[]}} Arrays of top and bottom wall angles.
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
            wallAngleTop[col] = wallAngleTop[col - 1];
            wallAngleBottom[col] = wallAngleBottom[col - 1];
        }
    }

    return { top: wallAngleTop, bottom: wallAngleBottom };
}

/**
 * Get local nozzle radius at a given x.
 * 
 * @param {number} x - Horizontal coordinate.
 * @param {object} controlPoints - Nozzle geometry control points.
 * @param {number} scaleY - Vertical scaling factor.
 * @param {number} canvasHeight - Canvas height.
 * @returns {number} Local radius.
 */
export function getLocalRadius(x, controlPoints, scaleY, canvasHeight) {
    if (x <= 0) return controlPoints.inlet_radius * scaleY;
    if (x >= controlPoints.exit_x) return controlPoints.exit_radius * scaleY;

    const topY = getWallY(x, true, controlPoints, scaleY, canvasHeight);
    const bottomY = getWallY(x, false, controlPoints, scaleY, canvasHeight);
    return Math.abs(bottomY - topY) / 2;
}