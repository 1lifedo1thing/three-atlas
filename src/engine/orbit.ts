import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { WorkContext } from './types'

export interface OrbitOptions {
  target?: Vector3
  minDistance?: number
  maxDistance?: number
  minPolarAngle?: number
  maxPolarAngle?: number
  /** Radians per second of idle drift (preview and full screen). */
  drift?: number
}

/**
 * Orbit camera that drifts on its own in preview and hands control to the
 * visitor in full screen. Controls only exist while the work is active.
 */
export function createOrbit(ctx: WorkContext, camera: PerspectiveCamera, opts: OrbitOptions = {}) {
  const target = opts.target ?? new Vector3()
  const drift = ctx.reducedMotion ? 0 : opts.drift ?? 0.06
  let controls: OrbitControls | null = null
  return {
    activate() {
      controls = new OrbitControls(camera, ctx.dom)
      controls.target.copy(target)
      controls.enableDamping = true
      controls.dampingFactor = 0.06
      controls.enablePan = false
      controls.rotateSpeed = 0.6
      controls.zoomSpeed = 0.7
      controls.autoRotate = drift > 0
      controls.autoRotateSpeed = (drift * 60) / (2 * Math.PI)
      if (opts.minDistance) controls.minDistance = opts.minDistance
      if (opts.maxDistance) controls.maxDistance = opts.maxDistance
      if (opts.minPolarAngle !== undefined) controls.minPolarAngle = opts.minPolarAngle
      if (opts.maxPolarAngle !== undefined) controls.maxPolarAngle = opts.maxPolarAngle
      controls.addEventListener('start', () => { if (controls) controls.autoRotate = false })
    },
    deactivate() { controls?.dispose(); controls = null },
    update(delta: number) {
      if (controls) { controls.update(delta); return }
      const off = camera.position.clone().sub(target)
      off.applyAxisAngle(new Vector3(0, 1, 0), drift * delta)
      camera.position.copy(target).add(off)
      camera.lookAt(target)
    },
    dispose() { controls?.dispose() },
  }
}
