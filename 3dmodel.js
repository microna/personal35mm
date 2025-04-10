//Import the THREE.js library
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// To allow for the camera to move around the scene
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// To allow for importing the .gltf file
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//Keep track of the mouse position, so we can make the eye move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

//Keep the 3D object on a global variable so we can access it later
let object;

//OrbitControls allow the camera to move around the scene
let controls;

//Set which object to render
let objToRender = "camera_kiev-4am__helios";

//Instantiate a loader for the .gltf file
const loader = new GLTFLoader();

//Load the file
loader.load(
  `./model/${objToRender}/scene.gltf`,
  function (gltf) {
    //If the file is loaded, add it to the scene
    object = gltf.scene;
    scene.add(object);
  },
  function (xhr) {
    //While it is loading, log the progress
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({ alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);

//Add the renderer to the DOM
document.getElementById("container3D").appendChild(renderer.domElement);

// Function to handle responsive adjustments
function handleResize() {
  // Get the current dimensions of the container
  const container = document.getElementById("container3D");
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Update camera aspect ratio
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer size to match container
  renderer.setSize(width, height);

  // Adjust camera position based on screen size
  if (window.innerWidth < 768) {
    // For mobile devices - moved 50% closer
    camera.position.z = objToRender === "camera_kiev-4am__helios" ? 1.1 : 45;
  } else {
    // For larger screens - moved 50% closer
    camera.position.z = objToRender === "camera_kiev-4am__helios" ? 0.85 : 7.5;
  }
}

// Initial setup
handleResize();

//Add lights to the scene, so we can actually see the 3D model
const topLight = new THREE.DirectionalLight(0xf1f1f1f, 1.9); // Reduced from 2.5 to 1.9
topLight.position.set(500, 500, 500); //top-left-ish
topLight.castShadow = true;
scene.add(topLight);

// Add a second directional light from the opposite side to fill shadows
const bottomLight = new THREE.DirectionalLight(0xffffff, 1.1); // Reduced from 1.5 to 1.1
bottomLight.position.set(-300, -300, -300); // Position opposite to topLight
scene.add(bottomLight);

// Add a front light to better illuminate the model's front face
const frontLight = new THREE.DirectionalLight(0xffffff, 1.5); // Reduced from 2 to 1.5
frontLight.position.set(0, 0, 1000); // Positioned in front of the model
scene.add(frontLight);

const ambientLight = new THREE.AmbientLight(
  0x555555,
  objToRender === "camera_kiev-4am__helios" ? 6 : 2.2 // Reduced from 8/3 to 6/2.2
);
scene.add(ambientLight);

//This adds controls to the camera, so we can rotate / zoom it with the mouse
// Enable OrbitControls for all models
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Add smooth damping effect
controls.dampingFactor = 0.05;
controls.enableZoom = false; // Disable zooming
controls.enablePan = true; // Allow panning
controls.autoRotate = true; // Enable auto-rotation
controls.autoRotateSpeed = 1.0; // Set a slow rotation speed (default is 2.0)

//Render the scene
function animate() {
  requestAnimationFrame(animate);
  //Here we could add some code to update the scene, adding some automatic movement

  //Make the eye move
  if (object && objToRender === "eye") {
    //I've played with the constants here until it looked good
    object.rotation.y = -3 + (mouseX / window.innerWidth) * 3;
    object.rotation.x = -1.2 + (mouseY * 2.5) / window.innerHeight;
  }

  // Update controls in each frame
  controls.update(); // This will handle the auto-rotation

  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", handleResize);
window.addEventListener("orientationchange", handleResize);

//add mouse position listener, so we can make the eye move
document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

//Start the 3D rendering
animate();
