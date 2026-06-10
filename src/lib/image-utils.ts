export async function createLowResImageFile(
    imageUrl: string,
    opts: { maxSize?: number; quality?: number; fileName?: string } = {},
  ): Promise<File | null> {
    try {
      const { maxSize = 512, quality = 0.6, fileName = "share-preview.jpg" } = opts
      const img = new Image()
      img.crossOrigin = "anonymous" // allow CORS-enabled images
      img.decoding = "async"
      img.src = imageUrl
  
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Image load failed"))
      })
  
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.max(1, Math.round(img.width * ratio))
      const h = Math.max(1, Math.round(img.height * ratio))
  
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return null
      ctx.drawImage(img, 0, 0, w, h)
  
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality))
      if (!blob) return null
      return new File([blob], fileName, { type: "image/jpeg", lastModified: Date.now() })
    } catch (e) {
      console.warn("[v0] Low-res image generation failed:", (e as Error).message)
      return null
    }
  }
  