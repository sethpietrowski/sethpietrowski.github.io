import { simulation, convergenceHistory, convergenceTolerances } from './core.js';
import { getLocalRadius, getWallY } from './geometry.js';

//flow initialization
export function initializeFlow(simulationData) {
    const { rows, cols, isInside, isBoundary } = simulationData;

    //inlet conditions
    const P_inlet = 300000; //kpa
    const V_inlet = 100;    // m/s
    const T_inlet = 300;    // K
    const R = 287;          // J/kg*K (air)
    const rho_inlet = P_inlet / (R * T_inlet);  // kg/m^3

    console.log('Initializing flow field...');

    //initialize interior cells with basic flow profile
    for (let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if (isInside[row][col]) {
                //linear interpolation from inlet to exit
                const progress = col / (cols - 1);
                simulationData.velocityX[row][col] = V_inlet * (1 + progress * 1.0);
                simulationData.velocityY[row][col] = 0.0;
                simulationData.pressure[row][col] = P_inlet * (1 - progress * 0.5);
                simulationData.temperature[row][col] = T_inlet * (1 - progress * 0.15);
                simulationData.density[row][col] = simulationData.pressure[row][col] / (R * simulationData.temperature[row][col]);
            
                //boundary cells set to no-slip
                if (isBoundary[row][col]) {
                    simulationData.velocityX[row][col] = 0.0;
                    simulationData.velocityY[row][col] = 0.0;
                }
            }
        }
    }

    console.log('Flow field initialized.');
}

//previous iteration storage

let prevVelocityX = [];
let prevVelocityY = [];
let prevPressure = [];
let prevTemperature = [];
let prevDensity = [];

function initializePreviousArrays(rows, cols) {
    if (prevVelocityX.length ===0) {
        prevVelocityX = Array.from({ length: rows }, () => Array(cols).fill(0));
        prevVelocityY = Array.from({ length: rows }, () => Array(cols).fill(0));
        prevPressure = Array.from({ length: rows }, () => Array(cols).fill(0));
    }
}

function storePreviousIteration(simulationData) {
    const { rows, cols, velocityX, velocityY, pressure } = simulationData;

    initializePreviousArrays(rows, cols);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            prevVelocityX[row][col] = velocityX[row][col];
            prevVelocityY[row][col] = velocityY[row][col];
            prevPressure[row][col] = pressure[row][col];
        }
    }
}

export function calculateArtificialViscosity(row, col, mach, rho, simulationData) {
    const { velocityX, velocityY, cellWidth, cellHeight, rows, cols } = simulationData;
    
    const C2 = 0.1; // artificial viscocity coefficient

    let viscosityX = 0, viscosityY = 0;

    if (mach > 0.3) { //artificial viscosity  added in transsonic+ region
        if (col > 0 && col < cols - 1) {
            const divergenceX = velocityX[row][col + 1] - velocityX[row][col - 1];
            viscosityX = -C2 * rho * Math.abs(divergenceX) * divergenceX / (2 * cellWidth);
        }

        if (row > 0 && row < rows - 1) {
            const divergenceY = velocityY[row + 1][col] - velocityY[row - 1][col];
            viscosityY = -C2 * rho * Math.abs(divergenceY) * divergenceY / (2 * cellWidth);
        }
    }

    return { x: viscosityX, y: viscosityY };
}

// should reintegrate von neumann-richtmyer artif viscos & cent diff if more acc
//
//     //velocity gradients (central difference)
//     const dvxDx = (velocityX[row][col + 1] - velocityX[row][col - 1]) / (2 * cellWidth);
//     const dvxDy = (velocityX[row + 1][col] - velocityX[row - 1][col]) / (2 * cellHeight);
//     const dvyDx = (velocityY[row][col + 1] - velocityY[row][col - 1]) / (2 * cellWidth);
//     const dvyDy = (velocityY[row + 1][col] - velocityY[row - 1][col]) / (2 * cellHeight);

//     //Von Neumann-Richtmyer artificial viscosity
//     const C1 = 0.1, C2 = 0.2;
//     const divergence = dvxDx + dvyDy;

//     if (divergence < 0) { //compression
//         const viscosity = -(C1 * Math.abs(divergence) + C2 * divergence * divergence) * 
//                          rho * Math.min(cellWidth, cellHeight);
//         return { 
//             x: viscosity * dvxDx, 
//             y: viscosity * dvyDy 
//         };
//     }
//     return { x: 0, y: 0 };
// }


function calculateResiduals(simulationData) {
    const { rows, cols, isInside, isBoundary, velocityX, velocityY, pressure, density, cellWidth, cellHeight } = simulationData;

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
                const rho_left = density[row][col - 1] || rho;
                const rho_right = density[row][col + 1] || rho;
                const rho_up = density[row - 1][col] || rho;
                const rho_down = density[row + 1][col] || rho;

                const vx_left = velocityX[row][col - 1] || velocityX[row][col];
                const vx_right = velocityX[row][col + 1] || velocityX[row][col];
                const vy_up = velocityY[row - 1][col] || velocityY[row][col];
                const vy_down = velocityY[row + 1][col] || velocityY[row][col];

                //continuity - d(rho*u)/dx + d(rho*v)/dy = 0
                const drhoDx = (rho_right * vx_right - rho_left * vx_left) / (2 * cellWidth);
                const drhoDy = (rho_down * vy_down - rho_up * vy_up) / (2 * cellHeight);
                const massRes = Math.abs(drhoDx + drhoDy);
                massResidual += massRes * massRes;

                count++;
            }
        }
    }

    return {
        velocity: Math.sqrt(velResidual / Math.max(count, 1)),
        pressure: Math.sqrt(pressResidual / Math.max(count, 1)),
        mass: Math.sqrt(massResidual / Math.max(count, 1))
    };
}

//convergence checking 

function updateConvergenceHistory(residuals) {
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

function checkConvergence(residuals) {
    const velConverged = residuals.velocity < convergenceTolerances.velocity;
    const pressConverged = residuals.pressure < convergenceTolerances.pressure;
    const massConverged = residuals.mass < convergenceTolerances.mass;
    return velConverged && pressConverged && massConverged;
}

//main Physics update function

/**
 * Update flow field
 * @param {object} simulationData - Main simulation data object
 * @returns {boolean} True to continue iteration, false if converged
 */

export function updateFlowStabilized(simulationData) {
    if (simulation.state !== 'running' || !simulationData) {
        return false;
    }

    // Store previous iteration values
    storePreviousIteration(simulationData);

    const gamma = 1.4; //air
    const R = 287; //air (J/kg*K)
    const P_inlet = 300000; //Pa
    const V_inlet = 100; //m/s
    const T_inlet = 300; //K
    const rho_inlet = 3.5 // kg/m3
    const relaxationVel = 0.15;
    const relaxationThermo = 0.05;

    //simple flow update to be replaced
    const { rows, cols, cellWidth, cellHeight, isInside, isBoundary,
            velocityX, velocityY, pressure, density, temperature,
            controlPoints, scaleY, canvasHeight, wallAngleTop, wallAngleBottom } = simulationData;

    //adaptive time stepping with CFL condition
    let maxVel = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (isInside[row][col]) {
                const vel = Math.sqrt(velocityX[row][col]**2 + velocityY[row][col]**2);
                maxVel = Math.max(maxVel, vel);
            }
        }
    }

    const cfl = 0.5;
    const dt = Math.min(0.0001, cfl * Math.min(cellWidth, cellHeight) / Math.max(maxVel, 1.0));

    //temporary arrays for updates
    const newVx  = velocityX.map(row => [...row]);
    const newVy  = velocityY.map(row => [...row]);
    const newP   = pressure.map(row => [...row]);
    const newRho = density.map(row => [...row]);
    const newT = temperature.map(row => [...row]);


    //Apply inlet boundary conditions
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 4; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                newVx[row][col] = V_inlet;
                newVy[row][col] = 0.0;
                newP[row][col] = P_inlet;
                newRho[row][col] = rho_inlet;
                newT[row][col] = T_inlet;
            }
        }
    }
    
    //update interior points, using central diff for sub, upwind for supersonic
    for (let row = 2; row < rows - 2; row++) {
        for (let col = 3; col < cols - 3; col++) {
            if (!isInside[row][col] || isBoundary[row][col]) continue;

            const xCanvas = col * cellWidth + cellWidth / 2;
            const yCanvas = row * cellHeight + cellHeight / 2;

            //current properties
            const rho = density[row][col];
            const vx = velocityX[row][col];
            const vy = velocityY[row][col];
            const p = pressure[row][col];

            //local speed of sound
            const c = Math.sqrt(gamma * p / rho);
            const mach = Math.sqrt(vx * vx + vy * vy) / c;
            
            //derivatives
            let dpDx, dpDy, dvxDx, dvxDy, dvyDx, dvyDy;

            //subsonic flow
            if (mach < 0.8) {
                //central difference
                dpDx = (pressure[row][col + 1] - pressure[row][col - 1]) / (2 * cellWidth);
                dpDy = (pressure[row + 1][col] - pressure[row - 1][col]) / (2 * cellHeight);
                dvxDx = (velocityX[row][col + 1] - velocityX[row][col - 1]) / (2 * cellWidth);
                dvxDy = (velocityX[row + 1][col] - velocityX[row - 1][col]) / (2 * cellHeight);
                dvyDx = (velocityY[row][col + 1] - velocityY[row][col - 1]) / (2 * cellWidth);
                dvyDy = (velocityY[row + 1][col] - velocityY[row - 1][col]) / (2 * cellHeight);
            } else {
                //supersonic flow - upwind scheme
                if (vx > 0) {
                    dpDx = (pressure[row][col] - pressure[row][col - 1]) / cellWidth;
                    dvxDx = (velocityX[row][col] - velocityX[row][col - 1]) / cellWidth;
                    dvyDx = (velocityY[row][col] - velocityY[row][col - 1]) / cellWidth;
                } else {
                    dpDx = (pressure[row][col + 1] - pressure[row][col]) / cellWidth;
                    dvxDx = (velocityX[row][col + 1] - velocityX[row][col]) / cellWidth;
                    dvyDx = (velocityY[row][col + 1] - velocityY[row][col]) / cellWidth;
                }

                if (vy > 0) {
                    dpDy = (pressure[row][col] - pressure[row - 1][col]) / cellHeight;
                    dvxDy = (velocityX[row][col] - velocityX[row - 1][col]) / cellHeight;
                    dvyDy = (velocityY[row][col] - velocityY[row - 1][col]) / cellHeight;
                } else {
                    dpDy = (pressure[row + 1][col] - pressure[row][col]) / cellHeight;
                    dvxDy = (velocityX[row + 1][col] - velocityX[row][col]) / cellHeight;
                    dvyDy = (velocityY[row + 1][col] - velocityY[row][col]) / cellHeight;
                }
            }

            //artificial viscosity for stability
            const artificialViscosity = calculateArtificialViscosity(row, col, mach, rho, simulationData);
    
            //wall influence
            const centerY = canvasHeight / 2;
            const localRadius = getLocalRadius(xCanvas, controlPoints, scaleY, canvasHeight);
            const throatRadius = controlPoints.throat_radius * scaleY;
            const wallAngle = yCanvas < centerY ? (wallAngleTop ? wallAngleTop[col] : 0) : (wallAngleBottom ? wallAngleBottom [col] : 0);

            //expansion effects
            let expansionFactorY = 0;
            if (localRadius > throatRadius * 1.1) {
                const distFromCenter = Math.abs(yCanvas - centerY);
                const radialPosition = distFromCenter / localRadius;
                const wallGradient = Math.sin(wallAngle);
                expansionFactorY = wallGradient * vx * radialPosition * 0.05;
                if (yCanvas > centerY) expansionFactorY = -expansionFactorY;
            }

            //momentum equations - navier-stokes
            const convectiveX = vx * dvyDx + vy * dvxDy;
            const convectiveY = vx * dvxDx + vy * dvyDy;
            const accelerationX = -dpDx / Math.max(rho, 0.5) - convectiveX * 0.2 + artificialViscosity.x;
            const accelerationY = -dpDy / Math.max(rho, 0.5) - convectiveY * 0.2 + expansionFactorY + artificialViscosity.y;


            // Clamp acceleration, necessary for stability
            const maxAccel = 0.5 * c / dt; // scaled by local speed of sound
            const accelX = Math.max(-maxAccel, Math.min(maxAccel, accelerationX));
            const accelY = Math.max(-maxAccel, Math.min(maxAccel, accelerationY));

            //update velocities
            newVx[row][col] = vx + accelX * dt;
            newVy[row][col] = vy + accelY * dt;

            //apply vel limits
            const maxVx = 800; //m/s
            const maxVy = 200;
            newVx[row][col] = Math.max(0.01, Math.min(maxVx, newVx[row][col]));
            newVy[row][col] = Math.max(-maxVy, Math.min(maxVy, newVy[row][col]));
            
            //pressure update isentropic equation
            const speedSq = newVx[row][col] ** 2 + newVy[row][col] ** 2;
            const oldSpeedSq = vx ** 2 + vy ** 2;
            const totalEnthalpy = gamma / (gamma - 1) * p / rho + 0.5 * oldSpeedSq;
            
            const newStaticEnthalpy = totalEnthalpy - 0.5 * speedSq;
            newT[row][col] = Math.max(0.1, newStaticEnthalpy * (gamma - 1) / gamma);
            newP[row][col] = Math.max(0.05, rho * R * newT[row][col]);

            //Isentropic density update
            const pressureRatio = Math.min(5.0, Math.max(0.01, newP[row][col] / P_inlet));
            newRho[row][col] = Math.max(0.5, rho_inlet * Math.pow(pressureRatio, 1 / gamma));

            //limits
            newT[row][col] = Math.min(500, Math.max(200, newT[row][col]));
            newP[row][col] = Math.min(500000, Math.max(50000, newP[row][col]));
            newRho[row][col] = Math.min(5.0, Math.max(0.5, newRho[row][col]));
        }
    }
            
    //wall boundary conditions with boundary layer effects      
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isBoundary[row][col]) continue;

            const yCanvas = row * cellHeight + cellHeight / 2;
            const xCanvas = col * cellWidth + cellWidth / 2;

            //nearest interior ref point
            let refVx = V_inlet, refVy = 0, refP = P_inlet, refRho = rho_inlet, refT = T_inlet;
            let foundRef = false;
                  
            for (let searchRadius = 2; searchRadius <= 6 && !foundRef; searchRadius++) {
                for (let dr = -searchRadius; dr <= searchRadius && !foundRef; dr++) {
                    for (let dc = -searchRadius; dc <= searchRadius && !foundRef; dc++) {
                        const nr = row + dr;
                        const nc = col + dc;

                        if (
                            nr >= 0 && nr < rows && 
                            nc >= 0 && nc < cols && 
                            isInside[nr][nc] && 
                            !isBoundary[nr][nc]
                        ) { 
                            refVx = velocityX[nr][nc]; 
                            refVy = velocityY[nr][nc]; 
                            refP = pressure[nr][nc];   
                            refRho = density[nr][nc];
                            refT = temperature[nr][nc];    
                            foundRef = true;
                        } 
                    } 
                }
            }

            if (foundRef) {
                //wall distance and boundary layer effects
                const topWallY = getWallY(xCanvas, true, controlPoints, scaleY, canvasHeight);
                const bottomWallY = getWallY(xCanvas, false, controlPoints, scaleY, canvasHeight);
                const distToTopWall = Math.abs(yCanvas - topWallY);
                const distToBottomWall = Math.abs(yCanvas - bottomWallY);
                const minDistToWall = Math.min(distToTopWall, distToBottomWall);
                
                const boundaryThickness = Math.max(cellWidth, cellHeight,) * 1.5;
                const wallDistance = Math.min(1.0, minDistToWall  /boundaryThickness);
                const velocityFactor = Math.pow(wallDistance, 0.3);

                newVx[row][col] = refVx * velocityFactor;     
                newVy[row][col] = refVy * velocityFactor * 0.7;     
                newP[row][col] = refP;      
                newRho[row][col] = refRho;     
                newT[row][col] = refT;     
            }         
        }   
    }

    //exit boundary conditions
    for (let row = 0; row < rows; row++) {
        for (let col = cols - 4; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                const gradient = col > 0 ? (velocityX[row][col] - velocityX[row][col - 1]) / cellWidth : 0;

                newVx[row][col] = Math.max(velocityX[row][col], velocityX[row][col] + gradient * cellWidth);
                newVy[row][col] = velocityY[row][col];
                newP[row][col] = Math.max(50000, pressure[row][col] * .98);
                newRho[row][col] = density[row][col] * .99;
                newT[row][col] = temperature[row][col];
            }
        }
    }

    //Apply under-relaxation for stability 
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;
            velocityX[row][col] = relaxationVel * newVx[row][col] + (1 - relaxationVel) * velocityX[row][col];
            velocityY[row][col] = relaxationVel * newVy[row][col] + (1 - relaxationVel) * velocityY[row][col];
            pressure[row][col] = relaxationThermo * newP[row][col] + (1 - relaxationThermo) * pressure[row][col];
            density[row][col] = relaxationThermo * newRho[row][col] + (1 - relaxationThermo) * density[row][col];
            temperature[row][col] = relaxationThermo * newT[row][col] + (1 - relaxationThermo) * temperature[row][col];
        }
    }

    //calculate residuals and check convergence
    const residuals = calculateResiduals(simulationData);
    updateConvergenceHistory(residuals);

    //check for convergence
    if (checkConvergence(residuals)) {
        updateSimulationStatus('converged');
        return false; //stop iterating
    }

    simulation.totalIterations++;

    //max to prevent infinite loop
    if (simulation.totalIterations > 10000) {
        console.log('Maximum iterations reached');
        return false;
    }

    return true; // continue iterating
}

//export residual functions for UI

export function getLatestResiduals(simulationData) {
    return calculateResiduals(simulationData);
}

export function isConverged(simulationData) {
    const residuals = calculateResiduals(simulationData);
    return checkConvergence(residuals);
}

