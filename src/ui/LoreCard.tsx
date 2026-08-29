import { useEffect, useState } from 'react'
import { useGameStore } from '../state/gameStore'

export function LoreCard() {
    const {
        gameState,
        activeArtifactId,
        setGameState,
        setActiveArtifactId,
        chronoSpeed,
        setChronoSpeed,
        tesseractSpeed,
        setTesseractSpeed,
        wardrobe,
    } = useGameStore()

    const isOpen = gameState === 'INSPECTING' && activeArtifactId !== null
    const [bounceValues, setBounceValues] = useState<number[]>([10, 20, 30, 40, 50, 40, 30, 20])

    // ESC key keypress listener to disengage
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setGameState('EXPLORING')
                setActiveArtifactId(null)
            }
        }

        // Procedural animation for the audio visualizer in the LoreCard
        let interval: any
        if (activeArtifactId === 'mobius') {
            interval = setInterval(() => {
                setBounceValues(
                    Array.from({ length: 12 }, () => 10 + Math.floor(Math.random() * 80))
                )
            }, 100)
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            if (interval) clearInterval(interval)
        }
    }, [isOpen, activeArtifactId, setGameState, setActiveArtifactId])

    if (!isOpen) return null

    // Artifact details
    const artifactData: Record<
        string,
        { title: string; subtitle: string; coordinates: string; desc: string }
    > = {
        tesseract: {
            title: '01 // The Hyper-Tesseract',
            subtitle: '4D SPATIAL ANCHOR // WARPING SHADOWS',
            coordinates: 'LOC: X:-8.0 // Y:1.45 // Z:-8.0',
            desc: 'A geometric wireframe construct rotating along a simulated 4th spatial dimension (W-axis). Because we perceive in 3D, the physical shape appears to twist inside-out. The morphing wireframe and its shadow projection represent the 3rd-dimensional perspective slice of a true 4D hypercube.',
        },
        hourglass: {
            title: '02 // Chrono-Hourglass',
            subtitle: 'CHRONO-FLUID // GRAVITATIONAL DILATION',
            coordinates: 'LOC: X:8.0 // Y:1.45 // Z:-8.0',
            desc: 'Inside this glass containment shell, gravity acts in reverse. Liquid mercury droplets rise upward from the bottom reservoir, accelerating as they compress through a central gravitational singularity neck before expanding into the upper chamber.',
        },
        mobius: {
            title: '03 // Möbius Plasma Loop',
            subtitle: 'SINGLE-SIDED RIBBON // SONIC HARMONIZATION',
            coordinates: 'LOC: X:-8.0 // Y:1.45 // Z:8.0',
            desc: 'A continuous, single-sided ribbon loop mapping parametric geometry. A high-energy plasma current travels along its surface, creating glowing emission stripes that react in real-time. The loop is synchronized with the acoustic frequency bins of the spatial sub-bass drone.',
        },
        portal: {
            title: '04 // Portal Mirror',
            subtitle: 'NON-EUCLIDEAN APERTURE // DIGITAL HORIZON',
            coordinates: 'LOC: X:8.0 // Y:1.45 // Z:8.0',
            desc: 'A fractured brutalist concrete gateway housing a non-Euclidean event horizon. This stargate utilizes specialized spatial shaders which detect view depth: looking straight through the front face reveals a burning cosmos, while walking behind and looking through the back face details a cold grid matrix.',
        },
    }

    const lore = artifactData[activeArtifactId] || {
        title: 'Unknown Phenomenon',
        subtitle: 'QUANTUM NO-DATA',
        coordinates: 'LOC: X:??? // Y:??? // Z:???',
        desc: 'Anomaly structure unclassified. Approach with care.',
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none pointer-events-none">
            {/* Centered glassmorphism modal card */}
            <div className="pointer-events-auto relative w-full max-w-md bg-[#070707]/95 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between font-mono backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto">
                {/* Glow highlight trim */}
                <div
                    className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
                    style={{ backgroundColor: wardrobe.emissiveColor }}
                />

                {/* Accent corners */}
                <div className="absolute -top-px -left-px w-4 h-4 border-t border-l rounded-tl pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />
                <div className="absolute -top-px -right-px w-4 h-4 border-t border-r rounded-tr pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />
                <div className="absolute -bottom-px -left-px w-4 h-4 border-b border-l rounded-bl pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r rounded-br pointer-events-none" style={{ borderColor: wardrobe.emissiveColor }} />

                {/* top content */}
                <div className="flex flex-col gap-5 mt-2">
                    {/* Breadcrumb / Category */}
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase tracking-widest font-bold border-b border-zinc-900 pb-2">
                        <span>multiverse index</span>
                        <span>{lore.coordinates}</span>
                    </div>

                    {/* Phenomenon Title */}
                    <div>
                        <h1
                            className="text-lg font-bold uppercase tracking-wider mb-1"
                            style={{ color: wardrobe.emissiveColor }}
                        >
                            {lore.title}
                        </h1>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {lore.subtitle}
                        </p>
                    </div>

                    {/* Lore Description Paragraph */}
                    <div className="bg-[#121212]/30 border border-zinc-900 rounded p-4 text-[11px] text-zinc-400 leading-relaxed uppercase">
                        {lore.desc}
                    </div>

                    {/* Interactive Controls Segment */}
                    <div className="border-t border-zinc-900 pt-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                            Phenomenon Diagnostics
                        </h3>

                        {/* 1. Tesseract controls */}
                        {activeArtifactId === 'tesseract' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase mb-2 font-bold select-none">
                                        <span>4D Hyper-Rotation Speed</span>
                                        <span className="text-[#00ffcc]" style={{ color: wardrobe.emissiveColor }}>
                                            {tesseractSpeed.toFixed(1)}x
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="5.0"
                                        step="0.1"
                                        value={tesseractSpeed}
                                        onChange={(e) => setTesseractSpeed(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
                                        style={{ accentColor: wardrobe.emissiveColor }}
                                    />
                                </div>
                                <div className="text-[9px] text-zinc-500 uppercase leading-normal">
                                    Adjusting this rotates the tesseract in the X-W plane. Higher speeds cause faster geometric infolding and coordinate morphs.
                                </div>
                            </div>
                        )}

                        {/* 2. Hourglass controls */}
                        {activeArtifactId === 'hourglass' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase mb-2 font-bold select-none">
                                        <span>Chrono Dilation Multiplier</span>
                                        <span className="text-[#00ffcc]" style={{ color: wardrobe.emissiveColor }}>
                                            {chronoSpeed.toFixed(1)}x
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="-4.0"
                                        max="4.0"
                                        step="0.2"
                                        value={chronoSpeed}
                                        onChange={(e) => setChronoSpeed(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00ffcc]"
                                        style={{ accentColor: wardrobe.emissiveColor }}
                                    />
                                </div>
                                <div className="flex justify-between text-[8px] text-zinc-500 uppercase font-bold">
                                    <span>[reversing time]</span>
                                    <span>[frozen]</span>
                                    <span>[accelerating]</span>
                                </div>
                                <div className="text-[9px] text-zinc-500 uppercase leading-normal">
                                    A negative value reverses local gravity, forcing mercury droplets downward. Set to 0.0 to freeze fluid velocity in space.
                                </div>
                            </div>
                        )}

                        {/* 3. Mobius visualizer */}
                        {activeArtifactId === 'mobius' && (
                            <div className="space-y-4">
                                <div className="text-[10px] text-zinc-400 uppercase mb-2 font-bold">
                                    Spatial Acoustic Frequencies
                                </div>

                                {/* CSS Visualizer bars */}
                                <div className="flex items-end justify-between h-14 bg-[#121212]/50 border border-zinc-950 rounded p-2 gap-1">
                                    {bounceValues.map((val, idx) => (
                                        <div
                                            key={idx}
                                            className="w-full transition-all duration-100 ease-out rounded-t-sm"
                                            style={{
                                                height: `${val}%`,
                                                backgroundColor: wardrobe.emissiveColor,
                                                opacity: 0.15 + (val / 100) * 0.85
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="text-[9px] text-zinc-500 uppercase leading-normal">
                                    Audio-reactive waves. Sub-bass harmonics and panner frequencies stimulate localized plasma pulses on the Möbius ribbon.
                                </div>
                            </div>
                        )}

                        {/* 4. Portal controls */}
                        {activeArtifactId === 'portal' && (
                            <div className="space-y-3">
                                <div className="inline-block px-2 py-1 text-[8px] border rounded uppercase font-bold" style={{ color: wardrobe.emissiveColor, borderColor: wardrobe.emissiveColor }}>
                                    Stargate Active
                                </div>
                                <div className="text-[9px] text-zinc-500 uppercase leading-normal">
                                    Rotate camera or move behind the frame to see the skybox shift from RED (front) to GREEN (back). No physical transition barrier triggers; dimensional alignment is coordinate-bound.
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Disengage / Exit Button */}
                <div className="mt-6 mb-2">
                    <button
                        onClick={() => {
                            setGameState('EXPLORING')
                            setActiveArtifactId(null)
                        }}
                        className="w-full py-2.5 rounded font-bold text-xs uppercase tracking-widest border transition bg-transparent text-white border-zinc-800 hover:bg-white hover:text-black hover:border-white transition-all select-none cursor-pointer"
                    >
                        Disengage Chamber [esc]
                    </button>
                </div>
            </div>
        </div>
    )
}
