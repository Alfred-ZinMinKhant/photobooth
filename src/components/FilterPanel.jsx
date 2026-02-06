import React, { useState } from 'react'
import '../../StyleSheets/editor-tools.css'

const FILTERS = [
  { id: 'none', name: 'None', apply: (ctx) => {} },
  { 
    id: 'bw', 
    name: 'Black & White',
    apply: (ctx, canvas) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = avg
        data[i + 1] = avg
        data[i + 2] = avg
      }
      ctx.putImageData(imageData, 0, 0)
    }
  },
  {
    id: 'sepia',
    name: 'Sepia',
    apply: (ctx, canvas) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
        data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
        data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
      }
      ctx.putImageData(imageData, 0, 0)
    }
  },
  {
    id: 'vintage',
    name: 'Vintage',
    apply: (ctx, canvas) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 1.2 // Increase red
        data[i + 1] = data[i + 1] * 0.9 // Decrease green slightly
        data[i + 2] = data[i + 2] * 0.7 // Decrease blue
      }
      ctx.putImageData(imageData, 0, 0)
    }
  },
  {
    id: 'underwater',
    name: 'Underwater',
    apply: (ctx, canvas) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * 0.7 // Decrease red
        data[i + 1] = data[i + 1] * 1.1 // Increase green
        data[i + 2] = data[i + 2] * 1.3 // Increase blue
      }
      ctx.putImageData(imageData, 0, 0)
    }
  },
  {
    id: 'brightness',
    name: 'Bright',
    apply: (ctx, canvas) => {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const brightness = 30
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] + brightness)
        data[i + 1] = Math.min(255, data[i + 1] + brightness)
        data[i + 2] = Math.min(255, data[i + 2] + brightness)
      }
      ctx.putImageData(imageData, 0, 0)
    }
  }
]

export default function FilterPanel({ currentFilter, onApplyFilter }) {
  return (
    <div className="filter-panel-v2">
      <div className="filter-grid">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            className={`filter-button ${currentFilter === filter.id ? 'active' : ''}`}
            onClick={() => onApplyFilter(filter)}
          >
            {filter.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export { FILTERS }
