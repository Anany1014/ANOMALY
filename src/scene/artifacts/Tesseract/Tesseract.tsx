import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGameStore } from '../../../state/gameStore'
import vertexShader from '../../../shaders/tesseract.vert.glsl?raw'

export function Tesseract({ preview = false }: { preview?: boolean }) {
    const { gameState, activeArtifactId, wardrobe, tesseractSpeed } = useGameStore()
    const valRef = useRef<THREE.LineSegments>(null)
    const matRef = useRef<THREE.ShaderMaterial>(null)
    const { camera } = useThree()

    const isActive = gameState === 'INSPECTING' && activeArtifactId === 'tesseract'

    // 1. Construct 4D Hypercube geometry (Line segments)
    const [positions, aWs] = useMemo(() => {
        const vertices: number[][] = []

        // Generate 16 vertices of a 4D hypercube (-1 or +1 for each axis)
        for (let i = 0; i < 16; i++) {
            vertices.push([
                (i & 1) ? 1 : -1,
                (i & 2) ? 1 : -1,
                (i & 4) ? 1 : -1,
                (i & 8) ? 1 : -1,
            ])
        }

        const linePositions: number[] = []
        const lineAWs: number[] = []

        // 32 edges connecting vertices that differ by exactly 1 bit
        for (let i = 0; i < 16; i++) {
            for (let b = 0; b < 4; b++) {
                const neighbor = i ^ (1 << b)
                if (neighbor > i) {
                    // Add first vertex
                    linePositions.push(vertices[i][0], vertices[i][1], vertices[i][2])
                    lineAWs.push(vertices[i][3])

                    // Add second vertex
                    linePositions.push(vertices[neighbor][0], vertices[neighbor][1], vertices[neighbor][2])
                    lineAWs.push(vertices[neighbor][3])
                }
            }
        }

        return [
            new Float32Array(linePositions),
            new Float32Array(lineAWs),
        ]
    }, [])

    // 2. Camera transition tween using GSAP
    useEffect(() => {
        if (preview || !isActive) return

        // Position of Tesseract Pedestal is [-8, 0.9, -8], look target is [-8, 1.3, -8]
        const lookTarget = new THREE.Vector3(-8, 1.33, -8)

        const tl = gsap.timeline()

        tl.to(camera.position, {
            x: -8,
            y: 1.5,
            z: -8 + 3.0,
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

    // 3. Dynamic custom shader uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uSpeed: { value: 2.0 },
        uScale: { value: 0.95 },
        uColor: { value: new THREE.Color('#00ffcc') },
    }), [])

    // Update uniform colors when wardrobe accent changes
    useEffect(() => {
        uniforms.uColor.value.set(wardrobe.emissiveColor)
    }, [wardrobe.emissiveColor, uniforms])

    useFrame((state) => {
        const elapsed = state.clock.getElapsedTime()
        if (matRef.current) {
            matRef.current.uniforms.uTime.value = elapsed
            matRef.current.uniforms.uSpeed.value = tesseractSpeed
        }

        if (valRef.current) {
            valRef.current.rotation.y = elapsed * 0.05 * tesseractSpeed
            valRef.current.rotation.x = elapsed * 0.03 * tesseractSpeed
        }
    })

    return (
        <group position={preview ? [0, 0, 0] : [-8, 1.45, -8]}>
            {/* Tesseract visualization mesh */}
            <lineSegments ref={valRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-aW"
                        args={[aWs, 1]}
                    />
                </bufferGeometry>
                <shaderMaterial
                    ref={matRef}
                    vertexShader={vertexShader}
                    fragmentShader={`
            uniform vec3 uColor;
            void main() {
              gl_FragColor = vec4(uColor, 0.95);
            }
          `}
                    uniforms={uniforms}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </lineSegments>

            {/* Dynamic glow beacon below the hyper-shape */}
            {!preview && (
                <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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
