import { convergenceHistory, convergenceTolerances } from 'core.js';
import { getWallY } from './feaGeometry.js';
//import { simulation } from './core.js';

export function setupCanvas(canvas, colorbarCanvas, convergenceCanvas) {
    const ctx = canvas.getContext('2d');

    canvas.width = 1000;
    canvas.height = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (colorbarCanvas) {
        colorbarCanvas.width = 30;
        colorbarCanvas.height = 400;
    }

    if (convergenceCanvas) {
        convergenceCanvas.width = 380;
        convergenceCanvas.height = 250;
    }
    
    return ctx;
}

//nozzle rendering

export function createNozzleGeometry(ctx, simulationData) {
    const { controlPoints, scaleY, canvasHeight } = simulationData;

    if (!controlPoints) return;

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(100,100,100,0.3)';

    const resolution = 100; //mnumber of points to draw smooth curves

    //draw top wall
    ctx.beginPath();
    for (let i=0; i <= resolution; i++) {
        const x = i / resolution * controlPoints.exit_x;
        const y = getWallY(x, true, controlPoints, scaleY, canvasHeight);
       
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }

    //draw bottom wall
    for (let i = resolution; i >= 0; i--) {
        const x = i / resolution * controlPoints.exit_x;
        const y = getWallY(x, false, controlPoints, scaleY, canvasHeight);
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5,5]);
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 2);
    ctx.lineTo(controlPoints.exit_x, canvasHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);    
}

//flow visualization

let currentStats = { min: 0, avg: 0, max: 0 };

export function visualizeFlow(ctx, simulationData, callbacks = null) {
    const {
        rows, cols, velocityX, velocityY, pressure, temperature, density, 
        isInside, isBoundary, cellWidth, cellHeight, visualizationMode
    } = simulationData;
    
    let dataArray;

    switch(visualizationMode) {
        case 'pressure': dataArray = pressure; break;
        case 'temperature': dataArray = temperature; break;
        case 'density': dataArray = density; break;
        case 'velocity':
            dataArray = Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, col) => {
                    const vx = velocityX[row][col] || 0;
                    const vy = velocityY[row][col] || 0;
                    return Math.sqrt(vx * vx + vy * vy);
                })
            );
            break;
        default: dataArray = pressure;
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

    if (flatData.length === 0) return;

    const minVal = Math.min(...flatData);
    const maxVal = Math.max(...flatData);
    const avgVal = flatData.reduce((a, b) => a + b, 0) / flatData.length;

    currentStats = { min: minVal, avg: avgVal, max: maxVal };

    updateStatsDisplay(minVal, maxVal, avgVal);

    if (callbacks?.onStatsUpdate) {
        callbacks.onStatsUpdate({ 
            min: minVal, 
            max: maxVal, 
            avg: avgVal 
        });
    }

    //enable antialiasing 
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;

            const value  =dataArray[row][col];
            const color = getColorFromValue(value, minVal, maxVal, visualizationMode);
            ctx.fillStyle = color;
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
    }
    //update colorbar
    createColorbar(minVal, maxVal, visualizationMode);
}

function updateStatsDisplay(minVal, maxVal, avgVal) {
    const minLabel = document.getElementById('min-label');
    const avgLabel = document.getElementById('avg-label');    
    const maxLabel = document.getElementById('max-label');
    
    if (minElement) minElement.textContent = minVal.toFixed(3);
    if (avgElement) avgElement.textContent = avgVal.toFixed(3);
    if (maxElement) maxElement.textContent = maxVal.toFixed(3);
}

//color mapping

export function getColorFromValue(value, minVal, maxVal, mode) {
    if (!isFinite(value)) value = minVal;
    
    let normalized = 0;
    if (maxVal > minVal) {
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

export function createColorbar(minVal, maxVal, mode) {
    const colorbarCanvas = document.getElementById('colorbar');
    if (!colorbarCanvas) return;

    const colorbarCtx = colorbarCanvas.getContext('2d');
    const height = colorbarCanvas.height;
    const width = colorbarCanvas.width;

    colorbarCtx.clearRect(0, 0, width, height);

    const gradient = colorbarCtx.createLinearGradient(0,height,0,0);

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const value = minVal + ratio * (maxVal - minVal);
        const color = getColorFromValue(value, minVal, maxVal, mode);
        gradient.addColorStop(ratio, color);
    }

    colorbarCtx.fillStyle = gradient;
    colorbarCtx.fillRect(0, 0, width, height);

    colorbarCtx.strokeStyle = '#ccc';
    colorbarCtx.lineWidth = 1;
    colorbarCtx.strokeRect(0, 0, width, height);

    const maxLabel = document.getElementById('max-label');
    const midLabel = document.getElementById('mid-label');
    const minLabel = document.getElementById('min-label');
    const titleLabel = document.getElementById('colorbar-title');

    if (maxLabel) maxLabel.textContent = maxVal.toFixed(3);
    if (midLabel) midLabel.textContent = ((maxVal + minVal) / 2).toFixed(3);
    if (minLabel) minLabel.textContent = minVal.toFixed(3);

    const titles = {
        'velocity': 'Velocity',
        'pressure': 'Pressure',
        'temperature': 'Temperature',
        'density': 'Density'
    };
    if (titleLabel) titleLabel.textContent = titles[mode] || 'Value';
}
  
//convergence chart

export function drawConvergenceChart(canvas) {
    if (!canvas) return; // safety check

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, width, height);

    if (convergenceHistory.velocity.length < 2) return;

    //find range for logarithmic scale
    const allValues = [
        ...convergenceHistory.velocity, 
        ...convergenceHistory.pressure, 
        ...convergenceHistory.mass
    ];
    const minVal = Math.max(1e-12, Math.min(...allValues));
    const maxVal = Math.max(minVal * 1.01, Math.max(...allValues));

    const logMin = Math.log10(minVal);
    const logMax = Math.log10(maxVal);
    const logRange = logMax - logMin;

    if (logRange <= 0) return;

    // Draw Grid
    drawChartGrid(ctx, width, height, logMin, logMax, logRange);
    drawConvergenceLines(ctx, width, height, logMin, logRange);
    drawConvergenceLabels(ctx, width, height, logMin, logRange);
}

function drawChartGrid(ctx, width, height, logMin, logMax, logRange) {
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
        const x = convergenceHistory.velocity.length > 1 
            ? (i / (convergenceHistory.velocity.length - 1)) * width
            : 0;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

function drawConvergenceLines(ctx, width, height, logMin, logRange) {
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
}

function drawToleranceLines(ctx, width, height, logMin, logRange) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    const tolerances = [
        convergenceTolerances.velocity,
        convergenceTolerances.pressure, 
        convergenceTolerances.mass
    ];

    tolerances.forEach((tol) => {
        if (tol <= 0) return;
        const logTol = Math.log10(tol);
        const y = height - ((logTol - logMin) / logRange) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    });

    ctx.setLineDash([]);
}

//export current stats
export function getCurrentStats() {
    return currentStats;
}
