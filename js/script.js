import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { cloudFragmentShader, vertexShader } from "/shaders/cloudShader.js";
import { uniform } from "three/webgpu";
// import { createSatellite } from "/models/satellite.js";

let uniforms = {
  iTime: { value: 0 },
  iMouse: { value: new THREE.Vector2(0.5, 0.5) },
  cloudscale: { value: 2.1 },
  speed: { value: 0.03 },
  clouddark: { value: 0.5 },
  cloudlight: { value: 0.3 },
  cloudcover: { value: 0.7 },
  cloudalpha: { value: 8.0 },
  skytint: { value: 0.5 },
  cloudTexture: { value: null },
};

let useShaderClouds = false;

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
  const nightTexture = textureLoader.load("/assets/night.png");
  const cloudTexture = textureLoader.load("/assets/clouds.png");
  // const gayabackground = textureLoader.load("/assets/gayabackground.png");
  // gayabackground.mapping = THREE.EquirectangularReflectionMapping;
  // gayabackground.opacity = 0.1;

  // scene.background = gayabackground;

  const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
  const earthMaterial = new THREE.MeshStandardMaterial({
    map: dayTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    emissiveMap: nightTexture,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.0,
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  const cloudGeometry = new THREE.SphereGeometry(10.05, 64, 64);
  const cloudMaterial = new THREE.MeshStandardMaterial({
    alphaMap: cloudTexture,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
  scene.add(clouds);
  // uniforms.cloudTexture.value = cloudTexture;

  const cloudShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: cloudFragmentShader,
    uniforms: uniforms,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const cloudShaderMesh = new THREE.Mesh(cloudGeometry, cloudShaderMaterial);
  cloudShaderMesh.visible = false;
  scene.add(cloudShaderMesh);

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

    const pointLight = new THREE.PointLight(0xfffff, 20);
    pointLight.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0040 })
      )
    );
    pointLight.position.set(0, 0.1, -0.35);
    satelliteGroup.add(pointLight);

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

  const button = document.createElement("button");
  button.innerHTML = "Toggle Cloud Shader";
  button.style.position = "absolute";
  button.style.top = "20px";
  button.style.right = "20px";
  document.body.appendChild(button);

  button.addEventListener("click", () => {
    useShaderClouds = !useShaderClouds;
    clouds.visible = !useShaderClouds;
    cloudShaderMesh.visible = useShaderClouds;

    document.getElementById("controls").style.display = useShaderClouds
      ? "block"
      : "none";
  });

  const animate = () => {
    requestAnimationFrame(animate);

    earth.rotation.y += 0.0005;

    // clouds.rotation.y += 0.0007;

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

    if (useShaderClouds) {
      cloudShaderMesh.rotation.y += 0.0007;
    } else {
      clouds.rotation.y += 0.0007;
    }

    controls.update();

    renderer.render(scene, camera);
  };

  animate();
};

const init = async () => {
  window.addEventListener("mousemove", (event) => {
    uniforms.iMouse.value.x = event.clientX / window.innerWidth;
    uniforms.iMouse.value.y = 1 - event.clientY / window.innerHeight;
  });

  document.getElementById("cloudscale").addEventListener("input", (e) => {
    uniforms.cloudscale.value = parseFloat(e.target.value);
  });
  document.getElementById("speed").addEventListener("input", (e) => {
    uniforms.speed.value = parseFloat(e.target.value);
  });
  document.getElementById("clouddark").addEventListener("input", (e) => {
    uniforms.clouddark.value = parseFloat(e.target.value);
  });
  document.getElementById("cloudlight").addEventListener("input", (e) => {
    uniforms.cloudlight.value = parseFloat(e.target.value);
  });
  document.getElementById("cloudcover").addEventListener("input", (e) => {
    uniforms.cloudcover.value = parseFloat(e.target.value);
  });
  document.getElementById("cloudalpha").addEventListener("input", (e) => {
    uniforms.cloudalpha.value = parseFloat(e.target.value);
  });
  document.getElementById("skytint").addEventListener("input", (e) => {
    uniforms.skytint.value = parseFloat(e.target.value);
  });

  createEarthScene();
};

init();
