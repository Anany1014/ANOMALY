import { useRef, RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../state/gameStore'
import { ProximityZone } from './ProximityZone'

interface WallProps {
    position: [number, number, number]
    rotation?: [number, number, number]
    wallIndex: number
    wallRef: RefObject<THREE.Mesh>
    shaderRef: RefObject<THREE.ShaderMaterial>
}

// Reusable Skybox Wall helper component to render continuous mountains landscape matching floor grid
function Wall({ position, rotation, wallIndex, wallRef, shaderRef }: WallProps) {
    return (
        <RigidBody type="fixed" position={position} rotation={rotation}>
            <mesh ref={wallRef}>
                <boxGeometry args={[48, 10, 1]} />
                <shaderMaterial
                    ref={shaderRef}
                    uniforms={{
                        uTime: { value: 0 },
                        uWarpMode: { value: 0 },
                        uWallIndex: { value: wallIndex }
                    }}
                    vertexShader={`
                        varying vec2 vUv;
                        varying vec3 vPosition;
                        varying vec3 vWorldPosition;
                        void main() {
                            vUv = uv;
                            vPosition = position;
                            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        uniform float uTime;
                        uniform float uWarpMode;
                        uniform float uWallIndex;
                        varying vec2 vUv;
                        varying vec3 vPosition;
                        varying vec3 vWorldPosition;

                        void main() {
                            // Plane coordinates x ranges from -24 to 24, y ranges from -5 to 5
                            vec2 gridCoords = vPosition.xy / 2.0;
                            vec2 grid = abs(fract(gridCoords - 0.5) - 0.5) / fwidth(gridCoords);
                            float line = 1.0 - min(min(grid.x, grid.y), 1.0);

                            // Continuous gradient across the room based on global world X
                            float gradientFactor = clamp((vWorldPosition.x + 24.0) / 48.0, 0.0, 1.0);
                            vec3 magentaColor = vec3(0.95, 0.0, 0.85);
                            vec3 cyanColor = vec3(0.0, 0.70, 1.0);
                            vec3 lineColor = mix(magentaColor, cyanColor, gradientFactor);

                            // Pulsate neon grids synced with store states
                            float speed = uWarpMode > 0.5 ? 3.0 : 1.2;
                            float breath = 0.55 + 0.45 * sin(uTime * speed);
                            vec3 finalColor = lineColor * line * (0.45 + 1.2 * breath);

                            // Ambient background gradient matching floor colors
                            vec3 bgColor = mix(vec3(0.03, 0.0, 0.04), vec3(0.0, 0.015, 0.05), gradientFactor);
                            
                            // Vignette grid to fade slightly towards the top of the walls
                            float fadeFactor = smoothstep(5.0, -3.0, vPosition.y);
                            bgColor *= fadeFactor;

                            vec3 compositeColor = mix(bgColor, finalColor, line * 0.95);
                            gl_FragColor = vec4(compositeColor, 1.0);
                        }
                    `}
                />
            </mesh>
        </RigidBody>
    )
}

export function GalleryHall() {
    const galleryState = useGameStore((state) => state.galleryState)

    const backWallRef = useRef<THREE.Mesh>(null)
    const frontWallRef = useRef<THREE.Mesh>(null)
    const leftWallRef = useRef<THREE.Mesh>(null)
    const rightWallRef = useRef<THREE.Mesh>(null)
    const floorShaderRef = useRef<THREE.ShaderMaterial>(null)

    // Border walls shaders reference loop
    const wallShader0 = useRef<THREE.ShaderMaterial>(null)
    const wallShader1 = useRef<THREE.ShaderMaterial>(null)
    const wallShader2 = useRef<THREE.ShaderMaterial>(null)
    const wallShader3 = useRef<THREE.ShaderMaterial>(null)
    const ceilingShaderRef = useRef<THREE.ShaderMaterial>(null)

    const pedestals: { id: string; name: string; pos: [number, number, number] }[] = [
        { id: 'tesseract', name: '1. The Hyper-Tesseract', pos: [-8, 0, -8] },
        { id: 'hourglass', name: '2. The Anti-Gravity Hourglass', pos: [8, 0, -8] },
        { id: 'mobius', name: '3. The Möbius Plasma Loop', pos: [-8, 0, 8] },
        { id: 'portal', name: '4. The Non-Euclidean Portal', pos: [8, 0, 8] },
    ]

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        const isWarped = galleryState === 'warped'

        // Animate the custom floor shader uniforms
        if (floorShaderRef.current) {
            floorShaderRef.current.uniforms.uTime.value = t
            floorShaderRef.current.uniforms.uWarpMode.value = isWarped ? 1.0 : 0.0
        }

        // Animate the custom ceiling shader uniforms
        if (ceilingShaderRef.current) {
            ceilingShaderRef.current.uniforms.uTime.value = t
            ceilingShaderRef.current.uniforms.uWarpMode.value = isWarped ? 1.0 : 0.0
        }

        // Animate the border walls skyline shaders
        const wallShaders = [wallShader0, wallShader1, wallShader2, wallShader3]
        wallShaders.forEach((shaderRef) => {
            if (shaderRef.current) {
                shaderRef.current.uniforms.uTime.value = t
                shaderRef.current.uniforms.uWarpMode.value = isWarped ? 1.0 : 0.0
            }
        })

        // Compute slow, organic folding angles based on elapsed time when in warped state
        const targetBackFrontX = isWarped ? Math.sin(t * 1.2) * 0.15 : 0
        const targetLeftRightZ = isWarped ? Math.cos(t * 1.0) * 0.15 : 0

        // Lerp wall rotations for visual smoothness
        if (backWallRef.current) {
            backWallRef.current.rotation.x = THREE.MathUtils.lerp(backWallRef.current.rotation.x, targetBackFrontX, 0.05)
        }
        if (frontWallRef.current) {
            frontWallRef.current.rotation.x = THREE.MathUtils.lerp(frontWallRef.current.rotation.x, -targetBackFrontX, 0.05)
        }
        if (leftWallRef.current) {
            leftWallRef.current.rotation.z = THREE.MathUtils.lerp(leftWallRef.current.rotation.z, targetLeftRightZ, 0.05)
        }
        if (rightWallRef.current) {
            rightWallRef.current.rotation.z = THREE.MathUtils.lerp(rightWallRef.current.rotation.z, -targetLeftRightZ, 0.05)
        }
    })

    return (
        <group>
            {/* 1. Static Floor & Glowing Synthwave Grid (matching user reference mockup) */}
            <RigidBody type="fixed" name="floor">
                <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
                    <planeGeometry args={[60, 60]} />
                    <shaderMaterial
                        ref={floorShaderRef}
                        uniforms={{
                            uTime: { value: 0 },
                            uWarpMode: { value: 0 }
                        }}
                        vertexShader={`
                            varying vec2 vUv;
                            varying vec3 vPosition;
                            void main() {
                                vUv = uv;
                                vPosition = position;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
                        fragmentShader={`
                            uniform float uTime;
                            uniform float uWarpMode;
                            varying vec2 vUv;
                            varying vec3 vPosition;
                            void main() {
                                vec2 gridCoords = vPosition.xy / 2.0;
                                vec2 grid = abs(fract(gridCoords - 0.5) - 0.5) / fwidth(gridCoords);
                                float line = 1.0 - min(min(grid.x, grid.y), 1.0);
                                float gradientFactor = clamp((vPosition.x + 30.0) / 60.0, 0.0, 1.0);
                                vec3 magentaColor = vec3(0.95, 0.0, 0.85);
                                vec3 cyanColor = vec3(0.0, 0.70, 1.0);
                                vec3 lineColor = mix(magentaColor, cyanColor, gradientFactor);
                                float speed = uWarpMode > 0.5 ? 3.0 : 1.2;
                                float breath = 0.55 + 0.45 * sin(uTime * speed);
                                vec3 finalColor = lineColor * line * (0.45 + 1.2 * breath);
                                vec3 bgColor = mix(vec3(0.03, 0.0, 0.04), vec3(0.0, 0.015, 0.05), gradientFactor);
                                float distToCenter = length(vPosition.xy) / 42.42;
                                float vignette = smoothstep(1.0, 0.22, distToCenter);
                                bgColor *= vignette;
                                vec3 compositeColor = mix(bgColor, finalColor, line * 0.95);
                                gl_FragColor = vec4(compositeColor, 1.0);
                            }
                        `}
                    />
                </mesh>
            </RigidBody>

            {/* 2. Ceilings bounds (Y = 8.5) - Open-Air Stargazing Synthwave Sky ceiling (matching border walls & floor) */}
            <RigidBody type="fixed" name="ceiling">
                <mesh position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[60, 60]} />
                    <shaderMaterial
                        ref={ceilingShaderRef}
                        uniforms={{
                            uTime: { value: 0 },
                            uWarpMode: { value: 0 }
                        }}
                        vertexShader={`
                            varying vec2 vUv;
                            varying vec3 vPosition;
                            void main() {
                                vUv = uv;
                                vPosition = position;
                                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                            }
                        `}
                        fragmentShader={`
                            uniform float uTime;
                            uniform float uWarpMode;
                            varying vec2 vUv;
                            varying vec3 vPosition;

                            float hash(vec2 p) {
                                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
                            }

                            float noise(vec2 p) {
                                vec2 i = floor(p);
                                vec2 f = fract(p);
                                vec2 u = f * f * (3.0 - 2.0 * f);
                                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                                           mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
                            }

                            void main() {
                                vec2 pos = vPosition.xy;

                                // Twinkling stars scattered in three grid resolution layers
                                float stars = 0.0;
                                
                                // Tiny backing stars
                                vec2 grid1 = floor(vUv * 150.0);
                                float rand1 = hash(grid1);
                                float twinkle1 = 0.5 + 0.5 * sin(uTime * 3.0 + rand1 * 20.0);
                                stars += step(0.995, rand1) * twinkle1 * 0.5;

                                // Medium stars
                                vec2 grid2 = floor(vUv * 80.0);
                                float rand2 = hash(grid2);
                                float twinkle2 = 0.4 + 0.6 * sin(uTime * 1.5 + rand2 * 35.0);
                                stars += step(0.992, rand2) * twinkle2 * 0.95;

                                // Bright sparklers
                                vec2 grid3 = floor(vUv * 35.0);
                                float rand3 = hash(grid3);
                                float twinkle3 = 0.3 + 0.7 * sin(uTime * 4.0 + rand3 * 50.0);
                                stars += step(0.994, rand3) * twinkle3 * 1.4;

                                // Layered neon magenta/cyan space nebulas
                                float n = noise(vUv * 4.0 + uTime * 0.02) * 0.5 
                                        + noise(vUv * 8.0 - uTime * 0.01) * 0.25;

                                vec3 nebMagenta = vec3(0.48, 0.0, 0.4);
                                vec3 nebBlue = vec3(0.0, 0.25, 0.5);
                                float colorMix = noise(vUv * 2.0 + vec2(uTime * 0.005));
                                vec3 nebulaColor = mix(nebMagenta, nebBlue, colorMix) * n;

                                // Faint ceiling grid lines to mirror the floor layout
                                vec2 ceilingGridCoords = vPosition.xy / 2.0;
                                vec2 gridLines = abs(fract(ceilingGridCoords - 0.5) - 0.5) / fwidth(ceilingGridCoords);
                                float line = 1.0 - min(min(gridLines.x, gridLines.y), 1.0);
                                vec3 gridColor = vec3(0.95, 0.0, 0.8) * line * 0.08 * (0.6 + 0.4 * sin(uTime));

                                vec3 bgColor = vec3(0.012, 0.0, 0.032);
                                vec3 color = bgColor + nebulaColor + vec3(stars) + gridColor;

                                // Enhance brightness in warped space
                                color = mix(color, color * 1.45 + vec3(0.12, 0.0, 0.12), uWarpMode * 0.35);

                                gl_FragColor = vec4(color, 1.0);
                            }
                        `}
                    />
                </mesh>
            </RigidBody>

            {/* 3. Surrounding Neon Horizon Landscape Walls (continuous 360-degree mountains) */}
            <Wall position={[0, 5, -24]} wallIndex={0} wallRef={backWallRef} shaderRef={wallShader0} />
            <Wall position={[0, 5, 24]} wallIndex={1} wallRef={frontWallRef} shaderRef={wallShader1} />
            <Wall position={[-24, 5, 0]} rotation={[0, Math.PI / 2, 0]} wallIndex={2} wallRef={leftWallRef} shaderRef={wallShader2} />
            <Wall position={[24, 5, 0]} rotation={[0, Math.PI / 2, 0]} wallIndex={3} wallRef={rightWallRef} shaderRef={wallShader3} />

            {/* 4. Interactive Pedestals */}
            {pedestals.map((ped) => (
                <group key={ped.id}>
                    {/* Base Pedestal concrete block */}
                    <RigidBody type="fixed" name={`${ped.id}_pedestal`}>
                        <mesh position={[ped.pos[0], 0.45, ped.pos[2]]} castShadow receiveShadow>
                            <boxGeometry args={[1.6, 0.9, 1.6]} />
                            <meshStandardMaterial color="#111111" roughness={0.7} metalness={0.8} />
                        </mesh>
                        {/* Glowing frame accent on top flat surface */}
                        <mesh position={[ped.pos[0], 0.905, ped.pos[2]]}>
                            <boxGeometry args={[1.4, 0.02, 1.4]} />
                            <meshStandardMaterial color={galleryState === 'warped' ? '#c084fc' : '#8a5cf5'} emissive={galleryState === 'warped' ? '#c084fc' : '#8a5cf5'} emissiveIntensity={0.6} />
                        </mesh>
                    </RigidBody>

                    {/* Pedestal Overhead Highlight SpotLight */}
                    <spotLight
                        position={[ped.pos[0], 7.5, ped.pos[2]]}
                        angle={Math.PI / 4.8}
                        penumbra={0.75}
                        intensity={4.5}
                        color={galleryState === 'gravity' ? '#a5f3fc' : '#ffffff'}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                    />

                    {/* Interactive Proximity zone for sensors */}
                    <ProximityZone id={ped.id} position={ped.pos} label={ped.name} />
                </group>
            ))}
        </group>
    )
}
