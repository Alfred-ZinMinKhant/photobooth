import React, { useEffect, useRef } from 'react'

export default function HomeAnimations({ navigate }){
  const containerRef = useRef(null)

  useEffect(()=>{
    const root = containerRef.current
    if (!root) return
    const bubbleEl = root.querySelector('.bubbles-mock')
    const photoboothEl = root.querySelector('.photobooth-mock')
    // prefer elements inside the component, fall back to document-level selectors
    const selectButton = root.querySelector('#select-button') || document.querySelector('#select-button')
    const cameraBtn = root.querySelector('#menu-camera-button') || document.querySelector('#menu-camera-button')
    const uploadBtn = root.querySelector('#menu-upload-button') || document.querySelector('#menu-upload-button')
    const logoEl = root.querySelector('.logo') || document.querySelector('.logo')

    let bubbleAnimating = false
    let currentBubbleFrame = 0
    let bubbleAnimationFrameId = null
    const BUBBLE_FRAMES = [
      '/Assets/fish-photobooth/homepage/animated-bubbles-home/bubble-1.png',
      '/Assets/fish-photobooth/homepage/animated-bubbles-home/bubble-2.png',
      '/Assets/fish-photobooth/homepage/animated-bubbles-home/bubble-3.png'
    ]

    function animateBubbles(){
      if (!bubbleAnimating || !bubbleEl) return
      bubbleEl.style.backgroundImage = `url('${BUBBLE_FRAMES[currentBubbleFrame]}')`
      currentBubbleFrame = (currentBubbleFrame + 1) % BUBBLE_FRAMES.length
      bubbleAnimationFrameId = setTimeout(()=> requestAnimationFrame(animateBubbles), 200)
    }
    function startBubbleAnimation(){ if (!bubbleAnimating){ bubbleAnimating = true; animateBubbles() } }
    function stopBubbleAnimation(){ bubbleAnimating = false; clearTimeout(bubbleAnimationFrameId) }

    const fishes = [
      { el: root.querySelector('.fish-mock-1'), rotation:7.52, dir: -1 },
      { el: root.querySelector('.fish-mock-2'), rotation:7.52, dir: 1 },
      { el: root.querySelector('.fish-mock-3'), rotation:7.52, dir: -1 }
    ]
    let fishAnimating = false
    let fishTimeouts = []
    function animateFish(index){ if (!fishAnimating) return; const fish = fishes[index]; if (!fish?.el) return; fish.el.style.transform = `rotate(${fish.rotation * fish.dir}deg)`; fish.dir *= -1; fishTimeouts[index] = setTimeout(()=> requestAnimationFrame(()=> animateFish(index)), 200) }
    function startFishAnimation(){ if (fishAnimating) return; fishAnimating = true; fishes.forEach((_,i)=> animateFish(i)) }
    function stopFishAnimation(){ fishAnimating = false; fishTimeouts.forEach(clearTimeout); fishes.forEach(f=> { if (f.el) f.el.style.transform='rotate(0deg)' }) }

    const photostrip = { el: root.querySelector('.photostrip-mock'), rotation:16.52, current:0 }
    let photostripTimeout = null
    function animatePhotostrip(){ if (!fishAnimating || !photostrip.el) return; photostrip.el.style.transform = `rotate(${photostrip.current}deg)`; photostrip.current = photostrip.current === photostrip.rotation ? 0 : photostrip.rotation; photostripTimeout = setTimeout(()=> requestAnimationFrame(animatePhotostrip), 300) }
    function startPhotostripAnimation(){ if (fishAnimating) animatePhotostrip() }
    function stopPhotostripAnimation(){ clearTimeout(photostripTimeout); if (photostrip.el) photostrip.el.style.transform='rotate(0deg)' }

    function onEnter(){ startBubbleAnimation(); startFishAnimation(); startPhotostripAnimation() }
    function onLeave(){ stopBubbleAnimation(); stopFishAnimation(); stopPhotostripAnimation() }

    if (selectButton){ ['mouseenter','mousedown'].forEach(evt=> selectButton.addEventListener(evt, onEnter)); ['mouseleave','mouseup'].forEach(evt=> selectButton.addEventListener(evt, onLeave)) }

    function addSafeNavigation(button, url){ if (!button) return ()=>{}; const handler = e => { e.preventDefault(); setTimeout(()=> { if (typeof navigate === 'function') navigate('/' + url.replace('.html','').replace(/^\//,'')); else window.location.href = url }, 100) }; button.addEventListener('click', handler); return ()=> button.removeEventListener('click', handler) }

    const removers = []
    removers.push(addSafeNavigation(selectButton, 'menu.html'))
    removers.push(addSafeNavigation(cameraBtn, 'camera.html'))
    removers.push(addSafeNavigation(uploadBtn, 'upload.html'))
    removers.push(addSafeNavigation(logoEl, 'index.html'))

    return ()=>{
      if (selectButton){ ['mouseenter','mousedown'].forEach(evt=> selectButton.removeEventListener(evt, onEnter)); ['mouseleave','mouseup'].forEach(evt=> selectButton.removeEventListener(evt, onLeave)) }
      removers.forEach(r => r && r())
      stopBubbleAnimation(); stopFishAnimation(); stopPhotostripAnimation()
    }
  }, [navigate])

  return (
    <div ref={containerRef} className="home-animations" style={{position:'relative'}}>
      <div className="photobooth-mock" />
      <div className="photostrip-mock" />
      <div className="bubbles-mock" />
      <div className="fish-mock-1" />
      <div className="fish-mock-2" />
      <div className="fish-mock-3" />
    </div>
  )
}
