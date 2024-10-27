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

camera.position.z = 5;

//lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10,10,10);
scene.add(light);

//mouse movement and miscellaneous controls
let targetX = 0, targetY = 0;
let rotationX = 0, rotationY = 0;
let isActive = false;      //for if viewport is/is not activated
const movementSpeed = 0.1; //for wasd XY-plane movement
const rotationSpeed = 0.002;  //for mouse movement
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;
let isRotating = false; // track lmb held down or not for rotation

// elements for visibility of entering and exiting activation of viewport
const activateIndicator = document.createElement('div');
const exitIndicator = document.createElement('div');
activateIndicator.className = 'indicator activate';
activateIndicator.innerText = "Click Here to Activate Viewport";
exitIndicator.className = 'indicator exit';
exitIndicator.innerText = "Press Esc to Exit Viewport";
document.getElementById("game-area").appendChild(activateIndicator);
document.getElementById("game-area").appendChild(exitIndicator);

// Toggle active vp on click and deactive on Esc - implement
document.getElementById("game-area").addEventListener("click", () => {
  if (!isActive) {
    isActive = true;
    activateIndicator.style.display = 'none';
    exitIndicator.style.display = 'block';
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
  if (isActive) {
    switch (event.key) {
      case 'w': moveForward = true; break;
      case 's': moveBackward = true; break;
      case 'a': moveLeft = true; break;
      case 'd': moveRight = true; break;
      case ' ': moveUp = true; break;
      case 'Control': moveDown = true; break;
    }
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

window.addEventListener("mousedown", (event) => {
  if (isActive && event.button === 0) { //left button
    isRotating = true;
  }
});

window.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    isRotating = false;
  }
});

// listen for mouse movement which is used for rotation
window.addEventListener("mousemove", (event) => {
  if (isActive && isRotating) {  
    const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const deltaY = event.movementY || event.mozMovementY || event.webkitMovement || 0;
    rotationX += deltaX * rotationSpeed; 
    rotationY += deltaY * rotationSpeed;
  }
});

window.addEventListener("keydown", (event) => {
  if (isActive) {
    switch (event.key) {
      case 'ArrowUp': cube.position.y += 1; break;
      case 'ArrowDown': cube.position.y -= 1; break;
      case 'ArrowLeft': cube.position.x -= 1; break;
      case 'ArrowRight': cube.position.x += 1; break;
    }
  }
});

//Animate function for rendering, camera, and movement
function animate() {
  requestAnimationFrame(animate);

  //move cube based on wasd keys
  if (isActive) {
    cube.rotation.y += rotationX;
    cube.rotation.x += rotationY;
    rotationX *= 0.9 // damping for smooth rotation
    rotationY *= 0.9

    // movement
    if (moveForward) cube.position.z += movementSpeed;
    if (moveBackward) cube.position.z -= movementSpeed;
    if (moveLeft) cube.position.x += movementSpeed;
    if (moveRight) cube.position.x -= movementSpeed;
    if (moveUp) cube.position.y -= movementSpeed;
    if (moveDown) cube.position.y += movementSpeed;
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