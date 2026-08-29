import { create } from 'zustand'

export type GameState = 'LOADING' | 'EXPLORING' | 'INSPECTING' | 'WARDROBE_OPEN'
export type GalleryState = 'neutral' | 'warped' | 'inverted' | 'gravity'

export interface WardrobeOptions {
    skin: string          // 'default' | 'matrix' | 'void' | 'gold'
    outfit: string        // 'none' | 'trenchcoat' | 'armor'
    emissiveColor: string   // '#00ffcc' | '#ff0055' | '#ffff00' | '#0088ff'
}

interface GameStore {
    gameState: GameState
    galleryState: GalleryState
    activeArtifactId: string | null
    activeProximityId: string | null
    wardrobe: WardrobeOptions
    loadProgress: number
    chronoSpeed: number
    tesseractSpeed: number
    isMuted: boolean

    setGameState: (state: GameState) => void
    setGalleryState: (state: GalleryState) => void
    setActiveArtifactId: (id: string | null) => void
    setActiveProximityId: (id: string | null) => void
    setChronoSpeed: (speed: number) => void
    setTesseractSpeed: (speed: number) => void
    updateWardrobe: (updates: Partial<WardrobeOptions>) => void
    setLoadProgress: (progress: number) => void
    toggleMuted: () => void
}

export const useGameStore = create<GameStore>((set) => ({
    gameState: 'EXPLORING',
    galleryState: 'neutral',
    activeArtifactId: null,
    activeProximityId: null,
    wardrobe: {
        skin: 'default',
        outfit: 'trenchcoat',
        emissiveColor: '#00ffcc',
    },
    loadProgress: 0,
    chronoSpeed: 1.0,
    tesseractSpeed: 2.0,
    isMuted: false,

    setGameState: (gameState) => set({ gameState }),
    setGalleryState: (galleryState) => set({ galleryState }),
    setActiveArtifactId: (activeArtifactId) => set({ activeArtifactId }),
    setActiveProximityId: (activeProximityId) => set({ activeProximityId }),
    setChronoSpeed: (chronoSpeed) => set({ chronoSpeed }),
    setTesseractSpeed: (tesseractSpeed) => set({ tesseractSpeed }),
    updateWardrobe: (updates) =>
        set((state) => ({ wardrobe: { ...state.wardrobe, ...updates } })),
    setLoadProgress: (loadProgress) => set({ loadProgress }),
    toggleMuted: () => set((state) => ({ isMuted: !state.isMuted })),
}))
