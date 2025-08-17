// import { velocityX, velocityY, pressure, density, temperature,
//         rows, cols, cellWidth, cellHeight, isInside, isBoundary,
//         totalIterations, controlPoints, scaleY, wallAngleTop,
//         wallAngleBottom } from './state.js';
// import { calculateArtificialViscosity } from './stability.js';

import { calculateResiduals, checkConvergence, storePreviousIteration, 
        updateConvergenceHistory } from './convergence.js';

import { updateSimulationStatus, updateConvergenceDisplay } from './loop.js';

// import { getLocalRadius, getWallY } from '../geometry/nozzleGeometry.js';
import { simulation } from './state.js';

let simulationData = null;

export function setSimulationDataForPhysics(data) {
    simulationData = data;
}

// Simplified flow update for initial testing
export function updateFlowStabilized() {
    if (simulation.state !== 'running' || !simulationData) {
        return false;
    }

    // Store previous iteration values
    storePreviousIteration();

    // Simple flow update - just for testing visualization
    // This is a placeholder - replace with your actual physics
    const rows = simulationData.rows;
    const cols = simulationData.cols;
    
    // Initialize arrays if they don't exist
    if (!simulationData.velocityX || simulationData.velocityX.length === 0) {
        simulationData.velocityX = Array.from({ length: rows }, () => Array(cols).fill(0));
        simulationData.velocityY = Array.from({ length: rows }, () => Array(cols).fill(0));
        simulationData.pressure = Array.from({ length: rows }, () => Array(cols).fill(101325));
        simulationData.temperature = Array.from({ length: rows }, () => Array(cols).fill(300));
        simulationData.density = Array.from({ length: rows }, () => Array(cols).fill(1.225));
    }

    // Simple test: gradually increase velocity in flow domain
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (simulationData.isInside[row][col] && !simulationData.isBoundary[row][col]) {
                // Simple linear velocity profile for testing
                const progress = col / (cols - 1);
                simulationData.velocityX[row][col] = 50 + progress * 100; // 50-150 m/s range
                simulationData.velocityY[row][col] = Math.sin(progress * Math.PI) * 10; // slight y-component
                simulationData.pressure[row][col] = 101325 * (1 - progress * 0.3); // pressure drop
                simulationData.temperature[row][col] = 300 - progress * 50; // temperature drop
                simulationData.density[row][col] = 1.225 * (1 - progress * 0.2); // density drop
            }
        }
    }

    // Calculate residuals (this will use the simplified arrays)
    const residuals = calculateResiduals();
    updateConvergenceHistory(residuals);
    updateConvergenceDisplay(residuals);

    // For testing, just run a few iterations then "converge"
    if (simulation.totalIterations > 50) {
        updateSimulationStatus('converged');
        return false; // Stop iterating
    }

    simulation.totalIterations++;
    return true; // Continue iterating
}

// //noting that this is a "stabilized" simulation
// export function updateFlowStabilized() {
//     if (simulation.state !== 'running') return false;

//     storePreviousIteration();

//     const gamma = 1.4;
//     const P_inlet = 3.0;
//     const V_inlet = 0.8;
//     const T_inlet = 2.0;
//     const rho_inlet = 1.5;
//     const relaxationVel = 0.15;
//     const relaxationThermo = 0.05;
    
//     //Adaptive time stepping - incorporates CFL condition
//     const maxVel = Math.max(...velocityX.flat(), ...velocityY.flat());
//     const cfl = 0.5; // CFL number - generally taken as 0.5, up to 0.9
//     const dt = Math.min(0.001, cfl * Math.min(cellWidth, cellHeight) / Math.max(maxVel, 1.0));

//     //temporary arrays for smooth updates
//     const newVx  = velocityX.map(row => [...row]);
//     const newVy  = velocityY.map(row => [...row]);
//     const newP   = pressure.map(row => [...row]);
//     const newRho = density.map(row => [...row]);
//     const newT = temperature.map(row => [...row]);

//     //Apply inlet boundary conditions
//     for (let row = 0; row < rows; row++) {
//         for (let col = 0; col < 4; col++) {
//             if (isInside[row][col] && !isBoundary[row][col]) {
//                 newVx[row][col] = V_inlet;
//                 newVy[row][col] = 0.0;
//                 newP[row][col] = P_inlet;
//                 newRho[row][col] = rho_inlet;
//                 newT[row][col] = T_inlet;
//             }
//         }
//     }
    
//     //update interior points, using central diff for sub, upwind for supersonic
//     for (let row = 2; row < rows - 2; row++) {
//         for (let col = 3; col < cols - 3; col++) {
//             if (!isInside[row][col] || isBoundary[row][col]) continue;

//             const xCanvas = col * cellWidth + cellWidth / 2;
//             const yCanvas = row * cellHeight + cellHeight / 2;

//             //current properties
//             const rho = density[row][col];
//             const vx = velocityX[row][col];
//             const vy = velocityY[row][col];
//             const p = pressure[row][col];

//             //local speed of sound
//             const c = Math.sqrt(gamma * p / rho);
//             const mach = Math.sqrt(vx * vx + vy * vy) / c;
            
//             //derivatives
//             let dpDx, dpDy, dvxDx, dvxDy, dvyDx, dvyDy;

//             //subsonic flow
//             if (mach < 0.8) {
//                 //central difference
//                 dpDx = (pressure[row][col + 1] - pressure[row][col - 1]) / (2 * cellWidth);
//                 dpDy = (pressure[row + 1][col] - pressure[row - 1][col]) / (2 * cellHeight);
//                 dvxDx = (velocityX[row][col + 1] - velocityX[row][col - 1]) / (2 * cellWidth);
//                 dvxDy = (velocityX[row + 1][col] - velocityX[row - 1][col]) / (2 * cellHeight);
//                 dvyDx = (velocityY[row][col + 1] - velocityY[row][col - 1]) / (2 * cellWidth);
//                 dvyDy = (velocityY[row + 1][col] - velocityY[row - 1][col]) / (2 * cellHeight);
//             } else {
//                 //supersonic flow - upwind scheme
//                 if (vx > 0) {
//                     dpDx = (pressure[row][col] - pressure[row][col - 1]) / cellWidth;
//                     dvxDx = (velocityX[row][col] - velocityX[row][col - 1]) / cellWidth;
//                     dvyDx = (velocityY[row][col] - velocityY[row][col - 1]) / cellWidth;
//                 } else {
//                     dpDx = (pressure[row][col + 1] - pressure[row][col]) / cellWidth;
//                     dvxDx = (velocityX[row][col + 1] - velocityX[row][col]) / cellWidth;
//                     dvyDx = (velocityY[row][col + 1] - velocityY[row][col]) / cellWidth;
//                 }

//                 if (vy > 0) {
//                     dpDy = (pressure[row][col] - pressure[row - 1][col]) / cellHeight;
//                     dvxDy = (velocityX[row][col] - velocityX[row - 1][col]) / cellHeight;
//                     dvyDy = (velocityY[row][col] - velocityY[row - 1][col]) / cellHeight;
//                 } else {
//                     dpDy = (pressure[row + 1][col] - pressure[row][col]) / cellHeight;
//                     dvxDy = (velocityX[row + 1][col] - velocityX[row][col]) / cellHeight;
//                     dvyDy = (velocityY[row + 1][col] - velocityY[row][col]) / cellHeight;
//                 }
//             }

//             //artificial viscosity for stability
//             const artificialViscosity = calculateArtificialViscosity(row, col, mach, rho);
    
//             //wall influence
//             const centerY = canvas.height / 2;
//             const localRadius = getLocalRadius(xCanvas);
//             const throatRadius = controlPoints.throat_radius * scaleY;
//             const wallAngle = yCanvas < centerY ? wallAngleTop[col] : wallAngleBottom[col];

//             //expansion effects
//             let expansionFactorY = 0;
//             if (localRadius > throatRadius * 1.1) {
//                 const distFromCenter = Math.abs(yCanvas - centerY);
//                 const radialPosition = distFromCenter / localRadius;
//                 const wallGradient = Math.sin(wallAngle);
//                 expansionFactorY = wallGradient * vx * radialPosition * 0.05;
//                 if (yCanvas > centerY) expansionFactorY = -expansionFactorY;
//             }

//             //momentum equations
//             const convectiveX = vx * dvyDx + vy * dvxDy;
//             const convectiveY = vx * dvxDx + vy * dvyDy;
//             const accelerationX = -dpDx / Math.max(rho, 0.5) - convectiveX * 0.2 + artificialViscosity.x;
//             const accelerationY = -dpDy / Math.max(rho, 0.5) - convectiveY * 0.2 + expansionFactorY + artificialViscosity.y;


//             // Clamp acceleration, necessary for stability
//             const maxAccel = 0.5 * c / dt; // scaled by local speed of sound
//             const accelX = Math.max(-maxAccel, Math.min(maxAccel, accelerationX));
//             const accelY = Math.max(-maxAccel, Math.min(maxAccel, accelerationY));

//             //update velocities
//             newVx[row][col] = vx + accelX * dt;
//             newVy[row][col] = vy + accelY * dt;

//             //apply limits
//             newVx[row][col] = Math.max(0.01, Math.min(maxVx, newVx[row][col]));
//             newVy[row][col] = Math.max(-maxVy, Math.min(maxVy, newVy[row][col]));
            
//             //pressure update isentropic equation
//             const speedSq = newVx[row][col] ** 2 + newVy[row][col] ** 2;
//             const oldSpeedSq = vx ** 2 + vy ** 2;
//             const totalEnthalpy = gamma / (gamma - 1) * p / rho + 0.5 * oldSpeedSq;
//             const newSpeedSq = Math.min(speedSq, 2 * totalEnthalpy * (gamma - 1) / gamma);

//             const R = 1; // gas constant normalized because I don't have units yet

//             const newStaticEnthalpy = totalEnthalpy - 0.5 * newSpeedSq;
//             newT[row][col] = Math.max(0.1, newStaticEnthalpy * (gamma - 1) / gamma);
//             newP[row][col] = Math.max(0.05, rho * R * newT[row][col]);

//             //Isentropic density update
//             const pressureRatio = Math.min(5.0, Math.max(0.01, newP[row][col] / P_inlet));
//             newRho[row][col] = Math.max(0.1, rho_inlet * Math.pow(pressureRatio, 1 / gamma));

//             //limits
//             newT[row][col] = Math.min(3.0, Math.max(0.1, newT[row][col]));
//             newP[row][col] = Math.min(4.0, Math.max(0.05, newP[row][col]));
//             newRho[row][col] = Math.min(2.0, Math.max(0.1, newRho[row][col]));
//         }
//     }
            
//     //wall boundary conditions      
//     for (let row = 0; row < rows; row++) {
//         for (let col = 0; col < cols; col++) {
//             if (!isBoundary[row][col]) continue;

//             const yCanvas = row * cellHeight + cellHeight / 2;
//             const xCanvas = col * cellWidth + cellWidth / 2;
                    
//             //calculate distance to nearest wall
//             const topWallY = getWallY(xCanvas, true);
//             const bottomWallY = getWallY(xCanvas, false);
//             const distToTopWall = Math.abs(yCanvas - topWallY);
//             const distToBottomWall = Math.abs(yCanvas - bottomWallY);
//             const minDistToWall = Math.min(distToTopWall, distToBottomWall);
                    
//             //boundary layer thickness
//             const boundaryThickness = Math.max(cellWidth, cellHeight) * 1.5;
//             const wallDistance = Math.min(1.0, minDistToWall / boundaryThickness);
                    
//             //reference values from nearby interior points
//             let refVx = V_inlet, refVy = 0, refP = P_inlet, refRho = rho_inlet, refT = T_inlet;
//             let foundRef = false;
                    
//             //look for stable interior reference
//             for (let searchRadius = 2; searchRadius <= 6 && !foundRef; searchRadius++) {
//                 for (let dr = -searchRadius; dr <= searchRadius && !foundRef; dr++) {
//                     for (let dc = -searchRadius; dc <= searchRadius && !foundRef; dc++) {
//                         const nr = row + dr;
//                         const nc = col + dc;

//                         if (
//                             nr >= 0 && nr < rows && 
//                             nc >= 0 && nc < cols && 
//                             isInside[nr][nc] && 
//                             !isBoundary[nr][nc]
//                         ) { 
//                             refVx = velocityX[nr][nc]; 
//                             refVy = velocityY[nr][nc]; 
//                             refP = pressure[nr][nc];   
//                             refRho = density[nr][nc];
//                             refT = temperature[nr][nc];    
//                             foundRef = true;
//                         } 
//                     } 
//                 }
//             }
                    
//             if (foundRef) {   
//                 const velocityFactor = Math.pow(wallDistance, 0.3);

//                 newVx[row][col] = refVx * velocityFactor;     
//                 newVy[row][col] = refVy * velocityFactor * 0.7;
                        
//                 //properties remian continuous     
//                 newP[row][col] = refP;      
//                 newRho[row][col] = refRho;     
//                 newT[row][col] = refT;     
//             }   
//         }   
//     }

//     //exit boundary conditions
//     for (let row = 0; row < rows; row++) {
//         for (let col = cols - 4; col < cols; col++) {
//             if (isInside[row][col] && !isBoundary[row][col]) {
//                 //extrapolate from interior
//                 const gradient = (velocityX[row][col] - velocityX[row][col - 1]) / cellWidth;

//                 newVx[row][col] = Math.max(velocityX[row][col], velocityX[row][col] + gradient * cellWidth);
//                 newVy[row][col] = velocityY[row][col];
//                 newP[row][col] = Math.max(0.01, pressure[row][col] * .98);
//                 newRho[row][col] = density[row][col] * .99;
//                 newT[row][col] = temperature[row][col];
//             }
//         }
//     }

//     //Apply under-relaxation for stability 
//     for (let row = 0; row < rows; row++) {
//         for (let col = 0; col < cols; col++) {
//             if (!isInside[row][col]) continue;
//             velocityX[row][col] = relaxationVel * newVx[row][col] + (1 - relaxationVel) * velocityX[row][col];
//             velocityY[row][col] = relaxationVel * newVy[row][col] + (1 - relaxationVel) * velocityY[row][col];
//             pressure[row][col] = relaxationThermo * newP[row][col] + (1 - relaxationThermo) * pressure[row][col];
//             density[row][col] = relaxationThermo * newRho[row][col] + (1 - relaxationThermo) * density[row][col];
//             temperature[row][col] = relaxationThermo * newT[row][col] + (1 - relaxationThermo) * temperature[row][col];
//         }
//     }

//     //calculate residuals and check convergence
//     const residuals = calculateResiduals();
//     updateConvergenceHistory(residuals);
//     updateConvergenceDisplay(residuals);

//     //check for convergence
//     if (checkConvergence(residuals)) {
//         updateSimulationStatus('converged');
//         return false; //stop iterating
//     }

//     totalIterations++;
//     return true; // continue iterating
// }