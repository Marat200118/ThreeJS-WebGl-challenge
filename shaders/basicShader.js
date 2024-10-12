// Vertex Shader
export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader
export const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  uniform float time;

  void main() {
    // Create a rotating swirl effect based on UV and time
    float angle = atan(vPosition.y, vPosition.x) + time;
    float swirl = sin(angle * 10.0) * 0.3 + 0.7;

    // Atmosphere-like glow effect based on normal direction
    float glow = max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    vec3 glowColor = vec3(0.0, 0.5, 1.0) * glow * 0.6;

    // Base color with swirl effect
    vec3 baseColor = mix(vec3(0.2, 0.2, 0.8), vec3(0.9, 0.2, 0.1), swirl);

    // Final color combining glow and base
    vec3 finalColor = baseColor + glowColor;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
