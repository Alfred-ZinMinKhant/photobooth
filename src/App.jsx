import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Camera from './pages/Camera'
import Final from './pages/Final'
import Upload from './pages/Upload'

export default function App(){
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/index" element={<Navigate to="/" replace />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/menu" element={<Menu/>} />
        <Route path="/camera" element={<Camera/>} />
        <Route path="/final" element={<Final/>} />
        <Route path="/upload" element={<Upload/>} />
      </Routes>
    </div>
  )
}
