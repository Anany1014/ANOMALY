import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGameStore } from '../../../state/gameStore'

export function MobiusPlasmaLoop({ preview = false }: { preview?: boolean }) {
    const { gameState, activeArtifactId, wardrobe } = useGameStore()
    const meshRef = useRef<THREE.Mesh>(null)
    const matRef = useRef<THREE.ShaderMaterial>(null)
    const { camera } = useThree()

    const isActive = gameState === 'INSPECTING' && activeArtifactId === 'mobius'

    // Web Audio synthesizer removed at user request to ensure silent operations.

    // 2. Build Möbius Strip Parametric Geometry mathematically
    const mobiusGeometry = useMemo(() => {
        const geom = new THREE.BufferGeometry()
        const vertices: number[] = []
        const uvs: number[] = []
        const indices: number[] = []

        const uSegments = 100 // Smoothness around loop
        const vSegments = 20  // Smoothness across width
        const radius = 0.8    // Radius of outer loop
        const width = 0.35    // Width of ribbon

        // Generate Vertices and UVs
        for (let i = 0; i <= uSegments; i++) {
            const u = (i / uSegments) * Math.PI * 2

            for (let j = 0; j <= vSegments; j++) {
                // v ranges from -width/2 to +width/2
                const v = (j / vSegments - 0.5) * width

                // Möbius parametric equations:
                // Half twist along the circumferential path axis
                const twistAngle = u / 2.0

                const x = (radius + v * Math.cos(twistAngle)) * Math.cos(u)
                const y = (radius + v * Math.cos(twistAngle)) * Math.sin(u)
                const z = v * Math.sin(twistAngle)

                vertices.push(x, y, z)
                uvs.push(i / uSegments, j / vSegments)
            }
        }

        // Generate indices for triangles (faces)
        const rowSize = vSegments + 1
        for (let i = 0; i < uSegments; i++) {
            for (let j = 0; j < vSegments; j++) {
                const a = i * rowSize + j
                const b = i * rowSize + j + 1
                const c = (i + 1) * rowSize + j
                const d = (i + 1) * rowSize + j + 1

                // Triangle 1
                indices.push(a, b, c)
                // Triangle 2
                indices.push(b, d, c)
            }
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        geom.setIndex(indices)
        geom.computeVertexNormals()

        return geom
    }, [])

    // 3. Camera transition tween using GSAP
    useEffect(() => {
        if (preview || !isActive) return

        // Position of Mobius Pedestal is [-8, 0.9, 8], look target is [-8, 1.45, 8]
        const lookTarget = new THREE.Vector3(-8, 1.45, 8)
        const tl = gsap.timeline()

        tl.to(camera.position, {
            x: -8,
            y: 1.5,
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

    // Shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAudio: { value: 0 },
        uColor: { value: new THREE.Color() },
    }), [])

    useEffect(() => {
        uniforms.uColor.value.set(wardrobe.emissiveColor)
    }, [wardrobe.emissiveColor, uniforms])

    // 4. Update simulated pulsing value and shader time
    useFrame((state) => {
        const elapsed = state.clock.getElapsedTime()
        // Simulate a smooth procedural pulsing value to drive plasma waves quietly
        const audioVal = Math.sin(elapsed * 2.5) * 0.15 + 0.15

        if (matRef.current) {
            matRef.current.uniforms.uTime.value = elapsed
            matRef.current.uniforms.uAudio.value = audioVal
        }

        if (meshRef.current) {
            // Rotation rate responds to sound intensity
            const rotSpeed = 0.15 + audioVal * 0.8
            meshRef.current.rotation.y = elapsed * rotSpeed
            meshRef.current.rotation.z = elapsed * 0.08
        }
    })

    return (
        <group position={preview ? [0, 0, 0] : [-8, 1.45, 8]}>
            {/* Möbius Extruded Mesh */}
            <mesh ref={meshRef} geometry={mobiusGeometry}>
                <shaderMaterial
                    ref={matRef}
                    transparent
                    side={THREE.DoubleSide}
                    uniforms={uniforms}
                    vertexShader={`
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
                    fragmentShader={`
            uniform float uTime;
            uniform float uAudio;
            uniform vec3 uColor;
            varying vec2 vUv;
            
            void main() {
              // Procedural audio-reactive plasma lines
              // Dynamic frequency shifts the wave density
              float frequency = 12.0 + uAudio * 30.0;
              float pulseSpeed = 4.0 + uAudio * 15.0;
 
              // Wave calculation moving down the ribbon axis
              float waveValue = sin(vUv.x * frequency - uTime * pulseSpeed) * 0.5 + 0.5;
              
              // Edge shading glow transition
              float edgeGlow = 1.0 - abs(vUv.y - 0.5) * 2.0;
              edgeGlow = pow(edgeGlow, 3.0);
 
              vec3 glowColor = uColor * (waveValue * 1.5 + 0.5) * (edgeGlow + 0.2);
 
              gl_FragColor = vec4(glowColor, edgeGlow * 0.8 + 0.1);
            }
          `}
                />
            </mesh>

            {/* Dynamic glow beacon below loop */}
            {!preview && (
                <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
