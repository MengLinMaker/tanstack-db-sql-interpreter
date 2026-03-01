export async function onRequest(context: {
  request: Request
  // @ts-expect-error <ignore>
  env: { WASM_BUCKET: R2Bucket }
  next: () => Promise<Response>
}) {
  const { request, env, next } = context
  const url = new URL(request.url)
  if (request.method !== 'GET' && request.method !== 'HEAD') return next()
  if (!url.pathname.endsWith('.wasm')) return next()

  const key = url.pathname
  const object = await env.WASM_BUCKET.get(key)
  if (!object) return next()

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
}
