import '../styles.css';

export default function About() {
    return (
        <div className="container">
            <h1>About Me</h1>

            <div className="project-grid">
                <div className="project-card">
                    <h3>🚀 About Me</h3>
                    <p>
                        I am Seth Pietrowski, a recent Aerospace Engineering grad. Feel free to follow along <br />
                        here: 
                        <a 
                            href="https://github.com/sethpietrowski/sethpietrowski.github.io"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            here on Github
                        </a>.
                    </p>
                </div>
                
                <div className="project-card">
                    <h3>🧩 Interactive Sudoku</h3>
                    <p>Sudoku game with keyboard navigation, number input buttons, and solution validation.</p>
                    <button className="demo-button">Play Game</button>
                </div>

                <div className="project-card">
                    <h3>🎯 3D Interactive Model</h3>
                    <p>3D torus knot model with custom shaders, mouse controls, and animations using Three.js.</p>
                    <button className="demo-button">View Model</button>
                </div><br />
                <div className="project-card">
                    <h3>🎮 3D Game Simulation</h3>
                    <p>First-person 3D environment with pointer lock controls and movement (for PC).</p>
                    <button className="demo-button">Play Game</button>
                </div><br />
                <div className="project-card">
                    <h3>⚡ FEA Nozzle Simulator</h3>
                    <p>Finite Element Analysis visualization of fluid flow through a rocket nozzle.</p>
                    <button className="demo-button">Run Simulation</button>
                </div>
            </div>

            <h2 style={{ fontStyle: "italic" }}>Check out my CV!</h2>
            <iframe  
                id="pdf-iframe" 
                src="/SethPietrowskiCurriculumVitaeV9.pdf"
                style={{ width: "100%", height: "90vh" }}
                title="CV SP"
            ></iframe>

            <footer>
                Thank you for your time<span style={{ fontSize: "85px"}}>.</span>
            </footer>
        </div>
    );
}