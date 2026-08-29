import { Physics } from '@react-three/rapier'
import { Player } from './player/Player'
import { FollowCamera } from './player/FollowCamera'
import { GalleryHall } from './gallery/GalleryHall'
import { Tesseract } from './artifacts/Tesseract/Tesseract'
import { AntiGravityHourglass } from './artifacts/AntiGravityHourglass/AntiGravityHourglass'
import { MobiusPlasmaLoop } from './artifacts/MobiusPlasmaLoop/MobiusPlasmaLoop'
import { PortalMirror } from './artifacts/PortalMirror/PortalMirror'
import { useGameStore } from '../state/gameStore'

export function Experience() {
    const galleryState = useGameStore((state) => state.galleryState)

    // Dynamic gravity based on state. Gravity Shift flips gravity to float player slowly upwards
    const gravityVector: [number, number, number] = galleryState === 'gravity' ? [0, 2.2, 0] : [0, -9.8, 0]

    // Cycle directional fill light colors depending on the active spatial dimension
    const fillLightColor = galleryState === 'warped'
        ? '#c084fc'
        : galleryState === 'gravity'
            ? '#22d3ee'
            : '#7777aa'

    const keyfillLightColor = galleryState === 'warped'
        ? '#db2777'
        : galleryState === 'gravity'
            ? '#0891b2'
            : '#aa7777'

    return (
        <group>
            {/* 1. R3F-Rapier Physics World with Dynamic Gravity */}
            <Physics gravity={gravityVector}>

                {/* Gallery Shell Geometry */}
                <GalleryHall />

                {/* Player rigid-body and model */}
                <Player />

            </Physics>

            {/* 2. Interactive Shaded Phenomenons */}
            <Tesseract />
            <AntiGravityHourglass />
            <MobiusPlasmaLoop />
            <PortalMirror />

            {/* 3. Camera Controllers */}
            <FollowCamera />

            {/* 4. Ambient Base Lighting */}
            <ambientLight intensity={galleryState === 'inverted' ? 0.35 : 0.15} />

            {/* Multi-angle fill lights for brutalist architectural details */}
            <directionalLight position={[-10, 10, -10]} intensity={0.4} color={fillLightColor} />
            <directionalLight position={[10, 8, 10]} intensity={0.3} color={keyfillLightColor} />
        </group>
    )
}
export default Experience
