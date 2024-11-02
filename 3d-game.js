const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-area").appendChild(renderer.domElement);

// create cube, add to scene
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let yaw = 0;
let pitch = 0;
camera.position.z = 5;
camera.fov = 60;

camera.updateProjectionMatrix();

//lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10,10,10);
scene.add(light);

//mouse movement and miscellaneous controls
let isActive = false;      //for if viewport is/is not activated
const movementSpeed = 0.1; //for wasd XY-plane movement
const rotationSpeed = 0.002;  //for mouse movement
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;

// elements for visibility of entering and exiting activation of viewport
const activateIndicator = document.createElement('div');
const exitIndicator = document.createElement('div');
activateIndicator.className = 'indicator activate';
activateIndicator.innerText = "Click Here to Activate Viewport";
exitIndicator.className = 'indicator exit';
exitIndicator.innerText = "Press Esc to Exit Viewport";
document.getElementById("game-area").appendChild(activateIndicator);
document.getElementById("game-area").appendChild(exitIndicator);

//Toggle active vp on click and deactive on Esc - implement
document.getElementById("game-area").addEventListener("click", () => {
  if (!isActive) {
    isActive = true;
    activateIndicator.style.display = 'none';
    exitIndicator.style.display = 'block';
    document.getElementById("game-area").requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  if(document.pointerLockElement === null) {
    isActive = false;
    activateIndicator.style.display = 'block';
    exitIndicator.style.display = 'none';
  }
});

// Toggle active vp on click and deactive on Esc - implement
document.addEventListener("keydown", (event) => {
  if (event.key === 'Escape' && isActive) {
    isActive = false;
    activateIndicator.style.display = 'block';
    exitIndicator.style.display = 'none';
  }
});

// listen for wasd press which is used for movement
window.addEventListener("keydown", (event) => {
  switch (event.key) {
    case 'w': moveForward = true; break;
    case 's': moveBackward = true; break;
    case 'a': moveLeft = true; break;
    case 'd': moveRight = true; break;
    case ' ': moveUp = true; break;
    case 'Control': moveDown = true; break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.key) {
    case 'w': moveForward = false; break;
    case 's': moveBackward = false; break;
    case 'a': moveLeft = false; break;
    case 'd': moveRight = false; break;
    case ' ': moveUp = false; break;
    case 'Control': moveDown = false; break;
  }
});

// listen for mouse movement used to rotate camera
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;

// listen for mouse movement which is used for rotation
window.addEventListener("mousemove", (event) => {
  if (isActive) {
    const deltaX = event.movementX * rotationSpeed;
    const deltaY = event.movementY * rotationSpeed;

    yaw -= deltaX;

    // pitch limit avoids vertical tilt that occurs from mouse drift
    const pitchLimit = Math.PI / 2 - 0.1; // little less than 90deg
    pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch - deltaY));
    
    //apply camera rotation
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);

    //combine yaw an pitch
    camera.quaternion.copy(yawQuat).multiply(pitchQuat);
    // camera.rotation.x -= deltaY * rotationSpeed; //rotating up/down
    // camera.rotation.y -= deltaX * rotationSpeed; // rotating left/right
  }
});

//Animate function for rendering, camera, and movement
function animate() {
  requestAnimationFrame(animate);

  if(isActive) {
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // ignore vertical direction
    cameraDirection.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize(); //get right direction vector (normal to camera view direction)

    //move cube based on wasd keys
    if (moveForward) camera.position.addScaledVector(cameraDirection, movementSpeed);
    if (moveBackward) camera.position.addScaledVector(cameraDirection, -movementSpeed);
    if (moveLeft) camera.position.addScaledVector(right, -movementSpeed);
    if (moveRight) camera.position.addScaledVector(right, movementSpeed);
    if (moveUp) camera.position.y += movementSpeed;
    if (moveDown) camera.position.y -= movementSpeed;
  }
  
  renderer.render(scene, camera);
}

animate();

//for window resizing
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth  /window.innerHeight;
  camera.updateProjectionMatrix();
});