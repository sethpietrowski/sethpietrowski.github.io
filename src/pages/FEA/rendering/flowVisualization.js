
export function visualizeFlow() {
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
            dataArray = Array.from({ length: rows }, (_, row) =>
                Array.from({ length: cols }, (_, col) =>
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

    if (flatData.length === 0) return;

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

export function createColorbar(minVal, maxVal, mode) {
    const height = 300;
    const width = 30;

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