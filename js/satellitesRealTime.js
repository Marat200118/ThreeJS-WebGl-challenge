import * as THREE from "three";
import * as satellite from "satellite.js";

let cachedTLEData = null;
let lastFetchTime = null;
const TLE_FETCH_INTERVAL = 12 * 60 * 60 * 1000;

export async function fetchSatelliteTLEs() {
  const currentTime = new Date().getTime();

  if (
    cachedTLEData &&
    lastFetchTime &&
    currentTime - lastFetchTime < TLE_FETCH_INTERVAL
  ) {
    return cachedTLEData;
  }

  try {
    const response = await fetch(
      "https://celestrak.com/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
    );
    const data = await response.text();
    const tleData = data.split("\n").filter((line) => line.trim());

    cachedTLEData = tleData;
    lastFetchTime = currentTime;

    return tleData;
  } catch (error) {
    console.error("Failed to fetch TLE data:", error);
    return [];
  }
}

export function parseTLE(tleData) {
  const satellites = [];
  for (let i = 0; i < tleData.length; i += 3) {
    const satName = tleData[i].trim();
    const tleLine1 = tleData[i + 1].trim();
    const tleLine2 = tleData[i + 2].trim();
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    satellites.push({ name: satName, satrec });
  }
  return satellites;
}

export function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

export function getSatellitePosition(satrec, time) {
  const gmst = satellite.gstime(time);
  const positionAndVelocity = satellite.propagate(satrec, time);
  const positionEci = positionAndVelocity.position;

  const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  const longitude = satellite.degreesLong(positionGd.longitude);
  const latitude = satellite.degreesLat(positionGd.latitude);

  return latLonToVector3(latitude, longitude, 11);
}

function getSatelliteColor(satelliteName) {
  if (satelliteName.includes("STARLINK")) {
    return 0xffff00; 
  } else if (
    satelliteName.includes("UFO") ||
    satelliteName.includes("INMARSAT") ||
    satelliteName.includes("THURAYA") ||
    satelliteName.includes("DIRECTV") ||
    satelliteName.includes("INTELSAT")
  ) {
    return 0x0000ff;
  } else if (
    satelliteName.includes("MILITARY") ||
    satelliteName.includes("USA") ||
    satelliteName.includes("OPS") ||
    satelliteName.includes("DSP") ||
    satelliteName.includes("MILSTAR")
  ) {
    return 0x008e00;
  } else if (
    satelliteName.includes("RESEARCH") ||
    satelliteName.includes("TEMPSAT") ||
    satelliteName.includes("UOSAT") ||
    satelliteName.includes("CALIPSO") ||
    satelliteName.includes("SORCE") ||
    satelliteName.includes("AURA")
  ) {
    return 0xffa500;
  } else {
    return 0xff0000;
  }
}

export async function addSatellitesToScene(scene) {
  const tleData = await fetchSatelliteTLEs();
  const satellites = parseTLE(tleData);

  const satelliteMarkers = satellites.map((satellite) => {
    const color = getSatelliteColor(satellite.name);
    const geometry = new THREE.SphereGeometry(0.03, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);
    scene.add(marker);
    return { marker, satrec: satellite.satrec, name: satellite.name };
  });

  return satelliteMarkers;
}

export function updateSatellitePositions(satelliteMarkers) {
  const currentTime = new Date();
  satelliteMarkers.forEach(({ marker, satrec }) => {
    const position = getSatellitePosition(satrec, currentTime);
    marker.position.copy(position); 
  });
}
