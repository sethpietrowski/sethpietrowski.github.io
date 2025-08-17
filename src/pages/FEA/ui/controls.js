import { initializeFlow, simulation, animationId, getAnimationId } from "../simulation/state.js";
import { updateFlowStabilized } from "../simulation/physics.js";
import { visualizeFlow } from "../rendering/flowVisualization.js";
import { createNozzleGeometry } from "../rendering/nozzleRender.js";
import { calculateWallAngles } from "../geometry/nozzleGeometry.js";
import { updateTolerances, updateSimulationStatus } from "../simulation/loop.js";
import { createFlowDomain } from "../geometry/flowDomain.js";

let simulationData = null;

export function setSimulationData(data) {
    simulationData = data;
}

class SimulationManager {
    start() {
        if (!simulationData) {
            console.error('Simulation data not set');
            return;
        }
        
        if (simulation.state === 'stopped' || simulation.state === 'converged') {
            createFlowDomain(simulationData.cols, simulationData.rows, simulationData);
            calculateWallAngles(
                simulationData.cols,
                simulationData.cellWidth,
                simulationData.controlPoints,
                simulationData.scaleY,
                simulationData.canvasHeight
            );
            initializeFlow();
        } else if (simulation.state === 'paused') {
            updateSimulationStatus('running');
        }
        const animationId = getAnimationId();
        if (!animationId) {
            animate();
        }
    }

    pause() {
        if (simulation.state === 'running') {
            updateSimulationStatus('paused');
            const animationId = getAnimationId();
            if (animationId) {
                cancelAnimationFrame(animationId);
                setAnimationId(null);
            }
            
            const canvas = document.getElementById('fea-canvas');
            if (canvas && simulationData) {
                const ctx = canvas.getContext('2d');
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
            }
        }
    }

    reset() {
        const animationId = getAnimationId();
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        updateSimulationStatus('stopped');
        
        if (simulationData) {
            createFlowDomain(simulationData.cols, simulationData.rows, simulationData);
            calculateWallAngles(
                simulationData.cols,
                simulationData.cellWidth,
                simulationData.controlPoints,
                simulationData.scaleY,
                simulationData.canvasHeight
            );
            initializeFlow();

            const canvas = document.getElementById('fea-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

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
            }
        }
        
        const convergenceCanvas = document.getElementById('convergence-canvas');
        if (convergenceCanvas) {
            const convergenceCtx = convergenceCanvas.getContext('2d');
            convergenceCtx.clearRect(0, 0, convergenceCanvas.width, convergenceCanvas.height);
        }
    }
}

//event listener
export function setupVisualizationModeControls() {
    document.querySelectorAll('input[name="vizMode"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            if (simulationData) {
                simulationData.visualizationMode = e.target.value;

                const canvas = document.getElementById('fea-canvas');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
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
                }
            }
        });
    });
}

//Tolerance input listener
export function setupToleranceControls() {
    ['vel-tolerance', 'press-tolerance', 'mass-tolerance'].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', updateTolerances);
    });
}

export const simManager = new SimulationManager();

//setup control button event listeners
export function setupControlButtons() {
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    if (startBtn) {
        startBtn.addEventListener('click', () =>simManager.start);
    }
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => simManager.pause);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', () => simManager.reset);
    }
}