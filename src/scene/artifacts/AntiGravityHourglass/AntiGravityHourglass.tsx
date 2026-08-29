import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGameStore } from '../../../state/gameStore'

export function AntiGravityHourglass({ preview = false }: { preview?: boolean }) {
    const { gameState, activeArtifactId, wardrobe, chronoSpeed } = useGameStore()
    const instancedRef = useRef<THREE.InstancedMesh>(null)
    const groupRef = useRef<THREE.Group>(null)
    const { camera } = useThree()

    const isActive = gameState === 'INSPECTING' && activeArtifactId === 'hourglass'
    const particleCount = 140

    // 1. Generate random factors for procedural particle simulation details
    const particles = useMemo(() => {
        const data = []
        for (let i = 0; i < particleCount; i++) {
            data.push({
                phase: Math.random(), // Starting offset (0 to 1)
                angleOffset: Math.random() * Math.PI * 2,
                rMult: 0.3 + Math.random() * 0.7, // Random dispersability factor
            })
        }
        return data
    }, [particleCount])

    // Helper dummy object for Matrix transformation calculations
    const tempObject = useMemo(() => new THREE.Object3D(), [])

    // 2. Camera transition tween using GSAP
    useEffect(() => {
        if (preview || !isActive) return

        // Position of Hourglass Pedestal is [8, 0.9, -8], look target is [8, 1.45, -8]
        const lookTarget = new THREE.Vector3(8, 1.45, -8)
        const tl = gsap.timeline()

        tl.to(camera.position, {
            x: 8,
            y: 1.55,
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

    // 3. Procedural fluid simulation in useFrame
    useFrame((state) => {
        if (!instancedRef.current) return

        const t = state.clock.getElapsedTime()

        particles.forEach((p, i) => {
            // Upward falling droplets progress
            // chronoSpeed adjusts the velocity dynamically
            const progress = (p.phase + t * chronoSpeed * 0.18) % 1.0

            // Height varies from Bottom Base (-0.75) to Top Base (0.75)
            const y = -0.75 + progress * 1.5

            // Neck squashing effect: particles squeeze at target y = 0
            const profileRatio = Math.abs(y) / 0.75 // 1 at bases, 0 at neck
            const dispersionRadius = 0.01 + 0.45 * Math.pow(profileRatio, 2.0)

            // Orbit angle
            const orbitSpeed = 0.4
            const angle = p.angleOffset + t * orbitSpeed

            // Calculate coordinates around central neck
            const x = Math.cos(angle) * dispersionRadius * p.rMult
            const z = Math.sin(angle) * dispersionRadius * p.rMult

            // Setup instanced mesh matrix positions
            tempObject.position.set(x, y, z)

            // Scale down slightly when passing through neck to simulate pressure squeeze
            const scale = 0.035 * (0.6 + 0.4 * Math.sin(profileRatio * Math.PI / 2))
            tempObject.scale.set(scale, scale, scale)

            tempObject.updateMatrix()
            instancedRef.current!.setMatrixAt(i, tempObject.matrix)
        })

        instancedRef.current.instanceMatrix.needsUpdate = true

        // Rotate frame slowly when not in zoom-inspection mode
        if (groupRef.current) {
            groupRef.current.rotation.y = t * 0.12 * chronoSpeed
        }
    })

    return (
        <group position={preview ? [0, 0, 0] : [8, 1.45, -8]} ref={groupRef}>
            {/* 1. Hourglass Structural Frame (Concrete bases and brass wire columns) */}
            {/* Bottom Ring Plate */}
            <mesh position={[0, -0.8, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.08, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Top Ring Plate */}
            <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.7, 0.7, 0.08, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Glass columns / pillars */}
            <group>
                <mesh position={[0.55, 0, 0.2]}>
                    <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={0.9} />
                </mesh>
                <mesh position={[-0.55, 0, -0.2]}>
                    <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={0.9} />
                </mesh>
                <mesh position={[0.2, 0, -0.55]}>
                    <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={0.9} />
                </mesh>
                <mesh position={[-0.2, 0, 0.55]}>
                    <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
                    <meshStandardMaterial color="#2d2d2d" roughness={0.3} metalness={0.9} />
                </mesh>
            </group>

            {/* 2. Glass Envelope (Upper and lower cones) */}
            <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.55, 0.76, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.05}
                    metalness={0.2}
                    transparent
                    opacity={0.16}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0, -0.38, 0]}>
                <coneGeometry args={[0.55, 0.76, 12, 1, true]} />
                <meshStandardMaterial
                    color="#ffffff"
                    roughness={0.05}
                    metalness={0.2}
                    transparent
                    opacity={0.16}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 3. Liquid Mercury Upward Particles (Instanced Mesh) */}
            <instancedMesh ref={instancedRef} args={[null as any, null as any, particleCount]}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial
                    color={wardrobe.emissiveColor}
                    roughness={0.02}
                    metalness={0.95}
                    emissive={wardrobe.emissiveColor}
                    emissiveIntensity={0.65}
                />
            </instancedMesh>

            {/* Emissive center singularity core */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color={wardrobe.emissiveColor} transparent opacity={0.65} />
            </mesh>

            {/* Floor glow beacon */}
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
