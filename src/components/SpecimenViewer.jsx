import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildSpecimen, disposeObject } from '../three/specimens.js'

/**
 * Interactive 3D specimen viewer.
 * Drag to spin & tilt. Optional scroll/pinch zoom. Auto-rotates when idle.
 */
export default function SpecimenViewer({ model, zoomable = false, className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
    camera.position.set(0, 0.4, 5)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.HemisphereLight('#ffffff', '#cdb9f5', 1.15))
    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(3, 4, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight('#f4c4e8', 0.6)
    rim.position.set(-4, -2, -3)
    scene.add(rim)

    const specimen = buildSpecimen(model)
    scene.add(specimen)

    // ── interaction state ──
    let dragging = false
    let lastX = 0
    let lastY = 0
    let velX = 0.006 // gentle idle spin
    let velY = 0
    let zoom = 1
    let lastPointerTime = 0

    const onPointerDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      host.setPointerCapture?.(e.pointerId)
      host.style.cursor = 'grabbing'
    }
    const onPointerMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      specimen.rotation.y += dx * 0.01
      specimen.rotation.x += dy * 0.008
      specimen.rotation.x = Math.max(-1.2, Math.min(1.2, specimen.rotation.x))
      velX = dx * 0.0004
      velY = dy * 0.0003
      lastPointerTime = performance.now()
    }
    const onPointerUp = (e) => {
      dragging = false
      host.releasePointerCapture?.(e.pointerId)
      host.style.cursor = 'grab'
    }
    const onWheel = (e) => {
      if (!zoomable) return
      e.preventDefault()
      zoom = Math.max(0.55, Math.min(2.2, zoom * (e.deltaY > 0 ? 0.93 : 1.07)))
    }

    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerup', onPointerUp)
    host.addEventListener('pointercancel', onPointerUp)
    host.addEventListener('wheel', onWheel, { passive: false })
    host.style.cursor = 'grab'
    host.style.touchAction = zoomable ? 'none' : 'pan-y'

    const resize = () => {
      const w = host.clientWidth || 1
      const h = host.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let raf
    const tick = () => {
      raf = requestAnimationFrame(tick)
      if (!dragging) {
        // ease back to a gentle idle spin after a fling
        const idle = performance.now() - lastPointerTime > 1600
        velX += ((idle ? 0.006 : 0) - velX) * 0.02
        velY += (0 - velY) * 0.04
        specimen.rotation.y += velX
        specimen.rotation.x = Math.max(-1.2, Math.min(1.2, specimen.rotation.x + velY))
      }
      const target = 5 / zoom
      camera.position.z += (target - camera.position.z) * 0.12
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointercancel', onPointerUp)
      host.removeEventListener('wheel', onWheel)
      disposeObject(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [model, zoomable])

  return <div ref={hostRef} className={`specimen-viewer ${className}`} aria-label="Interactive 3D specimen — drag to rotate" />
}
