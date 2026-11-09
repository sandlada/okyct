/**
 * 透视点阵地形（Three.js + 自定义 GLSL）。
 *
 * 视觉参考：镜头悬停于点阵波浪之上、垂直向下俯瞰，波浪在地表推进，
 * 起伏通过明暗与点径变化被感知。与参考不同的是颜色并非单色：
 * 每个点的色相取自 @sandlada/okyct 生成的连续色带，
 * 平面上的相邻点取相邻色带索引，因此邻近粒子的颜色始终保持梯度。
 *
 * 交互：指针射线与地表求交，在指针处隆起一道单一波峰，同时保持相机严格静止。
 */

import { useEffect, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  NoToneMapping,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { TerrainRoleRamps } from './palette.ts'

const TerrainVertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uPixelRatio;
  uniform float uDotScale;

  attribute vec3 aSurfaceLow;
  attribute vec3 aSurfaceHigh;
  attribute vec3 aPrimaryLow;
  attribute vec3 aPrimaryHigh;
  attribute vec3 aTertiaryLow;
  attribute vec3 aTertiaryHigh;
  attribute float aSize;

  varying vec3 vColor;
  varying float vToneMix;
  varying float vLight;

  float terrainHeight(vec2 p, float t) {
    float h = sin(p.x * 0.22 + t * 0.6) * cos(p.y * 0.19 - t * 0.5) * 1.4;
    h += sin(p.x * 0.47 - p.y * 0.31 + t * 0.95) * 0.5;
    h += cos(p.y * 0.66 + p.x * 0.14 + t * 1.25) * 0.24;
    return h;
  }

  void main() {
    vec3 transformed = position;
    float height = terrainHeight(position.xz, uTime);

    // 以指针为圆心的单一隆起：纯高斯包络，不含随距离振荡的 ripple 相位。
    // ripple 的 sin(distance * k - time * w) 在指针快速移动时会因 distance
    // 帧间跳变产生高频相位抖动，这正是快速来回移动时粒子原地抖动的主因。
    float distanceToPointer = distance(position.xz, uPointer);
    float moundFalloff = exp(-distanceToPointer * distanceToPointer * 0.007);
    float breathe = 0.9 + 0.12 * sin(uTime * 1.2);
    float moundHeight = moundFalloff * 4.2 * breathe * uPointerStrength;
    height += moundHeight;

    // 波峰解析坡度 → 伪光照：高斯导数本身光滑无振荡，只与当前位置有关，
    // 因此即使指针快速移动也不会引入抖动，同时让穹顶产生可读的立体明暗。
    vec2 moundGrad = -2.0 * 0.007 * (position.xz - uPointer) * moundHeight;

    transformed.y += height;

    // 用高度场的有限差分近似法线，形成可读的波脊明暗。
    float sampleOffset = 0.4;
    float heightLeft = terrainHeight(position.xz + vec2(-sampleOffset, 0.0), uTime);
    float heightRight = terrainHeight(position.xz + vec2(sampleOffset, 0.0), uTime);
    float heightDown = terrainHeight(position.xz + vec2(0.0, -sampleOffset), uTime);
    float heightUp = terrainHeight(position.xz + vec2(0.0, sampleOffset), uTime);
    float lighting = clamp(
      0.5 + (heightLeft - heightRight) * 0.5 + (heightDown - heightUp) * 0.35
        + (moundGrad.x * 0.55 + moundGrad.y * 0.75) * 2.2,
      0.0,
      1.0
    );

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float depth = max(1.0, -mvPosition.z);
    float relief = clamp(height * 0.34 + 0.5, 0.0, 1.0);
    gl_PointSize = clamp(
      uDotScale * aSize * uPixelRatio * (44.0 / depth) * (0.6 + 0.8 * relief) * (0.85 + 0.3 * lighting),
      1.0 * uPixelRatio,
      10.0 * uPixelRatio
    );

    // Height to role high-tone mix: higher particles take deeper tone in light mode, brighter in dark mode.
    vToneMix = clamp((height + 1.8) / 4.0, 0.0, 1.0);
    vLight = lighting;
    float pointerDistance = distance(position.xz, uPointer);
    float primaryWeight = exp(-pointerDistance * pointerDistance * 0.007) * uPointerStrength;
    float ringDistance = pointerDistance - 13.0;
    float ringWeight = exp(-ringDistance * ringDistance * 0.03) * uPointerStrength * (1.0 - primaryWeight);
    float surfaceWeight = 1.0 - primaryWeight - ringWeight;
    vec3 lowColor = aSurfaceLow * surfaceWeight + aPrimaryLow * primaryWeight + aTertiaryLow * ringWeight;
    vec3 highColor = aSurfaceHigh * surfaceWeight + aPrimaryHigh * primaryWeight + aTertiaryHigh * ringWeight;
    vColor = mix(lowColor, highColor, smoothstep(0.12, 0.92, vToneMix));
  }
`

const TerrainFragmentShader = `
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vToneMix;
  varying float vLight;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float radial = length(centered);
    if (radial > 0.5) {
      discard;
    }

    float heightMix = smoothstep(0.12, 0.92, vToneMix);
    float alpha = smoothstep(0.5, 0.24, radial)
      * (0.5 + 0.5 * heightMix)
      * (0.55 + 0.45 * vLight);
    gl_FragColor = vec4(vColor, alpha * uOpacity);
  }
`

const CompactBreakpoint = 768

interface ParticleTerrainProps {
  readonly roleRamps: TerrainRoleRamps
  readonly isDark: boolean
  readonly className?: string
}

function hexToComponents(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized.length === 3
    ? normalized.split('').map((character) => character + character).join('')
    : normalized, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function writeRampColor(target: Float32Array, cursor: number, ramp: readonly string[], progress: number) {
  const index = Math.round(progress * (ramp.length - 1))
  const [red, green, blue] = hexToComponents(ramp[index] ?? ramp[0])
  target[cursor * 3] = red
  target[cursor * 3 + 1] = green
  target[cursor * 3 + 2] = blue
}

export function ParticleTerrain({ roleRamps, isDark, className = '' }: ParticleTerrainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const container = canvas.parentElement
    if (container === null) {
      return
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.innerWidth < CompactBreakpoint
    const fallbackRamp: readonly string[] = ['#1a73e8']
    const surfaceLow = roleRamps.surface.low.length > 0 ? roleRamps.surface.low : fallbackRamp
    const surfaceHigh = roleRamps.surface.high.length > 0 ? roleRamps.surface.high : fallbackRamp
    const primaryLow = roleRamps.primary.low.length > 0 ? roleRamps.primary.low : fallbackRamp
    const primaryHigh = roleRamps.primary.high.length > 0 ? roleRamps.primary.high : fallbackRamp
    const tertiaryLow = roleRamps.tertiary.low.length > 0 ? roleRamps.tertiary.low : fallbackRamp
    const tertiaryHigh = roleRamps.tertiary.high.length > 0 ? roleRamps.tertiary.high : fallbackRamp

    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = NoToneMapping

    const scene = new Scene()
    const camera = new PerspectiveCamera(55, 1, 0.1, 320)
    camera.position.set(0, 44, 0)
    camera.up.set(0, 0, -1)
    camera.lookAt(0, 0, 0)

    const gridHalfExtent = compact ? 46 : 62
    const gridSpacing = compact ? 0.72 : 0.78
    const columns = Math.round((gridHalfExtent * 2) / gridSpacing) + 1
    const rows = columns

    const vertexCount = columns * rows
    const positions = new Float32Array(vertexCount * 3)
    const surfaceLowColors = new Float32Array(vertexCount * 3)
    const surfaceHighColors = new Float32Array(vertexCount * 3)
    const primaryLowColors = new Float32Array(vertexCount * 3)
    const primaryHighColors = new Float32Array(vertexCount * 3)
    const tertiaryLowColors = new Float32Array(vertexCount * 3)
    const tertiaryHighColors = new Float32Array(vertexCount * 3)
    const sizes = new Float32Array(vertexCount)

    let cursor = 0
    for (let row = 0; row < rows; row += 1) {
      const depthProgress = row / (rows - 1)
      const z = -gridHalfExtent + depthProgress * gridHalfExtent * 2

      for (let column = 0; column < columns; column += 1) {
        const lateralProgress = column / (columns - 1)
        const x = -gridHalfExtent + lateralProgress * gridHalfExtent * 2

        positions[cursor * 3] = x
        positions[cursor * 3 + 1] = 0
        positions[cursor * 3 + 2] = z

        // 相邻点取相邻色带索引，形成连续的色彩梯度。
        const rampProgress = Math.min(
          1,
          Math.max(0, lateralProgress * 0.72 + depthProgress * 0.28),
        )
        writeRampColor(surfaceLowColors, cursor, surfaceLow, rampProgress)
        writeRampColor(surfaceHighColors, cursor, surfaceHigh, rampProgress)
        writeRampColor(primaryLowColors, cursor, primaryLow, rampProgress)
        writeRampColor(primaryHighColors, cursor, primaryHigh, rampProgress)
        writeRampColor(tertiaryLowColors, cursor, tertiaryLow, rampProgress)
        writeRampColor(tertiaryHighColors, cursor, tertiaryHigh, rampProgress)

        sizes[cursor] = 0.8 + Math.random() * 0.45
        cursor += 1
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aSurfaceLow', new BufferAttribute(surfaceLowColors, 3))
    geometry.setAttribute('aSurfaceHigh', new BufferAttribute(surfaceHighColors, 3))
    geometry.setAttribute('aPrimaryLow', new BufferAttribute(primaryLowColors, 3))
    geometry.setAttribute('aPrimaryHigh', new BufferAttribute(primaryHighColors, 3))
    geometry.setAttribute('aTertiaryLow', new BufferAttribute(tertiaryLowColors, 3))
    geometry.setAttribute('aTertiaryHigh', new BufferAttribute(tertiaryHighColors, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))

    const uniforms = {
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uPixelRatio: { value: 1 },
      uDotScale: { value: compact ? 2.0 : 2.25 },
      uOpacity: { value: isDark ? 0.94 : 0.9 },
    }

    const material = new ShaderMaterial({
      uniforms,
      vertexShader: TerrainVertexShader,
      fragmentShader: TerrainFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })

    const points = new Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)

    const pointerTarget = new Vector3(0, 0, 0)
    const pointerSmooth = pointerTarget.clone()
    const pointerStep = new Vector3()
    let pointerTargetStrength = 0
    let pointerStrength = 0

    const raycaster = new Raycaster()
    const groundPlane = new Plane(new Vector3(0, 1, 0), 0)
    const pointerNdc = new Vector2()

    const resize = () => {
      const width = Math.max(1, Math.round(container.clientWidth))
      const height = Math.max(1, Math.round(container.clientHeight))
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(width, height, false)
      uniforms.uPixelRatio.value = renderer.getPixelRatio()
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        pointerTargetStrength = 0
        return
      }

      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointerNdc, camera)
      const hit = raycaster.ray.intersectPlane(groundPlane, pointerTarget)
      pointerTargetStrength = hit === null ? 0 : 1
    }

    const handlePointerLeave = () => {
      pointerTargetStrength = 0
    }

    let animationFrame = 0
    let lastTime = 0
    let elapsed = 0

    const animate = (time: number) => {
      const delta = lastTime === 0 ? 1 / 60 : Math.min(0.05, (time - lastTime) / 1000)
      lastTime = time
      elapsed += delta

      // 位置做速率钳制的一阶平滑：快速来回甩动鼠标时，直接 lerp 会让
      // 波峰中心在两帧之间横跳，附近粒子高度帧间突变即为“原地抖动”。
      // 钳制每帧最大步进后，波峰只能以有限速度滑行，抖动即消失。
      pointerStep.copy(pointerTarget).sub(pointerSmooth).multiplyScalar(1 - Math.exp(-6 * delta))
      const maxStep = 40 * delta
      if (pointerStep.length() > maxStep) {
        pointerStep.setLength(maxStep)
      }
      pointerSmooth.add(pointerStep)
      pointerStrength += (pointerTargetStrength - pointerStrength) * (1 - Math.exp(-3.5 * delta))

      uniforms.uTime.value = elapsed
      uniforms.uPointer.value.set(pointerSmooth.x, pointerSmooth.z)
      uniforms.uPointerStrength.value = pointerStrength

      // 相机保持严格垂直俯瞰、不做视差位移：任何相机平移都会让全场
      // 粒子产生整体 correlated 抖动，快速移动鼠标时尤为明显。

      renderer.render(scene, camera)
      animationFrame = window.requestAnimationFrame(animate)
    }

    const handleVisibility = () => {
      window.cancelAnimationFrame(animationFrame)
      if (!document.hidden && !reduceMotion) {
        lastTime = 0
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)
    document.addEventListener('visibilitychange', handleVisibility)

    resize()
    if (!reduceMotion) {
      animationFrame = window.requestAnimationFrame(animate)
    }

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
      document.removeEventListener('visibilitychange', handleVisibility)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }, [roleRamps, isDark])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
