function extensionFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/gif': 'gif',
  }
  return map[mime.toLowerCase()] ?? null
}

function sanitizeFileStem(name: string): string {
  return name.replace(/[/\\]+/g, '_').replace(/[^\w.-]+/g, '-').slice(0, 120)
}

/**
 * Descarga una imagen por URL (GET con CORS) como archivo local.
 */
export async function downloadImageFromUrl(
  url: string,
  stem: string,
): Promise<void> {
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) {
    throw new Error(`Error al obtener la imagen (${res.status})`)
  }
  const blob = await res.blob()
  const ext = extensionFromMime(blob.type) ?? 'jpg'
  const safe = sanitizeFileStem(stem) || 'imagen'
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `${safe}.${ext}`
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
