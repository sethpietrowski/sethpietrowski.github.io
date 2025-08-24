//ui.js - ui controls and event handling

import {simulation, getAnimationId, setAnimationId, setConvergenceTolerance, getSimulationData, getCallbacks} from './core.js';
import { updateFlowStabilized, getLatestResiduals } from "./physics.js";
import { visualizeFlow, createNozzleGeometry, drawConvergenceChart } from "./rendering.js"; 

//simulation status updates

export function updateSimulationStatus(status) {
    simulation.state = status;
    const statusElement = document.getElementById('simulation-status');
    const indicatorElement = document.getElementById('status-indicator');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');

    //skip DOM updates is elements not found (for testing)
    if (!statusElement || !indicatorElement || !startBtn || !pauseBtn) {
        console.log('Status updated to: ', status, '(DOM elements not found)');
        return;
    }
    
    const statusMap = {
        'running': { text: 'Running', class: 'status-indicator status-running', startDisabled: true, pauseDisabled: false },
        'paused': { text: 'Paused', class: 'status-indicator status-paused', startDisabled: false, pauseDisabled: true },
        'converged': { text: 'Converged', class: 'status-indicator status-converged', startDisabled: false, pauseDisabled: true },
        'stopped': { text: 'Ready', class: 'status-indicator status-paused', startDisabled: false, pauseDisabled: true },
        'ready': { text: 'Ready', class: 'status-indicator status-paused', startDisabled: false, pauseDisabled: true },
        'error': { text: 'Error', class: 'status-indicator status-error', startDisabled: true, pauseDisabled: true }
    };

    const config = statusMap[status.toLowerCase()];
    if(!config) {
        console.warm('Unknown status:', status);
        return;
    }

    statusElement.textContent = config.text;
    indicatorElement.className = config.class;
    startBtn.disabled = config.startDisabled;
    pauseBtn.disabled = config.pauseDisabled;

    console.log('Status updated to:', config.text);
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

    const callbacks = getCallbacks();
    if (callbacks?.onConvergenceUpdate) {
        callbacks.onConvergenceUpdate({
            timeStep: simulation.timeStep,
            totalIterations: simulation.totalIterations,
            velocityResidual: residuals.velocity.toExponential(3),
            pressureResidual: residuals.pressure.toExponential(3),
            massResidual: residuals.mass.toExponential(3),
        });
    }

    const convergenceCanvas = document.getElementById('convergence-canvas');
    if (convergenceCanvas) {
        drawConvergenceChart(convergenceCanvas);
    }
}

//tolerance controls

export function updateTolerances() {
    const velToleranceInput = document.getElementById('vel-tolerance');
    const pressToleranceInput = document.getElementById('press-tolerance');
    const massToleranceInput = document.getElementById('mass-tolerance');

    if (velToleranceInput) {
        const value = parseFloat(velToleranceInput.value) || 1e-6;
        setConvergenceTolerance('velocity', value);
    }

    if (pressToleranceInput) {
        const value = parseFloat(pressToleranceInput.value) || 1e-6;
        setConvergenceTolerance('pressure', value);
    }

    if (massToleranceInput) {
        const value = parseFloat(massToleranceInput.value) || 1e-6;
        setConvergenceTolerance('mass', value);
    }

}

export function setupToleranceControls() {
    const toleranceIds = ['vel-tolerance', 'press-tolerance', 'mass-tolerance'];

    toleranceIds.forEach((id) => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', updateTolerances);
            input.addEventListener('input', updateTolerances); //real-time updates
        }
    });
}

//animation loop

export function startAnimationLoop(canvas, simulationData, callbacks) {
    console.log('Stating animation loop...');

    const animate = () => {
        if (simulation.state !== 'running') {
            console.log('Animation loop stopped - simulation not running');
            return;
        }

        if (!simulationData) {
            console.error('Simulation data not available for animation');
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get canvas context');
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (simulation.timeStep % 2 === 0) {
            updateTolerances();

            let shouldContinue;
            try {
                shouldContinue = updateFlowStabilized(simulationData);
            } catch (error) {
                console.error('Error updating flow: ', error);
                simulation.state = 'error';
                updateSimulationStatus('error');
                return;
            }

            //update convergence display
            try {
                const residuals = getLatestResiduals(simulationData);
                updateConvergenceDisplay(residuals);
            } catch (error) {
                console.error('Error updating convergence display: ', error);
            }

            if (!shouldContinue) {
                //simulation converged or failed
                const animationId = getAnimationId();
                if(animationId !== null) {
                    cancelAnimationFrame(animationId);
                    setAnimationId(null);
                }
                simulation.state = 'converged';
                updateSimulationStatus('converged');

                renderFinalState(ctx, simulationData, callbacks);
                return;
            }
        }

        simulation.timeStep++;

        try {
            renderCurrentFrame(ctx, simulationData, callbacks);
        } catch (error) {
            console.error('Error rendering frame: ', error);
        }

        const newAnimationId = requestAnimationFrame(animate);
        setAnimationId(newAnimationId);
    };

    const animationId = requestAnimationFrame(animate);
    setAnimationId(animationId);
}

export function stopAnimationLoop() {
    const animationId = getAnimationId();
    if(animationId !== null) {
        cancelAnimationFrame(animationId);
        setAnimationId(null);
        console.log('Animation loop stopped');
    }
}

function renderCurrentFrame(ctx, simulationData, callbacks) {
    visualizeFlow(ctx, simulationData, callbacks);
    createNozzleGeometry(ctx, simulationData);
}

function renderFinalState(ctx, simulationData, callbacks) {
    console.log('Rendering final convergeed state');
    renderCurrentFrame(ctx, simulationData, callbacks);
}

//event handlers setup

let controlHandlers = null;

export function setupControlButtons(simulationControl) {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    //store handlers to prevent multiple bindings
    controlHandlers = {
        start: () => {
            console.log('Start button clicked');
            if (simulationControl?.start) {
                simulationControl.start();
            }
        },
        pause: () => {
            console.log('Pause button clicked');
            if (simulationControl?.pause) {
                simulationControl.pause();
            }
        },
        reset: () => {
            console.log('Reset button clicked');
            if (simulationControl?.reset) {
                simulationControl.reset();
            }
        }
    };

    if (startBtn) {
        startBtn.removeEventListener('click', controlHandlers.start); //remove existing
        startBtn.addEventListener('click', controlHandlers.start);
    }
    if (pauseBtn) {
        pauseBtn.removeEventListener('click', controlHandlers.pause);
        pauseBtn.addEventListener('click', controlHandlers.pause);
    }
    if (resetBtn) {
        resetBtn.removeEventListener('click', controlHandlers.reset);
        resetBtn.addEventListener('click', controlHandlers.reset);
    }

    console.log('Control buttons setup complete');
}

export function setupVisualizationModeControls() {
    const radios = document.querySelectorAll('input[name="vizMode"]');

    radios.forEach((radio) => {
        radio.addEventListener('change', (e) => {
            const simulationData = getSimulationData();
            if (simulationData) {
                simulationData.visualizationMode = e.target.value;

                //immediately update visualization
                const canvas = document.getElementById('fea-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    renderCurrentFrame(ctx, simulationData, getCallbacks());
                }

                console.log('Visualization mode changed to: ', e.target.value);
            }
        });
    });  
}

//resize handling

export function setupResize(canvas) {
    let resizeTimeout;

    const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('Handling resize');
            //resize logic goes here (FIX)
        }, 150);
    };

    window.addEventListener('resize', handleResize);

    //return cleanup function
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
    };
}

//initialization helpers

export function initializeUI(simulationControl) {
    console.log('Initializing UI controls...');

    try {
        setupVisualizationModeControls();
        setupToleranceControls();
        setupControlButtons(simulationControl);
        console.log('UI initialization complete');
    } catch (error) {
        console.error('Error initializing UI: ', error);
    }
}