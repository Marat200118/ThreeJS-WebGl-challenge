import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { cloudFragmentShader, vertexShader } from "/shaders/cloudShader.js";
import * as satelliteManager from "./satelliteManager.js";


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
let showSatellites = false;
let activeTrajectory = null;
let satelliteMarkers = [];
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let satellitesLoaded = false;

const createEarthScene = async () => {


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

  // const satelliteMarkers = await satelliteManager.addSatellitesToScene(scene);

  const toggleSatellitesButton = document.createElement("button");
  toggleSatellitesButton.innerHTML = "Toggle Real-Time Satellites";
  toggleSatellitesButton.style.position = "absolute";
  toggleSatellitesButton.style.top = "50px";
  toggleSatellitesButton.style.right = "20px";
  document.body.appendChild(toggleSatellitesButton);

  toggleSatellitesButton.addEventListener("click", async () => {
    showSatellites = !showSatellites;

    if (!satellitesLoaded) {
      // Fetch satellite data only the first time the user toggles the button
      satelliteMarkers = await satelliteManager.addSatellitesToScene(scene);
      satellitesLoaded = true;
    }

    // Toggle satellite visibility
    satelliteMarkers.forEach(({ marker }) => {
      marker.visible = showSatellites;
    });
  });

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
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
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
    const panelGeometry = new THREE.PlaneGeometry(2.5, 0.5);
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
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

    const pointLight = new THREE.PointLight(0xffb406, 40);
    pointLight.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xffb406 })
      )
    );
    pointLight.position.set(0, 0.1, -0.35);
    satelliteGroup.add(pointLight);

    const createPanelLight = (x, y, z) => {
      const light = new THREE.PointLight(0xffffff, 10, 10);
      light.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.05, 8, 8),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            opacity: 0.8,
            transparent: true, 
          })
        )
      );
      light.position.set(x, y, z);
      satelliteGroup.add(light);
      return light;
    };

    // Add small lights to the four corners of both solar panels
    const panelLights = [
      createPanelLight(-3.45, 0.25, 0),
      createPanelLight(-3.45, -0.25, 0),
      createPanelLight(3.45, 0.25, 0),
      createPanelLight(3.45, -0.25, 0),
    ];

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
      pointLight,
      panelLights,
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

    if (showSatellites && satelliteMarkers.length > 0) {
      satelliteManager.updateSatellitePositions(satelliteMarkers);
    }

    earth.rotation.y += 0.0005;

    let elapsedTime = (Date.now() - startTime) / 1000;
    cloudShaderMaterial.uniforms.iTime.value = elapsedTime;

    satellites.forEach((satellite) => {
      satellite.angle += satellite.orbitSpeed * satellite.direction;
      satellite.group.position.x =
        satellite.orbitRadius * Math.cos(satellite.angle);
      satellite.group.position.z =
        satellite.orbitRadius * Math.sin(satellite.angle);
      satellite.group.lookAt(earth.position);

      satellite.pointLight.intensity = Math.abs(Math.sin(elapsedTime * 3)); 

      satellite.panelLights.forEach((light) => {
        light.intensity = Math.abs(Math.sin(elapsedTime * 10)); 
      });
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

  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earth);

    if (intersects.length > 0) {
      const intersect = intersects[0];
      const uv = intersect.uv;
      uniforms.iMouse.value.set(uv.x, uv.y);
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  });

  window.addEventListener("click", (event) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      satelliteMarkers.map((s) => s.marker)
    );

    if (intersects.length > 0) {
      const clickedSatellite = satelliteMarkers.find(
        (sat) => sat.marker === intersects[0].object
      );
      if (clickedSatellite) {
        showSatellitePopup(clickedSatellite.name);
        displaySatelliteTrajectory(clickedSatellite.satrec, scene);
      }
    }
  });
};

const showSatellitePopup = (satelliteName) => {
  const popup = document.createElement("div");
  popup.className = "satellite-popup";
  popup.innerHTML = `<strong>Satellite Name:</strong> ${satelliteName}`;
  document.body.appendChild(popup);

  popup.style.left = `${event.clientX + 10}px`;
  popup.style.top = `${event.clientY + 10}px`;

  setTimeout(() => {
    popup.remove(); // Remove the popup after a few seconds
    removeSatelliteTrajectory();
  }, 5000);
}

const displaySatelliteTrajectory = (satrec, scene) => {
  const points = [];
  const now = new Date();
  const timeStep = 60; // Time step for calculating trajectory points (in seconds)

  for (let i = -43200; i <= 43200; i += timeStep) {
    // Cover past and future 12 hours
    const futureTime = new Date(now.getTime() + i * 1000);
    const position = satelliteManager.getSatellitePosition(satrec, futureTime);
    points.push(position);
  }

  const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);

  // Remove existing trajectory
  if (activeTrajectory) {
    scene.remove(activeTrajectory);
  }

  scene.add(trajectoryLine);
  activeTrajectory = trajectoryLine;
};

// Remove Satellite Trajectory
const removeSatelliteTrajectory = () => {
  if (activeTrajectory) {
    activeTrajectory.visible = false;
  }
};


const init = async () => {


  document.getElementById("cloudscale").addEventListener("input", (e) => {
    uniforms.cloudscale.value = parseFloat(e.target.value);
  });
  document.getElementById("speed").addEventListener("input", (e) => {
    uniforms.speed.value = parseFloat(e.target.value);
  });
  document.getElementById("clouddark").addEventListener("input", (e) => {
    uniforms.clouddark.value = parseFloat(e.target.value);
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
