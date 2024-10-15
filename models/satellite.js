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


export { createSatellite };