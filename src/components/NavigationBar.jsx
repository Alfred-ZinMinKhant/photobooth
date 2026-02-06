import { useNavigate, useLocation } from 'react-router-dom'
import { IoArrowBack, IoVolumeMedium, IoVolumeMute } from 'react-icons/io5'
import { useSound } from './SoundProvider'
import '../../StyleSheets/navigation.css'

export default function NavigationBar({ showBack = true, showProgress = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMuted, toggleMute } = useSound()

  const getStepInfo = () => {
    const path = location.pathname
    if (path === '/' || path === '/index' || path === '/index.html') {
      return { step: 1, label: 'Home', total: 4 }
    } else if (path === '/menu') {
      return { step: 2, label: 'Menu', total: 4 }
    } else if (path === '/camera' || path === '/upload') {
      return { step: 3, label: 'Capture', total: 4 }
    } else if (path === '/final') {
      return { step: 4, label: 'Edit', total: 4 }
    }
    return { step: 1, label: 'Home', total: 4 }
  }

  const handleBack = () => {
    navigate(-1)
  }

  const stepInfo = getStepInfo()
  const showBackButton = showBack && stepInfo.step > 1

  return (
    <div className="navigation-bar">
      <div className="nav-left">
        {showBackButton ? (
          <button className="back-button" onClick={handleBack} aria-label="Go back">
            <IoArrowBack />
            <span>Back</span>
          </button>
        ) : (
          <div className="nav-logo-container">
            <div className="logo-small" onClick={() => navigate('/')} style={{cursor:'pointer'}}>
              <img src="/Assets/fish-photobooth/logo-new.png" alt="Logo" style={{height: '35px', width: 'auto'}} />
            </div>
          </div>
        )}
      </div>
      
      {showProgress && (
        <div className="progress-indicator">
          <div className="progress-steps">
            {Array.from({ length: stepInfo.total }, (_, i) => (
              <div
                key={i}
                className={`progress-step ${i + 1 <= stepInfo.step ? 'active' : ''} ${i + 1 === stepInfo.step ? 'current' : ''}`}
              >
                <div className="step-circle">{i + 1}</div>
                {i < stepInfo.total - 1 && <div className="step-line" />}
              </div>
            ))}
          </div>
          <div className="progress-label">{stepInfo.label}</div>
        </div>
      )}

      <div className="nav-right">
        <button className="mute-toggle" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          <span className="mute-icon">{isMuted ? '🔇' : '🔊'}</span>
        </button>
      </div>
    </div>
  )
}
