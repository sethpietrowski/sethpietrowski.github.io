import '../styles.css';
import Banner from '../../components/Banner/banner.jsx';
import { useRef, useEffect, useState, useCallback } from 'react';
import { initFEA } from '../FEA/core.js';
import { initializeUI } from '../FEA/ui.js';
import { setupCanvas, drawConvergenceChart } from '../FEA/rendering.js';
//import { simulation, totalIterations } from './simulation/state';

export default function FEA() {
    const convergenceCanvasRef = useRef(null);
    const canvasRef = useRef(null);
    const [simulationStatus, setSimulationStatus] = useState('Initializing');
    const [isRunning, setIsRunning] = useState(false);
    const [visualizationMode, setVisualizationMode] = useState('velocity');
    const [stats, setStats] = useState({ min : 0, avg: 0, max: 0});
    const [convergenceData, setConvergenceData] = useState({
        timeStep: 0,
        totalIterations: 0,
        velocityResidual: '-',
        pressureResidual: '-',
        massResidual: '-',
    });

    const simulationRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);


     // Define your simulation data
    const simulationData = useRef({
        controlPoints: {
            inlet_radius: 20,
            inlet_length: 50,
            cp1x: 60, cp1y: 25,
            cp2x: 100, cp2y: 40,
            cp3x: 150, cp3y: 60,
            throat_x: 90, throat_radius: 15,
            switcher_x: 120, switcher_y: 35,
            exit_x: 200, exit_radius: 50
        },
        scaleY: 2,           // adjust scaling for display
        rows: 100,
        cols: 200,
        cellWidth: 5,
        cellHeight: 5,
        canvasHeight: 500,
        visualizationMode: visualizationMode,
        // empty arrays to be populated by createFlowDomain
        velocityX: [],
        velocityY: [],
        pressure: [],
        temperature: [],
        density: [],
        isInside: [],
        isBoundary: [],
    });

    useEffect(() => {
        if (isInitialized && simulationData.current && simulationRef.current.updateVisualization) {
            simulationData.visualizationMode = visualizationMode;
            simulationRef.current.updateVisualization();
        }
    }, [visualizationMode, isInitialized]);

    const handleStart = useCallback(() => {
        if (simulationRef.current && simulationRef.current.start) {
            simulationRef.current.start();
            setIsRunning(true);
            setSimulationStatus('Running');
        }
    }, []);

    const handlePause = useCallback(() => {
        if (simulationRef.current && simulationRef.current.pause) {
            simulationRef.current.pause();
            setIsRunning(false);
            setSimulationStatus('Paused');
        }
    }, []);

    const handleReset = useCallback(() => {
        if (simulationRef.current && simulationRef.current.reset) {
            simulationRef.current.reset();
            setIsRunning(false);
            setSimulationStatus('Reset');
            setStats({ min: 0, avg: 0, max: 0 });
            setConvergenceData({
                timeStep: 0,
                totalIterations: 0,
                velocityResidual: '-',
                pressureResidual: '-',
                massResidual: '-',
            });
        }
    }, []);

    const handleToleranceChange = useCallback((type, value) => {
        if (simulationRef.current && simulationRef.current.setTolerance) {
            simulationRef.current.setTolerance(type, parseFloat(value));
        }
    }, []);

    useEffect(() => {
        let timeoutId;

        const initializeSimulation = () => {
            console.log('Initializing simulation...');
            console.log('Canvas ref:', canvasRef.current);
            console.log('Simulation data:', simulationData.current);

            
            if (!canvasRef.current) {
                console.log('Canvas not ready yet, retrying');
                timeoutId = setTimeout(initializeSimulation, 100);
                return;
            }

            try {
                console.log('Canvas is ready, initializing FEA...');
                
                setupCanvas(
                     canvasRef.current,
                     document.getElementById('colorbar'),
                     convergenceCanvasRef.current
                 );

                simulationControlRef.current = initFEA(canvasRef.current, simulationData);
                
                if (simulationRef.current && simulationRef.current.setCallbacks) {
                    simulationRef.current.setCallbacks({
                        onStatusUpdate: setSimulationStatus,
                        onStatsUpdate: setStats,
                        onConvergenceUpdate: setConvergenceData
                    });

                    initializeUI(simulationControlRef.current);

                    setIsInitialized(true);
                    setSimulationStatus('Ready');
                    console.log('Simulation initialized successfully');
                } else {
                    console.error('Failed to initialize FEA callbacks');
                    setSimulationStatus('Error');
                }
            } catch (error) {
                console.error('Failed to initialize FEA', error);
                setSimulationStatus('Error');
            }
        };

        timeoutId = setTimeout(initializeSimulation, 200);

        const initChart = () => {
            if (convergenceCanvasRef.current) {
                try {
                    drawConvergenceChart(convergenceCanvasRef.current);
                } catch (error) {
                    console.error('Failed to draw convergence chart', error);
                }
            }
        };
        setTimeout(initChart, 300);

        //cleanup function
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);                
            }    
            if (simulationControlRef.current?.cleanup) {
                simulationControlRef.current.cleanup();
            }
        };
    }, []);

    const handleVisualizationModeChange = useCallback((e) => {
        setVisualizationMode(e.target.value);
    }, []);

    return (
        <>
            <Banner />
            <div className="title">
                <h1>FEA Nozzle Simulator</h1>
            </div>
            <div className="main-layout">
                <div className="left-section">
                    <div className="canvas-area">
                        <canvas ref={canvasRef} id="fea-canvas" width="1000" height="500" />
                        <div className="colorbar-container">
                            <div id="colorbar-title" className="colorbar-labels">
                                {visualizationMode.charAt(0).toUpperCase() + visualizationMode.slice(1)}
                            </div>
                            <div id="max-label" className="colorbar-labels">
                                {stats.max.toFixed(3)}
                            </div>
                            <canvas id="colorbar" width="30" height="400"></canvas>
                            <div id="mid-label" className="colorbar-labels" style={{ position: 'absolute', marginTop: '150px' }}>
                                {stats.avg.toFixed(3)}
                            </div>
                            <div id="min-label" className="colorbar-labels">
                                {stats.min.toFixed(3)}
                            </div>
                        </div>
                    </div>
                    <div className="controls">
                        <strong>Visualization Mode:</strong>
                        <label><input type="radio" name="vizMode" value="pressure" checked={visualizationMode === 'pressure'} onChange={handleVisualizationModeChange} />Pressure</label>
                        <label><input type="radio" name="vizMode" value="velocity" checked={visualizationMode === 'velocity'} onChange={handleVisualizationModeChange} />Velocity</label>
                        <label><input type="radio" name="vizMode" value="temperature" checked={visualizationMode === 'temperature'} onChange={handleVisualizationModeChange} />Temperature</label>
                        <label><input type="radio" name="vizMode" value="density" checked={visualizationMode === 'density'} onChange={handleVisualizationModeChange} />Density</label>
                    </div>

                    <div className="stats">
                        <div className="stat-item">
                            Min: <span id="min-value" className="stat-value">{stats.min.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                            Avg: <span id="avg-value" className="stat-value">{stats.avg.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                            Max: <span id="max-value" className="stat-value">{stats.max.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="right-section">
                    <div className="convergence-info">
                        <h3>Simulation Status</h3>
                        <div className="convergence-metric">
                            <span className={`status-indicator ${simulationStatus.toLowerCase()}`}
                                id="status-indicator"
                            ></span>
                            Status: <span id="simulation-status">{simulationStatus}</span>
                        </div>
                        <div className="convergence-metric">
                            Time Step: <span className="convergence-value" id="time-step">
                                {convergenceData.timeStep}
                            </span>
                        </div>
                        <div className="convergence-metric">
                            Iterations: <span className="convergence-value" id="total-iterations">
                                {convergenceData.totalIterations}
                            </span>
                        </div>
                        <div className="convergence-metric">
                            Velocity Residual: <span className="convergence-value" id="velocity-residual">
                                {convergenceData.velocityResidual}
                            </span>
                        </div>
                        <div className="convergence-metric">
                            Pressure Residual: <span className="convergence-value" id="pressure-residual">
                                {convergenceData.pressureResidual}
                            </span>
                        </div>
                        <div className="convergence-metric">
                            Mass Residual: <span className="convergence-value" id="mass-residual">
                                {convergenceData.massResidual}
                            </span>
                        </div>
                    </div>

                    <div className="convergence-controls">
                        <h3>Controls</h3>
                        <button className="control-button" id="start-btn" onClick={handleStart} disabled={isRunning}>Start</button>
                        <button className="control-button" id="pause-btn" onClick={handlePause} disabled={!isRunning}>Pause</button>
                        <button className="control-button" id="reset-btn" onClick={handleReset}>Reset</button>
                        <hr />
                        <div style={{ margin: '10px 0' }}>
                            <label>Velocity Tolerance:</label><br />
                            <input 
                                type="number" 
                                className="tolerance-input" 
                                id="vel-tolerance" 
                                defaultValue="1e-6" 
                                step="1e-7" 
                                placeholder="1e-6"
                                onChange={(e) => handleToleranceChange('velocity', e.target.value)}
                            /> 
                        </div>
                        <div style={{ margin: '10px 0' }}>
                            <label>Pressure Tolerance:</label><br />
                            <input 
                                type="number" 
                                className="tolerance-input" 
                                id="press-tolerance" 
                                defaultValue="1e-6" 
                                step="1e-7" 
                                placeholder="1e-6"
                                onChange={(e) => handleToleranceChange('pressure', e.target.value)}
                            /> 
                        </div>
                        <div style={{ margin: '10px 0' }}>
                            <label>Mass Tolerance:</label><br />
                            <input 
                                type="number" 
                                className="tolerance-input" 
                                id="mass-tolerance" 
                                defaultValue="1e-6" 
                                step="1e-7" 
                                placeholder="1e-6"
                                onChange={(e) => handleToleranceChange('mass', e.target.value)}
                            /> 
                        </div>
                    </div>

                    <div className="convergence-canvas">
                        <h3>Convergence History</h3>
                        <canvas 
                            ref={convergenceCanvasRef} 
                            id="convergence-canvas" 
                            width="400" 
                            height="250"
                        />
                    </div>        
                </div>
            </div>
        </>
    );
}