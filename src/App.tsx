import { useEffect, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { useGameStore, GalleryState } from './state/gameStore'
import Experience from './scene/Experience'
import * as THREE from 'three'
import { Tesseract } from './scene/artifacts/Tesseract/Tesseract'
import { AntiGravityHourglass } from './scene/artifacts/AntiGravityHourglass/AntiGravityHourglass'
import { MobiusPlasmaLoop } from './scene/artifacts/MobiusPlasmaLoop/MobiusPlasmaLoop'
import { PortalMirror } from './scene/artifacts/PortalMirror/PortalMirror'
import { LoreCard } from './ui/LoreCard'

interface ArtifactMeta {
    title: string
    subtitle: string
    dimension: string
    stability: string
    coordinates: string
    desc: string
}

function App() {
    const {
        gameState,
        setGameState,
        galleryState,
        setGalleryState,
        activeArtifactId,
        setActiveArtifactId,
        activeProximityId,
        chronoSpeed,
        setChronoSpeed,
        tesseractSpeed,
        setTesseractSpeed,
        isMuted,
        toggleMuted,
        wardrobe
    } = useGameStore()

    // State for local dynamic sparkline visualizer coordinates
    const [bounceValues, setBounceValues] = useState<number[]>([12, 28, 45, 15, 60, 30, 75, 40, 20, 50, 35, 10])

    // State for retractable left sidebar
    const [isLeftOpen, setIsLeftOpen] = useState(true)

    // State for exhibit catalog 3D model modal
    const [catalogArtifactId, setCatalogArtifactId] = useState<string | null>(null)

    // Globally listen for keybinds (e.g. 'H' or 'h' for Wardrobe toggle, 'Escape' to disengage)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase()

            if (key === 'h') {
                if (gameState === 'EXPLORING') {
                    setGameState('WARDROBE_OPEN')
                } else if (gameState === 'WARDROBE_OPEN') {
                    setGameState('EXPLORING')
                }
            }

            if (key === 'escape') {
                if (gameState === 'WARDROBE_OPEN' || gameState === 'INSPECTING') {
                    setGameState('EXPLORING')
                    setActiveArtifactId(null)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [gameState, setGameState, setActiveArtifactId])

    // Local procedural animation for the sparkline visualizer
    useEffect(() => {
        const interval = setInterval(() => {
            setBounceValues(
                Array.from({ length: 12 }, () => 10 + Math.floor(Math.random() * 80))
            )
        }, 150)
        return () => clearInterval(interval)
    }, [])

    // Identify which artifact is targeted (inspecting or currently in proximity)
    const targetedId = activeArtifactId || activeProximityId

    const artifactData: Record<string, ArtifactMeta> = {
        tesseract: {
            title: 'TESSERACT FLUX',
            subtitle: '4D HYPERCUBE // ROTATIONAL ANCHOR',
            dimension: '4D',
            stability: '∞',
            coordinates: 'LOC: X:-8.0 // Y:1.45 // Z:-8.0',
            desc: 'A wireframe hypercube folding into itself through space-time. Because we perceive in 3D, its shape appears to turn inside-out endlessly. Perception may vary.',
        },
        hourglass: {
            title: 'CHRONO HOURGLASS',
            subtitle: 'REVERSED GRAVITY CONSTRAINTS',
            dimension: '3D // REV-GRAV',
            stability: '98.4%',
            coordinates: 'LOC: X:8.0 // Y:1.45 // Z:-8.0',
            desc: 'Inside the containment shell, gravity acts in reverse. Liquid mercury droplets rise upward from the bottom singularity reservoir. Chrono dilation adjusts flow velocity.',
        },
        mobius: {
            title: 'MÖBIUS RESONANCE',
            subtitle: 'SINGLE-SIDED CLOSED MANIFOLD',
            dimension: '3D // PARAMETRIC',
            stability: '100.0%',
            coordinates: 'LOC: X:-8.0 // Y:1.45 // Z:8.0',
            desc: 'A continuous loop representing single-sided non-orientable space. High-energy plasma pulses travel along its surface, synchronized (simulated) with sound drone harmonics.',
        },
        portal: {
            title: 'PORTAL APERTURE',
            subtitle: 'NON-EUCLIDEAN APERTURE GATEWAY',
            dimension: '5D HYPERSURFACE',
            stability: 'DEGRADED // 42.1%',
            coordinates: 'LOC: X:8.0 // Y:1.45 // Z:8.0',
            desc: 'A fractured brutalist gateway housing a non-Euclidean event horizon. Detects camera view depth to reveal different spatial matrix dimensions depending on orientation.',
        },
    }

    const currentMeta = targetedId ? artifactData[targetedId] : null

    // Cards configuration for gallery states switcher matching the mockup
    const galleryStates: { id: GalleryState; title: string; subtitle: string; gradient: string }[] = [
        {
            id: 'neutral',
            title: 'NEUTRAL STATE',
            subtitle: 'Stable geometry. Normal gravity.',
            gradient: 'from-zinc-900 to-black border-zinc-800'
        },
        {
            id: 'warped',
            title: 'WARPED GEOMETRY',
            subtitle: 'Walls fold. Space bends.',
            gradient: 'from-purple-950/40 to-[#0e0024]/60 border-purple-900/30'
        },
        {
            id: 'inverted',
            title: 'COLOR INVERSION',
            subtitle: 'Reality inverts. Light behaves oddly.',
            gradient: 'from-amber-950/30 to-[#22071f]/50 border-[#ea580c]/30'
        },
        {
            id: 'gravity',
            title: 'GRAVITY SHIFT',
            subtitle: 'Up is down. Down is sideways.',
            gradient: 'from-blue-950/40 to-[#041a1a]/60 border-cyan-900/30'
        }
    ]

    const handleStateClick = (stateId: GalleryState) => {
        setGalleryState(stateId)
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black select-none pointer-events-auto font-sans-outfit">

            {/* 1. Main 3D WebGL Canvas Layer (apply inversion CSS filter if inverted state active) */}
            <div
                className="w-full h-full transition-all duration-1000 ease-in-out"
                style={{
                    filter: galleryState === 'inverted' ? 'invert(1) hue-rotate(180deg)' : 'none'
                }}
            >
                <Canvas
                    shadows
                    dpr={[1, 2]}
                    gl={{ antialias: true, powerPreference: 'high-performance' }}
                    camera={{ position: [0, 2.5, 6], fov: 60, near: 0.1, far: 100 }}
                >
                    <color attach="background" args={['#030303']} />

                    <Suspense fallback={
                        <Html center>
                            <div className="text-[#8a5cf5] font-mono text-xs uppercase tracking-widest bg-black/90 p-4 border border-[#8a5cf5]/40 rounded backdrop-blur-md">
                                [SYSTEM INSTANTIATION] CHARGING WEBGL CORES AND LOADING PHYSICS WASM...
                            </div>
                        </Html>
                    }>
                        <Experience />
                    </Suspense>

                    {/* Postprocessing filters optimized for high frame rates and sharp rendering */}
                    <EffectComposer multisampling={8}>
                        <Bloom
                            mipmapBlur
                            intensity={1.2}
                            luminanceThreshold={0.6}
                            luminanceSmoothing={0.3}
                        />
                        <ChromaticAberration
                            offset={new THREE.Vector2(0.0012, 0.0012) as any}
                            radialModulation={false}
                            modulationOffset={0}
                        />
                        <Vignette
                            darkness={0.7}
                            offset={0.4}
                        />
                    </EffectComposer>
                </Canvas>
            </div>

            {/* 2. Unified Museum Command Center HUD Layer (Overlay) */}
            <div className="absolute inset-0 pointer-events-none z-10 flex justify-between p-8">

                {/* Left Sidebar Toggle Button (Floating) */}
                <button
                    onClick={() => setIsLeftOpen(!isLeftOpen)}
                    className={`pointer-events-auto absolute top-8 z-20 flex items-center justify-center w-8 h-8 bg-[#070707]/90 border border-zinc-800 hover:border-[#8a5cf5] text-zinc-400 hover:text-white rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out active:scale-95 cursor-pointer uppercase font-mono text-[10px] ${gameState === 'INSPECTING' ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100'}`}
                    style={{ left: isLeftOpen ? '21.5rem' : '1rem' }}
                    title={isLeftOpen ? "Collapse Info Sidebar" : "Expand Info Sidebar"}
                >
                    {isLeftOpen ? '◀' : '▶'}
                </button>

                {/* LEFT SIDEBAR CONTAINER */}
                <div
                    className={`pointer-events-auto flex flex-col w-80 h-full bg-[#070707]/90 border border-zinc-800 rounded-lg p-5 justify-between space-y-4 backdrop-blur-md shadow-2xl transition-all duration-300 ease-out ${isLeftOpen && gameState !== 'INSPECTING' ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'
                        }`}
                >
                    {/* Top: Title Block */}
                    <div className="flex flex-col bg-[#050505]/45 border border-zinc-900/10 rounded-lg p-4 select-none">
                        <span className="text-[9px] text-[#8a5cf5] font-sans-outfit font-bold uppercase tracking-[0.25em] mb-1">
                            exhibition 02 // non-euclidean
                        </span>
                        <h1 className="font-serif-cinzel font-bold text-2xl leading-none text-white tracking-wide uppercase">
                            Museum of<br />
                            <span className="text-white">Impossible Artifacts</span>
                        </h1>
                        <p className="text-[10px] text-[#8a5cf5] font-sans-outfit font-semibold uppercase tracking-[0.2em] mt-1.5 mb-2">
                            4D SURREALISM
                        </p>
                        <p className="text-[9px] uppercase text-zinc-400 font-sans-outfit tracking-wide leading-relaxed">
                            An avant-garde virtual art exhibition featuring non-Euclidean, shape-shifting sculptures that defy physics.
                        </p>
                    </div>

                    {/* Exhibit Catalog Grid Selector */}
                    <div className="flex flex-col bg-[#050505]/50 border border-zinc-900/40 rounded-lg p-3 select-none">
                        <span className="text-[8px] text-[#8a5cf5] font-bold uppercase tracking-[0.2em] mb-2 block font-mono">
                            EXHIBIT CATALOG INDEX
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 text-[7.5px] tracking-wider uppercase font-bold text-zinc-400 font-mono">
                            <button
                                onClick={() => setCatalogArtifactId('tesseract')}
                                className="py-1.5 px-2 bg-zinc-900/50 hover:bg-[#8a5cf5]/20 hover:text-white rounded border border-zinc-800 transition-all text-left truncate cursor-pointer hover:border-zinc-700"
                            >
                                [ 01. TESSERACT ]
                            </button>
                            <button
                                onClick={() => setCatalogArtifactId('hourglass')}
                                className="py-1.5 px-2 bg-zinc-900/50 hover:bg-[#8a5cf5]/20 hover:text-white rounded border border-zinc-800 transition-all text-left truncate cursor-pointer hover:border-zinc-700"
                            >
                                [ 02. HOURGLASS ]
                            </button>
                            <button
                                onClick={() => setCatalogArtifactId('mobius')}
                                className="py-1.5 px-2 bg-zinc-900/50 hover:bg-[#8a5cf5]/20 hover:text-white rounded border border-zinc-800 transition-all text-left truncate cursor-pointer hover:border-zinc-700"
                            >
                                [ 03. MÖBIUS ]
                            </button>
                            <button
                                onClick={() => setCatalogArtifactId('portal')}
                                className="py-1.5 px-2 bg-zinc-900/50 hover:bg-[#8a5cf5]/20 hover:text-white rounded border border-zinc-800 transition-all text-left truncate cursor-pointer hover:border-zinc-700"
                            >
                                [ 04. PORTAL ]
                            </button>
                        </div>
                    </div>

                    {/* Middle: Dynamic Telemetry or Core Interaction card */}
                    <div className="flex-grow flex flex-col justify-center overflow-y-auto">
                        {currentMeta ? (
                            <div className="flex flex-col bg-[#0a0a0a]/80 border border-zinc-900/40 rounded-lg p-4 relative overflow-hidden">
                                {/* Glow Accent Strip */}
                                <div
                                    className="absolute top-0 left-0 w-full h-0.5"
                                    style={{ backgroundColor: wardrobe.emissiveColor }}
                                />

                                {/* Upper Header Card section */}
                                <div className="flex justify-between items-start mb-1.5">
                                    <h2 className="text-[#8a5cf5] font-bold text-xs tracking-widest uppercase font-serif-cinzel">
                                        {currentMeta.title}
                                    </h2>
                                    <span className="text-[7.5px] text-zinc-400 uppercase tracking-widest select-none bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded leading-none">
                                        {currentMeta.coordinates.split(' // ')[0].replace('LOC:', '')}
                                    </span>
                                </div>

                                {/* Stats lists */}
                                <div className="grid grid-cols-2 gap-2 border-b border-zinc-900/60 pb-2 mb-2 text-[9px] tracking-wider uppercase font-bold text-zinc-500 font-mono select-none">
                                    <div className="flex flex-col">
                                        <span className="text-[7.5px] text-zinc-550 tracking-widest normal-case">Dimension</span>
                                        <span className="text-white mt-0.5">{currentMeta.dimension}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[7.5px] text-zinc-550 tracking-widest normal-case font-mono">Stability</span>
                                        <span className="text-[#8a5cf5] mt-0.5" style={{ color: wardrobe.emissiveColor }}>
                                            {currentMeta.stability}
                                        </span>
                                    </div>
                                </div>

                                {/* SVG Sparkline Visualizer */}
                                <div className="flex items-center justify-center py-1 bg-[#121212]/30 border border-zinc-900 rounded p-1 mb-2">
                                    <svg className="w-full h-9 stroke-[1.5] text-purple-500 fill-none" viewBox="0 0 200 45">
                                        {/* Wave overlay 1 */}
                                        <path
                                            d={`M 0,22 Q 25,${10 + bounceValues[0] / 6} 50,${22 - bounceValues[1] / 8} T 100,${22 + bounceValues[2] / 6} T 150,${22 - bounceValues[3] / 5} T 200,22`}
                                            className="opacity-75"
                                            style={{ stroke: wardrobe.emissiveColor }}
                                        />
                                        {/* Wave overlay 2 */}
                                        <path
                                            d={`M 0,22 Q 35,${30 - bounceValues[4] / 5} 70,${22 + bounceValues[5] / 7} T 140,${20 - bounceValues[6] / 6} T 200,22`}
                                            className="opacity-25"
                                            style={{ stroke: '#8a5cf5' }}
                                        />
                                    </svg>
                                </div>

                                {/* Lore Description brief */}
                                <p className="text-[9px] text-zinc-400 uppercase leading-relaxed tracking-wider mb-3 border-b border-zinc-900/60 pb-2 font-mono">
                                    {currentMeta.desc}
                                </p>

                                {/* Diagnostics Controls / Sliders */}
                                <div className="space-y-3">
                                    {targetedId === 'tesseract' && (
                                        <div>
                                            <div className="flex justify-between items-center text-[8.5px] text-[#8a5cf5] uppercase mb-1 font-bold tracking-wider">
                                                <span>4D Rotation Index</span>
                                                <span>{tesseractSpeed.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="5.0"
                                                step="0.1"
                                                value={tesseractSpeed}
                                                onChange={(e) => setTesseractSpeed(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                                                style={{ accentColor: wardrobe.emissiveColor }}
                                            />
                                        </div>
                                    )}

                                    {targetedId === 'hourglass' && (
                                        <div>
                                            <div className="flex justify-between items-center text-[8.5px] text-[#8a5cf5] uppercase mb-1 font-bold tracking-wider">
                                                <span>Chrono Dilation Factor</span>
                                                <span>{chronoSpeed.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-4.0"
                                                max="4.0"
                                                step="0.2"
                                                value={chronoSpeed}
                                                onChange={(e) => setChronoSpeed(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                                                style={{ accentColor: wardrobe.emissiveColor }}
                                            />
                                            <div className="flex justify-between text-[6.5px] text-zinc-500 uppercase tracking-widest mt-0.5 font-bold">
                                                <span>[reversed]</span>
                                                <span>[frozen]</span>
                                                <span>[speed-up]</span>
                                            </div>
                                        </div>
                                    )}

                                    {targetedId === 'mobius' && (
                                        <div className="flex justify-between items-center text-[8.5px] text-zinc-400 uppercase tracking-wider font-bold">
                                            <span>Spectral Frequency</span>
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[7.5px] bg-purple-950/30 border border-purple-900/40"
                                                style={{ color: wardrobe.emissiveColor }}
                                            >
                                                [RESONATING]
                                            </span>
                                        </div>
                                    )}

                                    {targetedId === 'portal' && (
                                        <div className="flex justify-between items-center text-[8.5px] text-zinc-400 uppercase tracking-wider font-bold">
                                            <span>Non-Euclidean Skybox</span>
                                            <span
                                                className="px-1.5 py-0.5 rounded text-[7.5px] bg-[#ea580c]/10 border border-[#ea580c]/30"
                                                style={{ color: '#ea580c' }}
                                            >
                                                [CONCURRENT]
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Default Core Interaction guide on Left */
                            <div className="flex flex-col bg-[#050505]/45 border border-zinc-900/10 rounded-lg p-4 select-none">
                                <h3 className="text-[9px] text-[#8a5cf5] font-bold uppercase tracking-[0.2em] mb-2.5">
                                    CORE INTERACTION
                                </h3>
                                <div className="flex gap-3.5 items-center">
                                    <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#8a5cf5]/30 flex items-center justify-center bg-purple-950/20 relative shadow-[0_0_10px_rgba(138,92,245,0.1)]">
                                        <div className="absolute w-6 h-6 rounded-full border border-[#8a5cf5]/50 animate-ping opacity-60" />
                                        <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="3" />
                                            <line x1="12" y1="15" x2="12" y2="21" />
                                        </svg>
                                    </div>
                                    <p className="text-[9px] uppercase text-zinc-300 font-sans-outfit tracking-wide leading-normal">
                                        Step on glowing pedestals to activate an artifact, warping the gallery's geometry, colors, and gravity.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom: Navigation Help card */}
                    <div className="flex flex-col bg-zinc-950/40 border border-zinc-900/10 rounded-lg p-4 select-none pointer-events-auto">
                        <h4 className="text-[9px] text-[#8a5cf5] font-bold uppercase tracking-wider mb-2">
                            Navigation Commands
                        </h4>
                        <div className="space-y-1.5 text-[8.5px] uppercase tracking-wide text-zinc-400">
                            <div className="flex justify-between">
                                <span>Movement</span>
                                <span className="text-white font-mono">[W / A / S / D]</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Look / Aim</span>
                                <span className="text-white font-mono">[Mouse Drag]</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Engage Chamber</span>
                                <span className="text-white font-mono">[E] / [Esc]</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Visor settings</span>
                                <span className="text-white font-mono">[H]</span>
                            </div>
                        </div>
                    </div>
                </div>


                {/* RIGHT COLUMN: Full-Height Calibration & Command Center Sidebar */}
                <div
                    className={`pointer-events-auto flex flex-col w-80 h-full bg-[#070707]/95 border border-zinc-800 rounded-lg p-6 backdrop-blur-md shadow-2xl justify-between space-y-6 relative overflow-y-auto transition-all duration-300 ease-out ${gameState === 'INSPECTING' ? 'translate-x-[120%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
                >
                    {/* Top corner accents */}
                    <div
                        className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 rounded-tl pointer-events-none"
                        style={{ borderColor: wardrobe.emissiveColor }}
                    />
                    <div
                        className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 rounded-br pointer-events-none"
                        style={{ borderColor: wardrobe.emissiveColor }}
                    />

                    {/* SECTION A: Expanded Visor Calibration Panel */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                            <span
                                className="w-2 h-2 rounded-full inline-block animate-pulse"
                                style={{ backgroundColor: wardrobe.emissiveColor }}
                            />
                            <h3 className="text-xs font-bold text-white tracking-widest uppercase font-serif-cinzel">
                                Visor Calibration // Terminal
                            </h3>
                        </div>

                        {/* Chassis Selection */}
                        <div>
                            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5 font-bold">
                                Chassis Material Type
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { id: 'default', name: 'Default Matte', color: 'bg-zinc-800' },
                                    { id: 'matrix', name: 'Obsidian Matrix', color: 'bg-emerald-950 border-emerald-500' },
                                    { id: 'void', name: 'Void Shroud', color: 'bg-black border-zinc-700' },
                                    { id: 'gold', name: 'Aureum Gold', color: 'bg-amber-600 border-amber-400' },
                                ].map((skinItem) => (
                                    <button
                                        key={skinItem.id}
                                        onClick={() => useGameStore.getState().updateWardrobe({ skin: skinItem.id })}
                                        className={`flex items-center gap-2 border px-2.5 py-1.5 rounded text-left transition select-none text-[10px] ${wardrobe.skin === skinItem.id
                                            ? 'bg-zinc-900 text-white'
                                            : 'bg-[#121212]/50 border-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                            }`}
                                        style={{
                                            borderColor: wardrobe.skin === skinItem.id ? wardrobe.emissiveColor : undefined
                                        }}
                                    >
                                        <span className={`w-2.5 h-2.5 rounded-sm border border-zinc-700 ${skinItem.color} shrink-0`} />
                                        <span className="truncate">{skinItem.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visual Equipment Layer Toggle */}
                        <div>
                            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5 font-bold">
                                Visual Equipment Layer
                            </label>
                            <div className="flex gap-1.5">
                                {[
                                    { id: 'none', name: 'Mannequin Frame' },
                                    { id: 'trenchcoat', name: 'Glowing Trenchcoat' },
                                    { id: 'jacket', name: 'White Jacket' },
                                ].map((outfitItem) => (
                                    <button
                                        key={outfitItem.id}
                                        onClick={() => useGameStore.getState().updateWardrobe({ outfit: outfitItem.id })}
                                        className={`flex-1 border px-2.5 py-1.5 rounded text-center text-[10px] transition uppercase tracking-wider ${wardrobe.outfit === outfitItem.id
                                            ? 'bg-zinc-900 border-[#00ffcc] text-white font-bold'
                                            : 'bg-[#121212]/50 border-zinc-900 text-zinc-400 hover:border-zinc-700'
                                            }`}
                                        style={{
                                            borderColor: wardrobe.outfit === outfitItem.id ? wardrobe.emissiveColor : undefined
                                        }}
                                    >
                                        {outfitItem.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quantum Accent Light Selector */}
                        <div>
                            <label className="text-[9px] text-zinc-500 uppercase tracking-widest block mb-1.5 font-bold">
                                Quantum Light Accent
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                    { hex: '#00ffcc', name: 'Cyber Cyan' },
                                    { hex: '#ff0055', name: 'Neon Rose' },
                                    { hex: '#ffff00', name: 'Solar Flare' },
                                    { hex: '#0088ff', name: 'Void Plasma' },
                                ].map((colorItem) => (
                                    <button
                                        key={colorItem.hex}
                                        onClick={() => useGameStore.getState().updateWardrobe({ emissiveColor: colorItem.hex })}
                                        className={`flex flex-col items-center border p-1 rounded transition ${wardrobe.emissiveColor === colorItem.hex
                                            ? 'bg-[#18181b] border-white'
                                            : 'bg-[#121212]/50 border-zinc-900 hover:border-zinc-800'
                                            }`}
                                        style={{
                                            borderColor: wardrobe.emissiveColor === colorItem.hex ? colorItem.hex : undefined
                                        }}
                                    >
                                        <span
                                            className="w-3.5 h-3.5 rounded-full inline-block border border-black mb-1"
                                            style={{
                                                backgroundColor: colorItem.hex,
                                                boxShadow: wardrobe.emissiveColor === colorItem.hex ? `0 0 10px ${colorItem.hex}` : 'none'
                                            }}
                                        />
                                        <span className="text-[7.5px] text-zinc-500 tracking-wider truncate font-semibold uppercase">
                                            {colorItem.name.split(' ')[1]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: Gallery States System Controller */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] text-[#8a5cf5] font-bold uppercase tracking-[0.25em] select-none pl-1">
                            Gallery States // Controller
                        </h4>

                        <div className="flex flex-col gap-2 w-full">
                            {galleryStates.map((state) => {
                                const isActiveState = galleryState === state.id
                                return (
                                    <div
                                        key={state.id}
                                        onClick={() => handleStateClick(state.id)}
                                        className={`cursor-pointer rounded-lg border p-2.5 transition-all duration-300 ease-out select-none flex flex-col justify-between h-16 relative overflow-hidden backdrop-blur-md shadow bg-gradient-to-br ${state.gradient} ${isActiveState
                                            ? 'border-purple-650 scale-[1.01] shadow-[0_0_12px_rgba(138,92,245,0.18)]'
                                            : 'hover:border-zinc-700/80 hover:bg-zinc-900/30'
                                            }`}
                                        style={{
                                            borderColor: isActiveState ? wardrobe.emissiveColor : undefined
                                        }}
                                    >
                                        <div className="flex justify-between items-center w-full relative z-10">
                                            <span className="text-[9px] uppercase font-bold text-zinc-350 tracking-widest text-[#8a5cf5] filter brightness-125" style={{ color: isActiveState ? wardrobe.emissiveColor : undefined }}>
                                                {state.title}
                                            </span>
                                            {isActiveState && (
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full inline-block animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]"
                                                    style={{ backgroundColor: wardrobe.emissiveColor }}
                                                />
                                            )}
                                        </div>

                                        <span className="text-[8px] text-zinc-400 uppercase tracking-widest mt-1 font-semibold text-ellipsis overflow-hidden whitespace-nowrap relative z-10">
                                            {state.subtitle}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* SECTION C: Proximity Command — Engage/Disengage (right panel) */}
                    {targetedId && (
                        <div className="flex flex-col gap-2 bg-[#080808]/70 border border-zinc-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ backgroundColor: wardrobe.emissiveColor }} />
                                <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-[0.2em] font-mono">
                                    PROXIMITY COMMAND
                                </span>
                            </div>
                            {gameState === 'INSPECTING' ? (
                                <button
                                    onClick={() => { setGameState('EXPLORING'); setActiveArtifactId(null) }}
                                    className="w-full py-2 bg-zinc-900 border border-zinc-700 hover:border-white hover:bg-white hover:text-black rounded text-[8.5px] uppercase font-bold tracking-widest transition-all cursor-pointer"
                                >
                                    ✕ Disengage Chamber
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setGameState('INSPECTING'); setActiveArtifactId(targetedId) }}
                                    className="w-full py-2 text-white rounded text-[8.5px] uppercase font-bold tracking-widest transition-all cursor-pointer border border-transparent hover:opacity-90"
                                    style={{ backgroundColor: wardrobe.emissiveColor }}
                                >
                                    ⊕ Engage Inspection [E]
                                </button>
                            )}
                        </div>
                    )}

                    {/* SECTION D: System Version Footer & Controls */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-zinc-900/60 select-none">
                        <div className="flex justify-between items-center w-full text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-bold">
                            <span>ANOMALY SYSTEM V2.4</span>
                            <div className="flex items-center gap-4 pointer-events-auto">
                                <button
                                    onClick={toggleMuted}
                                    title="Toggle Ambient Audio"
                                    className="hover:text-white transition-colors cursor-pointer text-zinc-400"
                                >
                                    {isMuted ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    )}
                                </button>

                                <button
                                    title="Exhibition Language Override"
                                    className="hover:text-white transition-colors text-zinc-400 cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                </button>

                                <button
                                    onClick={() => {
                                        if (gameState === 'EXPLORING' && activeProximityId) {
                                            setGameState('INSPECTING')
                                            setActiveArtifactId(activeProximityId)
                                        } else if (gameState === 'INSPECTING') {
                                            setGameState('EXPLORING')
                                            setActiveArtifactId(null)
                                        }
                                    }}
                                    title="Chamber Full Immersion View"
                                    className="hover:text-white transition-colors text-zinc-400 cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 12a9 9 0 019-9m9 9a9 9 0 01-9 9m9-9H3m0 0a9 9 0 009 9" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <span className="text-[7.5px] text-zinc-650 text-zinc-600 font-bold text-center block tracking-widest leading-none">
                            POWERED BY THREE.JS / R3F / GLSL COMPILER
                        </span>
                    </div>
                </div>

            </div>

            {/* Centered artifact details view */}
            <LoreCard />

            {/* ───── ARTIFACT DOSSIER / CATALOG MODAL OVERLAY ───── */}
            {catalogArtifactId && (
                <div
                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
                    style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setCatalogArtifactId(null)}
                >
                    <div
                        className="relative flex flex-col md:flex-row w-[90vw] max-w-4xl h-[75vh] bg-[#060606] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Accent corners */}
                        <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 rounded-tl pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />
                        <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 rounded-br pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />

                        {/* LEFT: Live 3D Artifact Preview */}
                        <div className="relative w-full md:w-1/2 h-56 md:h-full bg-[#040404] border-b md:border-b-0 md:border-r border-zinc-800">
                            <Canvas
                                camera={{ position: [0, 0, catalogArtifactId === 'portal' ? 3.5 : 2.5], fov: 50 }}
                                gl={{ antialias: true }}
                                dpr={[1, 1.5]}
                            >
                                <color attach="background" args={['#040404']} />
                                <ambientLight intensity={0.4} />
                                <pointLight position={[2, 3, 2]} intensity={1.2} color={wardrobe.emissiveColor} />
                                <pointLight position={[-2, -2, 2]} intensity={0.6} color="#6633ff" />
                                <Suspense fallback={null}>
                                    {catalogArtifactId === 'tesseract' && <Tesseract preview />}
                                    {catalogArtifactId === 'hourglass' && <AntiGravityHourglass preview />}
                                    {catalogArtifactId === 'mobius' && <MobiusPlasmaLoop preview />}
                                    {catalogArtifactId === 'portal' && <PortalMirror preview />}
                                </Suspense>
                                <OrbitControls enableZoom={false} autoRotate={false} enablePan={false} />
                            </Canvas>
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                                <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono bg-black/50 px-2 py-0.5 rounded">
                                    Drag to rotate
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Lore Dossier */}
                        <div className="flex flex-col w-full md:w-1/2 h-full p-6 overflow-y-auto">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[8px] text-zinc-500 uppercase tracking-[0.25em] font-mono block mb-1">
                                        ARTIFACT DOSSIER // EXHIBIT CATALOG
                                    </span>
                                    <h2 className="text-xl font-bold text-white uppercase font-serif-cinzel tracking-wide leading-tight">
                                        {artifactData[catalogArtifactId]?.title}
                                    </h2>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 font-mono">
                                        {artifactData[catalogArtifactId]?.subtitle}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setCatalogArtifactId(null)}
                                    className="text-zinc-500 hover:text-white transition-colors text-lg leading-none ml-4 cursor-pointer"
                                    title="Close dossier"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Accent line */}
                            <div className="w-full h-px mb-4" style={{ backgroundColor: wardrobe.emissiveColor }} />

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4 font-mono">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2.5">
                                    <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Dimension</span>
                                    <span className="text-white text-[11px] font-bold uppercase">{artifactData[catalogArtifactId]?.dimension}</span>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded p-2.5">
                                    <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Stability Index</span>
                                    <span className="text-[11px] font-bold uppercase" style={{ color: wardrobe.emissiveColor }}>{artifactData[catalogArtifactId]?.stability}</span>
                                </div>
                                <div className="col-span-2 bg-zinc-900/50 border border-zinc-800 rounded p-2.5">
                                    <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-1">Coordinates</span>
                                    <span className="text-zinc-300 text-[10px] font-bold uppercase">{artifactData[catalogArtifactId]?.coordinates}</span>
                                </div>
                            </div>

                            {/* Lore text */}
                            <div className="bg-zinc-900/30 border border-zinc-800/60 rounded p-3 mb-4 flex-grow">
                                <span className="text-[7.5px] text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Classification Notes</span>
                                <p className="text-[10px] text-zinc-300 leading-relaxed uppercase tracking-wider font-sans-outfit">
                                    {artifactData[catalogArtifactId]?.desc}
                                </p>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex gap-2 mt-auto">
                                {['tesseract', 'hourglass', 'mobius', 'portal'].map((id) => (
                                    <button
                                        key={id}
                                        onClick={() => setCatalogArtifactId(id)}
                                        className="flex-1 py-1.5 text-[7px] uppercase font-bold tracking-widest font-mono rounded border transition-all cursor-pointer"
                                        style={{
                                            borderColor: catalogArtifactId === id ? wardrobe.emissiveColor : '#27272a',
                                            color: catalogArtifactId === id ? wardrobe.emissiveColor : '#71717a',
                                            backgroundColor: catalogArtifactId === id ? wardrobe.emissiveColor + '18' : 'transparent',
                                        }}
                                    >
                                        {id.toUpperCase().slice(0, 4)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default App
