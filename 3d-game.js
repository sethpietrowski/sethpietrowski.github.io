const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("game-area").appendChild(renderer.domElement);
camera.updateProjectionMatrix();

// create cube, add to scene
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let yaw = 0;
let pitch = 0;
camera.position.z = 5;
camera.fov = 60;

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
// const exitIndicator = createElement('div', 'indicator exit', "Press Esc to Exit Viewport");

gameArea.appendChild(activateIndicator);
// gameArea.appendChild(exitIndicator);

//listen or fullscreen change event
document.addEventListener("fullscreenchange", updateFullscreenState);
document.addEventListener("mozfullscreenchange", updateFullscreenState);
document.addEventListener("webkitfullscreenchange", updateFullscreenState);
document.addEventListener("msfullscreenchange", updateFullscreenState);

function disableScroll(event) {
  event.preventDefault();
}

function updateFullscreenState() {
  const navbar = document.querySelector('.navbar'); //select the navbar
  if (document.fullscreenElement || document.mozFullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
    activateIndicator.style.display = 'none'; // hide activation message
    // exitIndicator.style.display = 'none'; // hide exit message when in fullscreen
    navbar.style.display = 'none'; //hiding

    //disable scroll in fullscreen
    window.addEventListener('wheel', disableScroll, { passive: false});
  } else {
    activateIndicator.style.display = 'block'; // show activation message
    // exitIndicator.style.display = 'block'; // show exit message when in fullscreen
    navbar.style.display = 'block'; //showing

    setTimeout(() => {
      navbar.style.display = 'flex';
    }, 50); //timing

    //reenable scroll in exiting fullscreen
    window.removeEventListener('wheel', disableScroll);
  }
}

//lighting
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10,10,10);
scene.add(light);

//mouse movement and miscellaneous controls
let isActive = false;      //for if viewport is/is not activated
const movementSpeed = 0.05; //for wasd XY-plane movement
const rotationSpeed = 0.002;  //for mouse movement
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;

gameArea.addEventListener("click", () => {
  if (!isActive) {
    isActive = true;
    activateIndicator.style.display = 'none';
    // exitIndicator.style.display = 'block';

    //request fullscreen when viewport is activated
    const requestFullscreen = document.documentElement.requestFullscreen ||
                              document.documentElement.mozRequestFullscreen || 
                              document.documentElement.webkitRequestFullscreen || 
                              document.documentElement.msRequestFullscreen;
    if (requestFullscreen) {
      requestFullscreen.call(document.documentElement)
        .then(() => {
          console.log("Entered fullscreen mode");
          window.scrollTo(0, document.body.scrollHeight); //scroll to bottom
        })
        .catch(err => console.error("Error attempt. enable fullscreen: ", err)); 
    } else {
    console.warn("Fullscreen API is not supported");  
    }
    gameArea.requestPointerLock();
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

    //combine yaw and pitch
    camera.quaternion.copy(yawQuat).multiply(pitchQuat);
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