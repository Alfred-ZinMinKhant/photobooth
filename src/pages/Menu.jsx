import React from 'react'
import { useNavigate } from 'react-router-dom'
import HomeAnimations from '../components/HomeAnimations'
import Logo from '../components/Logo'
import '../../StyleSheets/home.css'

export default function Menu(){
  const navigate = useNavigate();
  return (
    <div>
      <Logo />

      <div className="menu-container">
        <div className="menu-header"></div>
        <button id="menu-camera-button">Take photos</button>
        <button id="menu-upload-button">Upload photos</button>
      </div>

      <HomeAnimations navigate={navigate} />
    </div>
  )
}
