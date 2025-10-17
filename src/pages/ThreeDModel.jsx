import {useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import '../styles.css'

const ThreeDModel = () => {
  const gameAreaRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const rendererRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const stateRef = useRef({
    isActive: false,
    rotationX: 0,
    rotationY: 0,
    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    isRotating: false,
  });

  useEffect(() => {
    if (!gameAreaRef.current) return;

    const gameArea = gameAreaRef.current;

    while (gameArea.firstChild) {
      gameArea.removeChild(gameArea.firstChild);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, gameArea.clientWidth / gameArea.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true});
    
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    gameArea.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // create cube, add to scene
    const geometry = new THREE.TorusKnotGeometry();

    const vertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;

    const fragmentShader = `
      varying vec3 vNormal;
      void main() {
        vec3 lightDirection = normalize(vec3(-1.0,1.0,0.0)); //light location is to left and above camera
        float intensity = pow(max(dot(vNormal, lightDirection), 0.0), 2.5); // make edges glow
        gl_FragColor = vec4(0.0, intensity, 0.0, 1.0); // greenish glow on edges
      }`;

    const material = new THREE.ShaderMaterial({ 
      vertexShader, 
      fragmentShader, 
      wireframe: false, 
    });

    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(-1, -1, -1).normalize();
    scene.add(directionalLight);
    
    //store references
    sceneRef.current = { scene, camera, renderer, cube };

    const movementSpeed = 0.1;
    const rotationSpeed = 0.01; 

    const activateIndicator = document.createElement('div');
    const exitIndicator = document.createElement('div');

    activateIndicator.innerText = "Click Here to Activate Viewport";
    activateIndicator.className = 'activate-indicator';
    exitIndicator.innerText = "Press Esc to Exit Viewport";
    exitIndicator.className = 'exit-indicator';   

    gameArea.appendChild(activateIndicator);
    gameArea.appendChild(exitIndicator);

    const updateIndicators = (active) => {
      activateIndicator.style.display = active ? 'none' : 'block';
      exitIndicator.style.display = active ? 'block' : 'none';
    };

    const handleActivateClick = (event) => {
      // console.log("Activate button clicked");
      // console.log("rendererRef.current:", rendererRef.current);
      // console.log("renderer.domElement:", rendererRef.current?.domElement);
      setIsActive(true);
      stateRef.current.isActive = true;
      updateIndicators(true);

      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.style.cursor = 'grab';
        rendererRef.current.domElement.style.pointerEvents = 'auto';
        rendererRef.current.domElement.style.position = 'relative';
        rendererRef.current.domElement.style.zIndex = '1';
        // console.log("Canvas cursor set to grab");
        // console.log("Canvas element:", rendererRef.current.domElement);
        // console.log("Canvas position:", rendererRef.current.domElement.getBoundingClientRect());
      }

      event.stopPropagation();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && stateRef.current.isActive) {
        setIsActive(false);
        stateRef.current.isActive = false;
        updateIndicators(false);
        return;
      }

      if (stateRef.current.isActive) {
        switch (event.key.toLowerCase()) {
          case 'w': stateRef.current.moveForward = true; break;
          case 's': stateRef.current.moveBackward = true; break;
          case 'a': stateRef.current.moveLeft = true; break;
          case 'd': stateRef.current.moveRight = true; break;
          case ' ': 
            event.preventDefault();  
            stateRef.current.moveUp = true; 
            break;
          case 'control': stateRef.current.moveDown = true; break;
          case 'arrowup': sceneRef.current.cube.position.y += 1; break;
          case 'arrowdown': sceneRef.current.cube.position.y -= 1; break;
          case 'arrowleft': sceneRef.current.cube.position.x -= 1; break;
          case 'arrowright': sceneRef.current.cube.position.x += 1; break;
        }
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key.toLowerCase()) {
        case 'w': stateRef.current.moveForward = false; break;
        case 's': stateRef.current.moveBackward = false; break;
        case 'a': stateRef.current.moveLeft = false; break;
        case 'd': stateRef.current.moveRight = false; break;
        case ' ': stateRef.current.moveUp = false; break;
        case 'control': stateRef.current.moveDown = false; break;
      }
    };

    const handleMouseDown = (event) => {
      if (stateRef.current.isActive && event.button === 0) {
        // console.log("Mouse down - starting rotation");
        stateRef.current.isRotating = true;
        if(rendererRef.current) {
          rendererRef.current.domElement.style.cursor = 'grabbing';
        }
        event.preventDefault();
      }
    };

    const handleMouseUp = (event) => {
      if (event.button === 0) {
        // console.log("Mouse up - stopping rotation");
        stateRef.current.isRotating = false;
        if(stateRef.current.isActive && rendererRef.current) {
          rendererRef.current.domElement.style.cursor = 'grab';
        }
      }
    };

    const handleMouseMove = (event) => {
      if (!stateRef.current.isActive || !stateRef.current.isRotating) return;
      if (sceneRef.current) {
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;
        // console.log("Mouse move - deltaX:", deltaX, "deltaY:", deltaY);
        // console.log("Cube before:", sceneRef.current.cube.rotation.x, sceneRef.current.cube.rotation.y);
        sceneRef.current.cube.rotation.x += deltaY * rotationSpeed; 
        sceneRef.current.cube.rotation.y += deltaX * rotationSpeed;
        // console.log("Cube after:", sceneRef.current.cube.rotation.x, sceneRef.current.cube.rotation.y);
      }
    };

    const handleResize = () => {
      const width = gameArea.clientWidth;
      const height = gameArea.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    activateIndicator.addEventListener('click', handleActivateClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // console.log("Event listeners added");
    // console.log("Canvas element:", renderer.domElement);
    // console.log("Canvas parent:", renderer.domElement.parentElement);
    // console.log("Canvas z-index:", window.getComputedStyle(renderer.domElement).zIndex);
    // console.log("Canvas pointer-events:", window.getComputedStyle(renderer.domElement).pointerEvents);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (stateRef.current.isActive && sceneRef.current) {
        const cube = sceneRef.current.cube;
        if (stateRef.current.moveForward) cube.position.z += movementSpeed;
        if (stateRef.current.moveBackward) cube.position.z -= movementSpeed;
        if (stateRef.current.moveLeft) cube.position.x += movementSpeed;
        if (stateRef.current.moveRight) cube.position.x -= movementSpeed;
        if (stateRef.current.moveUp) cube.position.y -= movementSpeed;
        if (stateRef.current.moveDown) cube.position.y += movementSpeed;
      }

      renderer.render(scene, camera);
    }

    animate();

    //clean up function
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      activateIndicator.removeEventListener('click', handleActivateClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (gameArea && gameArea.contains(activateIndicator)) {
        gameArea.removeChild(activateIndicator);
      }

      if (gameArea && gameArea.contains(exitIndicator)) {
        gameArea.removeChild(exitIndicator);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="three-d-model-container">
      <div className="container">
        <h1>3D Interactive Model</h1>
        <p style={{textAlign: 'center'}}>
          Click viewport to activate. Click esc to deactivate viewport. W,S move in into screen/away from screen. 
          A/D move sideways. Space/Ctrl move up/down. Hold down and drag left mouse button to rotate.
        </p>
      </div>
      <div ref={gameAreaRef} style={{width: '100%', height: '100vh', position: 'relative', overflow: 'hidden'}}></div>
    </div>
  );
};

export default ThreeDModel;