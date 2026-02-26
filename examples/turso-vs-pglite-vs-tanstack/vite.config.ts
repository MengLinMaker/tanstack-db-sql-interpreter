import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

const crossOriginIsolation = () => ({
  name: 'configure-server',
  configureServer(server: {
    middlewares: {
      use: (arg0: (_req: any, res: any, next: any) => void) => void
    }
  }) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
      next()
    })
  },
})

export default defineConfig({
  plugins: [solid() as never, crossOriginIsolation()],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite', '@electric-sql/pglite/worker'],
  },
  worker: {
    format: 'es',
  },
})
