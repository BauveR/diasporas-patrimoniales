// Pide a ImageKit la imagen al ancho en que se muestra y en el formato más
// liviano que acepte el navegador (f-auto: AVIF/WebP), en vez del original
// (las de actividades son PNG de 1080px que se muestran a ~330-580px).
// URLs de otros hosts (Cloudinary, DEFAULT_IMAGE) se devuelven tal cual.
// Mismo manejo del `?` que conTransform en data/participantes.ts.
export function ikImage(url: string, width: number): string {
  if (!url.includes('ik.imagekit.io')) return url
  return `${url}${url.includes('?') ? '&' : '?'}tr=w-${width},f-auto`
}
