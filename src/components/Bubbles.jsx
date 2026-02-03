import React, { useEffect, useRef } from 'react'

const bubbleImages = [
  '/Assets/fish-photobooth/camerapage/bubbles/bubble4.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble1.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble2.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble3.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble4.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble5.png',
  '/Assets/fish-photobooth/camerapage/bubbles/bubble4.png'
]

export default function Bubbles({ interval = 800, containerRef: externalRef = null }) {
  const ownRef = useRef(null)
  const containerRef = externalRef || ownRef

  useEffect(() => {
    const bubbleContainer = containerRef.current
    if (!bubbleContainer) return
    let intervalId = null

    const createBubble = () => {
      const bubble = document.createElement('img')
      bubble.src = bubbleImages[Math.floor(Math.random() * bubbleImages.length)]
      bubble.classList.add('bubble')
      bubble.style.position = 'absolute'
      bubble.style.left = Math.random() * 100 + 'vw'
      const size = 20 + Math.random() * 20
      bubble.style.width = size + 'px'
      const duration = 12 + Math.random() * 8
      bubble.style.animationDuration = duration + 's'
      bubble.addEventListener('animationend', () => (bubble.style.opacity = 0.2 + Math.random() * 0.8))
      bubbleContainer.appendChild(bubble)
      setTimeout(() => bubble.remove(), duration * 1000)
    }

    intervalId = setInterval(createBubble, interval)
    return () => { clearInterval(intervalId); bubbleContainer.querySelectorAll('.bubble').forEach(b => b.remove()) }
  }, [interval, containerRef])

  if (externalRef) return null
  return <div ref={ownRef} className="bubble-container" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%'}} />
}
