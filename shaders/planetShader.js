// planetShader.js
export const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  uniform float iTime;
  uniform vec3 iResolution;
  uniform sampler2D iChannel0; // Earth texture
  uniform sampler2D iChannel1; // Cloud texture
  varying vec2 vUv;
  varying vec3 vPosition;

  // Constants and parameters for the effect
  const float sphsize = 0.7; // Planet size
  const float dist = 0.27; // Distance for glow and distortion
  const float perturb = 0.3; // Distortion amount of the flow around the planet
  const float displacement = 0.015; // Hot air effect
  const float windspeed = 0.4; // Speed of wind flow
  const float steps = 110.0; // Number of steps for the volumetric rendering
  const float stepsize = 0.025; 
  const float brightness = 0.43;
  const vec3 planetcolor = vec3(0.55, 0.4, 0.3); // Base color for the effect
  const float fade = 0.005; // Fade by distance
  const float glow = 3.5; // Glow amount, mainly on hit side

  const int iterations = 13; 
  const float fractparam = 0.7;
  const vec3 offset = vec3(1.5, 2.0, -1.5);

  // Wind noise function
  float wind(vec3 p) {
    float d = max(0.0, dist - max(0.0, length(p) - sphsize) / sphsize) / dist; // For distortion and glow area
    float x = max(0.2, p.x * 2.0); // To increase glow on left side
    p.y *= 1.0 + max(0.0, -p.x - sphsize * 0.25) * 1.5; // Left side distortion
    p -= d * normalize(p) * perturb; // Spheric distortion of flow
    p += vec3(iTime * windspeed, 0.0, 0.0); // Flow movement
    p = abs(fract((p + offset) * 0.1) - 0.5); // Tile folding

    // Fractal iteration
    for (int i = 0; i < iterations; i++) {
      p = abs(p) / dot(p, p) - fractparam;
    }

    return length(p) * (1.0 + d * glow * x) + d * glow * x; // Apply glow
  }

  void main() {
    vec3 dir = normalize(vPosition); // Use the fragment's position to simulate direction

    // Perform volumetric rendering and wind effects
    float v = 0.0, l = -0.0001, t = iTime * windspeed * 0.2;
    for (float r = 10.0; r < steps; r++) {
      vec3 p = dir * r * stepsize;
      float tx = texture2D(iChannel0, vUv * 0.2 + vec2(t, 0.0)).x * displacement; // Hot air effect

      if (length(p) - sphsize - tx > 0.0)
        v += min(50.0, wind(p)) * max(0.0, 1.0 - r * fade); // Outside planet, apply wind effect
      else if (l < 0.0)
        l = pow(max(0.53, dot(normalize(p), normalize(vec3(-1.0, 0.5, -0.3)))), 4.0)
            * (0.5 + texture2D(iChannel1, vUv * vec2(2.0, 1.0) + vec2(tx + t * 0.5, 0.0)).x * 2.0);
    }

    v /= steps;
    v *= brightness; // Apply brightness

    vec3 col = vec3(v * 1.25, v * v, v * v * v) + l * planetcolor; // Combine the effect with color
    col *= 1.0 - length(pow(abs(vUv), vec2(5.0))) * 14.0; // Vignette

    gl_FragColor = vec4(col, 1.0); // Output the final color
  }
`;
