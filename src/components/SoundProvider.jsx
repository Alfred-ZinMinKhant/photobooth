import React, { createContext, useContext, useRef, useState, useEffect } from 'react'

const SoundContext = createContext()

export const useSound = () => useContext(SoundContext)

export const SoundProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true) // Start muted for better UX (autostart rules)
  const ambientRef = useRef(null)
  
  // Sound library (URLs can be replaced with real assets if available)
  const sounds = {
    click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    capture: new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3'),
    bubble: new Audio('https://assets.mixkit.co/active_storage/sfx/1110/1110-preview.mp3'),
    success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3')
  }

  const playSound = (name) => {
    if (isMuted) return
    const sound = sounds[name]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(e => console.log('Sound play blocked:', e))
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <SoundContext.Provider value={{ playSound, isMuted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  )
}
