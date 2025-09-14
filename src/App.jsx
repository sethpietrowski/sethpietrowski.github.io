import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Banner from './components/Banner/banner';
import './App.css';

const About = lazy(() => import('./pages/About'));
const FEA = lazy(() => import('./pages/FEA'));
const Sudoku = lazy(() => import('./pages/Sudoku'));
const ThreeDGame = lazy(() => import('./pages/ThreeDGame'));
const ThreeDModel = lazy(() => import('./pages/ThreeDModel'));
const LanguageApp = lazy(() => import('./pages/LanguageApp'));
const PopDemographics = lazy(() => import('./pages/PopDemographics'));

const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
    fontSize: '18px'
  }}>
    Loading...
  </div>
);

//error handling
import { Component } from 'react';
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: 'blue',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      {/* <Router basename={process.env.NODE_ENV === 'production' ? '/sethpietrowski.github.io' : ''}> */}
      <Router basename={''}>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Banner />
            <Routes>
              <Route path="/" element={<About />} />
              <Route path="/about" element={<Navigate to="/" replace />} />
              <Route path="/fea" element={<FEA />} />
              <Route path="/sudoku" element={<Sudoku />} />
              <Route path="/3d-game" element={<ThreeDGame />} />
              <Route path="/3d-model" element={<ThreeDModel />} />
              <Route path="/read-chinese" element={<LanguageApp />} />
              <Route path="/demographic-data-viewer" element={<PopDemographics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

