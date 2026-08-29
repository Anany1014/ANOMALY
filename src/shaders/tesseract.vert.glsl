uniform float uTime;
uniform float uSpeed;
uniform float uScale;
attribute float aW; // 4th coordinate of tesseract vertices

varying vec3 vPosition;
varying vec3 vNormal;

// Rotate in 2D plane
vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  // Input 4D coordinates
  float x = position.x;
  float y = position.y;
  float z = position.z;
  float w = aW;

  // Perform rotations in 4D hyperplanes
  // 1. Rotation in X-W plane
  float theta = uTime * uSpeed * 0.4;
  vec2 xw = rotate2D(vec2(x, w), theta);
  x = xw.x;
  w = xw.y;

  // 2. Rotation in Y-Z plane
  float phi = uTime * 0.3;
  vec2 yz = rotate2D(vec2(y, z), phi);
  y = yz.x;
  z = yz.y;

  // 3. Rotation in Z-W plane
  float psi = uTime * uSpeed * 0.2;
  vec2 zw = rotate2D(vec2(z, w), psi);
  z = zw.x;
  w = zw.y;

  // Perspective projection from 4D to 3D
  // 4D camera is placed at distance D along W-axis
  float D = 2.4;
  float factor = 1.0 / (D - w);
  
  vec3 pos3D = vec3(x, y, z) * factor * uScale;

  // Pass varying positions
  vPosition = pos3D;
  vNormal = normalMatrix * normal;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos3D, 1.0);
}
