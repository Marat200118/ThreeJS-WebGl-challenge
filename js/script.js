import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Create the scene, camera, and renderer
const createEarthScene = () => {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 30;

  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#c"),
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  // Add OrbitControls for interactivity
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Load textures
  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load("/assets/earth.jpg");
  const bumpTexture = textureLoader.load("/assets/bump-earth.jpg");
  const nightTexture = textureLoader.load("/assets/earth-night.jpg");

  // Earth geometry
  const earthGeometry = new THREE.SphereGeometry(10, 64, 64);

  // Earth material with day and night maps
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture, // Day map
    bumpMap: bumpTexture, // Bump map for surface details
    bumpScale: 0.05, // Bump scale for subtle terrain features
    emissiveMap: nightTexture, // Night map for city lights
    emissive: new THREE.Color(0xffff88), // Light color for night map
    emissiveIntensity: 0.8, // Adjust night light brightness
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Add directional light to simulate the sun
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5); // Sunlight
  directionalLight.position.set(50, 0, 30); // Sun position
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  scene.add(directionalLight);

  // Add an ambient light for soft global illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambientLight);

  const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
  scene.add(lightHelper);

  // Animation loop
  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Rotate the Earth slowly
    earth.rotation.y += 0.001;

    // Update controls
    controls.update();

    // Render the scene
    renderer.render(scene, camera);
  };

  animate();
};

// Initialize the scene
const init = () => {
  createEarthScene();
};

init();
