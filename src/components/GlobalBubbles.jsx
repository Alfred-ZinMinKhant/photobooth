import React, { useEffect, useRef } from 'react'
import '../../StyleSheets/global-bubbles.css'

export default function GlobalBubbles({ intensity = 'medium' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const bubbleCount = intensity === 'low' ? 3 : intensity === 'high' ? 8 : 5
    const bubbles = []

    const createBubble = () => {
      const bubble = document.createElement('div')
      bubble.className = 'global-bubble'
      
      // Random size
      const size = Math.random() * 30 + 20 // 20-50px
      bubble.style.width = `${size}px`
      bubble.style.height = `${size}px`
      
      // Random starting position
      bubble.style.left = `${Math.random() * 100}%`
      
      // Random animation duration
      const duration = Math.random() * 5 + 8 // 8-13s
      bubble.style.animationDuration = `${duration}s`
      
      // Random delay
      const delay = Math.random() * 5
      bubble.style.animationDelay = `${delay}s`
      
      container.appendChild(bubble)
      bubbles.push(bubble)

      // Remove and recreate after animation
      setTimeout(() => {
        if (bubble.parentNode) {
          bubble.remove()
        }
        const index = bubbles.indexOf(bubble)
        if (index > -1) {
          bubbles.splice(index, 1)
        }
        if (container) {
          createBubble()
        }
      }, (duration + delay) * 1000)
    }

    // Create initial bubbles
    for (let i = 0; i < bubbleCount; i++) {
      setTimeout(() => createBubble(), i * 1000)
    }

    return () => {
      bubbles.forEach(bubble => {
        if (bubble.parentNode) {
          bubble.remove()
        }
      })
    }
  }, [intensity])

  return <div ref={containerRef} className="global-bubbles-container" />
}
