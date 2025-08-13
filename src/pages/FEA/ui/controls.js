import { 
    createFlowDomain, 
    calculateWallAngles, 
    initializeFlow,
    simulation,
    animationId, 
    updateSimulationStatus 
} from "../simulation/state.js";
import { updateFlowStabilized } from "../simulation/physics.js";
import { visualizeFlow } from "../rendering/flowVisualization.js";
import { createNozzleGeometry } from "../geometry/nozzleGeometry.js";
import { visualizationMode } from "../simulation/state.js";
import { updateTolerances } from "../simulation/loop.js";

class SimulationManager {
    start() {
        if (simulation.state === 'stopped' || simulation.state === 'converged') {
            createFlowDomain();
            calculateWallAngles();
            initializeFlow();
        } else if (simulation.state === 'paused') {
            updateSimulationStatus('running');
        }
        if (!animationId) {
            this.animate();
        }
    }

    pause() {
        if (simulation.state === 'running') {
            updateSimulationStatus('paused');
            cancelAnimationFrame(animationId);
            animationId = null;
            visualizeFlow();
            createNozzleGeometry();
        }
    }

    reset() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        updateSimulationStatus('stopped');
        createFlowDomain();
        calculateWallAngles();
        initializeFlow();

        const canvas = document.getElementById('fea-canvas');
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        visualizeFlow();
        createNozzleGeometry();
        
        const convergenceCanvas = document.getElementById('convergence-canvas').getContext('2d');
        const convergenceCtx = convergenceCanvas.getContext('2d');
        convergenceCtx.clearRect(0, 0, convergenceCanvas.width, convergenceCanvas.height);
    }

    animate() {
        if (updateFlowStabilized()) {
            visualizeFlow();
            animationId = requestAnimationFrame(() => this.animate);
        } else {
            updateSimulationStatus('converged');
        }
    }
}

//event listener for visualization mode
export function setupVisualizationModeControls() {
    document.querySelectorAll('input[name="vizMode"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            window.visualizationMode = e.target.value; //fix later
        });
    });
}

//Tolerance input listeners
export function setupToleranceControls() {
    ['vel-tolerance', 'press-tolerance', 'mass-tolerance'].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', updateTolerances);
    });
}

export const simManager = new SimulationManager();