import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const rootDir = resolve(
  new URL('.', import.meta.url).pathname,
  '..',
  '..',
  '..',
)
const distDir = 'dist'
const assetsDir = resolve(distDir, 'assets')
const wranglerToml = resolve(rootDir, 'wrangler.toml')

function walk(dir: string) {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...walk(fullPath))
      continue
    }
    files.push(fullPath)
  }
  return files
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function runStatus(command: string, args: string[]) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  return result.status ?? 1
}

function readBucketName() {
  try {
    const text = readFileSync(wranglerToml, 'utf8')
    const match = text.match(/bucket_name\s*=\s*"([^"]+)"/)
    if (match?.[1]) {
      return match[1]
    }
  } catch {
    // Ignore and fall back to env
  }
  return 'tanstack-db-interpreter-wasm'
}

if (!statSync(distDir, { throwIfNoEntry: false })) {
  console.error('dist/ not found. Run the build first.')
  process.exit(1)
}

const bucketName = readBucketName()
if (!bucketName) {
  console.error(
    'R2 bucket name not found. Set bucket_name in wrangler.toml or WASM_BUCKET_NAME env var.',
  )
  process.exit(1)
}

let wasmFiles: string[] = []
try {
  wasmFiles = walk(assetsDir).filter((file) => file.endsWith('.wasm'))
} catch {
  wasmFiles = []
}

if (wasmFiles.length > 0) {
  console.log(`Uploading ${wasmFiles.length} WASM files to R2...`)
  for (const file of wasmFiles) {
    const key = relative(distDir, file).replaceAll('\\', '/')
    const commonArgs = [
      'r2',
      'object',
      'put',
      '--remote',
      '--file',
      file,
      '--content-type',
      'application/wasm',
    ]
    const combinedStatus = runStatus('wrangler', [
      ...commonArgs,
      `${bucketName}/${key}`,
    ])
    if (combinedStatus !== 0) {
      const splitStatus = runStatus('wrangler', [
        ...commonArgs,
        bucketName,
        key,
      ])
      if (splitStatus !== 0) {
        process.exit(splitStatus)
      }
    }
    unlinkSync(file)
  }
} else {
  console.log('No WASM files found in dist/assets.')
}

const pagesArgs = ['pages', 'deploy', distDir, ...process.argv.slice(2)]
run('wrangler', pagesArgs)
