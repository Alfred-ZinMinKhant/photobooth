import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { IoShareSocialOutline, IoDownloadOutline, IoCopyOutline, IoLogoInstagram, IoLogoFacebook, IoMailOutline } from 'react-icons/io5'
import '../../StyleSheets/sharing-panel.css'

export default function SharingPanel({ canvasRef, onBack }) {
  const [showQR, setShowQR] = useState(false)
  const [copyStatus, setCopyStatus] = useState('Copy URL')

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'my-fish-photobooth.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const copyToClipboard = async () => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      
      canvas.toBlob(async (blob) => {
        try {
          // Clipboard API for images
          const data = [new ClipboardItem({ 'image/png': blob })]
          await navigator.clipboard.write(data)
          setCopyStatus('Copied! ✅')
          setTimeout(() => setCopyStatus('Copy URL'), 2000)
        } catch (err) {
          // Fallback to URL copy
          await navigator.clipboard.writeText(window.location.href)
          setCopyStatus('URL Copied! 🔗')
          setTimeout(() => setCopyStatus('Copy URL'), 2000)
        }
      })
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareToTag = (platform) => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent("Check out my underwater photostrip! 🐠✨")
    
    let shareUrl = ''
    switch(platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'email':
        shareUrl = `mailto:?subject=My Photostrip&body=${text}%20${url}`
        break
      case 'instagram':
        alert("Instagram doesn't support direct web sharing. Please download and post your photo! 📸")
        return
      default:
        return
    }
    
    if (shareUrl) window.open(shareUrl, '_blank')
  }

  return (
    <div className="sharing-panel-overlay">
      <div className="sharing-panel-content">
        <h2 className="sharing-title">Share Your Memories! 🐠</h2>
        
        <div className="sharing-grid">
          <button className="sharing-main-btn download" onClick={downloadImage}>
            <IoDownloadOutline />
            <span>Download</span>
          </button>
          
          <button className="sharing-main-btn copy" onClick={copyToClipboard}>
            <IoCopyOutline />
            <span>{copyStatus}</span>
          </button>
          
          <button className="sharing-main-btn qr" onClick={() => setShowQR(!showQR)}>
            <IoShareSocialOutline />
            <span>{showQR ? 'Hide QR' : 'Quick QR'}</span>
          </button>
        </div>

        {showQR && (
          <div className="qr-container pulse-in">
            <p>Scan to view on your phone!</p>
            <QRCodeSVG value={window.location.href} size={150} />
          </div>
        )}

        <div className="social-links-container">
          <p>Share to Socials:</p>
          <div className="social-links">
            <button onClick={() => shareToTag('instagram')} title="Instagram"><IoLogoInstagram /></button>
            <button onClick={() => shareToTag('facebook')} title="Facebook"><IoLogoFacebook /></button>
            <button onClick={() => shareToTag('email')} title="Email"><IoMailOutline /></button>
          </div>
        </div>

        <button className="sharing-close-btn" onClick={onBack}>
          Keep Editing
        </button>
      </div>
    </div>
  )
}
