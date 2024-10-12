uniform float iTime;
uniform vec3 iResolution;
varying vec2 vUv;

float noise(vec2 p) {
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(iTime / 11.0))) + 0.2;
}

mat2 rotate(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float fbm(vec2 p) {
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    mat2 modify = rotate(iTime / 50.0 * float(i * i));
    f += amp * noise(p);
    p = modify * p;
    p *= 2.0;
    amp /= 2.2;
  }
  return f;
}

vec3 getColor(vec2 p) {
  float bar = mod(p.y + iTime * 20.0, 1.0) < 0.2 ? 1.4 : 1.0;
  float middle = fbm(p);
  return vec3(0.9) * middle * bar;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 p = fragCoord / iResolution.xy;
  vec3 col = getColor(p);
  fragColor = vec4(col, 1.0);
}

void main() {
  mainImage(gl_FragColor, vUv * iResolution.xy);
}
