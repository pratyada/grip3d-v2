/**
 * Properly dispose a globe.gl instance and release its WebGL context.
 *
 * Browsers limit concurrent WebGL contexts (~16 in Chrome). Without this,
 * navigating between 30 globe use cases exhausts the limit and WebGL
 * stops working entirely ("WebGL context could not be created").
 *
 * Call this in every useEffect cleanup that creates a globe.gl instance.
 */
export function disposeGlobe(
  globeInst: React.MutableRefObject<any>,
  globeRef: React.MutableRefObject<HTMLDivElement | null>,
): void {
  const globe = globeInst.current
  if (!globe) return

  // 1. Stop orbit controls
  try { globe.controls()?.dispose?.() } catch {}

  // 2. Dispose the THREE.js renderer (releases GPU memory)
  try {
    const renderer = globe.renderer?.()
    if (renderer) {
      renderer.dispose?.()
      renderer.forceContextLoss?.()
    }
  } catch {}

  // 3. Fallback: manually release WebGL context from the canvas
  try {
    const container = globeRef.current
    if (container) {
      const canvas = container.querySelector("canvas")
      if (canvas) {
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl")
        if (gl) {
          const ext = gl.getExtension("WEBGL_lose_context")
          ext?.loseContext()
        }
        // Remove canvas from DOM to prevent stale references
        canvas.remove()
      }
    }
  } catch {}

  // 4. Clear the ref
  globeInst.current = null
}
