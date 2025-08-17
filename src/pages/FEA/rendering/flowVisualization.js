export function visualizeFlow(ctx, controlPoints, scaleY, rows, cols, velocityX, velocityY, pressure, temperature, density, isInside, isBoundary, cellWidth, cellHeight, visualizationMode) {
    let dataArray;

    switch(visualizationMode) {
        case 'pressure': dataArray = pressure; break;
        case 'temperature': dataArray = temperature; break;
        case 'density': dataArray = density; break;
        case 'velocity':
            dataArray = Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, col) =>
                    Math.sqrt(velocityX[row][col]**2 + velocityY[row][col]**2)
                )
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

    minVal = Math.min(...flatData);
    maxVal = Math.max(...flatData);
    const avgVal = flatData.reduce((a, b) => a + b, 0) / flatData.length;

    const minElement = document.getElementById('min-value');
    const maxElement = document.getElementById('max-value');
    const avgElement = document.getElementById('avg-value');

    if (minElement) minElement.textContent = minVal.toFixed(3);
    if (maxElement) maxElement.textContent = maxVal.toFixed(3);
    if (avgElement) avgElement.textContent = avgVal.toFixed(3);

    //antialiasing 
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (!isInside[row][col]) continue;

            const color = getColorFromValue(dataArray[row][col], minVal, maxVal, visualizationMode);
            ctx.fillStyle = color;
            ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
    }
    //update colorbar
    createColorbar(minVal, maxVal, visualizationMode);
}

export function createColorbar(minVal, maxVal, mode) {
    const colorbarCanvas = document.getElementById('colorbar');
    if (!colorbarCanvas) return;

    const colorbarCtx = colorbarCanvas.getContext('2d');
    const height = colorbarCanvas.height;
    const width = colorbarCanvas.width;

    colorbarCtx.clearRect(0, 0, width, height);

    const gradient = colorbarCtx.createLinearGradient(0,0,0,height);

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