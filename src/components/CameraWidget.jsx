import React, { useEffect, useRef, useState } from 'react'
import Bubbles from './Bubbles'
import LoadingSpinner from './LoadingSpinner'
import ConfirmDialog from './ConfirmDialog'
import { useSound } from './SoundProvider'
import { IoCameraOutline, IoRefreshOutline, IoChevronDownOutline, IoLayersOutline } from 'react-icons/io5'
import '../../StyleSheets/camera-enhanced.css'

const WIDTH = 1176
const SINGLE = 735

export default function CameraWidget({ navigate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const countdownRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const overlayRef = useRef(null)
  const flashRef = useRef(null)
  const [photoStage, setPhotoStage] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [numPhotos, setNumPhotos] = useState(2)
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState(null)
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false)
  const { playSound } = useSound()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const mainLayoutRef = useRef(null)
  const mediaStreamRef = useRef(null)

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

  // Flash effect
  function triggerFlash() {
    playSound('capture')
    if (flashRef.current) {
      flashRef.current.classList.add('flash-active')
      setTimeout(() => {
        flashRef.current?.classList.remove('flash-active')
      }, 200)
    }
  }

  function finalize() {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (video) video.style.display = 'none'
    if (canvas) localStorage.setItem('photoStrip', canvas.toDataURL('image/png'))
    setTimeout(() => {
      if (typeof navigate === 'function') navigate('/final')
      else window.location.href = '/final'
    }, 50)
  }

  // Retake last photo
  function retakeLastPhoto() {
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
    
    // Reset to previous stage
    setPhotoStage(lastIndex)
    moveVideoToHalf(lastIndex)
    setShowRetakeConfirm(false)
    playSound('bubble')
  }

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    let countdownTimer = null

    const CAMERA_FLAG = '__photobooth_camera_started'
    const startCamera = async () => {
      try {
        setIsLoading(true)
        setCameraError(null)
        
        if (window[CAMERA_FLAG] || mediaStreamRef.current || (video && video.srcObject)) {
          setIsLoading(false)
          return
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 2560 }, height: { ideal: 1440 }, facingMode: 'user' }, 
          audio: false 
        })
        
        window[CAMERA_FLAG] = true
        mediaStreamRef.current = stream
        
        if (video) {
          video.srcObject = stream
          try { 
            await video.play()
            setIsLoading(false)
          } catch (playErr) { 
            console.error('Play error:', playErr)
            setIsLoading(false)
          }
          moveVideoToHalf(0)
        }
      } catch (err) {
        console.error('Camera error:', err)
        setIsLoading(false)
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera access denied. Please allow camera permissions in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found. Please connect a camera and try again.')
        } else {
          setCameraError('Failed to access camera: ' + err.message)
        }
      }
    }

    startCamera()
    document.body.classList.add('camera-page-active')

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.body.classList.remove('camera-page-active')
      document.removeEventListener('mousedown', handleClickOutside)
      if (countdownTimer) clearInterval(countdownTimer)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      try { window[CAMERA_FLAG] = false } catch (e) { /* ignore */ }
    }
  }, [navigate])

  const handleTake = () => {
    if (photoStage >= numPhotos) return
    
    setCountdown(3)
    const cb = () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const video = videoRef.current
      if (!video || !ctx) return
      
      const yOffset = photoStage * SINGLE
      
      if (photoStage === 0) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      const vW = video.videoWidth, vH = video.videoHeight
      const targetAspect = WIDTH / SINGLE, vAspect = vW / vH
      let sx, sy, sw, sh
      
      if (vAspect > targetAspect) { 
        sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0 
      } else { 
        sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2 
      }
      
      ctx.save()
      ctx.translate(WIDTH, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, SINGLE)
      ctx.restore()
      
      drawFilmBorder(ctx, photoStage)
      
      // Trigger flash effect
      triggerFlash()
      
      try {
        const overlay = overlayRef.current
        if (overlay && canvas) {
          const octx = overlay.getContext && overlay.getContext('2d')
          if (octx) {
            octx.clearRect(0, yOffset, WIDTH, SINGLE)
            octx.drawImage(canvas, 0, yOffset, WIDTH, SINGLE, 0, yOffset, WIDTH, SINGLE)
          }
        }
      } catch (e) { /* ignore */ }
      
      const nextStage = photoStage + 1
      setPhotoStage(nextStage)
      
      if (nextStage < numPhotos) moveVideoToHalf(nextStage)
      if (nextStage >= numPhotos) finalize()
    }
    
    if (countdownRef.current) {
      let c = 3
      countdownRef.current.textContent = c
      countdownRef.current.style.display = 'flex'
      countdownRef.current.classList.add('countdown-large')
      playSound('click')
      
      const id = setInterval(() => {
        c--
        setCountdown(c)
        if (c > 0) {
          countdownRef.current.textContent = c
        } else {
          clearInterval(id)
          countdownRef.current.style.display = 'none'
          countdownRef.current.classList.remove('countdown-large')
          cb()
        }
      }, 1000)
    } else cb()
  }

  function moveVideoToHalf(i) {
    const video = videoRef.current
    if (!video) return
    video.style.display = 'block'
    const topPercent = (i / numPhotos) * 100
    const heightPercent = 100 / numPhotos
    video.style.top = `${topPercent}%`
    video.style.left = '0'
    video.style.width = '100%'
    video.style.height = `${heightPercent}%`
  }

  React.useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext && overlay.getContext('2d')
    if (!ctx) return
    if (photoStage !== 0) return
    
    overlay.width = WIDTH
    overlay.height = SINGLE * numPhotos
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    
    for (let i = 0; i < numPhotos; i++) {
      drawFilmBorder(ctx, i)
    }
    
    if (canvas) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      const mainCtx = canvas.getContext && canvas.getContext('2d')
      if (mainCtx) {
        mainCtx.fillStyle = '#fff'
        mainCtx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    
    moveVideoToHalf(0)
  }, [numPhotos, photoStage])

  // Auto-scroll logic
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

  if (cameraError) {
    return (
      <div>
        <Logo />
        <div className="camera-error">
          <div className="error-icon">📷</div>
          <h2>Camera Error</h2>
          <p>{cameraError}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="camera-page-wrapper-v6">
      
      {isLoading && <LoadingSpinner message="Starting camera..." overlay />}
      
      <div className="camera-main-layout" ref={mainLayoutRef}>
        <div className="photo-slots-indicator-v7">
          {Array.from({ length: numPhotos }, (_, i) => (
            <div key={i} className={`slot-indicator ${i < photoStage ? 'captured' : ''} ${i === photoStage ? 'current' : ''}`}>
              {i < photoStage ? '✓' : i + 1}
            </div>
          ))}
        </div>

        <div className="photobooth-container" id="booth" style={{ aspectRatio: `${WIDTH} / ${SINGLE * numPhotos}`, position: 'relative' }}>
          <div ref={flashRef} className="camera-flash" />
          <div ref={bubbleContainerRef} className="bubble-container" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:2}}></div>
          <div ref={countdownRef} className="countdown-timer" style={{display:'none'}}>3</div>
          <canvas ref={canvasRef} id="finalCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0}} />
          <video ref={videoRef} id="liveVideo" autoPlay playsInline muted style={{display:'none', position:'absolute', zIndex:6, objectFit:'cover'}} />
          <canvas ref={overlayRef} id="overlayCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4}} />
          <Bubbles containerRef={bubbleContainerRef} />
        </div>
      </div>

      <div className="camera-controls-v6">
        <div className="control-group">
          <button 
            id="takePhoto" 
            onClick={handleTake} 
            disabled={photoStage >= numPhotos}
            className={`primary-capture-btn ${photoStage >= numPhotos ? 'disabled' : ''}`}
          >
            <IoCameraOutline />
            <span>{countdown > 0 ? countdown : 'Capture'}</span>
          </button>
          
          {photoStage > 0 && photoStage < numPhotos && (
            <button 
              className="retake-btn-v6"
              onClick={() => { setShowRetakeConfirm(true); playSound('click'); }}
            >
              <IoRefreshOutline />
              <span>Retake Last</span>
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
      
      <ConfirmDialog
        isOpen={showRetakeConfirm}
        title="Retake Last Photo?"
        message="This will delete the last photo you took. Are you sure?"
        confirmText="Retake"
        cancelText="Cancel"
        type="warning"
        onConfirm={retakeLastPhoto}
        onCancel={() => setShowRetakeConfirm(false)}
      />
    </div>
  )
}
