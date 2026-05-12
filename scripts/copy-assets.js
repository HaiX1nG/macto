/**
 * Copy assets to build output directory
 * This script runs after the build to copy tray icons and other assets
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const srcAssetsDir = path.join(rootDir, 'src', 'main', 'assets')
const outAssetsDir = path.join(rootDir, 'out', 'main', 'assets')

// Recursively copy directory
const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.log('Source directory does not exist:', src)
    return
  }

  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
      console.log('Copied:', srcPath, '->', destPath)
    }
  }
}

console.log('Copying assets to build output...')
copyDir(srcAssetsDir, outAssetsDir)
console.log('Assets copied successfully!')
