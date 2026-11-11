const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BYTES = 5 * 1024 * 1024
const MIN_EDGE = 224

export interface ImageValidationResult {
  ok: boolean
  error?: string
  warning?: string
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      error: 'Use a JPEG, PNG, or WebP image.',
    }
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: 'Image must be 5 MB or smaller.',
    }
  }

  return { ok: true }
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}

export async function assessImageQuality(dataUrl: string): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth < MIN_EDGE || img.naturalHeight < MIN_EDGE) {
        resolve({
          ok: true,
          warning:
            'This image is quite small. Matches may be weaker — try a clearer photo if you can.',
        })
        return
      }
      resolve({ ok: true })
    }
    img.onerror = () =>
      resolve({ ok: false, error: 'That image could not be loaded. Try another file.' })
    img.src = dataUrl
  })
}

export function createId(prefix = 'ref'): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
