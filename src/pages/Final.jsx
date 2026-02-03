import React from 'react'
import { useNavigate } from 'react-router-dom'
import FinalEditor from '../components/FinalEditor'
import '../../StyleSheets/final.css'

export default function Final(){
  const navigate = useNavigate();
  return (
    <div>

      <FinalEditor navigate={navigate} />
    </div>
  )
}
