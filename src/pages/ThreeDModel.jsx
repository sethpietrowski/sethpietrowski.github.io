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
    const rotationSpeed = 0.003; 

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
      console.log("Activate button clicked");
      setIsActive(true);
      stateRef.current.isActive = true;
      updateIndicators(true);
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
          case 'arrowup': cube.position.y += 1; break;
          case 'arrowdown': cube.position.y -= 1; break;
          case 'arrowleft': cube.position.x -= 1; break;
          case 'arrowright': cube.position.x += 1; break;
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
        console.log("Mouse down - starting rotation");
        stateRef.current.isRotating = true;
        event.preventDefault();
      }
    };

    const handleMouseUp = (event) => {
      if (event.button === 0) {
        console.log("Mouse up - stopping rotation");
        stateRef.current.isRotating = false;
      }
    };

    const handleMouseMove = (event) => {
      if (stateRef.current.isActive && stateRef.current.isRotating) {
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;
         console.log("Mouse move - deltaX:", deltaX, "deltaY:", deltaY);
        stateRef.current.rotationX += deltaY * rotationSpeed; 
        stateRef.current.rotationY += deltaX * rotationSpeed;
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
    gameArea.addEventListener('mousedown', handleMouseDown);
    gameArea.domElement.addEventListener('mouseup', handleMouseUp);
    gameArea.domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    console.log("Event listeners added to:", {
      gameArea: gameArea,
      rendererElement: renderer.domElement
    });

    // renderer.domElement.addEventListener('click', () => {
    //   renderer.domElement.requestPointerLock();
    // });

    // if (document.pointerLockElement === renderer.domElement) {
    //   document.addEventListener("mousemove", onMouseMove);
    //   document.addEventListener("mouseup", onMouseUp);
    //   document.addEventListener("mousedown", onMouseDown);
    // } else {
    //   document.removeEventListener("mousemove", onMouseMove);
    //   document.removeEventListener("mouseup", onMouseUp);
    //   document.removeEventListener("mousedown", onMouseDown);
    // }

    // function onMouseDown(event) {
    //   isDragging = true;
    //   prevX = event.clientX;
    //   prevY = event.clientY;
    // }

    // function onMouseMove(event) {
    //   if (!isDragging) return;

    //   const deltaX = event.clientX - prevX;
    //   const deltaY = event.clientY - prevY;

    //   cube.rotation.y += deltaX * 0.01;
    //   cube.rotation.x += deltaY * 0.01;

    //   prevX = event.clientX;
    //   prevY = event.clientY;
    // }

    // function onMouseUp() {
    //   isDragging = false;
    // }
    // // document.addEventListener('keydown', handleKeyDown);
    // // document.addEventListener('keyup', handleKeyUp);
    // // window.addEventListener('resize', handleResize);

    // //animation functions
    // const adjustRotation = () => {
    //   if (stateRef.current.isRotating) {
    //     const { rotationX, rotationY } = stateRef.current;
        
    //     const qx = new THREE.Quaternion();
    //     const qy = new THREE.Quaternion();

    //     qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
    //     qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationX);
        
    //     sceneRef.current.cube.quaternion.multiply(qy);
    //     sceneRef.current.cube.quaternion.multiply(qx);
        
    //     stateRef.current.rotationX = 0;
    //     stateRef.current.rotationY = 0;
    //   }
    // };
    
    // let lastTime = performance.now();

    // renderer.domElement.addEventListener("mousedown", onMouseDown);
    // renderer.domElement.addEventListener("mousemove", onMouseMove);
    // renderer.domElement.addEventListener("mouseup", onMouseUp);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // const now = performance.now();
      // const deltaTime = (now - lastTime) / 1000;
      // lastTime = now;

      //rotation handling
      if (stateRef.current.isRotating && stateRef.current.isActive) {
        cube.rotation.x += stateRef.current.rotationX;
        cube.rotation.y += stateRef.current.rotationY;

        stateRef.current.rotationX = 0;
        stateRef.current.rotationY = 0;
      }

      if (stateRef.current.isActive) {
        // adjustRotation(deltaTime);
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