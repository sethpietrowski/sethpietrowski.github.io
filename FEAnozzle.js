// creating nozzle geometry
const canvas = document.getElementById('fea-canvas');
const ctx = canvas.getContext('2d');
const colorbarCanvas = document.getElementById('colorbar');
const colorbarCtx = colorbarCanvas.getContext('2d');
const convergenceCanvas = document.getElementById('convergence-canvas');
const convergenceCtx = convergenceCanvas.getContext('2d');

const nozzleWidth = 700;
let visualizationMode = 'velocity';

//simulatuion state
let simulationState = 'stopped';
let timeStep = 0;
let totalIterations = 0;
let animationId = null;

//convergence tracking
const convergenceHistory = {
    velocity: [],
    pressure: [],
    mass: [],
    maxHistory: 200
};

let convergenceTolerances = {
    velocity: 1e-6,
    pressure: 1e-6,
    mass: 1e-6
};

function setupCanvas() {
    const mainSize = { width: canvas.width, height: canvas.height };
    colorbarCanvas.width = 30;
    colorbarCanvas.height = 400;
    convergenceCanvas.width = 380;
    convergenceCanvas.height = 250;
    return mainSize;
}

const canvasSize = setupCanvas();

//grid setup
const rows = 100;
const cols = 150;
const cellWidth = canvasSize.width / cols;
const cellHeight = canvasSize.height / rows;

// Flow field variables
const velocityX     = Array(rows).fill().map(() => Array(cols).fill(0));
const velocityY     = Array(rows).fill().map(() => Array(cols).fill(0));
const pressure      = Array(rows).fill().map(() => Array(cols).fill(1));
const density       = Array(rows).fill().map(() => Array(cols).fill(1));
const temperature   = Array(rows).fill().map(() => Array(cols).fill(1));
const isInside      = Array(rows).fill().map(() => Array(cols).fill(false));
const isBoundary    = Array(rows).fill().map(() => Array(cols).fill(false));

//convergence storage from previous iteration
const prevVelocityX = Array(rows).fill().map(() => Array(cols).fill(0));
const prevVelocityY = Array(rows).fill().map(() => Array(cols).fill(0));
const prevPressure = Array(rows).fill().map(() => Array(cols).fill(1));

//wall angle arrays for boundary interactions
const wallAngleTop = Array(cols).fill(0);
const wallAngleBottom = Array(cols).fill(0);

// Global control point definitions (X-values scaled to canvas width)
const scaleX = canvasSize.width / nozzleWidth;
const controlPoints = {
    inlet_length: 75 * scaleX,
    inlet_radius: 75,
    cp1x: 150 * scaleX, cp1y: 40,
    throat_x: 175 * scaleX, throat_radius: 37.5,
    cp2x: 225 * scaleX, cp2y: 30,
    switcher_x: 275 * scaleX, switcher_y: 50,
    cp3x: 450 * scaleX, cp3y: 125,
    exit_x: 700 * scaleX, exit_radius: 150
};
const scaleY = canvasSize.height / 2 / controlPoints.exit_radius;

// Bézier interpolation helper
function bezierQuadratic(t, p0, p1, p2) {
    const oneMinusT = 1 - t;
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

function getWallY(xCanvas, top = true) {
    
    //clamp x to valid range
    if (xCanvas < 0 ) xCanvas = 0;
    if (xCanvas > controlPoints.exit_x) xCanvas = controlPoints.exit_x;

    const t = xCanvas / controlPoints.exit_x;
    const cp = controlPoints;

    const y = bezierQuadratic(t,
        bezierQuadratic(t, cp.inlet_radius, cp.cp1y, cp.throat_radius),
        bezierQuadratic(t, cp.throat_radius, cp.cp2y, cp.switcher_y),
        bezierQuadratic(t, cp.switcher_y, cp.cp3y, cp.exit_radius)
    );

    const scaledY = y * scaleY;
    return top ? canvas.height / 2 - scaledY : canvas.height / 2 + scaledY;
}

//Calculate wall angles to allow for flow expansion tracking
function CalculateWallAngles() {
    for (let col = 0; col < cols; col++) {
        const x = col * cellWidth + cellWidth / 2;
        const dx = cellWidth;

        if (col < cols - 1) {
            const y1_top = getWallY(x, true);
            const y1_bot = getWallY(x, false);
            const y2_top = getWallY(x + dx, true);
            const y2_bot = getWallY(x + dx, false);

            wallAngleTop[col] = Math.atan2(y2_top - y1_top, dx);
            wallAngleBottom[col] = Math.atan2(y2_bot - y1_bot, dx);
        } else {
            wallAngleTop[col] = wallAngleTop[col - 1];
            wallAngleBottom[col] = wallAngleBottom[col - 1];
        }
    }
}

function getLocalRadius(xCanvas) {
    if (xCanvas <= 0) return controlPoints.inlet_radius * scaleY;
    if (xCanvas >= controlPoints.exit_x) return controlPoints.exit_radius * scaleY;

    const topY = getWallY(xCanvas, true);
    const bottomY = getWallY(xCanvas, false);
    return Math.abs(bottomY - topY) / 2;
}

// Create nozzle domain (hourglass shape TO BE EDITED TO COINCIDE WITH NOZZLE GEOMETRY)
function createFlowDomain() {
    // determine if each cell is inside the nozzle
    for (let row = 0; row < rows; row++) {    
        for (let col = 0; col < cols; col++) {
            //clear arrays
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

// Basic flow simulation (need to update with real physics)
function initializeFlow() {
    //inlet conditions
    const P_inlet = 3.0; //generic vals
    const V_inlet = 0.8; 
    const T_inlet = 2.0;
    const rho_inlet = 1.5;

    //giving interior cells basic vals
    for (let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                //linear interpolation from inlet to exit
                const progress = col / (cols - 1);
                velocityX[row][col] = V_inlet * (1 + progress * 0.5);
                velocityY[row][col] = 0.0;
                pressure[row][col] = P_inlet * (1 - progress * 0.3);
                density[row][col] = rho_inlet * (1 - progress * 0.2);
                temperature[row][col] = T_inlet * (1 - progress * 0.1);
            } else if (isBoundary[row][col]) {
                velocityX[row][col] = 0.0;
                velocityY[row][col] = 0.0;
            }
        }
    }

    //reset convergence tracking
    timeStep = 0;
    totalIterations = 0;
    convergenceHistory.velocity = [];
    convergenceHistory.pressure = [];
    convergenceHistory.mass = [];

    updateSimulationStatus('running');
}

function storePreviousIteration() {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            prevVelocityX[row][col] = velocityX[row][col];
            prevVelocityY[row][col] = velocityY[row][col];
            prevPressure[row][col] = pressure[row][col];
        }
    }
}

function calculateResiduals() {
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

    //normalize by num interior cells and take sqrt for L2 norm
    const velRes = Math.sqrt(velResidual / Math.max(count, 1));
    const pressRes = Math.sqrt(pressResidual / Math.max(count, 1));
    const massRes = Math.sqrt(massResidual / Math.max(count, 1));
    return { velocity: velRes, pressure: pressRes, mass: massRes };
}

function checkConvergence(residuals) {
    const velConverged = residuals.velocity < convergenceTolerances.velocity;
    const pressConverged = residuals.pressure < convergenceTolerances.pressure;
    const massConverged = residuals.mass < convergenceTolerances.mass;
    return velConverged && pressConverged && massConverged;
}

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

function updateFlow() {
    if (simulationState !== 'running') return false;

    storePreviousIteration();

    const gamma = 1.4;
    const P_inlet = 3.0;
    const V_inlet = 0.8;
    const T_inlet = 2.0;
    const rho_inlet = 1.5;
    const relaxation = 0.25;
    const dt = 0.005;

    //temporary arrays for smooth updates
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
    
    //update interior points
    for (let row = 2; row < rows - 2; row++) {
        for (let col = 5; col < cols - 5; col++) {
            if (!isInside[row][col] || isBoundary[row][col]) continue;

            const xCanvas = col * cellWidth + cellWidth / 2;
            const yCanvas = row * cellHeight + cellHeight / 2;

            //current properties
            const rho = density[row][col];
            const vx = velocityX[row][col];
            const vy = velocityY[row][col];
            const p = pressure[row][col];

            //pressure gradients - central difference
            const dpDx = (-pressure[row][col + 2] + 8 * pressure[row][col + 1] - 8 * pressure[row][col - 1] + pressure[row][col - 2]) / (12 * cellWidth);
            const dpDy = (-pressure[row + 2][col] + 8 * pressure[row + 1][col] - 8 * pressure[row - 1][col] + pressure[row - 2][col]) / (12 * cellHeight);

            //velocity gradients - central difference
            const dvxDx = (-velocityX[row][col + 2] + 8 * velocityX[row][col + 1] - 8 * velocityX[row][col - 1] + velocityX[row][col - 2]) / (12 * cellWidth);
            const dvxDy = (-velocityX[row + 2][col] + 8 * velocityX[row + 1][col] - 8 * velocityX[row - 1][col] + velocityX[row - 2][col]) / (12 * cellHeight);
            const dvyDx = (-velocityY[row][col + 2] + 8 * velocityY[row][col + 1] - 8 * velocityY[row][col - 1] + velocityY[row][col - 2]) / (12 * cellWidth);
            const dvyDy = (-velocityY[row + 2][col] + 8 * velocityY[row + 1][col] - 8 * velocityY[row - 1][col] + velocityY[row - 2][col]) / (12 * cellHeight);

            //wall influence
            const centerY = canvas.height / 2;
            const localRadius = getLocalRadius(xCanvas);
            const throatRadius = controlPoints.throat_radius * scaleY;
            const wallAngle = yCanvas < centerY ? wallAngleTop[col] : wallAngleBottom[col];

            //expansion effects
            let expansionFactorY = 0;
            if (localRadius > throatRadius * 1.1) {
                const distFromCenter = Math.abs(yCanvas - centerY);
                const radialPosition = distFromCenter / localRadius;
                const wallGradient = Math.sin(wallAngle);

                expansionFactorY = wallGradient * vx * radialPosition * 0.1;
                if (yCanvas > centerY) expansionFactorY = -expansionFactorY;
            }

            //momentum equations
            const convectiveX = vx * dvyDx + vy * dvxDy;
            const convectiveY = vx * dvxDx + vy * dvyDy;
            const accelerationX = -dpDx / Math.max(rho, 0.5) - convectiveX * 0.3;
            const accelerationY = -dpDy / Math.max(rho, 0.5) - convectiveY * 0.3 + expansionFactorY;

            //update velocities
            newVx[row][col] = vx + accelerationX * dt;
            newVy[row][col] = vy + accelerationY * dt;

            //apply limits
            newVx[row][col] = Math.max(0.05, Math.min(4.0, newVx[row][col]));
            newVy[row][col] = Math.max(-1.5, Math.min(1.5, newVy[row][col]));
            
            //update pressure with continuity
            const speedSq = newVx[row][col] * newVx[row][col] + newVy[row][col] * newVy[row][col];
            const oldSpeedSq = vx * vx + vy * vy;

            //energy-based pressure update
            newP[row][col] = p - 0.2 * rho * (speedSq - oldSpeedSq) - p * (dvxDx + dvyDy) * dt * 0.3;
            newP[row][col] = Math.max(0.05, newP[row][col]);

            //isent flow
            const pressureRatio = Math.max(0.01, newP[row][col] / P_inlet);
            newT[row][col] = T_inlet * Math.pow(pressureRatio, (gamma - 1) / gamma);
            newRho[row][col] = rho_inlet * Math.pow(pressureRatio, 1 / gamma);
            
            //limits
            newT[row][col] = Math.max(0.1, Math.min(3.0, newT[row][col]));
            newRho[row][col] = Math.max(0.1, Math.min(3.0, newRho[row][col]));
        }
    }

            
    //wall boundary conditions      
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (isBoundary[row][col]) {
                const yCanvas = row * cellHeight + cellHeight / 2;
                const xCanvas = col * cellWidth + cellWidth / 2;
                        
                //calculate distance to nearest wall
                const topWallY = getWallY(xCanvas, true);
                const bottomWallY = getWallY(xCanvas, false);
                const distToTopWall = Math.abs(yCanvas - topWallY);
                const distToBottomWall = Math.abs(yCanvas - bottomWallY);
                const minDistToWall = Math.min(distToTopWall, distToBottomWall);
                        
                //boundary layer thickness
                const boundaryThickness = Math.max(cellWidth, cellHeight) * 1.5;
                const wallDistance = Math.min(1.0, minDistToWall / boundaryThickness);
                        
                //find ref vals from interior
                let refVx = V_inlet, refVy = 0, refP = P_inlet, refRho = rho_inlet, refT = T_inlet;
                let foundRef = false;
                        
                //look for stable interior reference
                for (let searchRadius = 2; searchRadius <= 6 && !foundRef; searchRadius++) {
                    for (let dr = -searchRadius; dr <= searchRadius && !foundRef; dr++) {
                        for (let dc = -searchRadius; dc <= searchRadius && !foundRef; dc++) {
                            const nr = row + dr, nc = col + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && isInside[nr][nc] && !isBoundary[nr][nc]) { 
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
                    const velocityFactor = Math.pow(wallDistance, 0.3);
    
                    newVx[row][col] = refVx * velocityFactor;     
                    newVy[row][col] = refVy * velocityFactor * 0.7;
                            
                    //properties remian continuous     
                    newP[row][col] = refP;      
                    newRho[row][col] = refRho;     
                    newT[row][col] = refT;  
                }   
            }   
        }   
    }

    //exit boundary conditions
    for (let row = 0; row < rows; row++) {
        for (let col = cols - 4; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                //extrapolate from interior
                const gradient = (velocityX[row][col] - velocityX[row][col - 1]) / cellWidth;

                newVx[row][col] = Math.max(velocityX[row][col], velocityX[row][col] + gradient * cellWidth);
                newVy[row][col] = velocityY[row][col];
                newP[row][col] = Math.max(0.01, pressure[row][col] * .98);
                newRho[row][col] = density[row][col] * .99;
                newT[row][col] = temperature[row][col];
            }
        }
    }

    //Apply under-relaxation for stability 
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (isInside[row][col]) {
                velocityX[row][col] = relaxation * newVx[row][col] + (1 - relaxation) * velocityX[row][col];
                velocityY[row][col] = relaxation * newVy[row][col] + (1 - relaxation) * velocityY[row][col];
                pressure[row][col] = relaxation * newP[row][col] + (1 - relaxation) * pressure[row][col];
                density[row][col] = relaxation * newRho[row][col] + (1 - relaxation) * density[row][col];
                temperature[row][col] = relaxation * newT[row][col] + (1 - relaxation) * temperature[row][col];
            }
        }
    }

    //calculate residuals and check convergence
    const residuals = calculateResiduals();
    updateConvergenceHistory(residuals);

    //update display
    updateConvergenceDisplay(residuals);

    //check for convergence
    if (checkConvergence(residuals)) {
        updateSimulationStatus('converged');
        return false; //stop iterating
    }

    totalIterations++;
    return true; // continue iterating
}

function createColorbar(minVal, maxVal, mode) {
    const height = 300;
    const width = 30;

    colorbarCtx.clearRect(0, 0, width, height);

    const gradient = colorbarCtx.createLinearGradient(0,0,0,height);

    for (let i = 0; i < 20; i++) {
        const ratio = i/20;
        const value = minVal + ratio * (maxVal - minVal);
        const color = getColorFromValue(value, minVal, maxVal, mode);
        gradient.addColorStop(1-ratio, color);
    }

    colorbarCtx.fillStyle = gradient;
    colorbarCtx.fillRect(0, 0, width, height);

    colorbarCtx.strokeStyle = '#ccc';
    colorbarCtx.lineWidth = 1;
    colorbarCtx.strokeRect(0, 0, width, height);

    document.getElementById('max-label').textContent = maxVal.toFixed(3);
    document.getElementById('mid-label').textContent = ((maxVal + minVal) / 2).toFixed(3);
    document.getElementById('min-label').textContent = minVal.toFixed(3);

    const titles = {
        'velocity': 'Velocity',
        'pressure': 'Pressure',
        'temperature': 'Temperature',
        'density': 'Density'
    };
    document.getElementById('colorbar-title').textContent = titles[mode] || 'Value';
}
        
function getColorFromValue(value, minVal, maxVal, mode) {
    let normalized = 0;
    if (maxVal != minVal) {
        normalized = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));  
    }

    let r, g, b;

    switch(mode) {
        case 'velocity':
            // blue - cyan - green - yellow - red
            if (normalized < 0.25) {
                const t = normalized / 0.25;
                r = 0; g = Math.floor(t * 255); b = 255;
            } else if (normalized < 0.5) {
                const t = (normalized - 0.25) / 0.25;
                r = 0; g = 255; b = Math.floor(255 * (1 - t));
            } else if (normalized < 0.75) {
                const t = (normalized - 0.5) / 0.25;
                r = Math.floor(t * 255); g = 255; b = 0;
            } else {
                const t = (normalized - 0.75) / 0.25;
                r = 255; g = Math.floor(255 * (1 - t)); b = 0;
            }
            break;
        case 'pressure':
        case 'temperature':
        case 'density':
            r = Math.floor(normalized * 255);
            g = 0;
            b = Math.floor((1 - normalized) * 255);
            break;
        default:
            r = Math.floor(normalized * 255);
            g = Math.floor(normalized * 128);
            b = Math.floor((1 - normalized) * 255);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

function visualizeFlow() {
    let dataArray, minVal, maxVal;

    switch(visualizationMode) {
        case 'pressure':
            dataArray = pressure;
            break;
        case 'temperature':
            dataArray = temperature;
            break;
        case 'density':
            dataArray = density;
            break;
        case 'velocity':
            dataArray = Array(rows).fill().map((_, row) =>
                Array(cols).fill().map((_, col) =>
                    Math.sqrt(velocityX[row][col]**2 + velocityY[row][col]**2)
                )
            );
            break;
        default:
            dataArray = pressure;
    }

    //min/max from inside domain only
    const flatData = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                const val = dataArray[row][col];
                if (!isNaN(val) && isFinite(val)) {
                    flatData.push(val);
                }
            }
        }
    }

    minVal = Math.min(...flatData);
    maxVal = Math.max(...flatData);
    const avgVal = flatData.reduce((a, b) => a + b, 0) / flatData.length;

    document.getElementById('min-value').textContent = minVal.toFixed(3);
    document.getElementById('max-value').textContent = maxVal.toFixed(3);
    document.getElementById('avg-value').textContent = avgVal.toFixed(3);
    createColorbar(minVal, maxVal, visualizationMode);

    //antialiasing 
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;

            const color = getColorFromValue(dataArray[row][col], minVal, maxVal, visualizationMode);
            ctx.fillStyle = color;
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
    }
}

function createNozzleGeometry() {
    const cp = controlPoints;

    ctx.save();
    ctx.translate(0, canvas.height / 2);

    ctx.beginPath();
    ctx.moveTo(0, cp.inlet_radius * scaleY);
    ctx.lineTo(cp.inlet_length, cp.inlet_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp1x, cp.cp1y * scaleY, cp.throat_x, cp.throat_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp2x, cp.cp2y * scaleY, cp.switcher_x, cp.switcher_y * scaleY);
    ctx.quadraticCurveTo(cp.cp3x, cp.cp3y * scaleY, cp.exit_x, cp.exit_radius * scaleY);
    ctx.lineTo(cp.exit_x, -cp.exit_radius * scaleY);    
    ctx.quadraticCurveTo(cp.cp3x, -cp.cp3y * scaleY, cp.switcher_x, -cp.switcher_y * scaleY);
    ctx.quadraticCurveTo(cp.cp2x, -cp.cp2y * scaleY, cp.throat_x, -cp.throat_radius * scaleY);
    ctx.quadraticCurveTo(cp.cp1x, -cp.cp1y * scaleY, cp.inlet_length, -cp.inlet_radius * scaleY);
    ctx.lineTo(0, -cp.inlet_radius  * scaleY);
    ctx.closePath();

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

function updateSimulationStatus(status) {
    simulationState = status;
    const statusElement = document.getElementById('simulation-status');
    const indicatorElement = document.getElementById('status-indicator');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    switch(status) {
        case 'running':
            statusElement.textContent = 'Running';
            indicatorElement.className = 'status-indicator status-running';
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            break;
        case 'paused':
            statusElement.textContent = 'Paused';
            indicatorElement.className = 'status-indicator status-paused';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            break;
        case 'converged':
            statusElement.textContent = 'Converged';
            indicatorElement.className = 'status-indicator status-converged';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            break;
        case 'stopped':
            statusElement.textContent = 'Ready';
            indicatorElement.className = 'status-indicator status-paused';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            break;
    }
}

function updateConvergenceDisplay(residuals) {
    document.getElementById('time-step').textContent = timeStep;
    document.getElementById('total-iterations').textContent = totalIterations;
    document.getElementById('velocity-residual').textContent = residuals.velocity.toExponential(3);
    document.getElementById('pressure-residual').textContent = residuals.pressure.toExponential(3);
    document.getElementById('mass-residual').textContent = residuals.mass.toExponential(3);

    drawConvergenceChart();
}

function drawConvergenceChart() {
    const canvas  = convergenceCanvas;
    const ctx = convergenceCtx;
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.clearRect(0, 0, width, height);

    if (convergenceHistory.velocity.length < 2) return;

    //find range for logarithmic scale
    const allValues = [...convergenceHistory.velocity, ...convergenceHistory.pressure, ...convergenceHistory.mass];
    const minVal = Math.min(1e-12, Math.min(...allValues));
    const maxVal = Math.max(...allValues);

    const logMin = Math.log10(minVal);
    const logMax = Math.log10(maxVal);
    const logRange = logMax - logMin;

    if (logRange === 0) return;

    // Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;

    //horizontal grid lines (power of 10)
    for (let power = Math.floor(logMin); power <= Math.ceil(logMax); power++) {
        const y = height - ((power - logMin) / logRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        //labels
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Arial';
        ctx.fillText(`1e${power}`, 5, y - 2);
    }

    //Vertical grid lines
    const stepSize = Math.max(1, Math.floor(convergenceHistory.velocity.length / 5));

    for (let i = 0; i < convergenceHistory.velocity.length; i += stepSize) {
        const x = (i / (convergenceHistory.velocity.length - 1)) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    //Draw convergence lines
    const datasets = [
        { data: convergenceHistory.velocity, color: 'blue', label: 'Velocity' },
        { data: convergenceHistory.pressure, color: 'green', label: 'Pressure' },
        { data: convergenceHistory.mass, color: 'red', label: 'Mass' }
    ];

    datasets.forEach(dataset => {
        if (dataset.data.length < 2) return;

        ctx.strokeStyle = dataset.color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < dataset.data.length; i++) {
            const x = (i / (dataset.data.length - 1)) * width;
            const logValue = Math.log10(Math.max(1e-12, dataset.data[i]));
            const y = height - ((logValue - logMin) / logRange) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    });

    //draw tolerance lines
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const tolerances = [
        convergenceTolerances.velocity,
        convergenceTolerances.pressure, 
        convergenceTolerances.mass
    ];

    tolerances.forEach((tol, i) => {
        const logTol = Math.log10(Math.max(1e-12, tol));
        const y = height - ((logTol - logMin) / logRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    });

    ctx.setLineDash([]);

}

function updateTolerances() {
    convergenceTolerances.velocity = parseFloat(document.getElementById('vel-tolerance').value) || 1e-6;
    convergenceTolerances.pressure = parseFloat(document.getElementById('press-tolerance').value) || 1e-6;
    convergenceTolerances.mass = parseFloat(document.getElementById('mass-tolerance').value) || 1e-6;
}

function animate() {
    
    if (simulationState === 'running') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //update flow every other frame
        if (timeStep % 2 === 0) {
            updateTolerances();
            const shouldContinue = updateFlow();
            if (!shouldContinue) {
                //simualtion converged or failed
                if(animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
                visualizeFlow();
                createNozzleGeometry();
                return;
            }
        }
        timeStep++;

        //render current state
        visualizeFlow();
        createNozzleGeometry();

        //continue animation
        animationId = requestAnimationFrame(animate);
    }

    visualizeFlow();
    createNozzleGeometry();

   if (simulationState === 'running') {
        animationId = requestAnimationFrame(animate);
    }
}

//event listener for visualization mode
document.querySelectorAll('input[name="vizMode"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        visualizationMode = e.target.value;
    });
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (simulationState === 'stopped' || simulationState === 'converged') {
        createFlowDomain();
        CalculateWallAngles();
        initializeFlow();
    } else if (simulationState === 'paused') {
        updateSimulationStatus('running');
    }
    
    if (!animationId) {
        animate();
    }
});

document.getElementById('pause-btn').addEventListener('click', () => {
    if (simulationState === 'running') {
        updateSimulationStatus('paused');
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        visualizeFlow();
        createNozzleGeometry();
    }
    
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    updateSimulationStatus('stopped');
    createFlowDomain();
    CalculateWallAngles();
    initializeFlow();

    //clear display
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    visualizeFlow();
    createNozzleGeometry();

    convergenceCtx.clearRect(0, 0, convergenceCanvas.width, convergenceCanvas.height);
});

//Tolerance input listeners
['vel-tolerance', 'press-tolerance', 'mass-tolerance'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateTolerances);
});

//canvas resizing
window.addEventListener('resize', () => {
    setupCanvas();
    createFlowDomain();
    CalculateWallAngles();
    if (simulationState === 'stopped') {
        initializeFlow();
    }
});

// Run simulation
createFlowDomain();
CalculateWallAngles();
initializeFlow();
updateSimulationStatus('stopped');

//Initial display
ctx.clearRect(0, 0, canvas.width, canvas.height);
visualizeFlow();
createNozzleGeometry();