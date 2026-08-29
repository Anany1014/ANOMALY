import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../state/gameStore'

export function Player() {
    const rbRef = useRef<RapierRigidBody>(null)
    const groupRef = useRef<THREE.Group>(null)

    // Limbs for procedural animation
    const leftLegRef = useRef<THREE.Group>(null)
    const rightLegRef = useRef<THREE.Group>(null)
    const leftArmRef = useRef<THREE.Group>(null)
    const rightArmRef = useRef<THREE.Group>(null)
    const coatRef = useRef<THREE.Mesh>(null)
    const jacketRef = useRef<THREE.Mesh>(null)
    const bodyRef = useRef<THREE.Mesh>(null)
    const headRef = useRef<THREE.Mesh>(null)

    const { gameState, wardrobe } = useGameStore()

    // Track keyboard keys
    const keys = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false,
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            if (key in keys.current) {
                keys.current[key as keyof typeof keys.current] = true
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()
            if (key in keys.current) {
                keys.current[key as keyof typeof keys.current] = false
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    // Wardrobe traversing: apply selections (skin, outfit, emissiveColor)
    // Since we traverse ONCE when wardrobe changes, we do it in a useEffect.
    useEffect(() => {
        if (!groupRef.current) return

        groupRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const name = child.name

                let color = '#333333'
                let roughness = 0.5
                let metalness = 0.5
                let emissiveInt = 0

                // 1. Determine base material via skin
                if (wardrobe.skin === 'matrix') {
                    color = '#001a08'
                    roughness = 0.2
                    metalness = 0.9
                } else if (wardrobe.skin === 'void') {
                    color = '#0a0a0a'
                    roughness = 0.8
                    metalness = 0.1
                } else if (wardrobe.skin === 'gold') {
                    color = '#d4af37'
                    roughness = 0.1
                    metalness = 1.0
                } else {
                    // default
                    color = '#222222'
                }

                // 2. Mesh-specific modifications
                if (name.includes('coat')) {
                    if (wardrobe.outfit === 'trenchcoat') {
                        child.visible = true
                        color = wardrobe.skin === 'void' ? '#000000' : '#151515'
                    } else {
                        child.visible = false
                    }
                }

                // Jacket visibility and color
                if (name.includes('jacket')) {
                    if (wardrobe.outfit === 'jacket') {
                        child.visible = true
                        if (name.includes('strip')) {
                            color = wardrobe.emissiveColor
                            emissiveInt = 3.0
                        } else {
                            color = '#eeeeee'
                            roughness = 0.5
                            metalness = 0.1
                        }
                    } else {
                        child.visible = false
                    }
                }

                // Arm / sleeve colors matching outfit
                if (name.includes('arm')) {
                    if (wardrobe.outfit === 'jacket') {
                        color = '#eeeeee' // white sleeves
                    } else if (wardrobe.outfit === 'trenchcoat') {
                        color = wardrobe.skin === 'void' ? '#000000' : '#151515' // dark sleeves
                    }
                }

                // Leg/pants/boot colors
                if (name.includes('pants')) {
                    color = '#0c0c0c' // black pants
                    roughness = 0.85
                    metalness = 0.1
                }
                if (name.includes('boot')) {
                    if (name.includes('glow')) {
                        color = wardrobe.emissiveColor
                        emissiveInt = 3.0
                    } else {
                        color = '#111111' // black boots
                        roughness = 0.35
                        metalness = 0.65
                    }
                }

                if (name.includes('glow') || name.includes('accent')) {
                    color = wardrobe.emissiveColor
                    emissiveInt = 2.0
                }

                if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.color.set(color)
                    child.material.roughness = roughness
                    child.material.metalness = metalness
                    child.material.emissive.set(emissiveInt > 0 ? wardrobe.emissiveColor : '#000000')
                    child.material.emissiveIntensity = emissiveInt
                    child.material.needsUpdate = true
                }
            }
        })
    }, [wardrobe.skin, wardrobe.outfit, wardrobe.emissiveColor])

    useFrame((state) => {
        if (!rbRef.current || !groupRef.current) return

        const isExploring = gameState === 'EXPLORING'
        const linvel = rbRef.current.linvel()

        // Default zero horizontal movement
        let moveX = 0
        let moveZ = 0

        if (isExploring) {
            // Directions relative to camera
            const cam = state.camera
            const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion)
            camForward.y = 0
            camForward.normalize()

            const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion)
            camRight.y = 0
            camRight.normalize()

            if (keys.current.w) {
                moveX += camForward.x
                moveZ += camForward.z
            }
            if (keys.current.s) {
                moveX -= camForward.x
                moveZ -= camForward.z
            }
            if (keys.current.d) {
                moveX += camRight.x
                moveZ += camRight.z
            }
            if (keys.current.a) {
                moveX -= camRight.x
                moveZ -= camRight.z
            }
        }

        const inputDirection = new THREE.Vector3(moveX, 0, moveZ)
        const isMoving = inputDirection.lengthSq() > 0.001

        // Determine speed
        const isRunning = keys.current.shift && isMoving
        const speed = isRunning ? 6 : 3

        let targetVelX = 0
        let targetVelZ = 0

        if (isMoving) {
            inputDirection.normalize()
            targetVelX = inputDirection.x * speed
            targetVelZ = inputDirection.z * speed

            // Rotate visual mesh toward movement heading
            const targetAngle = Math.atan2(inputDirection.x, inputDirection.z)

            // Calculate smooth rotation
            const curAngle = groupRef.current.rotation.y
            // Simple shortest angle lerp
            let diff = targetAngle - curAngle
            while (diff < -Math.PI) diff += Math.PI * 2
            while (diff > Math.PI) diff -= Math.PI * 2
            groupRef.current.rotation.y = curAngle + diff * 0.15
        }

        // Apply translation to Rapier RigidBody
        rbRef.current.setLinvel(
            {
                x: targetVelX,
                y: linvel.y, // Maintain gravity
                z: targetVelZ,
            },
            true
        )

        // Procedural swing animation for limbs (legs & arms)
        const speedMultiplier = isRunning ? 2.5 : 1.5
        const time = state.clock.getElapsedTime() * 10 * speedMultiplier
        const isActuallyMoving = isMoving && Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z) > 0.1

        if (isActuallyMoving) {
            const swingAngle = Math.sin(time) * 0.6

            if (leftLegRef.current) leftLegRef.current.rotation.x = swingAngle
            if (rightLegRef.current) rightLegRef.current.rotation.x = -swingAngle

            if (leftArmRef.current) leftArmRef.current.rotation.x = -swingAngle * 0.8
            if (rightArmRef.current) rightArmRef.current.rotation.x = swingAngle * 0.8

            // Gentle torso bobbing
            if (bodyRef.current) bodyRef.current.position.y = 1.05 + Math.abs(Math.sin(time * 2)) * 0.05
        } else {
            // IDLE pose: breathing
            const idleBreathing = Math.sin(state.clock.getElapsedTime() * 2) * 0.02

            if (leftLegRef.current) leftLegRef.current.rotation.x = 0
            if (rightLegRef.current) rightLegRef.current.rotation.x = 0

            if (leftArmRef.current) {
                leftArmRef.current.rotation.x = 0
                leftArmRef.current.rotation.z = -0.15 - idleBreathing
            }
            if (rightArmRef.current) {
                rightArmRef.current.rotation.x = 0
                rightArmRef.current.rotation.z = 0.15 + idleBreathing
            }

            if (bodyRef.current) bodyRef.current.position.y = 1.05 + idleBreathing * 0.5
        }
    })

    // We build a procedural brutalist mannequin
    return (
        <RigidBody
            ref={rbRef}
            colliders={false}
            enabledRotations={[false, false, false]} // Lock physics rotations on all axes
            position={[0, 1, 0]}
            name="player"
        >
            <CapsuleCollider args={[0.6, 0.4]} position={[0, 1, 0]} />

            <group ref={groupRef}>
                {/* 1. VR-Style Helmet */}
                <mesh ref={headRef} name="head" position={[0, 1.7, 0]}>
                    <boxGeometry args={[0.32, 0.32, 0.32]} />
                    <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
                </mesh>
                {/* Visor frame decoration */}
                <mesh name="visor_frame" position={[0, 1.73, 0.155]}>
                    <boxGeometry args={[0.28, 0.1, 0.02]} />
                    <meshStandardMaterial color="#111111" roughness={0.15} metalness={0.85} />
                </mesh>
                {/* Glow visor (accent) */}
                <mesh name="visor_glow" position={[0, 1.73, 0.166]}>
                    <boxGeometry args={[0.24, 0.06, 0.01]} />
                    <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={3} />
                </mesh>

                {/* 2. Torso (Body) */}
                <mesh ref={bodyRef} name="body_core" position={[0, 1.05, 0]}>
                    <boxGeometry args={[0.5, 0.9, 0.3]} />
                    <meshStandardMaterial color="#222" roughness={0.5} metalness={0.5} />
                </mesh>

                {/* Trenchcoat (Outfit overlay) */}
                <mesh ref={coatRef} name="coat" position={[0, 0.8, 0]}>
                    <boxGeometry args={[0.56, 1.2, 0.36]} />
                    <meshStandardMaterial color="#151515" roughness={0.7} />
                </mesh>

                {/* Trenchcoat glow trim (accent) */}
                <mesh name="coat_trim_glow" position={[0, 0.8, 0.191]}>
                    <boxGeometry args={[0.04, 1.15, 0.01]} />
                    <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={2} />
                </mesh>

                {/* High-tech White Jacket (Outfit overlay) */}
                <mesh ref={jacketRef} name="jacket" position={[0, 1.1, 0]}>
                    <boxGeometry args={[0.54, 0.8, 0.34]} />
                    <meshStandardMaterial color="#eeeeee" roughness={0.5} metalness={0.1} />
                </mesh>

                {/* Jacket central emissive strip (accent) */}
                <mesh name="jacket_strip_glow" position={[0, 1.1, 0.171]}>
                    <boxGeometry args={[0.03, 0.78, 0.01]} />
                    <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={3} />
                </mesh>

                {/* 3. Left Arm with Joint Rotation */}
                <group position={[-0.35, 1.35, 0]}>
                    <group ref={leftArmRef} name="left_arm_group">
                        <mesh name="left_arm" position={[0, -0.3, 0]}>
                            <boxGeometry args={[0.15, 0.6, 0.15]} />
                            <meshStandardMaterial color="#222" roughness={0.5} metalness={0.5} />
                        </mesh>
                    </group>
                </group>

                {/* Right Arm with Joint Rotation */}
                <group position={[0.35, 1.35, 0]}>
                    <group ref={rightArmRef} name="right_arm_group">
                        <mesh name="right_arm" position={[0, -0.3, 0]}>
                            <boxGeometry args={[0.15, 0.6, 0.15]} />
                            <meshStandardMaterial color="#222" roughness={0.5} metalness={0.5} />
                        </mesh>
                    </group>
                </group>

                {/* 4. Left Leg with Pants/Boots/Soles details */}
                <group position={[-0.18, 0.6, 0]}>
                    <group ref={leftLegRef} name="left_leg_group">
                        {/* Pants */}
                        <mesh name="left_pants" position={[0, -0.2, 0]}>
                            <boxGeometry args={[0.16, 0.4, 0.16]} />
                            <meshStandardMaterial color="#0c0c0c" roughness={0.85} metalness={0.1} />
                        </mesh>
                        {/* Boot Shaft */}
                        <mesh name="left_boot_shaft" position={[0, -0.475, 0]}>
                            <boxGeometry args={[0.18, 0.15, 0.18]} />
                            <meshStandardMaterial color="#111111" roughness={0.35} metalness={0.65} />
                        </mesh>
                        {/* Boot Foot */}
                        <mesh name="left_boot_foot" position={[0, -0.56, 0.04]}>
                            <boxGeometry args={[0.18, 0.08, 0.24]} />
                            <meshStandardMaterial color="#111111" roughness={0.35} metalness={0.65} />
                        </mesh>
                        {/* Boot Sole Glow */}
                        <mesh name="left_boot_sole_glow" position={[0, -0.601, 0.04]}>
                            <boxGeometry args={[0.182, 0.01, 0.242]} />
                            <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={3} />
                        </mesh>
                    </group>
                </group>

                {/* Right Leg with Pants/Boots/Soles details */}
                <group position={[0.18, 0.6, 0]}>
                    <group ref={rightLegRef} name="right_leg_group">
                        {/* Pants */}
                        <mesh name="right_pants" position={[0, -0.2, 0]}>
                            <boxGeometry args={[0.16, 0.4, 0.16]} />
                            <meshStandardMaterial color="#0c0c0c" roughness={0.85} metalness={0.1} />
                        </mesh>
                        {/* Boot Shaft */}
                        <mesh name="right_boot_shaft" position={[0, -0.475, 0]}>
                            <boxGeometry args={[0.18, 0.15, 0.18]} />
                            <meshStandardMaterial color="#111111" roughness={0.35} metalness={0.65} />
                        </mesh>
                        {/* Boot Foot */}
                        <mesh name="right_boot_foot" position={[0, -0.56, 0.04]}>
                            <boxGeometry args={[0.18, 0.08, 0.24]} />
                            <meshStandardMaterial color="#111111" roughness={0.35} metalness={0.65} />
                        </mesh>
                        {/* Boot Sole Glow */}
                        <mesh name="right_boot_sole_glow" position={[0, -0.601, 0.04]}>
                            <boxGeometry args={[0.182, 0.01, 0.242]} />
                            <meshStandardMaterial color={wardrobe.emissiveColor} emissive={wardrobe.emissiveColor} emissiveIntensity={3} />
                        </mesh>
                    </group>
                </group>

                {/* 5. Floor contact glow rings */}
                <mesh position={[0, -0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.0, 0.45, 32]} />
                    <meshBasicMaterial
                        color={wardrobe.emissiveColor}
                        transparent
                        opacity={0.35}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
                <mesh position={[0, -0.989, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.55, 0.57, 32]} />
                    <meshBasicMaterial
                        color={wardrobe.emissiveColor}
                        transparent
                        opacity={0.18}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            </group>
        </RigidBody>
    )
}
