import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// HomeAnimations not used on this page; navigation handled by buttons below
import Logo from '../components/Logo'
import '../../StyleSheets/home.css'

export default function Menu(){
  const navigate = useNavigate();
  useEffect(() => {
    const body = document.body
    body.classList.add('menu-page')
    body.style.setProperty('--menu-body-background-image', "url('/Assets/fish-photobooth/menupage/MenuBackground.jpg')")
    return () => {
      body.classList.remove('menu-page')
      body.style.removeProperty('--menu-body-background-image')
    }
  }, [])

  return (
    <div>
      <Logo />

      <div className="menu-container">
        <div className="menu-buttons">
          <button id="menu-camera-button" type="button" onClick={() => navigate('/camera')}>Take photos</button>
          <button id="menu-upload-button" type="button" onClick={() => navigate('/upload')}>Upload photos</button>
        </div>
      </div>

    </div>
  )
}
