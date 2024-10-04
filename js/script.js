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
  const dayTexture = textureLoader.load("/assets/earth.jpg");
  const bumpTexture = textureLoader.load("/assets/bump-earth.jpg");
  const nightTexture = textureLoader.load("/assets/earth-night.jpg");

  // Earth geometry
  const earthGeometry = new THREE.SphereGeometry(10, 64, 64);

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: dayTexture, // Day map
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.0, 
  });

  // Earth mesh
  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Add directional light to simulate the sun
  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
  directionalLight.position.set(50, 0, 30);
  scene.add(directionalLight);

  earthMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <emissivemap_fragment>`,
      `
        #ifdef USE_EMISSIVEMAP
          vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );

          emissiveColor *= 1.0 - smoothstep(-0.9, 0.1, dot(normalize(vNormal), directionalLights[0].direction));

          totalEmissiveRadiance *= emissiveColor.rgb;
        #endif
      `
    );
  };

  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambientLight);

  const lightHelper = new THREE.DirectionalLightHelper(directionalLight);
  scene.add(lightHelper);

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.0005;

    controls.update();

    renderer.render(scene, camera);
  };

  animate();
};

// Initialize the scene
const init = () => {
  createEarthScene();
};

init();
