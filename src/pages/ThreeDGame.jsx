import {useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import '../styles.css';

const ThreeDGame = () => {
  const gameAreaRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    control: false
  });

  useEffect(() => {
    if (!gameAreaRef.current || showOverlay) return;

    const gameArea = gameAreaRef.current;

    //clear existing content
    gameArea.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, gameArea.clientWidth / gameArea.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true});
    
    renderer.setSize(gameArea.clientWidth, gameArea.clientHeight);
    gameArea.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // create cube, add to scene
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.set(0, 0, 5);
    camera.lookAt(cube.position);
    camera.fov = 60;
    camera.updateProjectionMatrix();

    //new directional lighting source
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10,10,10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
    scene.add(ambientLight);

    const createPointerLockControls = () => {
      const controls = {
        camera: camera,
        domElement: renderer.domElement,
        isLocked: false,

        lock: () => {
          renderer.domElement.requestPointerLock();
        },

        unlock: () => {
          document.exitPointerLock();
        }
      };

      return controls;
    }

    const controls = createPointerLockControls();
    controlsRef.current = controls;

    sceneRef.current = { scene, camera, renderer, cube, controls };

    const activateIndicator = document.createElement('div');
    activateIndicator.className = 'pointer-lock-indicator';
    activateIndicator.innerText = /Mobi|Android/i.test(navigator.userAgent)
      ? '3D Game is not supported on mobile.' 
      : 'Click Here to Activate Viewport';
    activateIndicator.style.display = isPointerLocked ? 'none' : 'block';
    
    gameArea.appendChild(activateIndicator);
    
    const movementSpeed = 0.05;
    let mouseX = 0;
    let mouseY = 0;

    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === renderer.domElement;
      controls.isLocked = locked;
      setIsPointerLocked(locked);
      activateIndicator.style.display = locked ? 'none' : 'block';

      if (locked) {
        document.body.style.cursor = 'none';
      } else {
        document.body.style.cursor = 'default';
      }
    };

    const handleClick = (event) => {
      if (event.target === activateIndicator && !controls.isLocked) {
        controls.lock();
      }
    };

    const handleMouseMove = (event) => {
      if (controls.isLocked) {
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        mouseX -= movementX * 0.002;
        mouseY -= movementY * 0.002;
        mouseY = Math.max(-Math.PI/2, Math.min(Math.PI/2, mouseY));

        camera.rotation.order = 'YXZ';
        camera.rotation.x = mouseY;
        camera.rotation.y = mouseX;
      }
    }

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === " ") {
        event.preventDefault;
        keysRef.current.space = true;
      } else if (key === "control") {
        keysRef.current.control = true;
      } else if (key in keysRef.current) {
        keysRef.current[key] = true;
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (key === " ") {
        keysRef.current.space = false;
      } else if (key === "control") {
        keysRef.current.control = false;
      } else if (key in keysRef.current) {
        keysRef.current[key] = false;
      }
    };

    const handleResize = () => {
      const width = gameArea.clientWidth;
      const height = gameArea.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    activateIndicator.addEventListener("click", handleClick);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (controls.isLocked) {
        const direction = new THREE.Vector3();
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);

        const right = new THREE.Vector3();
        right.crossVectors(cameraDirection, camera.up).normalize();
        
        if (keysRef.current.w) {
          direction.add(cameraDirection.clone().multiplyScalar(movementSpeed));
        }

        if (keysRef.current.s) {
          direction.add(cameraDirection.clone().multiplyScalar(-movementSpeed));
        }

        if (keysRef.current.a) {
          direction.add(right.clone().multiplyScalar(-movementSpeed));
        }

        if (keysRef.current.d) {
          direction.add(right.clone().multiplyScalar(movementSpeed));
        }

        if (keysRef.current.space) {
          direction.y += movementSpeed;
        }

        if (keysRef.current.control) {
          direction.y -= movementSpeed;
        }

        camera.position.add(direction);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      document.removeEventListener("pointerlockchange", handlePointerLockChange);
      activateIndicator.removeEventListener("click", handleClick);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);


      document.body.style.cursor = 'default';

      if (gameArea && gameArea.contains(activateIndicator)) {
        gameArea.removeChild(activateIndicator);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      geometry.dispose();
      material.dispose();
    };
  }, [showOverlay]);
  
  const handleAccept = () => {
    setShowOverlay(false);
  };

  return (
    <div className="three-d-game-container">
      {showOverlay && (
        <div id="instructions-overlay">
          <div id="instructions-box">
            <h2>Movement Controls</h2>
            <p>
              Click: activate viewport. Esc: deactivate viewport. W,S: forward/back. 
              A/D: left/right. Space/Ctrl: up/down. Move mouse to rotate camera.
            </p>
            <button id="accept-btn" onClick={handleAccept}>Accept</button>
          </div>
        </div>
      )}
      <div ref={gameAreaRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden'}}></div>
    </div>
  );
};

export default ThreeDGame;