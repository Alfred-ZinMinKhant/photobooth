import React, { useEffect, useRef, useState } from 'react'
import Logo from './Logo'

export default function FinalEditor({ navigate }) {
  const canvasRef = useRef(null)
  const [stickers, setStickers] = useState([])
  const [baseImage, setBaseImage] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const dataURL = localStorage.getItem('photoStrip')
    if (dataURL) {
      const img = new Image()
      img.src = dataURL
      img.onload = () => setBaseImage(img)
    } else {
      // don't alert in module — just keep empty
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (baseImage) ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)
      stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.width, s.height))
    }
    draw()
  }, [baseImage, stickers])

  const addSticker = src => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setStickers(prev => [...prev, { img, x: canvasRef.current.width / 2 - img.width / 6, y: canvasRef.current.height / 2 - img.height / 6, width: img.width / 2.5, height: img.height / 2.5 }])
    }
  }

  const getPointer = e => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches?.[0]?.clientX ?? e.clientX
    const clientY = e.touches?.[0]?.clientY ?? e.clientY
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const onPointerDown = e => {
    const p = getPointer(e)
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]
      if (p.x >= s.x && p.x <= s.x + s.width && p.y >= s.y && p.y <= s.y + s.height) {
        setDragging({ index: i, offsetX: p.x - s.x, offsetY: p.y - s.y })
        // bring to front
        setStickers(prev => { const copy = [...prev]; const [item] = copy.splice(i, 1); copy.push(item); return copy })
        e.preventDefault();
        break
      }
    }
  }

  const onPointerMove = e => {
    if (!dragging) return
    const p = getPointer(e)
    setStickers(prev => prev.map((s, idx) => idx === prev.length - 1 ? { ...s, x: p.x - dragging.offsetX, y: p.y - dragging.offsetY } : s))
    e.preventDefault()
  }

  const onPointerUp = () => setDragging(null)

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'fish-photobooth.png'; a.click() }, 'image/png')
  }

  return (
    <div>
      <Logo />
      <div className="heading-content">
        <div className="sticker-container">
          <h1>Add Stickers!</h1>
          <p>(drag to reposition)</p>
          <div className="sticker-btns">
            <button className="sticker-btn fish-btn" aria-label="Add Fish" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/fish.png')}>Add Fish</button>
            <button className="sticker-btn octopus-btn" aria-label="Add Octopus" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/octopus.png')}>Add Octopus</button>
            <button className="sticker-btn seaweed-btn" aria-label="Add Seaweed" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/seaweed1.png')}>Add Seaweed</button>
            <button className="sticker-btn axolotl-btn" aria-label="Add Axolotl" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/axolotl.png')}>Add Axolotl</button>
            <button className="sticker-btn bubble-btn" aria-label="Add Bubble" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/bubble1.png')}>Add Bubble</button>
            <button className="sticker-btn reset-btn" aria-label="Reset" onClick={() => setStickers([])}>Reset</button>
          </div>
        </div>
      </div>

      <div id="canvasContainer">
        <canvas ref={canvasRef} id="finalCanvas" width={1176} height={1470}
          onMouseDown={onPointerDown} onMouseMove={onPointerMove} onMouseUp={onPointerUp}
          onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
        />
      </div>

      <div className="button-container">
        <button onClick={download}>Download</button>
        <button onClick={() => { if (typeof navigate === 'function') navigate('/'); else window.location.href = '/' }}>Home</button>
      </div>
    </div>
  )
}
