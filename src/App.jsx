import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import FEA from './pages/FEA';
import Sudoku from './pages/Sudoku';
import ThreeDGame from './pages/ThreeDGame';
import ThreeDModel from './pages/ThreeDModel';
import Banner from './components/Banner';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Banner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/fea" element={<FEA />} />
        <Route path="/sudoku" element={<Sudoku />} />
        <Route path="/3dgame" element={<ThreeDGame />} />
        <Route path="/3dmodel" element={<ThreeDModel />} />
      </Routes>
    </Router>

  )
}

export default App;