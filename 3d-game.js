import * as THREE from 'https://threejs.org/build/three.module.js';
import { PointerLockControls } from 'https://threejs.org/examples/jsm/controls/PointerLockControls.js';

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

//new ambient lighting source
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//pointer lock controls
const controls = new THREE.PointerLockControls(camera, document.body);
scene.add(controls.getObject());
//new end

function createElement(tag, className, textContent, styles = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.innerText = textContent;
  Object.assign(element.style, styles);
  return element;
}

document.addEventListener("pointerlockchange", () => {
  if(document.pointerLockElement === document.body) {
    activateIndicator.style.display = 'none';
  } else {
    activateIndicator.style.display = 'block'; 
  }
});

document.addEventListener("click", () => {
  controls.lock();
});

controls.addEventListener("lock", () => {
  console.log('Pointer locked');
})

controls.addEventListener("unlock", () => {
  console.log('Pointer unlocked');
});

const movementSpeed = 0.1;
const keys = {
  w: false,
  s: false,
  a: false,
  d: false,
  space: false,
  control: false
};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === " ") keys.space = true;
  else if (key === "control") keys.control = true;
  else if (key in keys) keys[key] = true;
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (key === " ") keys.space = false;
  else if (key === "control") keys.control = false;
  else if (key in keys) keys[key] = false;
});

//Animate function for rendering, camera, and movement
function animate() {
  requestAnimationFrame(animate);

  if(controls.isLocked) {

    const direction = new THREE.Vector3();

    if (keys.w) direction.z -= movementSpeed;
    if (keys.s) direction.z += movementSpeed;
    if (keys.a) direction.x -= movementSpeed;
    if (keys.d) direction.x += movementSpeed;
    if (keys.space) direction.y += movementSpeed;
    if (keys.control) direction.y -= movementSpeed;

    if (direction.length() > 0) {
      direction.applyQuaternion(camera.quaternion);
      controls.getObject().position.add(direction);
    }
  }
  renderer.render(scene, camera);
};




animate();

//for window resizing
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth  /window.innerHeight;
  camera.updateProjectionMatrix();
});

//overlay button fucntioning capability:
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("instructions-overlay");
  const acceptBtn = document.getElementById("accept-btn");

  acceptBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  const gameArea = document.getElementById("game-area");
  const activateIndicator = createElement('div', 'indicator activate', "Click Here to Activate Viewport");
  gameArea.appendChild(activateIndicator);

  //pointer lock not available on Android
  if (/Mobi|Android/i.test(navigator.userAgent)) {
    activateIndicator.innerText = "3D Game is not supported on mobile.";
  }

  document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === document.body) {
      activateIndicator.style.display = 'none';
    } else {
      activateIndicator.style.display = 'block';
    }
  });

  document.addEventListener("click", () => {
    controls.lock();
  });
});