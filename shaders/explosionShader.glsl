// Vertex Shader
varying vec2 vUv;           // Pass texture coordinates to fragment shader
varying vec3 vPosition;      // Pass position to fragment shader

void main() {
  vUv = uv;                  // Use built-in `uv` from Three.js geometry
  vPosition = position;      // Use built-in `position` from Three.js geometry
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform sampler2D map;       // Texture map
uniform float time;          // Time variable for explosion
uniform vec3 explosionCenter; // Center of explosion

varying vec2 vUv;            // Passed from vertex shader
varying vec3 vPosition;      // Passed from vertex shader

void main() {
  // Base texture color from UV coordinates
  vec3 color = texture2D(map, vUv).rgb;

  // Compute distance from the explosion center
  float distance = length(vPosition - explosionCenter);
  
  // Explosion effect: strength decreases with time and distance
  float explosion = max(0.0, 1.0 - distance / (5.0 * time));

  // Add explosion color (red/orange glow)
  color += vec3(1.0, 0.3, 0.1) * explosion;

  // Set the fragment color
  gl_FragColor = vec4(color, 1.0);
}
