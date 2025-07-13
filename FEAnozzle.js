// creating nozzle geometry
const canvas = document.getElementById('fea-canvas');
const ctx = canvas.getContext('2d');

//creating 2d path for nozzle curve geometry
// function createNozzleGeometry(ctx) {
//     //position variables
//     inlet_radius = 75;
//     inlet_length = 75;
//     cp1x = 150;
//     cp1y = 40;
//     throat_x = 175;
//     throat_radius = 37.5;
//     cp2x = 225;
//     cp2y = 30;
//     switcher_x = 275;
//     switcher_y = 50;
//     cp3x = 450;
//     cp3y = 125; 
//     exit_x = 700;
//     exit_radius = 150;
    
//     ctx.clearRect(0,0, canvas.width, canvas.height);

//     ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
//     //canvas takes origin as top left corner, need to move it to 
//     // the middle of the left side
//     ctx.save();
//     ctx.translate(0, canvas.height / 2);

//     ctx.beginPath();
//     ctx.moveTo(0,inlet_radius);
//     ctx.lineTo(inlet_length, inlet_radius);
//     ctx.quadraticCurveTo(cp1x, cp1y, throat_x, throat_radius);
//     ctx.quadraticCurveTo(cp2x, cp2y, switcher_x, switcher_y);
//     ctx.quadraticCurveTo(cp3x, cp3y, exit_x, exit_radius);
//     ctx.lineTo(exit_x, -1 * exit_radius);
//     ctx.quadraticCurveTo(cp3x, -1 * cp3y, switcher_x, -1 * switcher_y);
//     ctx.quadraticCurveTo(cp2x, -1 * cp2y, throat_x, -1 * throat_radius);
//     ctx.quadraticCurveTo(cp1x, -1 * cp1y, inlet_length, -1 * inlet_radius);
//     ctx.lineTo(0, -inlet_length);
//     ctx.lineTo(0, inlet_length);
//     ctx.stroke();
//     ctx.closePath();

//     ctx.fillStyle = "#e0e0e0";
//     ctx.fill();
//     ctx.stroke();

//     ctx.restore(); //restore original state
// }
// createNozzleGeometry(ctx);

//grid setup
const rows = 60;
const cols = 120;
canvas.width = canvas.clientWidth * window.devicePixelRatio;
canvas.height = canvas.clientHeight * window.devicePixelRatio;

const cellWdith = canvas.width / cols;
const cellHeight = canvas.height / rows;

// Flow field variables
const velocityX = Array(rows).fill().map(() => Array(cols).fill(0));
const velocityY = Array(rows).fill().map(() => Array(cols).fill(0));
const pressure = Array(rows).fill().map(() => Array(cols).fill(0));
const isInside = Array(rows).fill().map(() => Array(cols).fill(false));

// Create nozzle domain as an hourglass shape
function createFlowDomain() {
    const centerY = Math.floor(rows / 2);

    for (let j = 0; j < cols; j++) {
        const xNorm = j / cols; // from 0 to 1
        const radiusFrac = 0.35 + 0.25 * Math.sin(Math.PI * xNorm); // hourglass shape

        const halfHeight = Math.floor(radiusFrac * rows / 2);

        for (let i = centerY - halfHeight; i <= centerY + halfHeight; i++) {
            if (i >= 0 && i < rows) {
                isInside[i][j] = true;
            }
        }
    }
}

// Basic flow simulation (not physical)
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

// Master animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateFlow();
    visualizeFlow();
    drawNozzleOutline();
    requestAnimationFrame(animate);
}

// Run simulation
createFlowDomain();
animate();