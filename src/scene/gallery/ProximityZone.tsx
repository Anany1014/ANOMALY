import { useEffect } from 'react'
import { Html } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGameStore } from '../../state/gameStore'

interface ProximityZoneProps {
    id: string
    position: [number, number, number]
    label: string
}

export function ProximityZone({ id, position, label }: ProximityZoneProps) {
    const {
        activeProximityId,
        setActiveProximityId,
        gameState,
        setGameState,
        setActiveArtifactId,
    } = useGameStore()

    const isInRange = activeProximityId === id

    // Listen for 'E' key press to trigger inspection when in range
    useEffect(() => {
        if (!isInRange || gameState !== 'EXPLORING') return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'e') {
                setGameState('INSPECTING')
                setActiveArtifactId(id)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isInRange, gameState, id, setGameState, setActiveArtifactId])

    return (
        <group position={position}>
            {/* Rapier Proximity Sensor Zone */}
            <RigidBody type="fixed" colliders={false}>
                <CuboidCollider
                    sensor
                    args={[2.2, 2.2, 2.2]}
                    position={[0, 1.2, 0]}
                    onIntersectionEnter={({ other }) => {
                        if (other.rigidBodyObject?.name === 'player') {
                            setActiveProximityId(id)
                        }
                    }}
                    onIntersectionExit={({ other }) => {
                        if (other.rigidBodyObject?.name === 'player') {
                            if (useGameStore.getState().activeProximityId === id) {
                                setActiveProximityId(null)
                            }
                        }
                    }}
                />
            </RigidBody>

            {/* Floating 3D HUD prompt above pedestal */}
            {isInRange && gameState === 'EXPLORING' && (
                <Html position={[0, 1.8, 0]} center distanceFactor={8}>
                    <div className="bg-black/90 backdrop-blur-md border border-[#00ffcc]/40 px-3 py-2 rounded text-center whitespace-nowrap select-none pointer-events-none shadow-[0_0_15px_rgba(0,255,204,0.2)] animate-pulse">
                        <span className="text-[#00ffcc] font-mono text-xs uppercase tracking-widest font-bold block mb-1">
                            {label}
                        </span>
                        <span className="text-gray-400 font-mono text-[9px] uppercase tracking-wider">
                            Press <kbd className="bg-[#00ffcc]/90 text-black px-1 rounded font-bold font-mono">E</kbd> to inspect
                        </span>
                    </div>
                </Html>
            )}
        </group>
    )
}
