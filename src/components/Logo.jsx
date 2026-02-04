import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Logo(){
  const navigate = useNavigate()
  return (
    <div className="logo" role="button" tabIndex={0} onClick={() => navigate('/')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate('/') }} style={{cursor:'pointer'}}>
      <img src="/Assets/fish-photobooth/logo-new.png" alt="Logo" />
    </div>
  )
}
