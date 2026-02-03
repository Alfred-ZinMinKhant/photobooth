import React, { useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import Bubbles from './Bubbles'

const WIDTH = 1176, HEIGHT = 1470, HALF = HEIGHT / 2

export default function CameraWidget({ navigate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const countdownRef = useRef(null)
  const bubbleContainerRef = useRef(null)
  const [photoStage, setPhotoStage] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const mediaStreamRef = useRef(null)

  function finalize() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const video = videoRef.current
    if (video) video.style.display = 'none'
    const frame = new Image(); frame.src = '/Assets/fish-photobooth/camerapage/frame.png'
    frame.onload = () => {
      if (ctx) ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT)
      if (canvas) localStorage.setItem('photoStrip', canvas.toDataURL('image/png'))
      setTimeout(() => {
        if (typeof navigate === 'function') navigate('/final')
        else window.location.href = '/final'
      }, 50)
    }
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
      const yOffset = photoStage === 0 ? 0 : HALF
      const vW = video.videoWidth, vH = video.videoHeight
      const targetAspect = WIDTH / HALF, vAspect = vW / vH
      let sx, sy, sw, sh
      if (vAspect > targetAspect) { sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0 }
      else { sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2 }
      ctx.save(); ctx.translate(WIDTH, 0); ctx.scale(-1, 1); ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF); ctx.restore()
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
    if (photoStage > 1) return
    setCountdown(3)
    const cb = () => {
      // capture and maybe finalize
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const video = videoRef.current
      if (!video || !ctx) return
      const yOffset = photoStage === 0 ? 0 : HALF
      const vW = video.videoWidth, vH = video.videoHeight
      const targetAspect = WIDTH / HALF, vAspect = vW / vH
      let sx, sy, sw, sh
      if (vAspect > targetAspect) { sh = vH; sw = vH * targetAspect; sx = (vW - sw) / 2; sy = 0 }
      else { sw = vW; sh = vW / targetAspect; sx = 0; sy = (vH - sh) / 2 }
      ctx.save(); ctx.translate(WIDTH, 0); ctx.scale(-1, 1); ctx.drawImage(video, sx, sy, sw, sh, 0, yOffset, WIDTH, HALF); ctx.restore()
      const nextStage = photoStage + 1
      setPhotoStage(nextStage)
      if (nextStage === 1) moveVideoToHalf(1)
      if (nextStage === 2) finalize()
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
    video.style.top = i === 0 ? '0' : '50%'
    video.style.left = '0'
    video.style.width = '100%'
    video.style.height = '50%'
  }

  return (
    <div>
      <Logo />
      <div className="photobooth-container" id="booth">
        <div ref={bubbleContainerRef} className="bubble-container"></div>
        <div ref={countdownRef} className="countdown-timer" style={{display:'none'}}>3</div>
        <canvas ref={canvasRef} id="finalCanvas" width={WIDTH} height={HEIGHT} />
        <video ref={videoRef} id="liveVideo" autoPlay playsInline muted style={{display:'none'}} />
        <img className="frame-overlay" src="/Assets/fish-photobooth/camerapage/frame.png" alt="frame" />
        <Bubbles containerRef={bubbleContainerRef} />
      </div>

      <div className="controls">
        <button id="takePhoto" onClick={handleTake} disabled={photoStage > 1}>Capture</button>
      </div>
    </div>
  )
}
