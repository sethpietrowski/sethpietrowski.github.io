export function setupCanvas(canvas, colorbarCanvas, convergenceCanvas) {
    const ctx = canvas.getContext('2d');

    canvas.width = 1000;
    canvas.height = 500;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    colorbarCanvas.width = 30;
    colorbarCanvas.height = 400;
    convergenceCanvas.width = 380;
    convergenceCanvas.height = 250;
    return ctx;
}