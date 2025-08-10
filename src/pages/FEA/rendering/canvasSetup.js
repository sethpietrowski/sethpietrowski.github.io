export function setupCanvas(canvas, colorbarCanvas, convergenceCanvas) {
    const mainSize = { width: canvas.width, height: canvas.height };
    colorbarCanvas.width = 30;
    colorbarCanvas.height = 400;
    convergenceCanvas.width = 380;
    convergenceCanvas.height = 250;
    return mainSize;
}