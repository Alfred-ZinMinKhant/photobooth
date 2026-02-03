import React from 'react'
import { useNavigate } from 'react-router-dom'
import CameraWidget from '../components/CameraWidget'
import Bubbles from '../components/Bubbles'
import '../../StyleSheets/camera.css'

export default function Camera(){
  const navigate = useNavigate();
  return (
    <div>
      <CameraWidget navigate={navigate} />
    </div>
  )
}
