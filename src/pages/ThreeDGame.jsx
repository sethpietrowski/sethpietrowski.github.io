import {useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import '../styles.css';

const ThreeDGame = () => {
  const gameAreaRef = useRef(null);
  const sceneRef = useRef(null);
  const animationIdRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(true);

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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    camera.updateProjectionMatrix();

    // create cube, add to scene
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;
    camera.lookAt(cube.position);
    camera.fov = 60;
    camera.updateProjectionMatrix();

    //new directional lighting source
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(10,10,10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // soft white light
    scene.add(ambientLight);

    const controls = new PointerLockControls(camera, document.body);
    scene.add(controls.object);

    sceneRef.current = { scene, camera, renderer, cube, controls };

    const createElement = (tag, className, textContent, styles = {}) => {
      const element = document.createElement(tag);
      if (className) element.className = className;
      if (textContent) element.innerText = textContent;
      Object.assign(element.style, styles);
      return element;
    };

    const activateIndicator = createElement('div', 'indicator activate', 'Click Here to Activate Viewport');
    activateIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px; border-radius: 10px; font-size: 18px; text-align: center; z-index: 1000; cursor: pointer;';
    gameArea.appendChild(activateIndicator);
    
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      activateIndicator.innerText = "3D Game is not supported on mobile.";
    }

    const movementSpeed = 0.05;

    const handlePointerLockChange = () => {
      if (activateIndicator) {
        activateIndicator.style.display = 
          document.pointerLockElement === document.body ? 'none' : 'block';
      }
    };

    const handleClick = () => {
      if (!document.pointerLockElement) {
        controls.lock();
      }
    };

    const handleLock = () => {
      console.log('Pointer locked');
    };

    const handleUnlock = () => {
      console.log('Pointer unlocked');
    };

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (key === " ") keysRef.current.space = true;
      else if (key === "control") keysRef.current.control = true;
      else if (key in keysRef.current) keysRef.current[key] = true;
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (key === " ") keysRef.current.space = false;
      else if (key === "control") keysRef.current.control = false;
      else if (key in keysRef.current) keysRef.current[key] = false;
    };

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("click", handleClick);
    controls.addEventListener("lock", handleLock);
    controls.addEventListener("unlock", handleUnlock);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("resize", handleResize);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (controls.isLocked) {
        const direction = new THREE.Vector3();

        if (keysRef.current.w) direction.z -= movementSpeed;
        if (keysRef.current.s) direction.z += movementSpeed;
        if (keysRef.current.a) direction.x -= movementSpeed;
        if (keysRef.current.d) direction.x += movementSpeed;
        if (keysRef.current.space) direction.y += movementSpeed;
        if (keysRef.current.control) direction.y -= movementSpeed;

        if (direction.length() > 0) {
          direction.applyQuaternion(camera.quaternion);
          controls.object.position.add(direction);
        }
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
      document.removeEventListener("click", handleClick);
      controls.removeEventListener("lock", handleLock);
      controls.removeEventListener("unlock", handleUnlock);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);

      if (document.body.contains(renderer.domElement)) {
        document.body.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
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