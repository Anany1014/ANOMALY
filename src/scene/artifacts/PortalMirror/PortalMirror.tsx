import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGameStore } from '../../../state/gameStore'

export function PortalMirror({ preview = false }: { preview?: boolean }) {
    const { gameState, activeArtifactId, wardrobe } = useGameStore()
    const matRef = useRef<THREE.ShaderMaterial>(null)
    const frameRef = useRef<THREE.Group>(null)
    const { camera } = useThree()

    const isActive = gameState === 'INSPECTING' && activeArtifactId === 'portal'

    // 1. Camera transition tween using GSAP
    useEffect(() => {
        if (preview || !isActive) return

        // Position of Portal Pedestal is [8, 0.9, 8], look target is [8, 1.35, 8]
        const lookTarget = new THREE.Vector3(8, 1.35, 8)
        const tl = gsap.timeline()

        tl.to(camera.position, {
            x: 8,
            y: 1.45,
            z: 8 + 3.0,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: () => {
                camera.lookAt(lookTarget)
            }
        })

        return () => {
            tl.kill()
        }
    }, [isActive, camera, preview])

    // Custom shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color() },
    }), [])

    useEffect(() => {
        uniforms.uColor.value.set(wardrobe.emissiveColor)
    }, [wardrobe.emissiveColor, uniforms])

    // 2. Animate portal shader time AND frame rotation slowly when exploring
    useFrame((state) => {
        const elapsed = state.clock.getElapsedTime()
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = elapsed
        }

        if (frameRef.current && !isActive) {
            frameRef.current.rotation.y = elapsed * 0.1
        }
    })

    return (
        <group position={preview ? [0, 0, 0] : [8, 1.4, 8]} ref={frameRef}>
            {/* 1. Brutalist concrete black frame enclosing the portal */}
            {/* Left Frame Border */}
            <mesh position={[-0.7, 0, 0]}>
                <boxGeometry args={[0.15, 2.0, 0.15]} />
                <meshStandardMaterial color="#0f0f0f" roughness={0.7} metalness={0.9} />
            </mesh>
            {/* Right Frame Border */}
            <mesh position={[0.7, 0, 0]}>
                <boxGeometry args={[0.15, 2.0, 0.15]} />
                <meshStandardMaterial color="#0f0f0f" roughness={0.7} metalness={0.9} />
            </mesh>
            {/* Top Frame Border */}
            <mesh position={[0, 1.0, 0]}>
                <boxGeometry args={[1.55, 0.15, 0.15]} />
                <meshStandardMaterial color="#0f0f0f" roughness={0.7} metalness={0.9} />
            </mesh>
            {/* Bottom Frame Border */}
            <mesh position={[0, -1.0, 0]}>
                <boxGeometry args={[1.55, 0.15, 0.15]} />
                <meshStandardMaterial color="#0f0f0f" roughness={0.7} metalness={0.9} />
            </mesh>

            {/* 2. Embedded emissive warning lights on the frame (accent) */}
            <mesh position={[-0.7, 0.9, 0.081]}>
                <boxGeometry args={[0.04, 0.04, 0.01]} />
                <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={2.5} />
            </mesh>
            <mesh position={[0.7, 0.9, 0.081]}>
                <boxGeometry args={[0.04, 0.04, 0.01]} />
                <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={2.5} />
            </mesh>

            {/* 3. Non-Euclidean Portal Plane (Procedural Cosmic Shader) */}
            {/* Note: Renders double-sided so looking from front/back yields different views */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[1.25, 1.85]} />
                <shaderMaterial
                    ref={matRef}
                    side={THREE.DoubleSide}
                    uniforms={uniforms}
                    vertexShader={`
            varying vec3 vWorldPosition;
            varying vec2 vUv;
            void main() {
              vUv = uv;
              vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
                    fragmentShader={`
            uniform float uTime;
            uniform vec3 uColor;
            varying vec3 vWorldPosition;
            varying vec2 vUv;

            // Simple 3D sine-based noise function
            float hash(vec3 p) {
              p = fract(p * 0.3183099 + vec3(0.1, 0.1, 0.1));
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }

            float noise(vec3 x) {
              vec3 i = floor(x);
              vec3 f = fract(x);
              f = f * f * (3.0 - 2.0 * f);
              return mix(
                mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                    mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                    mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z
              );
            }

            // Layered noise for deep space density
            float fbm(vec3 p) {
              float sum = 0.0;
              float amp = 1.0;
              for(int i = 0; i < 4; i++) {
                sum += amp * noise(p);
                p *= 2.1;
                amp *= 0.5;
              }
              return sum;
            }

            void main() {
              // Calculate view direction vector in 3D world space
              vec3 viewDir = normalize(vWorldPosition - cameraPosition);

              // 1. Procedural skybox sampling:
              // Project viewDir onto spherical angles mapping to celestial noise coordinates
              vec2 sphericalCoord = vec2(atan(viewDir.z, viewDir.x), acos(viewDir.y));
              vec3 noisePos = vec3(sphericalCoord * 8.0, uTime * 0.15);

              // Standard fractal brownian noise density of clouds
              float density = fbm(noisePos);

              // Determine whether camera looks at front face or back face of portal
              // gl_FrontFacing is true when viewed from front (positive Z)
              vec3 finalColor = vec3(0.0);

              if (gl_FrontFacing) {
                // Front cosmic skybox: Red/Orange space storm nebula
                vec3 col1 = vec3(0.85, 0.20, 0.10); // Red core
                vec3 col2 = vec3(0.12, 0.05, 0.35); // Dark blue backdrop
                
                // Emphasize glow of custom wardrobe highlight
                col1 = mix(col1, uColor, 0.4);

                vec3 spaceFog = mix(col2, col1, density);
                
                // Add tiny celestial stars
                float stars = pow(hash(floor(viewDir * 125.0)), 22.0);
                finalColor = spaceFog + vec3(stars * 1.5);
              } else {
                // Back cosmic skybox: Blue/Green cyber matrix skybox
                vec3 col1 = vec3(0.0, 0.85, 0.45); // Emerald cyber lines
                vec3 col2 = vec3(0.02, 0.02, 0.12); // Infinite black
                
                // Layered matrix digital patterns
                float linePulse = step(0.68, fract(vWorldPosition.y * 3.5 - uTime * 0.45));
                float matrixLines = fract(sphericalCoord.x * 20.0);
                float lineGlow = smoothstep(0.85, 0.98, sin(matrixLines * 6.28 + uTime * 2.0));
                
                vec3 spaceMatrix = mix(col2, col1, density * 0.6);
                spaceMatrix += col1 * linePulse * 0.4;
                spaceMatrix += col1 * lineGlow * 0.3;

                finalColor = spaceMatrix;
              }

              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
                />
            </mesh>

            {/* Floor glow beacon */}
            {!preview && (
                <mesh position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.2, 1.2]} />
                    <meshBasicMaterial
                        color={wardrobe.emissiveColor}
                        transparent
                        opacity={0.15}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    )
}
