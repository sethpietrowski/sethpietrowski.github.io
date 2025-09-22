import {useEffect, useRef } from "react";
import * as THREE from 'three';
import '../styles.css'

const ThreeDModel = () => {
  const gameAreaRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const stateRef = useRef({
    isActive: false,
    targetX: 0,
    targetY: 0,
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameArea.appendChild(renderer.domElement);

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
    const rotationSpeed = 0.001; 

    const activateIndicator = document.createElement('div');
    const exitIndicator = document.createElement('div');
    activateIndicator.className = 'indicator activate';
    activateIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; font-size: 18px; text-align: center; z-index: 1000; cursor: pointer;';
    activateIndicator.innerText = "Click Here to Activate Viewport";
    exitIndicator.className = 'indicator exit';
    exitIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; font-size: 18px; text-align: center; z-index: 1000; display: none;';
    exitIndicator.innerText = "Press Esc to Exit Viewport";
    gameArea.appendChild(activateIndicator);
    gameArea.appendChild(exitIndicator);

    const handleGameAreaClick = (event) => {
      if (event.target === activateIndicator && !stateRef.current.isActive) {
        stateRef.current.isActive = true;
        activateIndicator.style.display = 'none';
        exitIndicator.style.display = 'block';
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && stateRef.current.isActive) {
        stateRef.current.isActive = false;
        activateIndicator.style.display = 'block';
        exitIndicator.style.display = 'none';
        return;
      }

      if (stateRef.current.isActive) {
        switch (event.key) {
          case 'w': stateRef.current.moveForward = true; break;
          case 's': stateRef.current.moveBackward = true; break;
          case 'a': stateRef.current.moveLeft = true; break;
          case 'd': stateRef.current.moveRight = true; break;
          case ' ': stateRef.current.moveUp = true; break;
          case 'Control': stateRef.current.moveDown = true; break;
          case 'ArrowUp': cube.position.y += 1; break;
          case 'ArrowDown': cube.position.y -= 1; break;
          case 'ArrowLeft': cube.position.x -= 1; break;
          case 'ArrowRight': cube.position.x += 1; break;
        }
      }
    };

    const handleKeyUp = (event) => {
      switch (event.key) {
        case 'w': stateRef.current.moveForward = false; break;
        case 's': stateRef.current.moveBackward = false; break;
        case 'a': stateRef.current.moveLeft = false; break;
        case 'd': stateRef.current.moveRight = false; break;
        case ' ': stateRef.current.moveUp = false; break;
        case 'Control': stateRef.current.moveDown = false; break;
      }
    };

    const handleMouseDown = (event) => {
      if (stateRef.current.isActive && event.button === 0) {
        stateRef.current.isRotating = true;
      }
    };

    const handleMouseUp = (event) => {
      if (event.button === 0) {
        stateRef.current.isRotating = false;
      }
    };

    const handleMouseMove = (event) => {
      if (stateRef.current.isActive && stateRef.current.isRotating) {
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;
        stateRef.current.rotationX += deltaY * rotationSpeed; 
        stateRef.current.rotationY += deltaX * rotationSpeed;
      }
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    activateIndicator.addEventListener('click', handleGameAreaClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    //animation functions
    const adjustRotation = (deltaTime) => {
      if (stateRef.current && stateRef.current.isRotating) {
        const qx = new THREE.Quaternion();
        const qy = new THREE.Quaternion();

        qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), stateRef.current.rotationY);
        qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), stateRef.current.rotationX);
        
        cube.quaternion.multiplyQuaternions(qy, cube.quaternion);
        cube.quaternion.multiplyQuaternions(qx, cube.quaternion);
        
        stateRef.current.rotationX *= 0.9;
        stateRef.current.rotationY *= 0.9;
      }
    };
    
    let lastTime = performance.now();

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (stateRef.current && stateRef.current.isActive) {
        adjustRotation(deltaTime);

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

      activateIndicator.removeEventListener('click', handleGameAreaClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (gameArea && renderer.domElement) {
        gameArea.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
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