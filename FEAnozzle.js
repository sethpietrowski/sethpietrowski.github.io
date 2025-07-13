// creating nozzle geometry
const canvas = document.getElementById('fea-canvas');
const ctx = canvas.getContext('2d');

canvas.width = canvas.clientWidth * window.devicePixelRatio;
canvas.height = canvas.clientHeight * window.devicePixelRatio;
ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

//grid setup
const rows = 60;
const cols = 120;
const cellWidth = canvas.width / cols;
const cellHeight = canvas.height / rows;

// Flow field variables
const velocityX = Array(rows).fill().map(() => Array(cols).fill(0));
const velocityY = Array(rows).fill().map(() => Array(cols).fill(0));
const pressure = Array(rows).fill().map(() => Array(cols).fill(0));
const isInside = Array(rows).fill().map(() => Array(cols).fill(false));

// Global control point definitions (X-values scaled to canvas width)
const nozzleWidth = 700;
const scaleX = canvas.width / nozzleWidth;

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

// Bézier interpolation helper
function bezierQuadratic(t, p0, p1, p2) {
    const oneMinusT = 1 - t;
    return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
}

// Create nozzle domain (hourglass shape for now)
function createFlowDomain() {
    const topWall = [];     // top boundary Y values for each column
    const bottomWall = [];  // bottom boundary Y values for each column

    for (let j = 0; j < cols; j++) {
        const t = j / (cols - 1);
        const cp = controlPoints;

        const topY = bezierQuadratic(t,
            bezierQuadratic(t, cp.inlet_radius, cp.cp1y, cp.throat_radius),
            bezierQuadratic(t, cp.throat_radius, cp.cp2y, cp.switcher_y),
            bezierQuadratic(t, cp.switcher_y, cp.cp3y, cp.exit_radius)
        );
        const bottomY = -topY;

        topWall.push(canvas.height / 2 - topY);
        bottomWall.push(canvas.height / 2 - bottomY);
    }

    for (let j = 0; j < cols; j++) {
        const top = topWall[j];
        const bottom = bottomWall[j];

        for (let i = 0; i < rows; i++) {
            const y = i * cellHeight;
            if (y >= top && y <= bottom) {
                isInside[i][j] = true;
            }
        }

    // const pxToCol = canvas.width / cols;
    // const pyToRow = canvas.height / rows;

    // // Simulate rocket nozzle curve (from createNozzleGeometry)
    // function bezierQuadratic(t, p0, p1, p2) {
    //     const oneMinusT = 1 - t;
    //     return oneMinusT * oneMinusT * p0 + 2 * oneMinusT * t * p1 + t * t * p2;
    // }

    // const steps = cols;
    // for (let j = 0; j < steps; j++) {
    //     const t = j / (steps - 1);

    //     // control points from createNozzleGeometry
    //     const inlet_length = 75;
    //     const cp1x = 150, cp1y = 40;
    //     const throat_x = 175, throat_radius = 37.5;
    //     const cp2x = 225, cp2y = 30;
    //     const switcher_x = 275, switcher_y = 50;
    //     const cp3x = 450, cp3y = 125;
    //     const exit_x = 700, exit_radius = 150;

    //     const topY = bezierQuadratic(t,
    //         bezierQuadratic(t, 75, cp1y, throat_radius),
    //         bezierQuadratic(t, throat_radius, cp2y, switcher_y),
    //         bezierQuadratic(t, switcher_y, cp3y, exit_radius)
    //     );

    //     // symmetric - bottom wall
    //     const bottomY = -topY;

    //     topWall.push(canvas.height / 2 - topY); // shift to canvas center
    //     bottomWall.push(canvas.height / 2 - bottomY);
    }
}

// Basic flow simulation (need to update with real physics)
function updateFlow() {
    // Inlet velocity
    for (let i = 0; i < rows; i++) {
        if (isInside[i][0]) velocityX[i][0] = 5;
    }

    // Propagate using neighbor averaging
    for (let i = 1; i < rows - 1; i++) {
        for (let j = 1; j < cols - 1; j++) {
            if (!isInside[i][j]) continue;

            velocityX[i][j] = (
                velocityX[i - 1][j] +
                velocityX[i + 1][j] +
                velocityX[i][j - 1] +
                velocityX[i][j + 1]
            ) / 4;

            velocityY[i][j] = (
                velocityY[i - 1][j] +
                velocityY[i + 1][j] +
                velocityY[i][j - 1] +
                velocityY[i][j + 1]
            ) / 4;

            pressure[i][j] = Math.sqrt(velocityX[i][j] ** 2 + velocityY[i][j] ** 2);
        }
    }
}

function getColorFromPressure(p, min, max) {
    let normalized = 0;
    if (max !== min) {
        normalized = (p - min) / (max - min);
    }    
    const hue = (1-normalized) * 240; // 240 = blue, 0 = red
    return `hsl(${hue}, 100%, 50%)`;
}

// Draw color grid
function visualizeFlow() {
    const maxP = Math.max(...pressure.flat());
    const minP = Math.min(...pressure.flat());

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!isInside[i][j]) continue;

            const color = getColorFromPressure(pressure[i][j], minP, maxP);
            ctx.fillStyle = color;
            ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
        }
    }
}

// Draw nozzle contour lines for reference
function drawNozzleOutline() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;

    for (let j = 0; j < cols; j++) {
        let top = -1, bottom = -1;
        for (let i = 0; i < rows; i++) {
            if (isInside[i][j]) {
                if (top === -1) top = i;
                bottom = i;
            }
        }

        if (top !== -1 && bottom !== -1) {
            ctx.beginPath();
            ctx.moveTo(j * cellWidth, top * cellHeight);
            ctx.lineTo(j * cellWidth, bottom * cellHeight);
            ctx.stroke();
        }
    }
}

function createNozzleGeometry() {
    const cp = controlPoints

    ctx.save();
    ctx.translate(0, canvas.height / 2);

    ctx.beginPath();
    ctx.moveTo(0, cp.inlet_radius);
    ctx.lineTo(cp.inlet_length, cp.inlet_radius);
    ctx.quadraticCurveTo(cp.cp1x, cp.cp1y, cp.throat_x, cp.throat_radius);
    ctx.quadraticCurveTo(cp.cp2x, cp.cp2y, cp.switcher_x, cp.switcher_y);
    ctx.quadraticCurveTo(cp.cp3x, cp.cp3y, cp.exit_x, cp.exit_radius);
    ctx.lineTo(cp.exit_x, -cp.exit_radius);
    ctx.quadraticCurveTo(cp.cp3x, -cp.cp3y, cp.switcher_x, -cp.switcher_y);
    ctx.quadraticCurveTo(cp.cp2x, -cp.cp2y, cp.throat_x, -cp.throat_radius);
    ctx.quadraticCurveTo(cp.cp1x, -cp.cp1y, cp.inlet_length, -cp.inlet_radius);
    ctx.lineTo(0, -cp.inlet_length);
    ctx.closePath();

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

// Master animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateFlow();
    visualizeFlow();
    drawNozzleOutline();
    createNozzleGeometry();
    requestAnimationFrame(animate);
}

// Run simulation
createFlowDomain();
animate();