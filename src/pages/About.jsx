import '../styles.css';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const socialLinks = [
    { name: 'Github', url: 'https://github.com/sethpietrowski', icon: FaGithub, username: 'sethpietrowski' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/sethpietrowski/', icon: FaLinkedin, username: 'Seth Pietrowski' },
];

export default function About() {
    const navigate = useNavigate();

    const handleProjectClick = (path) => {
        navigate(path);
    }

    return (
        <div className="about-page">
            <section className="about-section">
                <h1>About Me</h1>
                <p>
                    I am Seth Pietrowski, an Aerospace Engineer based out of the Dallas area. 
                    Feel free to follow along!
                </p>

                <div className="social-links">
                    {socialLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <a 
                                key={link.name}    
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="social-link-button"
                            >
                                <Icon className="social-icon" />
                                <span className="social-username">{link.username}</span>
                            </a>
                        );
                    })}
                </div>
            </section>

            <div className="project-grid">
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick("/sudoku")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/sudoku")}
                >
                    <h3>🧩 Interactive Sudoku</h3>
                    <p>Sudoku game with keyboard navigation, number input buttons, and solution validation.</p>  
                </div>
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick( "/3d-model")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/3d-model")}
                >
                    <h3>🎯 3D Interactive Model</h3>
                    <p>3D torus knot model with custom shaders, mouse controls, and animations using Three.js.</p>
                </div>
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick("/3d-game")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/3d-game")}
                >
                    <h3>🎮 3D Game Simulation</h3>
                    <p>First-person 3D environment with pointer lock controls and movement (for PC).</p>
                </div>
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick("/fea")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/fea")}
                >
                    <h3>⚡ FEA Nozzle Simulator</h3>
                    <p>Finite Element Analysis visualization of fluid flow through a rocket nozzle.</p>
                </div>
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick("/read-chinese")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/read-chinese")}
                >
                    <h3>📖 Chinese Learning Reader</h3>
                    <p>Learn Chinese by reading simple stories with sentence- and word-wise English translations</p>
                </div>
                <div 
                    className="project-card"
                    onClick={() => handleProjectClick("/demographic-data-viewer")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleProjectClick("/demographic-data-viewer")}
                >
                    <h3>🗺️ US Demogrpahic Data Viewer</h3>
                    <p>View multiple demographic statistics for each US state</p>
                </div>
            </div>

            <section className="cv-section">
                <h2 style={{ fontStyle: "italic" }}>Check out my CV!</h2><br />
                <iframe  
                    id="pdf-iframe" 
                    src="/SethPietrowskiCurriculumVitaeV9.pdf"
                    style={{ width: "100%", height: "90vh" }}
                    title="CV SP"
                ></iframe>
            </section>

            <footer>
                Thank you for your time<span style={{ fontSize: "80px"}}>.</span>
            </footer>
        </div>
    );
}