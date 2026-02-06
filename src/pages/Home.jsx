import React from 'react'
import { useNavigate } from 'react-router-dom'
import HomeAnimations from '../components/HomeAnimations'
import '../../StyleSheets/home.css'

export default function Home(){
  const navigate = useNavigate();
  return (
    <div>
      <div className="home-container">
        <div className="photobooth-container">
          <HomeAnimations navigate={navigate} />
        </div>

        <div className="button-container">
          <button id="select-button">Select</button>
        </div>
      </div>
    </div>
  )
}
