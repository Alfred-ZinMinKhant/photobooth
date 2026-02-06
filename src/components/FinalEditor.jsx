import React, { useEffect, useRef, useState } from 'react'
import TextTool from './TextTool'
import FilterPanel, { FILTERS } from './FilterPanel'
import SharingPanel from './SharingPanel'
import { useSound } from './SoundProvider'
import { IoArrowUndo, IoArrowRedo, IoCheckmarkDoneOutline, IoHappyOutline, IoTextOutline, IoColorPaletteOutline, IoImageOutline, IoTrashOutline, IoDownloadOutline, IoHomeOutline, IoRefreshOutline } from 'react-icons/io5'
import '../../StyleSheets/editor-tools.css'
import '../../StyleSheets/sharing-panel.css'

export default function FinalEditor({ navigate }) {
  const canvasRef = useRef(null)
  const [stickers, setStickers] = useState([])
  const [textElements, setTextElements] = useState([])
  const [baseImage, setBaseImage] = useState(null)
  const [originalImage, setOriginalImage] = useState(null)
  const [showSharing, setShowSharing] = useState(false)
  const [frames] = useState([
    { id: 'none', label: 'None', src: '' },
    { id: 'frame-a', label: 'Blue Frame', src: '/Assets/fish-photobooth/finalpage/frames/frame-a.png', contentRect: { x: 0.06, y: 0.08, width: 0.88, height: 0.84 } },
    { id: 'frame-b', label: 'Polaroid', src: '/Assets/fish-photobooth/finalpage/frames/frame-b.png', contentRect: { x: 0.08, y: 0.12, width: 0.84, height: 0.74 } }
  ])
  const [selectedFrameId, setSelectedFrameId] = useState('none')
  const [selectedFrameImage, setSelectedFrameImage] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [selectedElement, setSelectedElement] = useState(null)
  const [currentFilter, setCurrentFilter] = useState('none')
  const [showTextTool, setShowTextTool] = useState(false)
  const [activeTab, setActiveTab] = useState('stickers')
  const { playSound } = useSound()
  
  // Undo/Redo state
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Save state to history
  const saveToHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      playSound('click')
      const prevState = history[historyIndex - 1]
      applyHistoryState(prevState)
      setHistoryIndex(historyIndex - 1)
    }
  }

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      playSound('click')
      const nextState = history[historyIndex + 1]
      applyHistoryState(nextState)
      setHistoryIndex(historyIndex + 1)
    }
  }

  const applyHistoryState = (state) => {
    setStickers(state.stickers || [])
    setTextElements(state.textElements || [])
    setCurrentFilter(state.filter || 'none')
    setSelectedFrameId(state.frameId || 'none')
  }

  const getCurrentState = () => ({
    stickers: [...stickers],
    textElements: [...textElements],
    filter: currentFilter,
    frameId: selectedFrameId
  })

  useEffect(() => {
    const dataURL = localStorage.getItem('photoStrip')
    if (dataURL) {
      const img = new Image()
      img.src = dataURL
      img.onload = () => {
        setOriginalImage(img)
        setBaseImage(img)
        // Save initial state
        saveToHistory(getCurrentState())
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (baseImage) {
        const frameMeta = frames.find(ff => ff.id === selectedFrameId)
        if (frameMeta && frameMeta.contentRect) {
          const r = frameMeta.contentRect
          const rectPx = { 
            x: Math.round(r.x * canvas.width), 
            y: Math.round(r.y * canvas.height), 
            width: Math.round(r.width * canvas.width), 
            height: Math.round(r.height * canvas.height) 
          }
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
      
      // Draw stickers
      stickers.forEach(s => ctx.drawImage(s.img, s.x, s.y, s.width, s.height))
      
      // Draw text elements
      textElements.forEach(t => {
        ctx.font = `${t.size}px ${t.font}`
        ctx.fillStyle = t.color
        ctx.fillText(t.text, t.x, t.y)
      })
      
      // Draw selected frame on top
      if (selectedFrameImage) ctx.drawImage(selectedFrameImage, 0, 0, canvas.width, canvas.height)
    }
    
    draw()
  }, [baseImage, stickers, textElements, selectedFrameImage])

  const addSticker = src => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      const newSticker = { 
        img, 
        x: canvasRef.current.width / 2 - img.width / 6, 
        y: canvasRef.current.height / 2 - img.height / 6, 
        width: img.width / 2.5, 
        height: img.height / 2.5 
      }
      setStickers(prev => [...prev, newSticker])
      saveToHistory({ ...getCurrentState(), stickers: [...stickers, newSticker] })
      playSound('bubble')
    }
  }

  const addText = (textData) => {
    const newText = {
      text: textData.text,
      font: textData.font,
      color: textData.color,
      size: textData.size,
      x: canvasRef.current.width / 2,
      y: canvasRef.current.height / 2
    }
    setTextElements(prev => [...prev, newText])
    saveToHistory({ ...getCurrentState(), textElements: [...textElements, newText] })
    playSound('bubble')
    setShowTextTool(false)
  }

  const applyFilter = (filter) => {
    if (!originalImage) return
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = originalImage.width
    tempCanvas.height = originalImage.height
    const tempCtx = tempCanvas.getContext('2d')
    
    tempCtx.drawImage(originalImage, 0, 0)
    
    if (filter.id !== 'none') {
      filter.apply(tempCtx, tempCanvas)
    }
    
    const filteredImg = new Image()
    filteredImg.src = tempCanvas.toDataURL()
    filteredImg.onload = () => {
      setBaseImage(filteredImg)
      setCurrentFilter(filter.id)
      saveToHistory({ ...getCurrentState(), filter: filter.id })
      playSound('click')
    }
  }

  useEffect(() => {
    if (!selectedFrameId || selectedFrameId === 'none') { 
      setSelectedFrameImage(null)
      return 
    }
    const f = frames.find(ff => ff.id === selectedFrameId)
    if (!f || !f.src) { 
      setSelectedFrameImage(null)
      return 
    }
    const img = new Image()
    img.src = f.src
    img.onload = () => setSelectedFrameImage(img)
    img.onerror = () => setSelectedFrameImage(null)
  }, [selectedFrameId, frames])

  useEffect(() => {
    try { localStorage.setItem('selectedFrameId', selectedFrameId) } catch (e) {}
  }, [selectedFrameId])

  useEffect(() => {
    try { 
      const saved = localStorage.getItem('selectedFrameId')
      if (saved) setSelectedFrameId(saved) 
    } catch (e) {}
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
    
    // Check text elements first
    for (let i = textElements.length - 1; i >= 0; i--) {
      const t = textElements[i]
      const ctx = canvasRef.current.getContext('2d')
      ctx.font = `${t.size}px ${t.font}`
      const metrics = ctx.measureText(t.text)
      const width = metrics.width
      const height = t.size
      
      if (p.x >= t.x && p.x <= t.x + width && p.y >= t.y - height && p.y <= t.y) {
        setDragging({ type: 'text', index: i, offsetX: p.x - t.x, offsetY: p.y - t.y })
        setSelectedElement({ type: 'text', index: i })
        e.preventDefault()
        return
      }
    }
    
    // Check stickers
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i]
      if (p.x >= s.x && p.x <= s.x + s.width && p.y >= s.y && p.y <= s.y + s.height) {
        setDragging({ type: 'sticker', index: i, offsetX: p.x - s.x, offsetY: p.y - s.y })
        setSelectedElement({ type: 'sticker', index: i })
        setStickers(prev => {
          const copy = [...prev]
          const [item] = copy.splice(i, 1)
          copy.push(item)
          return copy
        })
        e.preventDefault()
        return
      }
    }
    
    setSelectedElement(null)
  }

  const onPointerMove = e => {
    if (!dragging) return
    const p = getPointer(e)
    
    if (dragging.type === 'sticker') {
      setStickers(prev => prev.map((s, idx) => 
        idx === prev.length - 1 
          ? { ...s, x: p.x - dragging.offsetX, y: p.y - dragging.offsetY } 
          : s
      ))
    } else if (dragging.type === 'text') {
      setTextElements(prev => prev.map((t, idx) => 
        idx === dragging.index 
          ? { ...t, x: p.x - dragging.offsetX, y: p.y - dragging.offsetY } 
          : t
      ))
    }
    
    e.preventDefault()
  }

  const onPointerUp = () => {
    if (dragging) {
      saveToHistory(getCurrentState())
    }
    setDragging(null)
  }

  const deleteSelected = () => {
    if (!selectedElement) return
    playSound('click')
    if (selectedElement.type === 'sticker') {
      setStickers(prev => prev.filter((_, i) => i !== selectedElement.index))
    } else if (selectedElement.type === 'text') {
      setTextElements(prev => prev.filter((_, i) => i !== selectedElement.index))
    }
    
    saveToHistory(getCurrentState())
    setSelectedElement(null)
  }

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(blob => { 
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'fish-photobooth.png'
      a.click() 
    }, 'image/png')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo()
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !showTextTool) {
          e.preventDefault()
          deleteSelected()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history, selectedElement, showTextTool])

  return (
    <div>
      
      <div className="heading-content">
        {/* Undo/Redo controls */}
        <div className="undo-redo-controls">
          <button 
            className="undo-redo-btn" 
            onClick={undo} 
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <IoArrowUndo /> Undo
          </button>
          <button 
            className="undo-redo-btn" 
            onClick={redo} 
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
          >
            <IoArrowRedo /> Redo
          </button>
          <button 
            className="undo-redo-btn delete-btn" 
            onClick={deleteSelected}
            style={{ marginLeft: 'auto' }}
          >
            <IoTrashOutline /> Delete
          </button>
        </div>

        {/* Tab navigation */}
        <div className="editor-tabs">
          <button 
            className={`editor-tab ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => setActiveTab('stickers')}
          >
            <IoHappyOutline />
            <span>Stickers</span>
          </button>
          <button 
            className={`editor-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            <IoTextOutline />
            <span>Text</span>
          </button>
          <button 
            className={`editor-tab ${activeTab === 'filters' ? 'active' : ''}`}
            onClick={() => setActiveTab('filters')}
          >
            <IoColorPaletteOutline />
            <span>Filters</span>
          </button>
          <button 
            className={`editor-tab ${activeTab === 'frames' ? 'active' : ''}`}
            onClick={() => setActiveTab('frames')}
          >
            <IoImageOutline />
            <span>Frames</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'stickers' && (
          <div className="tool-panel-v2">
            <h3 className="panel-title-v2">Add Stickers</h3>
            <div className="sticker-grid-v2">
              <button className="sticker-item-btn" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/fish.png')}>
                <img src="/Assets/fish-photobooth/camerapage/stickers/fish.png" alt="Fish" />
              </button>
              <button className="sticker-item-btn" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/octopus.png')}>
                <img src="/Assets/fish-photobooth/camerapage/stickers/octopus.png" alt="Octopus" />
              </button>
              <button className="sticker-item-btn" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/seaweed1.png')}>
                <img src="/Assets/fish-photobooth/camerapage/stickers/seaweed1.png" alt="Seaweed" />
              </button>
              <button className="sticker-item-btn" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/axolotl.png')}>
                <img src="/Assets/fish-photobooth/camerapage/stickers/axolotl.png" alt="Axolotl" />
              </button>
              <button className="sticker-item-btn" onClick={() => addSticker('/Assets/fish-photobooth/camerapage/stickers/bubble1.png')}>
                <img src="/Assets/fish-photobooth/camerapage/stickers/bubble1.png" alt="Bubble" />
              </button>
              <button className="sticker-item-btn reset-btn" onClick={() => { setStickers([]); saveToHistory(getCurrentState()); }}>
                <IoRefreshOutline />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="tool-panel-v2">
            <h3 className="panel-title-v2">Add Custom Text</h3>
            {!showTextTool ? (
              <button 
                onClick={() => setShowTextTool(true)}
                style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
              >
                Add Text
              </button>
            ) : (
              <TextTool 
                onAddText={addText}
                onClose={() => setShowTextTool(false)}
              />
            )}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="tool-panel-v2">
            <h3 className="panel-title-v2">Apply Artistic Filters</h3>
            <FilterPanel 
              currentFilter={currentFilter}
              onApplyFilter={applyFilter}
            />
          </div>
        )}

        {activeTab === 'frames' && (
          <div className="tool-panel-v2">
            <h3 className="panel-title-v2">Choose Frame</h3>
            <div className="frame-picker">
              {frames.map(f => (
                <button 
                  key={f.id} 
                  className={"frame-thumb " + (selectedFrameId===f.id ? 'selected' : '')} 
                  type="button" 
                  onClick={() => { setSelectedFrameId(f.id); saveToHistory({ ...getCurrentState(), frameId: f.id }); }} 
                  title={f.label}
                >
                  {f.src ? <img src={f.src} alt={f.label} /> : <div className="frame-none">None</div>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div id="canvasContainer">
        <canvas 
          ref={canvasRef} 
          id="finalCanvas" 
          width={1176} 
          height={1470}
          onMouseDown={onPointerDown} 
          onMouseMove={onPointerMove} 
          onMouseUp={onPointerUp}
          onTouchStart={onPointerDown} 
          onTouchMove={onPointerMove} 
          onTouchEnd={onPointerUp}
        />
      </div>

      <div className="editor-actions">
        <button className="action-btn download-btn" onClick={() => { download(); playSound('click'); }}>
          <IoDownloadOutline />
          <span>Download</span>
        </button>
        <button className="action-btn finish-btn primary" onClick={() => { setShowSharing(true); playSound('success'); }}>
          <IoCheckmarkDoneOutline />
          <span>Finish & Share</span>
        </button>
        <button className="action-btn home-btn" onClick={() => { if (typeof navigate === 'function') navigate('/'); else window.location.href = '/' }}>
          <IoHomeOutline />
          <span>Home</span>
        </button>
      </div>

      {showSharing && (
        <SharingPanel 
          canvasRef={canvasRef} 
          onBack={() => setShowSharing(false)} 
        />
      )}
    </div>
  )
}
