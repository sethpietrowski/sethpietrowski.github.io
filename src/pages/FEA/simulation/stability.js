import { cellWidth, cellHeight, velocityX, velocityY, rows, cols } from './state.js';

//artificial viscosity required for stability
export function calculateArtificialViscosity(row, col, mach, rho) {
    if (mach < 0.5 || row <= 0 || row >= rows - 1 || col <= 0 || col >= cols - 1) {
        return { x: 0, y: 0 };
    }

    //velocity gradients (central difference)
    const dvxDx = (velocityX[row][col + 1] - velocityX[row][col - 1]) / (2 * cellWidth);
    const dvxDy = (velocityX[row + 1][col] - velocityX[row - 1][col]) / (2 * cellHeight);
    const dvyDx = (velocityY[row][col + 1] - velocityY[row][col - 1]) / (2 * cellWidth);
    const dvyDy = (velocityY[row + 1][col] - velocityY[row - 1][col]) / (2 * cellHeight);

    //Von Neumann-Richtmyer artificial viscosity
    const C1 = 0.1, C2 = 0.2;
    const divergence = dvxDx + dvyDy;

    if (divergence < 0) { //compression
        const viscosity = -(C1 * Math.abs(divergence) + C2 * divergence * divergence) * 
                         rho * Math.min(cellWidth, cellHeight);
        return { 
            x: viscosity * dvxDx, 
            y: viscosity * dvyDy 
        };
    }
    return { x: 0, y: 0 };
}

//Slope limiter for TVD schemes
export function slopeLimiter(r, limiterType = 'minmod') {
    switch(limiterType) {
        case 'minmod':  return Math.max(0, Math.min(1, r));
        case 'superbee':  
            return Math.max(0, Math.min(2*r, 1), Math.min(r, 2));
        case 'vanLeer':  return (r + Math.abs(r)) / (1 + Math.abs(r));
        default:        return Math.max(0, Math.min(1, r)); //minmod is default
    }
}