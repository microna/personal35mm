//Import the THREE.js library
import * as THREE from "https://esm.sh/three@0.129.0";
import { OrbitControls } from "https://esm.sh/three@0.129.0/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "https://esm.sh/three@0.129.0/examples/jsm/loaders/GLTFLoader";

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

// Radius of the model's bounding sphere, used to fit the camera to the container
let fitRadius;

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

    // Center the model on the origin so it orbits around its own middle
    const box = new THREE.Box3().setFromObject(object);
    object.position.sub(box.getCenter(new THREE.Vector3()));
    fitRadius = box.getBoundingSphere(new THREE.Sphere()).radius;

    // Apply smoothing to the model and its materials
    object.traverse(function (child) {
      if (child.isMesh) {
        // Smooth the geometry
        child.geometry.computeVertexNormals();

        // Enhance materials for smoother appearance
        if (child.material) {
          // Set material properties for smoother look
          child.material.flatShading = false;
          child.material.needsUpdate = true;

          if (child.material.isMeshStandardMaterial) {
            child.material.envMapIntensity = 1.0;
          }
        }
      }
    });

    scene.add(object);
    frameModel();
  },
  function (xhr) {
    // loading progress — intentionally silent
  },
  function (error) {
    //If there is an error, log it
    console.error(error);
  }
);

//Instantiate a new renderer and set its size
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true, // Enable anti-aliasing for smoother edges
  precision: "highp", // Use high precision for better rendering
  powerPreference: "high-performance", // Request high performance mode
});

// Set pixel ratio for sharper rendering
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable physically correct lighting and shadows
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.2;
renderer.outputEncoding = THREE.sRGBEncoding;

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

  frameModel();
}

// Move the camera so the model's bounding sphere fits the container on both axes
function frameModel() {
  if (!fitRadius) return;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const distance = fitRadius / Math.sin(Math.min(vFov, hFov) / 2);
  if (camera.position.lengthSq() === 0) camera.position.set(0, 0, 1);
  camera.position.setLength(distance);
}

// Initial setup
handleResize();

// Key light — warm tungsten from upper-right, casts shadows
const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.5);
keyLight.position.set(4, 6, 4);
keyLight.castShadow = true;
keyLight.shadow.bias = -0.001;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 5;
keyLight.shadow.camera.bottom = -5;
scene.add(keyLight);

// Fill light — cooler daylight from the left to soften shadows
const fillLight = new THREE.DirectionalLight(0xd0e8ff, 1.2);
fillLight.position.set(-4, 2, 2);
scene.add(fillLight);

// Rim light — from behind to outline the camera body and create depth
const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
rimLight.position.set(-2, 4, -5);
scene.add(rimLight);

// Hemisphere — warm sky above, cool shadow below for natural ambient
const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x334466, 0.7);
scene.add(hemiLight);

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

// Debounced resize so Locomotive Scroll's internal recalculations don't spam repaints
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(handleResize, 150);
});
window.addEventListener("orientationchange", handleResize);
// Container size can change without a window resize (layout shifts, fonts, scroll libs)
new ResizeObserver(handleResize).observe(document.getElementById("container3D"));

//add mouse position listener, so we can make the eye move
document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

//Start the 3D rendering
animate();
