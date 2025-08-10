import { rows, cols, cellWidth, cellHeight, 
        velocityX, velocityY, prevVelocityX, prevVelocityY, 
        pressure, prevPressure, density, isInside, isBoundary, 
        convergenceHistory, convergenceTolerances 
    } from './state.js';

export function storePreviousIteration() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            prevVelocityX[row][col] = velocityX[row][col];
            prevVelocityY[row][col] = velocityY[row][col];
            prevPressure[row][col] = pressure[row][col];
        }
    }
}

export function calculateResiduals() {
    let velResidual = 0, pressResidual = 0, massResidual = 0;
    let count = 0;

    for (let row = 1; row < rows - 1; row++) {
        for (let col = 1; col < cols - 1; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                // velocity residual - L2 norm
                const dvx = velocityX[row][col] - prevVelocityX[row][col];
                const dvy = velocityY[row][col] - prevVelocityY[row][col];
                velResidual += (dvx * dvx + dvy * dvy);

                //Pressure residual
                const dp = pressure[row][col] - prevPressure[row][col];
                pressResidual += dp * dp;

                //Mass conversation residual - continuity equation
                const rho = density[row][col];
                const rho_left = density[row][col - 1];
                const rho_right = density[row][col + 1];
                const rho_up = density[row - 1][col];
                const rho_down = density[row + 1][col];
                
                const vx_left = velocityX[row][col - 1];
                const vx_right = velocityX[row][col + 1];
                const vy_up = velocityY[row - 1][col];
                const vy_down = velocityY[row + 1][col];

                // continuity: d(rho*u)/dx + d(rho*v)/dy = 0
                const drhoDx = (rho_right * vx_right - rho_left * vx_left) / (2 * cellWidth);
                const drhoDy = (rho_down * vy_down - rho_up * vy_up) / (2 * cellHeight);
                const massRes = Math.abs(drhoDx + drhoDy);
                massResidual += massRes * massRes;

                count++;
            }
        }
    }

    //normalize and take sqrt for L2 norm
    return { 
        velocity: Math.sqrt(velResidual / Math.max(count, 1)),
        pressure: Math.sqrt(pressResidual / Math.max(count, 1)), 
        mass: Math.sqrt(massResidual / Math.max(count, 1)) 
    };
}

export function updateConvergenceHistory(residuals) {
    const history = convergenceHistory;

    history.velocity.push(residuals.velocity);
    history.pressure.push(residuals.pressure);
    history.mass.push(residuals.mass);

    //limit history size
    if (history.velocity.length > history.maxHistory) {
        history.velocity.shift();
        history.pressure.shift();
        history.mass.shift();
    }
}

export function checkConvergence(residuals) {
    const velConverged = residuals.velocity < convergenceTolerances.velocity;
    const pressConverged = residuals.pressure < convergenceTolerances.pressure;
    const massConverged = residuals.mass < convergenceTolerances.mass;
    return velConverged && pressConverged && massConverged;
}