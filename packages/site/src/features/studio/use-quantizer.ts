import { useEffect, useRef } from 'react'
import { extractSeedsFromImageData, PRESET_ART_SCENES } from '../../color/imageQuantizer.ts'
import { useAppDispatch, useAppSelector } from '../../app/store.ts'
import { setExtractedSeeds, setQuantizerScene, setSourceHex } from './slice.ts'

export function useQuantizer(canvasRef: { readonly current: HTMLCanvasElement | null }) {
  const dispatch = useAppDispatch()
  const activeSceneId = useAppSelector((state) => state.studio.quantizerSceneId)
  const seeds = useAppSelector((state) => state.studio.extractedSeeds)
  const sceneRef = useRef(activeSceneId)
  sceneRef.current = activeSceneId

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const context = canvas.getContext('2d')
    if (context === null) {
      return
    }
    const scene = PRESET_ART_SCENES.find((item) => item.id === activeSceneId)
    if (scene === undefined) {
      return
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    scene.drawScene(context, canvas.width, canvas.height)
    dispatch(setExtractedSeeds(extractSeedsFromImageData(context.getImageData(0, 0, canvas.width, canvas.height), 4)))
  }, [activeSceneId, canvasRef, dispatch])

  return {
    scenes: PRESET_ART_SCENES.map((scene) => ({ id: scene.id, name: scene.name })),
    activeSceneId,
    seeds,
    selectScene: (id: string) => dispatch(setQuantizerScene(id)),
    upload(file: File) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const image = new Image()
        image.onload = () => {
          const canvas = canvasRef.current
          if (canvas === null) {
            return
          }
          const context = canvas.getContext('2d')
          if (context === null) {
            return
          }
          context.clearRect(0, 0, canvas.width, canvas.height)
          context.drawImage(image, 0, 0, canvas.width, canvas.height)
          dispatch(setQuantizerScene('uploaded'))
          const nextSeeds = extractSeedsFromImageData(context.getImageData(0, 0, canvas.width, canvas.height), 4)
          dispatch(setExtractedSeeds(nextSeeds))
          const first = nextSeeds[0]
          if (first !== undefined) {
            dispatch(setSourceHex(first.hex))
          }
        }
        if (typeof event.target?.result === 'string') {
          image.src = event.target.result
        }
      }
      reader.readAsDataURL(file)
    },
  }
}
