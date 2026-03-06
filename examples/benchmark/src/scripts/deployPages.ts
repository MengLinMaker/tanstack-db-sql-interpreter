import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const wranglerToml = join(__dirname, '../../wrangler.toml')
const readBucketName = () => {
  const text = readFileSync(wranglerToml, 'utf8')
  const match = text.match(/bucket_name\s*=\s*"([^"]+)"/)
  if (match?.[1]) return match[1]
  throw Error(`'bucket_name=BUCKET_NAME' cannot be found in wrangler.toml`)
}
const bucketName = readBucketName()

const assetsDir = join(__dirname, '../../dist/assets')
readdirSync(assetsDir)
  .filter((file) => {
    if (!file.endsWith('.wasm')) return false
    const filePath = join(assetsDir, file)
    // Cloudflare has 25mb asset limit - store large files in R2.
    if (statSync(filePath).size < 25 * 10 ** 6) return false
    return true
  })
  .forEach((wasmFile) => {
    const key = join('assets', wasmFile)
    const filePath = join(assetsDir, wasmFile)
    execSync(
      `wrangler r2 object put --remote --file "${filePath}" --content-type application/wasm ${bucketName}/${key}`,
      { stdio: 'inherit' },
    )
    rmSync(filePath)
  })

execSync(`wrangler pages deploy`, { stdio: 'inherit' })
