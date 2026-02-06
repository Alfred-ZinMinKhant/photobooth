import React from 'react'
import '../../StyleSheets/loading-confirm.css'

export default function LoadingSpinner({ message = 'Loading...', size = 'medium', overlay = false }) {
  const spinnerContent = (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner-fish">
        <div className="fish-body">🐠</div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  )

  if (overlay) {
    return (
      <div className="loading-overlay">
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}
