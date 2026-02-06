import React from 'react'
import { IoClose, IoArrowUp, IoArrowDown } from 'react-icons/io5'
import '../../StyleSheets/editor-tools.css'

export default function StickerControls({ 
  sticker, 
  onDelete, 
  onBringToFront, 
  onSendToBack,
  canvasRect 
}) {
  if (!sticker || !sticker.selected) return null

  // Calculate position relative to canvas
  const controlsStyle = {
    position: 'absolute',
    left: `${sticker.x + sticker.width}px`,
    top: `${sticker.y}px`,
    transform: 'translate(8px, -8px)',
    zIndex: 10000
  }

  return (
    <div className="sticker-controls" style={controlsStyle}>
      <button
        className="sticker-control-btn delete"
        onClick={onDelete}
        title="Delete"
      >
        <IoClose />
      </button>
      <button
        className="sticker-control-btn layer"
        onClick={onBringToFront}
        title="Bring to Front"
      >
        <IoArrowUp />
      </button>
      <button
        className="sticker-control-btn layer"
        onClick={onSendToBack}
        title="Send to Back"
      >
        <IoArrowDown />
      </button>
    </div>
  )
}

// Resize handle component
export function ResizeHandle({ position, onMouseDown, onTouchStart }) {
  const handleStyle = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    background: '#fff',
    border: '2px solid #2a4a53',
    borderRadius: '50%',
    cursor: position.includes('nw') || position.includes('se') ? 'nwse-resize' :
            position.includes('ne') || position.includes('sw') ? 'nesw-resize' : 'move',
    zIndex: 10001,
    ...getPositionStyle(position)
  }

  return (
    <div
      className="resize-handle"
      style={handleStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    />
  )
}

function getPositionStyle(position) {
  switch (position) {
    case 'nw':
      return { top: '-10px', left: '-10px' }
    case 'ne':
      return { top: '-10px', right: '-10px' }
    case 'sw':
      return { bottom: '-10px', left: '-10px' }
    case 'se':
      return { bottom: '-10px', right: '-10px' }
    default:
      return {}
  }
}
