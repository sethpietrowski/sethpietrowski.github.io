import { ctx } from '../rendering/CanvasSetup.js';
import { visualizeFlow } from '../rendering/flowVisualization.js';
import { createNozzleGeometry } from '../rendering/nozzleGeometry.js';
import { updateFlowStabilized } from './physics.js';
import { drawConvergenceChart } from '../rendering/convergenceChart.js';
import { 
    simulationState, timeStep, totalIterations, animationId,
    convergenceTolerances
} from './state.js';

export function updateSimulationStatus(status) {
    simulationState = status;
    const statusElement = document.getElementById('simulation-status');
    const indicatorElement = document.getElementById('status-indicator');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

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
    document.getElementById('time-step').textContent = timeStep;
    document.getElementById('total-iterations').textContent = totalIterations;
    document.getElementById('velocity-residual').textContent = residuals.velocity.toExponential(3);
    document.getElementById('pressure-residual').textContent = residuals.pressure.toExponential(3);
    document.getElementById('mass-residual').textContent = residuals.mass.toExponential(3);

    drawConvergenceChart();
}

export function updateTolerances() {
    convergenceTolerances.velocity = parseFloat(document.getElementById('vel-tolerance').value) || 1e-6;
    convergenceTolerances.pressure = parseFloat(document.getElementById('press-tolerance').value) || 1e-6;
    convergenceTolerances.mass = parseFloat(document.getElementById('mass-tolerance').value) || 1e-6;
}

export function animate() {
    
    if (simulationState.value !== 'running') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //update flow every other frame
    if (timeStep % 2 === 0) {
        updateTolerances();
        const shouldContinue = updateFlowStabilized();

        if (!shouldContinue) {
            //simualtion converged or failed
            if(animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            simulationState.value = 'converged';
            updateSimulationStatus('converged');

            //render final state
            visualizeFlow();
            createNozzleGeometry();
            return;
        }
    }
    timeStep++;

    //render current state
    visualizeFlow();
    createNozzleGeometry();

    //continue animation
    animationId = requestAnimationFrame(animate);
}