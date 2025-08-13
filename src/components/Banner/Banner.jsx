import { NavLink } from 'react-router-dom';
import "../styles.css";

export default function Banner() {
    return (
        <div className="navbar" role="navigation">
            <div className="navbar-toggle">🦫</div>
            <div className="navbar-links">
                <NavLink to="/about">About Me</NavLink>
                <NavLink to="/sudoku">Sudoku</NavLink>
                <NavLink to="/3Dmodel">3D Model</NavLink>
                <NavLink to="/3Dgame">3D Game</NavLink>
                <NavLink to="/fea">FEA Nozzle</NavLink>
            </div>
        </div>
    );
}