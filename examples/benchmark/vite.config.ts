import sqlocal from 'sqlocal/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const crossOriginIsolationHandler = (server: {
  middlewares: {
    use: (arg0: (_req: any, res: any, next: any) => void) => void
  }
}) => {
  server.middlewares.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
    next()
  })
}

const crossOriginIsolation = () => ({
  name: 'configure-server',
  configureServer: crossOriginIsolationHandler,
  configurePreviewServer: crossOriginIsolationHandler,
})

export default defineConfig({
  plugins: [solid() as never, crossOriginIsolation(), sqlocal()],
  optimizeDeps: {
    exclude: [
      '@electric-sql/pglite',
      '@electric-sql/pglite/worker',
      '@ducklings/browser',
    ],
  },
  worker: {
    format: 'es',
  },
})
