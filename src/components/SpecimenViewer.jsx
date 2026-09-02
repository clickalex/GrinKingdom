import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildSpecimen, disposeObject } from '../three/specimens.js'

/* Soft radial-gradient disc used as a "studio pedestal" under the specimen. */
function pedestalTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.28)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * Interactive 3D specimen viewer.
 * Drag to spin & tilt. Optional scroll/pinch zoom. Auto-rotates when idle.
 * Realism rig: sRGB output + ACES tone mapping, key/fill/rim lights,
 * shadow-catcher ground and a soft pedestal glow, gentle idle float.
 */
export default function SpecimenViewer({ model, zoomable = false, className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
    camera.position.set(0, 0.4, 5)
    camera.lookAt(0, 0, 0)

    /* light rig */
    scene.add(new THREE.HemisphereLight('#ffffff', '#b9a7e8', 0.85))
    const key = new THREE.DirectionalLight('#fff7ea', 2.4)
    key.position.set(3.5, 5, 4.5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    key.shadow.camera.near = 1
    key.shadow.camera.far = 20
    key.shadow.bias = -0.0004
    scene.add(key)
    const fill = new THREE.DirectionalLight('#bcd7ff', 0.8)
    fill.position.set(-4, 1.5, 2.5)
    scene.add(fill)
    const rim = new THREE.DirectionalLight('#ffc9ec', 1.1)
    rim.position.set(-2, -1.5, -4)
    scene.add(rim)

    /* ground + pedestal */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.32 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.55
    ground.receiveShadow = true
    scene.add(ground)

    const pedestal = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 48),
      new THREE.MeshBasicMaterial({ map: pedestalTexture(), transparent: true, depthWrite: false })
    )
    pedestal.rotation.x = -Math.PI / 2
    pedestal.position.y = -1.54
    scene.add(pedestal)

    const specimen = buildSpecimen(model)
    scene.add(specimen)

    /* ── interaction state ── */
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
    const t0 = performance.now()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = performance.now()
      if (!dragging) {
        // ease back to a gentle idle spin after a fling
        const idle = t - lastPointerTime > 1600
        velX += ((idle ? 0.006 : 0) - velX) * 0.02
        velY += (0 - velY) * 0.04
        specimen.rotation.y += velX
        specimen.rotation.x = Math.max(-1.2, Math.min(1.2, specimen.rotation.x + velY))
      }
      // gentle idle float so specimens feel alive, not mounted
      specimen.position.y = Math.sin((t - t0) * 0.0011) * 0.06
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
