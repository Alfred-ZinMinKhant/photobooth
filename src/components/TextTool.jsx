import React, { useState } from 'react'
import { IoTextOutline, IoColorPaletteOutline, IoResizeOutline, IoText, IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5'
import '../../StyleSheets/editor-tools.css'

const FONTS = [
  { name: 'Modern', value: 'Outfit, sans-serif' },
  { name: 'Classic', value: 'Castoro, serif' },
  { name: 'Cursive', value: 'Pacifico, cursive' },
  { name: 'Elegant', value: 'Playfair Display, serif' },
  { name: 'Bold', value: 'Montserrat, sans-serif' },
  { name: 'Playful', value: 'Fredoka One, cursive' },
  { name: 'Typewriter', value: 'Courier New, monospace' }
]

const COLORS = [
  '#2a4a53', '#f59e0b', '#ef4444', '#10b981', '#6366f1',
  '#000000', '#FFFFFF', '#FF69B4', '#8B4513', '#708090'
]

export default function TextTool({ onAddText, onClose }) {
  const [text, setText] = useState('')
  const [font, setFont] = useState(FONTS[0].value)
  const [color, setColor] = useState('#2a4a53')
  const [size, setSize] = useState(60)

  const handleAdd = () => {
    if (text.trim()) {
      onAddText({ text, font, color, size })
      setText('')
      if (onClose) onClose()
    }
  }

  return (
    <div className="text-tool-content-v2">
      <div className="text-tool-grid">
        <div className="text-tool-left">
          <div className="text-tool-field">
            <label><IoText /> Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={40}
              autoFocus
            />
          </div>

          <div className="text-tool-field">
            <label><IoTextOutline /> Style</label>
            <div className="font-grid">
              {FONTS.map(f => (
                <button 
                  key={f.value} 
                  className={`font-option ${font === f.value ? 'active' : ''}`}
                  onClick={() => setFont(f.value)}
                  style={{ fontFamily: f.value }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-tool-right">
          <div className="text-tool-field">
            <label><IoColorPaletteOutline /> Color</label>
            <div className="color-picker-v2">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch-v2 ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && <div className="color-check" />}
                </button>
              ))}
              <input 
                type="color" 
                className="custom-color-input" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>

          <div className="text-tool-field">
            <label><IoResizeOutline /> Size: {size}px</label>
            <input
              className="styled-range"
              type="range"
              min="30"
              max="150"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className={`text-tool-preview-area ${text ? 'has-text' : ''}`}>
        <div className="preview-label">Live Preview</div>
        <div className="text-tool-preview-box" style={{ fontFamily: font, color, fontSize: `${size / 2}px` }}>
          {text || 'Your Text Here'}
        </div>
      </div>

      <div className="text-tool-actions">
        <button className="text-action-btn cancel" onClick={onClose}>
          <IoCloseCircleOutline />
          <span>Cancel</span>
        </button>
        <button className="text-action-btn add" onClick={handleAdd} disabled={!text.trim()}>
          <IoCheckmarkCircleOutline />
          <span>Add to Strip</span>
        </button>
      </div>
    </div>
  )
}
