import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Bubbles from './Bubbles'

export default function UploadEditor() {
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const [photoStage, setPhotoStage] = useState(0)
  const navigate = useNavigate()

  const drawPhoto = img => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const WIDTH = canvas.width, HEIGHT = canvas.height, HALF = HEIGHT / 2
    const yOffset = photoStage === 0 ? 0 : HALF
    const imgAspect = img.width / img.height, targetAspect = WIDTH / HALF
    let sx, sy, sw, sh
    if (imgAspect > targetAspect) { sh = img.height; sw = img.height * targetAspect; sx = (img.width - sw) / 2; sy = 0 }
    else { sw = img.width; sh = img.width / targetAspect; sx = 0; sy = (img.height - sh) / 2 }
    ctx.drawImage(img, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF)
    setPhotoStage(s => s + 1)
  }

  const handleFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => drawPhoto(img)
    img.src = URL.createObjectURL(file)
    e.target.value = ''
  }

  const finalize = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const frame = new Image()
    frame.onload = () => {
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
      if (canvas) localStorage.setItem('photoStrip', canvas.toDataURL('image/png'))
      setTimeout(() => { if (typeof navigate === 'function') navigate('/final'); else window.location.href = '/final' }, 50)
    }
    frame.src = '/Assets/fish-photobooth/camerapage/frame.png'
  }

  useEffect(() => {
    // clear previous photoStrip so we don't confuse pages
    localStorage.removeItem('photoStrip')
  }, [])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'photo-strip.png'; a.click() }, 'image/png')
  }

  return (
    <div>
      <Logo />

      <div className="photobooth-container" id="booth">
        <div ref={bubbleContainerRef} className="bubble-container"></div>
        <canvas ref={canvasRef} id="finalCanvas" width={1176} height={1470} style={{display:'block', width:'100%'}} />
        <img className="frame-overlay" src="/Assets/fish-photobooth/camerapage/frame.png" alt="frame overlay" />
        <Bubbles containerRef={bubbleContainerRef} />
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile} />
      <div style={{display:'flex', justifyContent:'center', marginTop:20}}>
        <button
          onClick={() => {
            if (photoStage < 2) inputRef.current?.click()
            else finalize()
          }}
          style={{padding:'14px 28px', fontSize:20}}
        >
          {photoStage < 2 ? 'Upload Photo' : 'Ready'}
        </button>
      </div>
    </div>
  )
}
