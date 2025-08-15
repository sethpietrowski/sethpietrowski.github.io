import '../styles.css';
import Banner from '../components/Banner';
import { useEffect } from 'react';
import { initFEA } from '../FEA/mainFEA';
import { drawConvergenceChart } from '../FEA/rendering/charts';

export default function FEA() {
    const convergenceCanvasRef = useRef(null);
    
    useEffect(() => {
        initFEA();

        // Draw convergence chart once the canvas is mounted
        if (convergenceCanvasRef.current) {
        drawConvergenceChart(convergenceCanvasRef.current);
        }
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
                        <canvas id="fea-canvas" width="1000" height="500"></canvas>
                        <div className="colorbar-container">
                            <div id="colorbar-title" className="colorbar-labels">Velocity</div>
                            <div id="max-label" className="colorbar-labels">0.000</div>
                            <canvas id="colorbar" width="30" height="400"></canvas>
                            <div id="mid-label" className="colorbar-labels" style={{ position: 'absolute', marginTop: '150px' }}>0.000</div>
                            <div id="min-label" className="colorbar-labels">0.000</div>
                        </div>
                    </div>
                    <div className="controls">
                        <strong>Visualization Mode:</strong>
                        <label><input type="radio" name="vizMode" value="pressure" />Pressure</label>
                        <label><input type="radio" name="vizMode" value="velocity" defaultChecked />Velocity</label>
                        <label><input type="radio" name="vizMode" value="temperature" />Temperature</label>
                        <label><input type="radio" name="vizMode" value="density" />Density</label>
                    </div>

                    <div className="stats">
                        <div className="stat-item">Min: <span id="min-value" className="stat-value">0.00</span></div>
                        <div className="stat-item">Avg: <span id="avg-value" className="stat-value">0.00</span></div>
                        <div className="stat-item">Max: <span id="max-value" className="stat-value">0.00</span></div>
                    </div>
                </div>

                <div className="right-section">
                    <div className="convergence-info">
                        <h3>Simulation Status</h3>
                        <div className="convergence-metric">
                            <span className="status-indicator" id="status-indicator"></span>
                            Status: <span id="simulation-status">Initializing</span>
                        </div>
                        <div className="convergence-metric">
                            Time Step: <span className="convergence-value" id="time-step">0</span>
                        </div>
                        <div className="convergence-metric">
                            Iterations: <span className="convergence-value" id="total-iterations">0</span>
                        </div>
                        <div className="convergence-metric">
                            Velocity Residual: <span className="convergence-value" id="velocity-residual">-</span>
                        </div>
                        <div className="convergence-metric">
                            Pressure Residual: <span className="convergence-value" id="pressure-residual">-</span>
                        </div>
                        <div className="convergence-metric">
                            Mass Residual: <span className="convergence-value" id="mass-residual">-</span>
                        </div>
                    </div>

                    <div className="convergence-controls">
                        <h3>Controls</h3>
                        <button className="control-button" id="start-btn">Start</button>
                        <button className="control-button" id="pause-btn" disabled>Pause</button>
                        <button className="control-button" id="reset-btn">Reset</button>
                        <hr />
                        <div style={{ margin: '10px 0' }}>
                            <label>Velocity Tolerance:</label><br />
                            <input type="number" className="tolerance-input" id="vel-tolerance" defaultValue="1e-6" step="1e-7" placeholder="1e-6" /> 
                        </div>
                        <div style={{ margin: '10px 0' }}>
                            <label>Pressure Tolerance:</label><br />
                            <input type="number" className="tolerance-input" id="press-tolerance" defaultValue="1e-6" step="1e-7" placeholder="1e-6" /> 
                        </div>
                        <div style={{ margin: '10px 0' }}>
                            <label>Mass Tolerance:</label><br />
                            <input type="number" className="tolerance-input" id="mass-tolerance" defaultValue="1e-6" step="1e-7" placeholder="1e-6" /> 
                        </div>
                    </div>

                    <div className="convergence-canvas">
                        <h3>Convergence History</h3>
                        <canvas
                        ref={convergenceCanvasRef} // use the ref here
                        id="convergence-canvas"
                        width="400"
                        height="250"
                        ></canvas>
                    </div>        
                </div>
            </div>
        </>
    );
}