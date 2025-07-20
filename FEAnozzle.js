// creating nozzle geometry
const canvas = document.getElementById('fea-canvas');
const ctx = canvas.getContext('2d');
const colorbarCanvas = document.getElementById('colorbar');
const colorbarCtx = colorbarCanvas.getContext('2d');

const nozzleWidth = 700;
let visualizationMode = 'velocity';

function resizeCanvasToDisplaySize(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * ratio;
    const height = rect.height * ratio;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    return { width: rect.width, height: rect.height };
}

function setupCanvas() {
    const mainSize = resizeCanvasToDisplaySize(canvas); 

    colorbarCanvas.width = 30;
    colorbarCanvas.height = 300;

    return mainSize;
}

const canvasSize = setupCanvas();

//grid setup
const rows = 100;
const cols = 120;
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

                    //check if near boundary
                    const tolerance = Math.max(cellWidth, cellHeight) * 0.8;
                    if (Math.abs(yCanvas - topY) < tolerance || Math.abs(yCanvas - bottomY) < tolerance) {
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
    const P_inlet = 2.0; //generic vals
    const V_inlet = 1.0; 
    const T_inlet = 1.0;
    const rho_inlet = 1.5;

    //giving interior cells basic vals
    for (let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            if (isInside[row][col] && !isBoundary[row][col]) {
                //linear interpolation from inlet to exit
                const progress = col / (cols - 1);
                velocityX[row][col] = V_inlet * (1 + progress *2);
                velocityY[row][col] = 0.0;
                pressure[row][col] = P_inlet * (1 + progress * 0.7);
                density[row][col] = rho_inlet * (1 + progress * 0.5);
                temperature[row][col] = T_inlet * (1 + progress * 0.3);
            } else if (isBoundary[row][col]) {
                velocityX[row][col] = 0.0;
                velocityY[row][col] = 0.0;
            }
        }
    }
}

function updateFlow() {
    const gamma = 1.4;
    const P_inlet = 3.0;
    const V_inlet = 0.8;
    const T_inlet = 2.0;
    const rho_inlet = 1.5;
    const relaxation = 0.7; // Under-relaxation for stability

    //multiple convergence passes
    for (let pass = 0; pass < 8; pass++) {
        const newVx  = velocityX.map(row => [...row]);
        const newVy  = velocityY.map(row => [...row]);
        const newP   = pressure.map(row => [...row]);
        const newRho = density.map(row => [...row]);
        const newT = temperature.map(row => [...row]);

        //Apply inlet boundary conditions
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < 3; col++) {
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
        for (let row = 1; row < rows - 1; row++) {
            for (let col = 3; col < cols - 2; col++) {
                if (!isInside[row][col] || isBoundary[row][col]) continue;

                const xCanvas = col * cellWidth + cellWidth / 2;
                const currentRadius = Math.abs(getWallY(xCanvas, true) - getWallY(xCanvas, false)) / 2;
                const throatRadius = controlPoints.throat_radius * scaleY;
                const areaRatio = currentRadius  / throatRadius;

                //Gather upstream vals for convection terms
                let upstreamVx = col > 0 ? velocityX[row][col - 1] : V_inlet;
                let upstreamP = col > 0 ? pressure[row][col - 1] : P_inlet;
                let upstreamRho = col > 0 ? density[row][col - 1] : rho_inlet;

                let nextAreaRatio = areaRatio;
                if (col < cols - 1) {
                    const nextX = (col + 1) * cellWidth + cellWidth / 2;
                    const nextRadius = Math.abs(getWallY(nextX, true) - getWallY(nextX, false)) / 2;
                    nextAreaRatio = nextRadius / throatRadius;
                }

                const areaChange = (nextAreaRatio - areaRatio) / (areaRatio + 1e-6);

                //nozzle physics
                let acceleration = 0.0;
                if (areaRatio > 1.05) { //converging
                    acceleration = 1.5 * Math.abs(areaChange) * upstreamVx;
                } else if (areaRatio < 0.95) { //diverging
                    acceleration = 0.8 * Math.abs(areaChange) * upstreamVx;
                } else {
                    acceleration = 2.0 * Math.abs(areaChange) * upstreamVx;
                }

                //updating velocity with convective and area change effects
                newVx[row][col] = upstreamVx + acceleration;
                newVx[row][col] = Math.max(0.1, newVx[row][col]);

                //pressure drop due to acceleration MAY NEED TO CHANGE
                const speedSq = newVx[row][col] * newVx[row][col] + newVy[row][col] * newVy[row][col];
                newP[row][col] = Math.max(0.1, upstreamP - 0.2 * (speedSq - upstreamVx * upstreamVx));

                //isent flow
                const pressureRatio = newP[row][col] / P_inlet;
                newT[row][col] = T_inlet * Math.pow(pressureRatio, (gamma - 1) / gamma);
                newRho[row][col] = rho_inlet * Math.pow(pressureRatio, 1 / gamma);
                
                //smoothing from neighbors
                let avgVx = 0, avgVy = 0, avgP = 0, count = 0;

                const neighbors = [[row-1, col], [row+1, col], [row, col-1], [row, col+1]];

                for (const [nRow,nCol] of neighbors) {
                    if (nRow >= 0 && nRow < rows && nCol >= 0 && nCol < cols && isInside[nRow][nCol]) {
                        avgVx += velocityX[nRow][nCol];
                        avgVy += velocityY[nRow][nCol];
                        avgP += pressure[nRow][nCol];
                        //avgRho += density[nRow][nCol];
                        //avgT += temperature[nRow][nCol];
                        count++;
                    }
                }

                if (count > 0) {
                    const smoothing = 0.2;
                    newVx[row][col] = (1 - smoothing) * newVx[row][col] + smoothing * avgVx / count;
                    newVy[row][col] = (1 - smoothing) * newVy[row][col] + smoothing * avgVy / count;
                    newP[row][col] = (1 - smoothing) * newP[row][col] + smoothing * avgP / count;
                    //newRho[row][col] = (1 - smoothing) * newRho[row][col] + smoothing * avgRho / count;
                    //newT[row][col] = (1 - smoothing) * newT[row][col] + smoothing * avgT / count;
                }
            }
        }

        // extrapolated exit boundary conditions
        for (let row = 0; row < rows; row++) {
            for (let col = cols - 2; col < cols; col++) {
                if (isInside[row][col] && !isBoundary[row][col] && col > 0) {
                    newVx[row][col] = velocityX[row][col - 1];
                    newVy[row][col] = velocityY[row][col - 1];
                    newP[row][col] = Math.max(0.1, pressure[row][col - 1] * 0.9);
                    //newRho[row][col] = density[row][col - 1];
                    //newT[row][col] = temperature[row][col - 1];
                    
                }
            }
        }
        
        //update arrays with under-relaxation
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (isInside[row][col] && !isBoundary[row][col]) {
                    velocityX[row][col] = relaxation * newVx[row][col] + (1 - relaxation) * velocityX[row][col];
                    velocityY[row][col] = relaxation * newVy[row][col] + (1 - relaxation) * velocityY[row][col];
                    pressure[row][col] = relaxation * newP[row][col] + (1 - relaxation) * pressure[row][col];
                    //density[row][col] = relaxation * newRho[row][col] + (1 - relaxation) * density[row][col];
                    //temperature[row][col] = relaxation * newT[row][col] + (1 - relaxation) * temperature[row][col];
                }
            }
        }
    }
}

function createColorbar(minVal, maxVal, mode) {
    const height = 300;
    const width = 30;

    colorbarCtx.clearRect(0,0, width, height);

    const gradient = colorbarCtx.createLinearGradient(0,0,0,height);

    //create color steps based on mode
    for (let i = 0; i < 20; i++) {
        const ratio = i/20;
        const value = minVal + ratio * (maxVal - minVal);
        const color = getColorFromValue(value, minVal, maxVal, mode);
        gradient.addColorStop(1-ratio, color);
    }

    colorbarCtx.fillStyle = gradient;
    colorbarCtx.fillRect(0, 0, width, height);

    //add border
    colorbarCtx.strokeStyle = '#ccc';
    colorbarCtx.lineWidth = 1;
    colorbarCtx.strokeRect(0, 0, width, height);

    //update labels
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

function getColorFromValue(value, min, max, mode) {
    let normalized = 0;
    if (max !== min) {
        normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
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
            r = Math.floor(normalized * 255);
            g = 0;
            b = Math.floor((1 - normalized) * 255);
            break;
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

// Draw color grid
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

    maxVal = Math.max(...flatData);
    minVal = Math.min(...flatData);
    const avgVal = flatData.reduce((a,b) => a + b, 0) / flatData.length;

    document.getElementById('min-value').textContent = minVal.toFixed(3);
    document.getElementById('avg-value').textContent = avgVal.toFixed(3);
    document.getElementById('max-value').textContent = maxVal.toFixed(3);

    createColorbar(minVal, maxVal, visualizationMode);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;

            const color = getColorFromValue(dataArray[row][col], minVal, maxVal, visualizationMode);
            ctx.fillStyle = color;
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight); //i * cellHeight + offsetY
        }
    }
}

// // Draw nozzle contour lines for reference
// function drawNozzleOutline() {
//     ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
//     ctx.lineWidth = 1;

//     for (let col = 0; col < cols; col++) {
//         const xCanvas = col * cellWidth + cellWidth / 2;
//         if (xCanvas > controlPoints.exit_x) continue;

//         let top = -1, bottom = -1;
//         for (let row = 0; row < rows; row++) {
//             if (isInside[row][col]) {
//                 if (top === -1) top = row;
//                 bottom = row;
//             }
//         }

//         if (top !== -1 && bottom !== -1) {
//             ctx.beginPath();
//             ctx.moveTo(col * cellWidth, top * cellHeight);
//             ctx.lineTo(col * cellWidth, bottom * cellHeight);
//             ctx.stroke();
//         }
//     }
// }

function createNozzleGeometry() {
    const cp = controlPoints

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

let animationId;
let frameCount = 0;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (frameCount % 2 === 0) {
        updateFlow();
    }

    visualizeFlow();
    createNozzleGeometry();

    frameCount++;
    animationId = requestAnimationFrame(animate);
}

//event listener for visualization mode
document.querySelectorAll('input[name="vizMode"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        visualizationMode = e.target.value;
    });
});

//canvas resizing
window.addEventListener('resize', () => {
    setupCanvas();
    createFlowDomain();
    initializeFlow();
});

// Run simulation
createFlowDomain();
initializeFlow();
animate();