import './styles.css/';
import { NavLink } from 'react-router-dom';

export default function Banner() {
    return (
        <div className="navbar" role="navigation">
            <div class="navbar-toggle">🦫</div>
            <div class="navbar-links">
                <NavLink to="/About">About Me</NavLink>
                <NavLink to="/Sudoku">Sudoku</NavLink>
                <NavLink to="/3Dmodel">3D Model</NavLink>
                <NavLink to="/3Dgame">3D Game</NavLink>
                <NavLink to="/FEA">FEA Nozzle</NavLink>
            </div>
        </div>
    );
}