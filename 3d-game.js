const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-area").appendChild(renderer.domElement);
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
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());
//new end

function createElement(tag, className, textContent, styles = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.innerText = textContent;
  Object.assign(element.style, styles);
  return element;
}

//fullscreen and ui integration
const gameArea = document.getElementById("game-area");
const activateIndicator = createElement('div', 'indicator activate', "Click Here to Activate Viewport");
gameArea.appendChild(activateIndicator);

document.addEventListener("pointerlockchange", () => {
  if(document.pointerLockElement === renderer.domElement) {
    activateIndicator.style.display = 'none';
  } else {
    activateIndicator.style.display = 'block'; 
  }
});

gameArea.addEventListener("click", () => {
  controls.lock();
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
  if (event.key in keys) {
    keys[event.key] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  }
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
    if (keys[" "]) direction.y += movementSpeed;
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