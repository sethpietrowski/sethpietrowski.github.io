import { getWallY } from './nozzleGeometry.js';

// Create nozzle domain (hourglass shape TO BE EDITED TO COINCIDE WITH NOZZLE GEOMETRY)
export function createFlowDomain(rows, cols, cellWidth, cellHeight, controlPoints, isInside, isBoundary) {
    // reset arrays
    for (let row = 0; row < rows; row++) {    
        for (let col = 0; col < cols; col++) {
            isInside[row][col] = false;
            isBoundary[row][col] = false;
        }
    }   

    //determine if each cell is inside nozzle
    for (let row = 0; row < rows; row++) {    
        for (let col = 0; col < cols; col++) {
            const xCanvas = col * cellWidth + cellWidth / 2;
            const yCanvas = row * cellHeight + cellHeight / 2;
            if (xCanvas <= controlPoints.exit_x) {
                const topY = getWallY(xCanvas, true);
                const bottomY = getWallY(xCanvas, false);

                if (yCanvas >= topY && yCanvas <= bottomY) {
                    isInside[row][col] = true;

                    //use boundary layers from wall
                    const distToTopWall = Math.abs(yCanvas - topY);
                    const distToBottomWall = Math.abs(yCanvas - bottomY);
                    const minDistToWall = Math.min(distToTopWall, distToBottomWall);
                    
                    //Boundary zone of 1.5 cells from wall
                    const boundaryThickness = Math.max(cellWidth, cellHeight) * 1.5;
                    if (minDistToWall < boundaryThickness) {
                        isBoundary[row][col] = true;
                    }
                }
            }
        }
    }
}