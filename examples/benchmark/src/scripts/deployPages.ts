import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
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
  .filter((file) => file.endsWith('.wasm'))
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
