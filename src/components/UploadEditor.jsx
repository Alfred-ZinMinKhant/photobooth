import React, { useRef, useEffect, useState } from 'react'
import Bubbles from './Bubbles'
import LoadingSpinner from './LoadingSpinner'
import { IoCloudUploadOutline, IoLayersOutline, IoChevronDownOutline, IoRefreshOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'
import { useSound } from './SoundProvider'
import '../../StyleSheets/camera-enhanced.css'

export default function UploadEditor() {
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const overlayRef = useRef(null)
  const nextSlotRef = useRef(0)
  const [photoStage, setPhotoStage] = useState(0)
  const [numPhotos, setNumPhotos] = useState(2)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { playSound } = useSound()
  const navigate = useNavigate()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const mainLayoutRef = useRef(null)

  const WIDTH = 1176
  const SINGLE = 735

  const drawPhoto = img => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    const slot = nextSlotRef.current
    if (slot >= numPhotos) return

    nextSlotRef.current = slot + 1
    const yOffset = slot * SINGLE
    const imgAspect = img.width / img.height, targetAspect = WIDTH / SINGLE
    let sx, sy, sw, sh
    
    if (imgAspect > targetAspect) { 
      sh = img.height; sw = img.height * targetAspect; sx = (img.width - sw) / 2; sy = 0 
    } else { 
      sw = img.width; sh = img.width / targetAspect; sx = 0; sy = (img.height - sh) / 2 
    }
    
    if (slot === 0) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    ctx.drawImage(img, sx, sy, sw, sh, 0, yOffset, WIDTH, SINGLE)
    drawFilmBorder(ctx, slot)
    
    try {
      const overlay = overlayRef.current
      if (overlay) {
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

    setPhotoStage(nextSlotRef.current)
  }

  const handleFile = e => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    e.target.value = ''
  }

  const processFiles = async (files) => {
    if (files.length === 0) return
    setIsProcessing(true)
    
    for (const file of files) {
      if (nextSlotRef.current >= numPhotos) break
      if (!file.type.startsWith('image/')) continue

      await new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          drawPhoto(img)
          playSound('bubble')
          resolve()
        }
        img.src = URL.createObjectURL(file)
      })
    }
    
    setIsProcessing(false)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    if (photoStage < numPhotos) setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (photoStage < numPhotos) {
      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    }
  }

  const finalize = () => {
    playSound('success')
    const canvas = canvasRef.current
    if (canvas) localStorage.setItem('photoStrip', canvas.toDataURL('image/png'))
    setTimeout(() => { 
      if (typeof navigate === 'function') navigate('/final')
      else window.location.href = '/final' 
    }, 50)
  }

  useEffect(() => {
    localStorage.removeItem('photoStrip')
    const overlay = overlayRef.current
    if (overlay) {
      overlay.width = WIDTH
      overlay.height = SINGLE * numPhotos
      const octx = overlay.getContext && overlay.getContext('2d')
      if (octx) octx.clearRect(0, 0, overlay.width, overlay.height)
    }
  }, [])

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
    
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      const mctx = canvas.getContext && canvas.getContext('2d')
      if (mctx) { 
        mctx.fillStyle = '#fff'
        mctx.fillRect(0,0,canvas.width,canvas.height) 
      }
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

  // Retake last photo logic adapted for Upload
  const retakeLastPhoto = () => {
    if (photoStage === 0) return
    
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    const ctx = canvas?.getContext('2d')
    const octx = overlay?.getContext('2d')
    
    const lastIndex = photoStage - 1
    const yOffset = lastIndex * SINGLE
    
    // Clear the last photo from both canvases
    if (ctx) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, yOffset, WIDTH, SINGLE)
    }
    if (octx) {
      octx.clearRect(0, yOffset, WIDTH, SINGLE)
      drawFilmBorder(octx, lastIndex)
    }
    
    // Reset to previous stage and update internal slot tracking
    setPhotoStage(lastIndex)
    nextSlotRef.current = lastIndex
    playSound('bubble')
  }

  // Auto-scroll logic similar to CameraWidget
  useEffect(() => {
    if (mainLayoutRef.current && photoStage < numPhotos) {
      const container = mainLayoutRef.current
      const booth = document.getElementById('booth')
      if (booth) {
        const slotHeight = booth.offsetHeight / numPhotos
        const targetScroll = photoStage * slotHeight
        
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
      }
    }
  }, [photoStage, numPhotos])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="camera-page-wrapper-v6">
      
      {isProcessing && <LoadingSpinner message="Processing photos..." overlay />}
      
      <div className="camera-main-layout" ref={mainLayoutRef}>
        <div className="photo-slots-indicator-v7">
          {Array.from({ length: numPhotos }, (_, i) => (
            <div key={i} className={`slot-indicator ${i < photoStage ? 'captured' : ''} ${i === photoStage ? 'current' : ''}`}>
              {i < photoStage ? '✓' : i + 1}
            </div>
          ))}
        </div>

        <div 
          className={`photobooth-container ${isDragging ? 'dragging' : ''}`}
          id="booth" 
          style={{aspectRatio: `${WIDTH} / ${SINGLE * numPhotos}`, position: 'relative'}}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {photoStage < numPhotos && (
            <div className="upload-overlay-hint" style={{zIndex: 5}}>
              <IoCloudUploadOutline className="upload-icon" style={{fontSize: '4rem', color: '#2a4a53', opacity: 0.8}} />
              <p style={{fontFamily: 'Castoro, serif', fontSize: '1.5rem', color: '#2a4a53', marginTop: '1rem'}}>Drag & Drop Photos Here</p>
            </div>
          )}
          
          <div ref={bubbleContainerRef} className="bubble-container" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:2}}></div>
          <canvas ref={canvasRef} id="finalCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0}} />
          <canvas ref={overlayRef} id="overlayCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4}} />
          <Bubbles containerRef={bubbleContainerRef} />
        </div>
      </div>

      <div className="camera-controls-v6">
        <div className="control-group">
          <input 
            ref={inputRef} 
            type="file" 
            accept="image/*" 
            multiple 
            style={{display:'none'}} 
            onChange={handleFile} 
          />
          
          <button 
            className={`primary-capture-btn ${photoStage >= numPhotos ? 'disabled' : ''}`}
            onClick={() => {
              if (photoStage < numPhotos) inputRef.current?.click()
              else finalize()
            }}
          >
            {photoStage < numPhotos ? <IoCloudUploadOutline /> : '✨'}
            <span>{photoStage < numPhotos ? 'Pick Files' : 'Finish'}</span>
          </button>
          
          {photoStage > 0 && photoStage < numPhotos && (
             <button 
               className="retake-btn-v6"
               onClick={retakeLastPhoto}
             >
               <IoRefreshOutline />
               <span>Change Last Photo</span>
             </button>
          )}
        </div>
        
        <div className="settings-group">
          <div className={`custom-dropdown-v7 ${photoStage > 0 ? 'disabled' : ''}`} ref={dropdownRef}>
            <div 
              className="dropdown-trigger" 
              onClick={() => { if (photoStage === 0) setIsDropdownOpen(!isDropdownOpen) }}
            >
              <IoLayersOutline className="select-icon" />
              <span>{numPhotos} Photos</span>
              <IoChevronDownOutline className={`select-arrow ${isDropdownOpen ? 'open' : ''}`} />
            </div>
            
            {isDropdownOpen && (
              <div className="dropdown-list">
                {[2, 3, 4, 5].map((val) => (
                  <div 
                    key={val} 
                    className={`dropdown-item ${numPhotos === val ? 'active' : ''}`}
                    onClick={() => {
                      setNumPhotos(val)
                      setIsDropdownOpen(false)
                      playSound('click')
                    }}
                  >
                    <span className="item-text">{val} Photos</span>
                    {numPhotos === val && <span className="item-check">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
