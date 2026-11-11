import type { Area } from 'react-easy-crop'

const MIN_CROP_PX = 64

/** Decode a data URL / blob URL and bake in EXIF orientation via createImageBitmap. */
export async function loadOrientedImage(src: string): Promise<HTMLCanvasElement> {
  const res = await fetch(src)
  const blob = await res.blob()

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch {
    bitmap = await createImageBitmap(blob)
  }

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare image canvas')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvas
}

export function orientedCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/jpeg', 0.95)
}

/**
 * Crop at full natural resolution from an already-oriented source canvas or image URL.
 */
export async function getCroppedDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  sourceCanvas?: HTMLCanvasElement,
): Promise<string> {
  if (pixelCrop.width < MIN_CROP_PX || pixelCrop.height < MIN_CROP_PX) {
    throw new Error(`Crop must be at least ${MIN_CROP_PX}×${MIN_CROP_PX} pixels.`)
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(pixelCrop.width))
  canvas.height = Math.max(1, Math.round(pixelCrop.height))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not crop image')

  if (sourceCanvas) {
    ctx.drawImage(
      sourceCanvas,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
  } else {
    const img = await loadImageElement(imageSrc)
    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function getPreviewThumb(
  imageSrc: string,
  pixelCrop: Area,
  sourceCanvas?: HTMLCanvasElement,
  maxEdge = 96,
): Promise<string> {
  try {
    const full = await getCroppedDataUrl(imageSrc, pixelCrop, sourceCanvas)
    const img = await loadImageElement(full)
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return full
    ctx.drawImage(img, 0, 0, w, h)
    return c.toDataURL('image/jpeg', 0.85)
  } catch {
    return ''
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to load'))
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

export { MIN_CROP_PX }
