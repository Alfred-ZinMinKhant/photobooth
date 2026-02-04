import React, { useEffect, useRef, useState } from 'react'
import Logo from './Logo'

export default function FinalEditor({ navigate }) {
  const canvasRef = useRef(null)
  const [stickers, setStickers] = useState([])
  const [baseImage, setBaseImage] = useState(null)
  const [frames] = useState([
    { id: 'none', label: 'None', src: '' },
    // contentRect values are relative fractions {x, y, width, height} of the canvas
    { id: 'frame-a', label: 'Blue Frame', src: '/Assets/fish-photobooth/finalpage/frames/frame-a.png', contentRect: { x: 0.06, y: 0.08, width: 0.88, height: 0.84 } },
    { id: 'frame-b', label: 'Polaroid', src: '/Assets/fish-photobooth/finalpage/frames/frame-b.png', contentRect: { x: 0.08, y: 0.12, width: 0.84, height: 0.74 } },
    { id: 'frame-c', label: 'Rounded', src: '/Assets/fish-photobooth/finalpage/frames/frame-c.png', contentRect: { x: 0.04, y: 0.06, width: 0.92, height: 0.88 } }
  ])
  const [selectedFrameId, setSelectedFrameId] = useState('none')
  const [selectedFrameImage, setSelectedFrameImage] = useState(null)
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
      if (baseImage) {
        // fit baseImage into frame contentRect if defined for selected frame
        const frameMeta = frames.find(ff => ff.id === selectedFrameId)
        if (frameMeta && frameMeta.contentRect) {
          const r = frameMeta.contentRect
          const rectPx = { x: Math.round(r.x * canvas.width), y: Math.round(r.y * canvas.height), width: Math.round(r.width * canvas.width), height: Math.round(r.height * canvas.height) }
          const scale = Math.min(rectPx.width / baseImage.width, rectPx.height / baseImage.height)
          const drawW = Math.round(baseImage.width * scale)
          const drawH = Math.round(baseImage.height * scale)
          const drawX = rectPx.x + Math.round((rectPx.width - drawW) / 2)
          const drawY = rectPx.y + Math.round((rectPx.height - drawH) / 2)
          ctx.drawImage(baseImage, drawX, drawY, drawW, drawH)
        } else {
          ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height)
        }
      }
      stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.width, s.height))
      // draw selected frame on top (applies immediately when selected)
      if (selectedFrameImage) ctx.drawImage(selectedFrameImage, 0, 0, canvas.width, canvas.height)
    }
    draw()
  }, [baseImage, stickers, selectedFrameImage])

  const addSticker = src => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      setStickers(prev => [...prev, { img, x: canvasRef.current.width / 2 - img.width / 6, y: canvasRef.current.height / 2 - img.height / 6, width: img.width / 2.5, height: img.height / 2.5 }])
    }
  }

  // load frame image when selection changes
  useEffect(() => {
    if (!selectedFrameId || selectedFrameId === 'none') { setSelectedFrameImage(null); return }
    const f = frames.find(ff => ff.id === selectedFrameId)
    if (!f || !f.src) { setSelectedFrameImage(null); return }
    const img = new Image()
    img.src = f.src
    img.onload = () => setSelectedFrameImage(img)
    img.onerror = () => setSelectedFrameImage(null)
  }, [selectedFrameId, frames])

  // persist selected frame and options
  useEffect(() => {
    try { localStorage.setItem('selectedFrameId', selectedFrameId) } catch (e) {}
  }, [selectedFrameId])

  // restore selected frame from localStorage on mount
  useEffect(() => {
    try { const saved = localStorage.getItem('selectedFrameId'); if (saved) setSelectedFrameId(saved) } catch (e) {}
  }, [])

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
            <div style={{marginTop:12}}>
                <h2 className="frame-heading">Choose Frame</h2>
                <div className="frame-picker">
                  {frames.map(f => (
                    <button key={f.id} className={"frame-thumb " + (selectedFrameId===f.id ? 'selected' : '')} type="button" onClick={() => setSelectedFrameId(f.id)} title={f.label}>
                      {f.src ? <img src={f.src} alt={f.label} /> : <div className="frame-none">None</div>}
                    </button>
                  ))}
                </div>
              
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
