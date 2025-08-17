import { visualizeFlow } from '../rendering/flowVisualization.js';
import { createNozzleGeometry } from '../rendering/nozzleRender.js';
import { updateFlowStabilized } from './physics.js';
import { drawConvergenceChart } from '../rendering/charts.js';
import { 
    simulation, timeStep, totalIterations,
    convergenceTolerances, setAnimationId, getAnimationId
} from './state.js';

let simulationData = null;

export function setSimulationDataForLoop(data) {
    simulationData = data;
}

export function updateSimulationStatus(status) {
    simulation.state = status;
    const statusElement = document.getElementById('simulation-status');
    const indicatorElement = document.getElementById('status-indicator');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    if (!statusElement || !indicatorElement || !startBtn || !pauseBtn) return; //skip DOM updates if elements not found
    
    const statusMap = {
        running: { text: 'Running', class: 'status-indicator status-running', startDisabled: true, pauseDisabled: false },
        paused: { text: 'Paused', class: 'status-indicator status-paused', startDisabled: false, pauseDisabled: true },
        converged: { text: 'Converged', class: 'status-indicator status-converged', startDisabled: false, pauseDisabled: true },
        stopped: { text: 'Ready', class: 'status-indicator status-paused', startDisabled: false, pauseDisabled: true }
    };

    const config = statusMap[status];
    if (!config) return; //unknown status

    statusElement.textContent = config.text;
    indicatorElement.className = config.class;
    startBtn.disabled = config.startDisabled;
    pauseBtn.disabled = config.pauseDisabled;
}

export function updateConvergenceDisplay(residuals) {
    const timeStepElement = document.getElementById('time-step');
    const totalIterationsElement = document.getElementById('total-iterations');
    const velocityResidualElement = document.getElementById('velocity-residual');
    const pressureResidualElement = document.getElementById('pressure-residual');
    const massResidualElement = document.getElementById('mass-residual');

    if (timeStepElement) timeStepElement.textContent = simulation.timeStep;
    if (totalIterationsElement) totalIterationsElement.textContent = simulation.totalIterations;
    if (velocityResidualElement) velocityResidualElement.textContent = residuals.velocity.toExponential(3);
    if (pressureResidualElement) pressureResidualElement.textContent = residuals.pressure.toExponential(3);
    if (massResidualElement) massResidualElement.textContent = residuals.mass.toExponential(3);

    const convergenceCanvas = document.getElementById('convergence-canvas');
    if (convergenceCanvas) {
        drawConvergenceChart(convergenceCanvas);
    }
}

export function updateTolerances() {
    const velToleranceInput = document.getElementById('vel-tolerance');
    const pressToleranceInput = document.getElementById('press-tolerance');
    const massToleranceInput = document.getElementById('mass-tolerance');

    if (velToleranceInput) {
        convergenceTolerances.velocity = parseFloat(velToleranceInput.value) || 1e-6;
    }

    if (pressToleranceInput) {
        convergenceTolerances.pressure = parseFloat(pressToleranceInput.value) || 1e-6;
    }

    if (massToleranceInput) {
        convergenceTolerances.mass = parseFloat(massToleranceInput.value) || 1e-6;
    }

}

export function animate() {
    
    if (simulation.state !== 'running') return;
    
    if (!simulationData) {
        console.error('Simulation data not available for animation');
        return;
    }

    const canvas = document.getElementById('fea-canvas');

    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //update flow every other frame
    if (simulation.timeStep % 2 === 0) {
        updateTolerances();
        const shouldContinue = updateFlowStabilized();

        if (!shouldContinue) {
            //simulation converged or failed
            const animationId = getAnimationId();
            if(animationId !== null) {
                cancelAnimationFrame(animationId);
                setAnimationId(null);
            }
            simulation.state = 'converged';
            updateSimulationStatus('converged');

            //render final state
            visualizeFlow(
                ctx,
                simulationData.controlPoints,
                simulationData.scaleY,
                simulationData.rows,
                simulationData.cols,
                simulationData.velocityX,
                simulationData.velocityY,
                simulationData.pressure,
                simulationData.density,
                simulationData.temperature,
                simulationData.isInside,
                simulationData.isBoundary,
                simulationData.cellWidth,
                simulationData.cellHeight,
                simulationData.visualizationMode
            );
            createNozzleGeometry(ctx, simulationData.controlPoints, simulationData.scaleY);
            return;
        }
    }

    simulation.timeStep++;

    //render current state
    visualizeFlow(
        ctx,
        simulationData.controlPoints,
        simulationData.scaleY,
        simulationData.rows,
        simulationData.cols,
        simulationData.velocityX,
        simulationData.velocityY,
        simulationData.pressure,
        simulationData.density,
        simulationData.temperature,
        simulationData.isInside,
        simulationData.isBoundary,
        simulationData.cellWidth,
        simulationData.cellHeight,
        simulationData.visualizationMode
    )
    createNozzleGeometry(ctx, simulationData.controlPoints, simulationData.scaleY);

    //continue animation
    const newAnimationId = requestAnimationFrame(animate);
    setAnimationId(newAnimationId);
    simulation.totalIterations++;
}