const cloudFragmentShader = `
uniform float iTime;
uniform vec2 iMouse;
varying vec2 vUv;

uniform float cloudscale;
uniform float speed;
uniform float clouddark;
uniform float cloudlight;
uniform float cloudcover;
uniform float cloudalpha;
uniform float skytint;
uniform sampler2D cloudTexture;

const vec3 skycolour1 = vec3(0.2, 0.4, 0.6);
const vec3 skycolour2 = vec3(0.4, 0.7, 1.0);
const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );

vec2 hash( vec2 p ) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
}

float fbm(vec2 n) {
    float total = 0.0, amplitude = 0.1;
    for (int i = 0; i < 7; i++) {
        total += noise(n) * amplitude;
        n = m * n;
        amplitude *= 0.4;
    }
    return total;
}

void main() {
    vec2 uv = vUv;

    float distanceToMouse = distance(uv, iMouse);

    float influence = smoothstep(0.15, 0.0, distanceToMouse);

    if (distanceToMouse < 0.15) {
        float angle = atan(uv.y - iMouse.y, uv.x - iMouse.x);
        angle += iTime * 3.0;
        float radius = length(uv - iMouse) * 0.5;
        uv.x = mix(uv.x, iMouse.x + radius * cos(angle), influence);
        uv.y = mix(uv.y, iMouse.y + radius * sin(angle), influence);
    }

    float time = iTime * speed;
    float q = fbm(uv * cloudscale * 0.5);

    float r = 0.0;
    uv *= cloudscale;
    uv -= q - time;
    float weight = 0.8;
    for (int i = 0; i < 8; i++) {
        r += abs(weight * noise(uv));
        uv = m * uv + time;
        weight *= 0.7;
    }

    float f = 0.0;
    uv = vUv * cloudscale;
    uv -= q - time;
    weight = 0.7;
    for (int i = 0; i < 8; i++) {
        f += weight * noise(uv);
        uv = m * uv + time;
        weight *= 0.6;
    }

    f *= r + f;

    float c = 0.0;
    time = iTime * speed * 2.0;
    uv = vUv * cloudscale * 2.0;
    uv -= q - time;
    weight = 0.4;
    for (int i = 0; i < 7; i++) {
        c += weight * noise(uv);
        uv = m * uv + time;
        weight *= 0.6;
    }

    float c1 = 0.0;
    time = iTime * speed * 3.0;
    uv = vUv * cloudscale * 3.0;
    uv -= q - time;
    weight = 0.4;
    for (int i = 0; i < 7; i++) {
        c1 += abs(weight * noise(uv));
        uv = m * uv + time;
        weight *= 0.6;
    }

    c += c1;

    vec3 skycolour = mix(skycolour2, skycolour1, vUv.y);
    vec3 cloudcolour = vec3(1.1, 1.1, 0.9) * clamp((clouddark + cloudlight * c), 0.0, 1.0);

    f = cloudcover + cloudalpha * f * r;

    vec3 proceduralClouds = mix(skycolour, clamp(skytint * skycolour + cloudcolour, 0.0, 1.0), clamp(f + c, 0.0, 1.0));

    vec4 textureClouds = texture2D(cloudTexture, vUv);
    vec3 finalClouds = mix(textureClouds.rgb, proceduralClouds, 0.5);

    gl_FragColor = vec4(finalClouds, 0.8); 
}
`;
export { cloudFragmentShader };

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export { vertexShader };
