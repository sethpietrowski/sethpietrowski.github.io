// creating nozzle geometry
const canvas = document.getElementById('fea-canvas');
const ctx = canvas.getContext('2d');

//creating 2d path for nozzle curve geometry
function createNozzleGeometry(ctx) {
    //position variables
    inlet_radius = 75;
    inlet_length = 75;
    cp1x = 150;
    cp1y = 40;
    throat_x = 175;
    throat_radius = 37.5;
    cp2x = 225;
    cp2y = 30;
    switcher_x = 275;
    switcher_y = 50;
    cp3x = 450;
    cp3y = 125;
    exit_x = 700;
    exit_radius = 150;
    
    ctx.clearRect(0,0, canvas.width, canvas.height);

    //canvas takes origin as top left corner, need to move it to 
    // the middle of the left side
    ctx.save();
    ctx.translate(0, canvas.height / 2);

    ctx.beginPath();
    ctx.moveTo(0,inlet_radius);
    ctx.lineTo(inlet_length, inlet_radius);
    ctx.quadraticCurveTo(cp1x, cp1y, throat_x, throat_radius);
    ctx.quadraticCurveTo(cp2x, cp2y, switcher_x, switcher_y);
    ctx.quadraticCurveTo(cp3x, cp3y, exit_x, exit_radius);
    ctx.lineTo(exit_x, -1 * exit_radius);
    ctx.quadraticCurveTo(cp3x, -1 * cp3y, switcher_x, -1 * switcher_y);
    ctx.quadraticCurveTo(cp2x, -1 * cp2y, throat_x, -1 * throat_radius);
    ctx.quadraticCurveTo(cp1x, -1 * cp1y, inlet_length, -1 * inlet_radius);
    ctx.lineTo(0, -inlet_length);
    ctx.lineTo(0, inlet_length);
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "#e0e0e0";
    ctx.fill();
    ctx.stroke();

    ctx.restore(); //restore original state
}
createNozzleGeometry(ctx);

// Creating FEA domain
function createGrid(ctx, rows, cols) {
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    ctx.save();
    ctx.translate(0, canvas.height / 2); //align with nozzle
    ctx.strokeStyle = '#ccc';
    for (let i=0; i<=rows; i++) {
        const y = i * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y - canvas.height / 2); //align vertically
        ctx.lineTo(canvas.width, y - canvas.height / 2);
        ctx.stroke();
    }
    for (let i=0; i<=cols; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, -canvas.height / 2);
        ctx.lineTo(x, canvas.height / 2);
        ctx.stroke();
    }
    ctx.restore();
}
createGrid(ctx, 20, 40) // (x, y, z) - y is #rows, z is #cols

// variables for quantities of velocity, pressure storing
const rows = 20;
const cols = 40;
const velocityX = Array(rows).fill().map(() => Array(cols).fill(0));
const velocityY = Array(rows).fill().map(() => Array(cols).fill(0));
const pressure = Array(rows).fill().map(() => Array(cols).fill(0));

//equations for velocity and pressure
function updateFlow() {
    for (let i=1; i<rows-1; i++) {
        for (let j=1; j<cols-1; j++) {
            velocityX[i][j] = (velocityX[i - 1][j] + velocityX[i + 1][j] + velocityX[i][j - 1] + velocityX[i][j + 1]) / 4;
            velocityY[i][j] = (velocityY[i - 1][j] + velocityY[i + 1][j] + velocityY[i][j - 1] + velocityY[i][j + 1]) / 4;

            pressure[i][j] = Math.sqrt(velocityX[i][j]**2 + velocityY[i][j]**2);
        }
    }
}

function getColorFromPressure(pressureValue, minPressure, maxPressure) {
    const normalized = (pressureValue - minPressure) / (maxPressure - minPressure);
    const hue = (1-normalized) * 240;
    return `hsl(${hue}, 100%, 50%)`;
}

//correlate numeric to color value
function visualizeFlow(ctx) {
    const maxPressure = Math.max(...pressure.flat());
    const minPressure = Math.min(...pressure.flat());

    for (let i = 0; i<rows; i++) {
        for (let j = 0; j<cols; j++) {
            const color = getColorFromPressure(pressure[i][j], minPressure, maxPressure);
            ctx.fillStyle = color;
            ctx.fillRect(j * canvas.width / cols, i * canvas.height / rows, canvas.width / cols, canvas.height / rows);
        }
    }
}


//animate the visualization
function animate() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    createNozzleGeometry(ctx);
    visualizeFlow(ctx);
    updateFlow();
    requestAnimationFrame(animate);
}
animate();