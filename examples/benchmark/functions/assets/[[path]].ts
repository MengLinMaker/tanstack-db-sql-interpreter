export async function onRequest(context: {
  request: Request
  // @ts-expect-error <ignore>
  env: { WASM_BUCKET: R2Bucket }
  next: () => Promise<Response>
}) {
  const { request, env, next } = context

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next()
  }

  const url = new URL(request.url)
  if (!url.pathname.endsWith('.wasm')) {
    return next()
  }

  const key = url.pathname.replace(/^\/+/, '')
  const object = await env.WASM_BUCKET.get(key)
  if (!object) {
    return next()
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  if (key.endsWith('.wasm')) {
    headers.set('Content-Type', 'application/wasm')
  }
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
}
