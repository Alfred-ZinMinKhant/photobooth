import React from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Camera from './pages/Camera'
import Final from './pages/Final'
import Upload from './pages/Upload'
import PageTransition from './components/PageTransition'
import NavigationBar from './components/NavigationBar'
import GlobalBubbles from './components/GlobalBubbles'
import { SoundProvider } from './components/SoundProvider'

export default function App(){
  const location = useLocation()
  
  // Determine bubble intensity based on page
  const getBubbleIntensity = () => {
    if (location.pathname === '/') return 'medium'
    if (location.pathname === '/menu') return 'medium'
    if (location.pathname === '/camera') return 'high'
    if (location.pathname === '/final') return 'low'
    return 'medium'
  }

  return (
    <SoundProvider>
      <div>
        <GlobalBubbles intensity={getBubbleIntensity()} />
        <NavigationBar />
        <Routes>
          <Route path="/" element={<PageTransition><Home/></PageTransition>} />
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="/menu" element={<PageTransition><Menu/></PageTransition>} />
          <Route path="/camera" element={<PageTransition><Camera/></PageTransition>} />
          <Route path="/final" element={<PageTransition><Final/></PageTransition>} />
          <Route path="/upload" element={<PageTransition><Upload/></PageTransition>} />
        </Routes>
      </div>
    </SoundProvider>
  )
}
