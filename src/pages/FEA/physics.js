import { simulation, convergenceHistory, convergenceTolerances } from './core.js';
import { getLocalRadius, getWallY } from './geometry.js';

//flow initialization
export function initializeFlow(simulationData) {
    const { rows, cols, isInside, isBoundary } = simulationData;

    //inlet conditions
    const P_inlet = 300000; //pa
    const V_inlet = 100;    // m/s
    const T_inlet = 300;    // K
    const R = 287;          // J/kg*K (air)
    const gamma = 1.4;      //air
    const rho_inlet = P_inlet / (R * T_inlet);  // kg/m^3

    console.log('Initializing flow field...');

    //initialize interior cells with basic flow profile
    for (let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if (isInside[row][col]) {
                //linear interpolation from inlet to exit
                const progress = col / (cols - 1);

                //isentropic relations
                const pressureRatio = 1 - progress * 0.4; //drop pressure through nozzle
                simulationData.pressure[row][col] = P_inlet * pressureRatio;

                // T/T0 = (P/P0)^((gamma-1)/gamma)
                const tempRatio = Math.pow(pressureRatio, (gamma - 1) / gamma);
                simulationData.temperature[row][col] = T_inlet * tempRatio;

                simulationData.density[row][col] = simulationData.pressure[row][col] / (R * simulationData.temperature[row][col]);
            
                //energy conservation: h0 = h + V^2/2
                const h0 = (gamma / (gamma - 1)) * R * T_inlet;
                const h = (gamma / (gamma - 1)) * R * simulationData.temperature[row][col];
                const velocityMagnitude = Math.sqrt(Math.max(0, 2 * (h0 - h)));

                simulationData.velocityX[row][col] = velocityMagnitude;
                simulationData.velocityY[row][col] = 0.0;
                
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
        prevDensity = Array.from({ length: rows }, () => Array(cols).fill(0));
        prevTemperature = Array.from({ length: rows }, () => Array(cols).fill(0));
    }
}

function storePreviousIteration(simulationData) {
    const { rows, cols, velocityX, velocityY, pressure, density, temperature } = simulationData;

    initializePreviousArrays(rows, cols);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            prevVelocityX[row][col] = velocityX[row][col];
            prevVelocityY[row][col] = velocityY[row][col];
            prevPressure[row][col] = pressure[row][col];
            prevDensity[row][col] = density[row][col];
            prevTemperature[row][col] = temperature[row][col];
        }
    }
}

function calculateResiduals(simulationData) {
    const { rows, cols, isInside, isBoundary, velocityX, velocityY, pressure, density, temperature, cellWidth, cellHeight } = simulationData;

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
                const rhoVx_left = density[row][col - 1] * velocityX[row][col - 1];
                const rhoVx_right = density[row][col + 1] * velocityX[row][col + 1];
                const rhoVx_up = density[row - 1][col] * velocityY[row - 1][col];
                const rhoVx_down = density[row + 1][col] * velocityY[row + 1][col];

                const massFlux = (rhoVx_right - rhoVx_left) / (2 * cellWidth) + (rhoVx_down - rhoVx_up) / (2 * cellHeight);
                massResidual += massFlux * massFlux;

                count++;
            }
        }
    }

    const result =  {
        velocity: Math.sqrt(velResidual / Math.max(count, 1)),
        pressure: Math.sqrt(pressResidual / Math.max(count, 1)),
        mass: Math.sqrt(massResidual / Math.max(count, 1))
    };

    if (simulation.totalIterations % 100 === 0) {
        console.log(`Iteration ${simulation.totalIterations} Residuals:`, result);
    }

    return result;
}

//convergence checking 

function updateConvergenceHistory(residuals) {
    convergenceHistory.velocity.push(residuals.velocity);
    convergenceHistory.pressure.push(residuals.pressure);
    convergenceHistory.mass.push(residuals.mass);

    //limit history size
    if (convergenceHistory.velocity.length > convergenceHistory.maxHistory) {
        convergenceHistory.velocity.shift();
        convergenceHistory.pressure.shift();
        convergenceHistory.mass.shift();
    }
}

function checkConvergence(residuals) {
    return residuals.velocity < convergenceTolerances.velocity && 
           residuals.pressure < convergenceTolerances.pressure && 
           residuals.mass < convergenceTolerances.mass;
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

    //intialize arrays on first call
    if (prevVelocityX.length === 0) {
        initializePreviousArrays(simulationData.rows, simulationData.cols);
        //copy current vals to previous on first iteration
        for (let row = 0; row < simulationData.rows; row++) {
            for (let col = 0; col < simulationData.cols; col++) {
                prevVelocityX[row][col] = simulationData.velocityX[row][col];
                prevVelocityY[row][col] = simulationData.velocityY[row][col];
                prevPressure[row][col] = simulationData.pressure[row][col];
                prevDensity[row][col] = simulationData.density[row][col];
                prevTemperature[row][col] = simulationData.temperature[row][col];
            }
        }
    }

    // Store previous iteration values
    storePreviousIteration(simulationData);

    const gamma = 1.4; //air
    const R = 287; //air (J/kg*K)
    const P_inlet = 300000; //Pa
    const P_exit = 101325; //Pa, atm
    const V_inlet = 100; //m/s
    const T_inlet = 300; //K
    const rho_inlet = P_inlet / (R * T_inlet) // kg/m3

    const alpha_vel = 0.4;
    const alpha_p = 0.3;
    const alpha_rho = 0.3;
    const alpha_T = 0.3;

    //simple flow update to be replaced
    const { rows, cols, cellWidth, cellHeight, isInside, isBoundary,
            velocityX, velocityY, pressure, density, temperature,
            controlPoints, scaleY, canvasHeight } = simulationData;

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
    const dt = 0.3 * Math.min(cellWidth, cellHeight) / Math.max(maxVel, 10.0);

    //temporary arrays
    const newVx = velocityX.map(row => [...row]);
    const newVy = velocityY.map(row => [...row]);
    const newP = pressure.map(row => [...row]);
    const newRho = density.map(row => [...row]);
    const newT = temperature.map(row => [...row]);
    
    //update interior points, using central diff for sub, upwind for supersonic
    for (let row = 3; row < rows - 3; row++) {
        for (let col = 8; col < cols - 8; col++) {
            if (!isInside[row][col] || isBoundary[row][col]) continue;

            //current properties
            const rho = density[row][col];
            const vx = velocityX[row][col];
            const vy = velocityY[row][col];
            const p = pressure[row][col];
            const T = temperature[row][col];

            //local speed of sound
            const c = Math.sqrt(gamma * p / Math.max(rho, 0.1));
            const mach = Math.sqrt(vx * vx + vy * vy) / c;
            
            //always use central difference for pressure
            const dpDx = (pressure[row][col + 1] - pressure[row][col - 1]) / (2 * cellWidth);
            const dpDy = (pressure[row + 1][col] - pressure[row - 1][col]) / (2 * cellHeight);

            //velocity graidents (central difference)
            const dvxDx = (velocityX[row][col + 1] - velocityX[row][col - 1]) / (2 * cellWidth);
            const dvxDy = (velocityX[row + 1][col] - velocityX[row - 1][col]) / (2 * cellHeight);
            const dvyDx = (velocityY[row][col + 1] - velocityY[row][col - 1]) / (2 * cellWidth);
            const dvyDy = (velocityY[row + 1][col] - velocityY[row - 1][col]) / (2 * cellHeight);

            // Continuity equation: ∂ρ/∂t + ∂(ρu)/∂x + ∂(ρv)/∂y = 0
            const rhoVx_e = 0.5 * (density[row][col] + density[row][col + 1]) * 
                            (velocityX[row][col] + velocityX[row][col + 1]);
            const rhoVx_w = 0.5 * (density[row][col - 1] + density[row][col]) * 
                            (velocityX[row][col - 1] + velocityX[row][col]);
            const rhoVy_s = 0.5 * (density[row][col] + density[row + 1][col]) * 
                            (velocityY[row][col] + velocityY[row + 1][col]);
            const rhoVy_n = 0.5 * (density[row - 1][col] + density[row][col]) * 
                            (velocityY[row - 1][col] + velocityY[row][col]);

            const drho_dt = -(rhoVx_e - rhoVx_w) / cellWidth - (rhoVy_n - rhoVy_s) / cellHeight;

            //Momentum equation: ρ(∂v/∂t) + v·∇v) = -∇p
            const convectiveX = vx * dvxDx + vy * dvxDy;
            const convectiveY = vx * dvyDx + vy * dvyDy;

            const dvx_dt = -convectiveX - dpDx / Math.max(rho, 0.01);
            const dvy_dt = -convectiveY - dpDy / Math.max(rho, 0.01);

            //update density
            newRho[row][col] = rho + drho_dt * dt;
            newRho[row][col] = Math.max(0.1, Math.min(10.0, newRho[row][col]));

            //update velocity
            newVx[row][col] = vx + dvx_dt * dt;
            newVy[row][col] = vy + dvy_dt * dt;
            newVx[row][col] = Math.max(1.0, Math.min(1000, newVx[row][col]));
            newVy[row][col] = Math.max(-300, Math.min(300, newVy[row][col]));

            const cp = gamma * R / (gamma - 1);
            const V_old_sq = vx * vx + vy * vy;
            const V_new_sq = newVx[row][col] ** 2 + newVy[row][col] ** 2;
            const h0 = cp * T + 0.5 * V_old_sq;
            const h_new = h0 - 0.5 * V_new_sq;

            newT[row][col] = h_new / cp;
            newT[row][col] = Math.max(50, Math.min(600, newT[row][col]));

            //ideal gas - P = ρRT
            newP[row][col] = newRho[row][col] * R * newT[row][col];
            newP[row][col] = Math.max(10000, Math.min(1000000, newP[row][col]));
        }
    }

    //inlet boundary conditions
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < 5; col++) {
            if (isInside[row][col]) {
                const blendFactor = col / 5.0;
                newVx[row][col] = V_inlet;
                newVy[row][col] = 0;
                newP[row][col] = P_inlet * (1 - blendFactor) + pressure[row][col] * blendFactor;
                newRho[row][col] = rho_inlet * (1 - blendFactor) + density[row][col] * blendFactor;
                newT[row][col] = T_inlet * (1 - blendFactor) + temperature[row][col] * blendFactor;
            }
        }
    }
    
    const blCells = 2;
    const minRefDist =1e-6;

    //wall boundary conditions with boundary layer effects      
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isBoundary[row][col]) continue;

            //nearest interior ref point
            let refP = P_inlet, refRho = rho_inlet, refT = T_inlet;
            let refVx = V_inlet, refVy = 0;
            let minDist = Infinity;
            let refRow = -1, refCol = -1;
                 
            for (let dr = -3; dr <= 3; dr++) {
                for (let dc = -3; dc <= 3; dc++) {
                    const nr = row + dr;
                    const nc = col + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && 
                        isInside[nr][nc] && !isBoundary[nr][nc]) { 
                        const dist = Math.sqrt(dr*dr + dc*dc);
                        if (dist < minDist) {
                            minDist = dist;
                            refRow = nr;
                            refCol = nc;
                            refVx = velocityX[nr][nc];
                            refVy = velocityY[nr][nc];
                            refP = pressure[nr][nc];   
                            refRho = density[nr][nc];
                            refT = temperature[nr][nc];
                        }
                    } 
                } 
            }

            if (minDist === Infinity || minDist < minRefDist || refRow < 0) {
                const nr = Math.max(0, Math.min(rows-1, row));
                const nc = Math.max(0, Math.min(cols-1, col+1));
                if (isInside[nr][nc] && !isBoundary[nr][nc]) {
                    refRow = nr; refCol = nc;
                    refVx = velocityX[nr][nc];
                    refVy = velocityY[nr][nc];
                    refP = pressure[nr][nc];   
                    refRho = density[nr][nc];
                    refT = temperature[nr][nc];
                }
            }

            // 1) wall cell: no-slip and adiabatic
            newVx[row][col] = 0.0;
            newVy[row][col] = 0.0;
            newT[row][col] = refT;
            newP[row][col] = refP;
            newRho[row][col] = newP[row][col] / (R* newT[row][col]);

            // 2) Ramp into interior across blCells along line from wall cell to ref cell
            if (refRow >= 0) {
                //vector from wall to interior
                const dr = refRow - row;
                const dc = refCol - col;
                const len = Math.sqrt(dr*dr + dc*dc) || 1.0;
                const stepR = dr / len;
                const stepC = dc / len;

                // ramp velocity from 0 at wall to refV at interior over blCells
                for (let k = 1; k <= blCells; k++) {
                    //position along normal direction
                    const rr = Math.round(row + stepR * k);
                    const cc = Math.round(col + stepC * k);
                    if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) break;
                    if (!isInside[rr][cc] || isBoundary[rr][cc]) continue;
                    
                    //scale factor: small near wall, large further away
                    const scale = k / (blCells + 1);
                    //desired damped velocity (linear profile)
                    const desiredVx = refVx * scale;
                    const desiredVy = refVy * scale;
                    //conservative: do not increase vlecoity above what newVx/newVy have - add an upper bound if solver still evolves
                    const blendFactor = 0.3;
                    newVx[rr][cc] = blendFactor * desiredVx + (1 - blendFactor) * newVx[rr][cc];
                    newVy[rr][cc] = blendFactor * desiredVy + (1 - blendFactor) * newVy[rr][cc];

                    // pressure/temp/density: linear interp between wall and ref
                    newP[rr][cc] = (1 - scale) * newP[row][col] + scale * refP;
                    newT[rr][cc] = (1 - scale) * newT[row][col] + scale * refT;
                    newRho[rr][cc] = newP[rr][cc]  /(R * newT[rr][cc]);
                }
            }
        }      
    }  

    //exit boundary conditions
    for (let row = 0; row < rows; row++) {
        for (let col = cols - 2; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                //simple extrapolation
                if (col > 8) {
                    newVx[row][col] = 2 * velocityX[row][col - 1] - velocityX[row][col - 2];
                    newVy[row][col] = 2 * velocityY[row][col - 1] - velocityY[row][col - 2];
                    newT[row][col] = 2 * temperature[row][col - 1] - temperature[row][col - 2];

                    newP[row][col] = P_exit;
                    newRho[row][col] = newP[row][col] / (R * newT[row][col]);
                }
            }
        }
    }

    //apply under-relaxation
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;

            velocityX[row][col] = alpha_vel * newVx[row][col] + (1 - alpha_vel) * velocityX[row][col];
            velocityY[row][col] = alpha_vel * newVy[row][col] + (1 - alpha_vel) * velocityY[row][col];
            pressure[row][col] = alpha_p * newP[row][col] + (1 - alpha_p) * pressure[row][col];
            density[row][col] = alpha_rho * newRho[row][col] + (1 - alpha_rho) * density[row][col];
            temperature[row][col] = alpha_T * newT[row][col] + (1 - alpha_T) * temperature[row][col];
        }
    }

    //check convergence
    const residuals = calculateResiduals(simulationData);
    updateConvergenceHistory(residuals);
        
    if (checkConvergence(residuals)) {
        console.log("Converged");
        return false;
    }

    simulation.totalIterations++;

    if (simulation.totalIterations > 10000) {
        console.log("Maximum iterations reached");
        return false;
    }
    return true;
}

//export residual functions for UI

export function getLatestResiduals(simulationData) {
    return calculateResiduals(simulationData);
}

export function isConverged(simulationData) {
    const residuals = calculateResiduals(simulationData);
    return checkConvergence(residuals);
}

export function calculateArtificialViscosity(row, col, mach, rho, simulationData) {
    //placeholder for future enhancement
    return { x: 0, y: 0 };
}

