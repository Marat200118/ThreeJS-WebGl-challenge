import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { cloudFragmentShader, vertexShader } from "/shaders/cloudShader.js";
import * as satellitesRealTime from "./satellitesRealTime.js";
import { createSatellite } from "/models/satellite.js";


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
let showBackground = true; 

const createEarthScene = async () => {

  let startTime = Date.now();

  const satellites = [];
  const satelliteCount = 5;

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
  const gayabackground = textureLoader.load("/assets/gayabackground.png");
  gayabackground.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = gayabackground;


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

  for (let i = 0; i < satelliteCount; i++) {
    const orbitRadius = 15 + Math.random() * 10;
    const orbitSpeed = 0.001 + Math.random() * 0.002;
    const startAngle = Math.random() * Math.PI * 2; 
    const direction = Math.random() > 0.5 ? 1 : -1; 

    const satellite = createSatellite(
      scene,
      orbitRadius,
      orbitSpeed,
      startAngle,
      direction
    );
    satellites.push(satellite);
  }


  const toggleBackgroundBtn = document.querySelector(".toggle-background");
  toggleBackgroundBtn.addEventListener("click", () => {
    showBackground = !showBackground;
    scene.background = showBackground ? gayabackground : null;
    toggleBackgroundBtn.innerText = showBackground
      ? "Hide Background"
      : "Show Background";
  });

  const toggleSatellitesBtn = document.querySelector(".toggle-satellites");
  const satelliteIndicator = document.querySelector(".satellite-indicator");

  toggleSatellitesBtn.addEventListener("click", async () => {
    showSatellites = !showSatellites;

    if (!satellitesLoaded) {
      satelliteMarkers = await satellitesRealTime.addSatellitesToScene(scene);
      satellitesLoaded = true;
    }

    satelliteMarkers.forEach(({ marker }) => {
      marker.visible = showSatellites;
    });

    toggleSatellitesBtn.innerText = showSatellites
      ? "Hide Real-Time Satellites"
      : "Show Real-Time Satellites";

    satelliteIndicator.style.display = showSatellites ? "block" : "none";
  });

  const toggleCloudShaderBtn = document.querySelector(".toggle-cloud-shader");
  const controlsDiv = document.querySelector("#controls");

  toggleCloudShaderBtn.addEventListener("click", () => {
    useShaderClouds = !useShaderClouds;
    clouds.visible = !useShaderClouds;
    cloudShaderMesh.visible = useShaderClouds;

    controlsDiv.style.display = useShaderClouds ? "block" : "none";

    toggleCloudShaderBtn.innerText = useShaderClouds
      ? "Hide Cloud Shader"
      : "Show Cloud Shader";
  });

  const animate = () => {
    requestAnimationFrame(animate);

    if (showSatellites && satelliteMarkers.length > 0) {
      satellitesRealTime.updateSatellitePositions(satelliteMarkers);
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
    popup.remove();
    removeSatelliteTrajectory();
  }, 5000);
}

const displaySatelliteTrajectory = (satrec, scene) => {
  const points = [];
  const now = new Date();
  const timeStep = 60;

  for (let i = -43200; i <= 43200; i += timeStep) {
    const futureTime = new Date(now.getTime() + i * 1000);
    const position = satellitesRealTime.getSatellitePosition(
      satrec,
      futureTime
    );
    points.push(position);
  }

  const trajectoryGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);

  if (activeTrajectory) {
    scene.remove(activeTrajectory);
  }

  scene.add(trajectoryLine);
  activeTrajectory = trajectoryLine;
};

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
