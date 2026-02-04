import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Bubbles from './Bubbles'

export default function UploadEditor() {
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const overlayRef = useRef(null)
  const nextSlotRef = useRef(0)
  const [photoStage, setPhotoStage] = useState(0)
  const [numPhotos, setNumPhotos] = useState(2)
  const navigate = useNavigate()

  const WIDTH = 1176
  const SINGLE = 735

  const drawPhoto = img => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    // reserve slot using a ref to avoid timing issues
    const slot = nextSlotRef.current
    nextSlotRef.current = Math.min(numPhotos - 1, slot + 1)
    const yOffset = slot * SINGLE
    const imgAspect = img.width / img.height, targetAspect = WIDTH / SINGLE
    let sx, sy, sw, sh
    if (imgAspect > targetAspect) { sh = img.height; sw = img.height * targetAspect; sx = (img.width - sw) / 2; sy = 0 }
    else { sw = img.width; sh = img.width / targetAspect; sx = 0; sy = (img.height - sh) / 2 }
    // on first upload, ensure canvas resolution matches requested size and clear background
    if (slot === 0) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, yOffset, WIDTH, SINGLE)
    // draw film border for this slot
    drawFilmBorder(ctx, slot)
    // update overlay: only draw this slot (don't reset overlay bitmap)
    try {
      const overlay = overlayRef.current
      if (overlay) {
        // ensure overlay bitmap is initialized (but don't reset if already set)
        if (!overlay.width || overlay.width !== WIDTH || overlay.height !== SINGLE * numPhotos) {
          overlay.width = WIDTH
          overlay.height = SINGLE * numPhotos
        }
        const octx = overlay.getContext && overlay.getContext('2d')
        if (octx) {
          octx.clearRect(0, yOffset, WIDTH, SINGLE)
          octx.drawImage(canvas, 0, yOffset, WIDTH, SINGLE, 0, yOffset, WIDTH, SINGLE)
        }
      }
    } catch (e) { /* ignore overlay copy errors */ }

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
    if (canvas) localStorage.setItem('photoStrip', canvas.toDataURL('image/png'))
    setTimeout(() => { if (typeof navigate === 'function') navigate('/final'); else window.location.href = '/final' }, 50)
  }

  useEffect(() => {
    // clear previous photoStrip so we don't confuse pages
    localStorage.removeItem('photoStrip')
    // ensure overlay resolution initially
    const overlay = overlayRef.current
    if (overlay) {
      overlay.width = WIDTH
      overlay.height = SINGLE * numPhotos
      const octx = overlay.getContext && overlay.getContext('2d')
      if (octx) {
        octx.clearRect(0, 0, overlay.width, overlay.height)
      }
    }
  }, [])

  // draw preview borders into overlay whenever numPhotos changes (and no uploads yet)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
    const octx = overlay.getContext && overlay.getContext('2d')
    if (!octx) return
    if (photoStage !== 0) return
    overlay.width = WIDTH
    overlay.height = SINGLE * numPhotos
    octx.clearRect(0, 0, overlay.width, overlay.height)
    for (let i = 0; i < numPhotos; i++) drawFilmBorder(octx, i)
    // ensure main canvas matches size
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      const mctx = canvas.getContext && canvas.getContext('2d')
      if (mctx) { mctx.fillStyle = '#fff'; mctx.fillRect(0,0,canvas.width,canvas.height) }
    }
  }, [numPhotos, photoStage])

  function drawFilmBorder(ctx, index) {
    if (!ctx) return
    const inset = 12
    const slotY = index * SINGLE
    const x = inset / 2
    const y = slotY + inset / 2
    const w = WIDTH - inset
    const h = SINGLE - inset
    const r = 14
    ctx.save()
    ctx.beginPath()
    ctx.lineWidth = inset
    ctx.strokeStyle = '#000'
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.stroke()
    ctx.restore()
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'photo-strip.png'; a.click() }, 'image/png')
  }

  return (
    <div>
      <Logo />

      <div className="photobooth-container" id="booth" style={{position:'relative', aspectRatio: `${WIDTH} / ${SINGLE * numPhotos}`}}>
        <div ref={bubbleContainerRef} className="bubble-container" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:2}}></div>
        <canvas ref={canvasRef} id="finalCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0}} />
        <canvas ref={overlayRef} id="overlayCanvas" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4}} />
        <Bubbles containerRef={bubbleContainerRef} />
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile} />
      <div style={{display:'flex', justifyContent:'center', marginTop:20, gap:12}}>
        <div style={{display:'inline-flex', alignItems:'center', gap:8}}>
          <label htmlFor="numPhotosSelect" style={{fontSize:'0.95rem'}}>Photos:</label>
          <select id="numPhotosSelect" value={numPhotos} onChange={e => { if (photoStage === 0) setNumPhotos(Number(e.target.value)) }} disabled={photoStage > 0} style={{padding:'6px 8px', fontSize:'1rem', borderRadius:6}}>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button
          onClick={() => {
            if (photoStage < numPhotos) inputRef.current?.click()
            else finalize()
          }}
          style={{padding:'14px 28px', fontSize:20}}
        >
          {photoStage < numPhotos ? 'Upload Photo' : 'Ready'}
        </button>
      </div>
    </div>
  )
}
