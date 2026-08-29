import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../state/gameStore'

export function FollowCamera() {
    const { gameState } = useGameStore()

    // Camera angles in radians
    const yaw = useRef(0.2) // Horizontal rotation
    const pitch = useRef(0.3) // Vertical rotation
    const isDragging = useRef(false)
    const previousMousePosition = useRef({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            isDragging.current = true
            previousMousePosition.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseUp = () => {
            isDragging.current = false
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return

            const deltaX = e.clientX - previousMousePosition.current.x
            const deltaY = e.clientY - previousMousePosition.current.y

            yaw.current -= deltaX * 0.005
            pitch.current = Math.max(-0.2, Math.min(1.2, pitch.current + deltaY * 0.005)) // Clamped vertical look

            previousMousePosition.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('mousemove', handleMouseMove)

        return () => {
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    useFrame((state) => {
        // Only execute third-person follow camera when in EXPLORING state
        if (gameState !== 'EXPLORING') return

        const player = state.scene.getObjectByName('player')
        if (!player) return

        const playerPosition = player.position

        const distance = 5.5

        // Calculate target camera coordinates relative to the player using spherical coordinates
        const targetX = playerPosition.x + distance * Math.sin(yaw.current) * Math.cos(pitch.current)
        const targetY = playerPosition.y + 1.2 + distance * Math.sin(pitch.current)
        const targetZ = playerPosition.z + distance * Math.cos(yaw.current) * Math.cos(pitch.current)

        const targetCamPos = new THREE.Vector3(targetX, targetY, targetZ)

        // Smoothly interpolate camera position
        state.camera.position.lerp(targetCamPos, 0.1)

        // Smoothly point camera at player head position
        const lookTarget = new THREE.Vector3(playerPosition.x, playerPosition.y + 1.2, playerPosition.z)

        // We create a temporary object matrix lookAt or lerp the camera orientation
        const targetRotation = new THREE.Matrix4().lookAt(state.camera.position, lookTarget, new THREE.Vector3(0, 1, 0))
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(targetRotation)
        state.camera.quaternion.slerp(targetQuaternion, 0.1)
    })

    return null
}
