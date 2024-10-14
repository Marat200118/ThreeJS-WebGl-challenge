import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { vertexShader, fragmentShader } from "/shaders/planetShader.js";
// import { fragmentShader as cloudFragmentShader } from "/shaders/cloudShader.glsl";
import { cloudFragmentShader } from "/shaders/cloudShader.js";



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

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const textureLoader = new THREE.TextureLoader();
  const dayTexture = textureLoader.load("/assets/earth.jpg");
  const bumpTexture = textureLoader.load("/assets/bump-earth.jpg");
  const nightTexture = textureLoader.load("/assets/earth-night.jpg");
  const cloudTexture = textureLoader.load("/assets/clouds.png");
  const gayabackground = textureLoader.load("/assets/gayabackground.png");
  gayabackground.mapping = THREE.EquirectangularReflectionMapping;
  gayabackground.opacity = 0.5;

  scene.background = gayabackground;

  const earthGeometry = new THREE.SphereGeometry(10, 64, 64);

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: dayTexture, // Day map
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.0,
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  //  const shaderMaterial = new THREE.ShaderMaterial({
  //    vertexShader: vertexShader, // Use the imported vertex shader
  //    fragmentShader: fragmentShader, // Use the imported fragment shader
  //  });
  const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      iTime: { value: 0 },
      iResolution: {
        value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1),
      },
      iChannel0: { value: dayTexture }, // Earth texture
      iChannel1: { value: cloudTexture }, // Cloud texture
    },
    transparent: false,
  });

  const cloudGeometry = new THREE.SphereGeometry(10.05, 64, 64);
  const cloudMaterial = new THREE.MeshStandardMaterial({
    alphaMap: cloudTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);

    const cloudShaderMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: cloudFragmentShader,
      uniforms: {
        iTime: { value: 0 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

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

  // let useShader = false;
  // const button = document.createElement("button");
  // button.innerHTML = "Toggle Shader";
  // button.style.position = "absolute";
  // button.style.top = "20px";
  // button.style.left = "20px";
  // document.body.appendChild(button);

  let useCloudShader = false;
  const button = document.createElement("button");
  button.innerHTML = "Toggle Cloud Shader";
  button.style.position = "absolute";
  button.style.top = "20px";
  button.style.left = "20px";
  document.body.appendChild(button);

  button.addEventListener("click", () => {
    if (useCloudShader) {
      clouds.material = defaultCloudMaterial; 
    } else {
      clouds.material = cloudShaderMaterial;
    }
    useCloudShader = !useCloudShader;
  });

  let startTime = Date.now();

  const createSatellite = (
    scene,
    orbitRadius,
    orbitSpeed,
    startAngle,
    direction
  ) => {
    const satelliteGroup = new THREE.Group();

    // Satellite Main Body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4); // Smaller body
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const satelliteBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
    satelliteGroup.add(satelliteBody);

    // Solar Panel Support Arms
    const armGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 32);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.8, 0, 0);
    leftArm.rotation.z = Math.PI / 2;
    satelliteGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.8, 0, 0);
    rightArm.rotation.z = Math.PI / 2;
    satelliteGroup.add(rightArm);

    // Solar Panels
    const panelGeometry = new THREE.PlaneGeometry(1.5, 0.5);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      side: THREE.DoubleSide, // Panels are visible from both sides
    });

    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.set(-2.2, 0, 0);
    satelliteGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.set(2.2, 0, 0);
    satelliteGroup.add(rightPanel);

    // Antenna Dish
    const dishBaseGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 32);
    const dishBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
    });
    const dishBase = new THREE.Mesh(dishBaseGeometry, dishBaseMaterial);
    dishBase.position.set(0, 0.2, -0.2);
    satelliteGroup.add(dishBase);

    const dishGeometry = new THREE.CylinderGeometry(0, 0.15, 0.3, 32, 1, true);
    const dishMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.set(0, 0.45, -0.2);
    dish.rotation.x = -Math.PI / 2;
    satelliteGroup.add(dish);

    satelliteGroup.scale.set(0.5, 0.5, 0.5);

    satelliteGroup.position.set(
      orbitRadius * Math.cos(startAngle),
      0,
      orbitRadius * Math.sin(startAngle)
    );

    scene.add(satelliteGroup);

    return {
      group: satelliteGroup,
      orbitRadius,
      orbitSpeed,
      angle: startAngle,
      direction,
    };
  };

  const satellites = [];
  const satelliteCount = 5;

  for (let i = 0; i < satelliteCount; i++) {
    const orbitRadius = 15 + Math.random() * 10; // Random radius between 15 and 25
    const orbitSpeed = 0.001 + Math.random() * 0.002; // Random speed between 0.001 and 0.003
    const startAngle = Math.random() * Math.PI * 2; // Random start angle
    const direction = Math.random() > 0.5 ? 1 : -1; // Random orbit direction (clockwise/counterclockwise)

    const satellite = createSatellite(
      scene,
      orbitRadius,
      orbitSpeed,
      startAngle,
      direction
    );
    satellites.push(satellite);
  }


  const animate = () => {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.0005;

    clouds.rotation.y += 0.0007;

    let elapsedTime = (Date.now() - startTime) / 1000;
    cloudShaderMaterial.uniforms.iTime.value = elapsedTime;

    satellites.forEach((satellite) => {
      satellite.angle += satellite.orbitSpeed * satellite.direction;
      satellite.group.position.x =
        satellite.orbitRadius * Math.cos(satellite.angle);
      satellite.group.position.z =
        satellite.orbitRadius * Math.sin(satellite.angle);
      satellite.group.lookAt(earth.position);
    });

    controls.update();

    renderer.render(scene, camera);
  };

  animate();
};

const init = async () => {
  createEarthScene();
};

init();
