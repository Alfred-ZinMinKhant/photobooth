import React, { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import Bubbles from './Bubbles'

const WIDTH = 1176
const SINGLE = 735

export default function CameraWidget({ navigate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const countdownRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const overlayRef = useRef(null)
  const [photoStage, setPhotoStage] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [numPhotos, setNumPhotos] = useState(2)
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

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')

    let countdownTimer = null

    const CAMERA_FLAG = '__photobooth_camera_started'
    const startCamera = async () => {
      try {
        if (window[CAMERA_FLAG] || mediaStreamRef.current || (video && video.srcObject)) return
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 2560 }, height: { ideal: 1440 }, facingMode: 'user' }, audio: false })
        // mark global so StrictMode duplicate mounts don't reinitialize
        window[CAMERA_FLAG] = true
        mediaStreamRef.current = stream
        if (video) {
          video.srcObject = stream
          try { await video.play() } catch (playErr) { /* ignore play aborts */ }
          moveVideoToHalf(0)
        }
      } catch (err) {
        alert('Camera access failed: ' + err)
      }
    }

    const startCountdown = cb => {
      setCountdown(3)
      if (!countdownRef.current) return cb()
      let c = 3
      countdownRef.current.style.display = 'flex'
      countdownTimer = setInterval(() => {
        c--
        setCountdown(c)
        if (c > 0) countdownRef.current.textContent = c
        else {
          clearInterval(countdownTimer)
          countdownRef.current.style.display = 'none'
          cb()
        }
      }, 1000)
    }

    const capture = () => {
      if (!video || !ctx) return
      const yOffset = photoStage === 0 ? 0 : (photoStage * SINGLE)
      const vW = video.videoWidth, vH = video.videoHeight
      const targetAspect = WIDTH / SINGLE, vAspect = vW / vH
      let sx, sy, sw, sh
      if (vAspect > targetAspect) { sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0 }
      else { sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2 }
      ctx.save(); ctx.translate(WIDTH, 0); ctx.scale(-1, 1); ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, SINGLE); ctx.restore()
      // draw film border for this slot (use current photoStage index)
      drawFilmBorder(ctx, photoStage)
      // update overlay: replace preview border with captured image for this slot
      try {
        const overlay = overlayRef.current
        const canvas = canvasRef.current
        if (overlay && canvas) {
          const octx = overlay.getContext && overlay.getContext('2d')
          if (octx) {
            octx.clearRect(0, yOffset, WIDTH, SINGLE)
            octx.drawImage(canvas, 0, yOffset, WIDTH, SINGLE, 0, yOffset, WIDTH, SINGLE)
          }
        }
      } catch (e) { /* ignore overlay copy errors */ }
      setPhotoStage(s => s + 1)
    }

    // finalize handled by outer-scope `finalize()` so handlers can call it

    startCamera()

    return () => {
      if (countdownTimer) clearInterval(countdownTimer)
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop())
        mediaStreamRef.current = null
      }
      // clear global flag so future mounts can start camera
      try { window[CAMERA_FLAG] = false } catch (e) { /* ignore */ }
    }
  }, [navigate])

  const handleTake = () => {
    if (photoStage >= numPhotos) return
    setCountdown(3)
    const cb = () => {
      // capture and maybe finalize
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const video = videoRef.current
      if (!video || !ctx) return
      const yOffset = photoStage * SINGLE
      // if first capture, clear the canvas background to white
      if (photoStage === 0) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      const vW = video.videoWidth, vH = video.videoHeight
      const targetAspect = WIDTH / SINGLE, vAspect = vW / vH
      let sx, sy, sw, sh
      if (vAspect > targetAspect) { sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0 }
      else { sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2 }
      ctx.save(); ctx.translate(WIDTH, 0); ctx.scale(-1, 1); ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, SINGLE); ctx.restore()
      // draw film border for this slot
      drawFilmBorder(ctx, photoStage)
      // update overlay to show the captured image in place of the preview border
      try {
        const overlay = overlayRef.current
        const canvas = canvasRef.current
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
    // show countdown in DOM
    if (countdownRef.current) {
      let c = 3
      countdownRef.current.textContent = c
      countdownRef.current.style.display = 'flex'
      const id = setInterval(() => {
        c--
        if (c > 0) countdownRef.current.textContent = c
        else { clearInterval(id); countdownRef.current.style.display = 'none'; cb() }
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

  // redraw preview borders whenever numPhotos changes, but only if nothing captured yet
  React.useEffect(() => {
    const canvas = canvasRef.current
    // draw borders into the overlay canvas so the live video remains visible and full
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext && overlay.getContext('2d')
    if (!ctx) return
    if (photoStage !== 0) return
    // ensure overlay resolution matches desired size
    overlay.width = WIDTH
    overlay.height = SINGLE * numPhotos
    // clear overlay
    ctx.clearRect(0, 0, overlay.width, overlay.height)
    // draw borders for preview
    for (let i = 0; i < numPhotos; i++) {
      drawFilmBorder(ctx, i)
    }
    // prepare main canvas background white
    if (canvas) {
      canvas.width = WIDTH
      canvas.height = SINGLE * numPhotos
      const mainCtx = canvas.getContext && canvas.getContext('2d')
      if (mainCtx) {
        mainCtx.fillStyle = '#fff'
        mainCtx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
    // reset video viewport to top slot
    moveVideoToHalf(0)
  }, [numPhotos, photoStage])

  return (
    <div>
      <Logo />
      <div className="photobooth-container" id="booth" style={{ aspectRatio: `${WIDTH} / ${SINGLE * numPhotos}` }}>
        <div ref={bubbleContainerRef} className="bubble-container" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:2}}></div>
        <div ref={countdownRef} className="countdown-timer" style={{display:'none'}}>3</div>
        <canvas ref={canvasRef} id="finalCanvas" width={WIDTH} height={SINGLE * numPhotos} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:0}} />
        <video ref={videoRef} id="liveVideo" autoPlay playsInline muted style={{display:'none', position:'absolute', top:0, left:0, width:'100%', height:'100%', zIndex:6, objectFit:'cover'}} />
        <canvas ref={overlayRef} id="overlayCanvas" style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4}} />
        <Bubbles containerRef={bubbleContainerRef} />
      </div>

      <div className="controls">
        <button id="takePhoto" onClick={handleTake} disabled={photoStage >= numPhotos}>Capture</button>
        <div style={{display:'inline-flex', alignItems:'center', gap:8, marginLeft:12}}>
          <label htmlFor="numPhotosSelect" style={{fontSize:'0.9rem'}}>Photos:</label>
          <select
            id="numPhotosSelect"
            value={numPhotos}
            onChange={(e) => { if (photoStage === 0) setNumPhotos(Number(e.target.value)) }}
            disabled={photoStage > 0}
            style={{padding: '6px 8px', fontSize: '1rem', borderRadius: 6}}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
      </div>
    </div>
  )
}
