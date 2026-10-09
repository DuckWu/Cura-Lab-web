// src/components/HeroCanvas.tsx
// Cinematic WebGL hero: artwork textures crossfade with a slow push-in,
// film grain and vignette. Falls back to a CSS crossfade when WebGL fails.
//
// The slideshow is CONTROLLED by the parent via `activeIndex` (e.g. Landing's
// 6s timer + clickable counter ticks). The canvas only crossfades to whatever
// index it is given — it never advances on its own, so UI and canvas can't drift.
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uImgAspectA;
  uniform float uImgAspectB;
  uniform float uCanvasAspect;
  uniform float uMix;    // 0 = show A, 1 = show B
  uniform float uZoomA;  // slow push-in progress per layer
  uniform float uZoomB;
  uniform float uTime;

  vec2 coverUv(vec2 uv, float imgAspect, float zoom) {
    vec2 c = uv - 0.5;
    vec2 s;
    if (imgAspect > uCanvasAspect) {
      // image wider than canvas: match heights, crop the sides
      s = vec2(uCanvasAspect / imgAspect, 1.0);
    } else {
      // image taller than canvas: match widths, crop top/bottom
      s = vec2(1.0, imgAspect / uCanvasAspect);
    }
    return c * s / (1.0 + zoom * 0.10) + 0.5;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec3 a = texture2D(uTexA, coverUv(vUv, uImgAspectA, uZoomA)).rgb;
    vec3 b = texture2D(uTexB, coverUv(vUv, uImgAspectB, uZoomB)).rgb;
    float m = smoothstep(0.0, 1.0, uMix);
    vec3 col = mix(a, b, m);

    // vignette
    vec2 d = vUv - 0.5;
    col *= 1.0 - 0.55 * dot(d, d);

    // animated grain
    float g = hash(vUv * 913.0 + fract(uTime) * 7.0) - 0.5;
    col += g * 0.045;

    gl_FragColor = vec4(col, 1.0);
  }
`

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

type Props = {
  images: string[]
  /** Parent-owned slideshow position. Canvas crossfades to follow it. */
  activeIndex: number
  fadeMs?: number
}

export default function HeroCanvas({ images, activeIndex, fadeMs = 2200 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  // Ref mirror so the rAF loop always sees the latest prop without re-subscribing.
  const activeRef = useRef(activeIndex)
  activeRef.current = activeIndex

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || failed) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFailed(true)
      return
    }

    let renderer: THREE.WebGLRenderer | null = null
    let raf = 0
    let disposed = false
    const clock = new THREE.Clock()

    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' })
    } catch {
      setFailed(true)
      return
    }
    if (!renderer.getContext()) {
      setFailed(true)
      return
    }

    const DPR = Math.min(window.devicePixelRatio || 1, 1.75)
    renderer.setPixelRatio(DPR)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    mount.appendChild(renderer.domElement)
    const canvasEl = renderer.domElement

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const uniforms = {
      uTexA: { value: null as THREE.Texture | null },
      uTexB: { value: null as THREE.Texture | null },
      uImgAspectA: { value: 1 },
      uImgAspectB: { value: 1 },
      uCanvasAspect: { value: 1 },
      uMix: { value: 0 },
      uZoomA: { value: 0 },
      uZoomB: { value: 0 },
      uTime: { value: 0 },
    }
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthTest: false,
      depthWrite: false,
    })
    const geo = new THREE.PlaneGeometry(2, 2)
    scene.add(new THREE.Mesh(geo, mat))

    const resize = () => {
      if (!mount || !renderer) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      uniforms.uCanvasAspect.value = w / h
    }
    resize()
    window.addEventListener('resize', resize)

    const loader = new THREE.TextureLoader()
    const cache = new Map<string, THREE.Texture>()
    const loadTex = (src: string): Promise<THREE.Texture> => {
      const hit = cache.get(src)
      if (hit) return Promise.resolve(hit)
      return new Promise((res, rej) => {
        loader.load(
          src,
          tex => {
            tex.colorSpace = THREE.SRGBColorSpace
            tex.minFilter = THREE.LinearFilter
            tex.generateMipmaps = false
            cache.set(src, tex)
            res(tex)
          },
          undefined,
          rej,
        )
      })
    }
    const aspectOf = (t: THREE.Texture) => {
      const img = t.image as HTMLImageElement
      return img.width / Math.max(img.height, 1)
    }

    // Monotonic token: a slow earlier load must never overwrite a newer request.
    let loadSeq = 0
    const setLayer = (i: number, layer: 'A' | 'B'): Promise<boolean> => {
      const seq = ++loadSeq
      const src = images[((i % images.length) + images.length) % images.length]
      return loadTex(src).then(
        tex => {
          if (disposed || seq !== loadSeq) return false
          if (layer === 'A') {
            uniforms.uTexA.value = tex
            uniforms.uImgAspectA.value = aspectOf(tex)
            uniforms.uZoomA.value = 0
          } else {
            uniforms.uTexB.value = tex
            uniforms.uImgAspectB.value = aspectOf(tex)
            uniforms.uZoomB.value = 0
          }
          return true
        },
        () => false,
      )
    }

    const norm = (i: number) => ((i % images.length) + images.length) % images.length
    let settled = norm(activeRef.current)
    void setLayer(settled, 'A')
    void setLayer(settled + 1, 'B')

    let fading = false
    let fadeStart = 0
    let fadeTarget = -1
    let fadeReady = false
    let lastRequestAt = -10000
    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

    const tick = () => {
      if (disposed || !renderer) return
      raf = requestAnimationFrame(tick)
      const now = performance.now()
      const dt = Math.min(clock.getDelta(), 0.1)
      uniforms.uTime.value = clock.elapsedTime

      const want = norm(activeRef.current)
      if (want !== settled && !fading && fadeTarget === -1 && now - lastRequestAt > 2000) {
        // Load the requested image into layer B; the fade starts once it's ready.
        lastRequestAt = now
        fadeTarget = want
        fadeReady = false
        void setLayer(want, 'B').then(ok => {
          if (disposed) return
          if (fadeTarget === want && ok) fadeReady = true
          else if (fadeTarget === want) fadeTarget = -1 // load failed; retry on a later tick
        })
      }
      if (fadeTarget !== -1 && fadeReady && !fading) {
        fading = true
        fadeStart = now
        fadeReady = false
      }
      if (fading) {
        const p = Math.min((now - fadeStart) / fadeMs, 1)
        uniforms.uMix.value = easeInOut(p)
        uniforms.uZoomB.value = p
        if (p >= 1) {
          // promote B to the settled layer A
          settled = fadeTarget
          uniforms.uTexA.value = uniforms.uTexB.value
          uniforms.uImgAspectA.value = uniforms.uImgAspectB.value
          uniforms.uZoomA.value = 1
          uniforms.uMix.value = 0
          fading = false
          fadeTarget = -1
          void setLayer(settled + 1, 'B')
        }
      } else {
        // framerate-independent push-in (~0.036/s, same feel as before at 60fps)
        uniforms.uZoomA.value = Math.min(uniforms.uZoomA.value + dt * 0.036, 1)
      }

      if (!document.hidden) renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      if (canvasEl.parentNode === mount) mount.removeChild(canvasEl)
      cache.forEach(t => t.dispose())
      geo.dispose()
      mat.dispose()
      scene.clear()
      renderer?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed])

  if (failed) {
    const n = normIndex(activeIndex, images.length)
    return (
      <div className="absolute inset-0 overflow-hidden bg-neutral-950">
        {images.map((img, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: n === i ? 1 : 0 }}
          >
            <img src={img} alt="" className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 overflow-hidden bg-neutral-950"
    />
  )
}

function normIndex(i: number, len: number) {
  return ((i % len) + len) % len
}
