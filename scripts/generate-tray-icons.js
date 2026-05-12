/**
 * Tray Icon Generator
 *
 * This script generates tray icons for different platforms from the source icon.
 * Run with: node scripts/generate-tray-icons.js
 *
 * For production, use proper image editing tools to create high-quality icons.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const assetsDir = path.join(rootDir, 'assets')
const iconsDir = path.join(rootDir, 'src', 'main', 'assets', 'icons')

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Minimal valid PNG generator (1x1 pixel, will be replaced with proper icons)
// These are placeholder icons - replace with proper icons for production
const createMinimalPNG = (width, height, r, g, b, a) => {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData.writeUInt8(8, 8)  // bit depth
  ihdrData.writeUInt8(6, 9)  // color type (RGBA)
  ihdrData.writeUInt8(0, 10) // compression
  ihdrData.writeUInt8(0, 11) // filter
  ihdrData.writeUInt8(0, 12) // interlace

  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT chunk (compressed image data)
  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0 // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 4) + 1 + x * 4
      rawData[offset] = r
      rawData[offset + 1] = g
      rawData[offset + 2] = b
      rawData[offset + 3] = a
    }
  }

  // Simple zlib compression (deflate with no compression)
  const zlib = require('node:zlib')
  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

const createChunk = (type, data) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const typeBuffer = Buffer.from(type)
  const crcData = Buffer.concat([typeBuffer, data])
  const crc = crc32(crcData)
  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(crc >>> 0, 0)

  return Buffer.concat([length, typeBuffer, data, crcBuffer])
}

// CRC32 implementation
const crc32 = (data) => {
  let crc = 0xFFFFFFFF
  const table = []

  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c
  }

  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8)
  }

  return crc ^ 0xFFFFFFFF
}

// Copy existing tray icon if available
const sourceIcon = path.join(assetsDir, 'tray-icon.png')
const hasSourceIcon = fs.existsSync(sourceIcon)

console.log('Generating tray icons...')
console.log(`Source icon exists: ${hasSourceIcon}`)
console.log(`Icons directory: ${iconsDir}`)

// Generate icons for different platforms
const icons = [
  { name: 'tray.png', width: 16, height: 16, desc: 'Standard tray icon (16x16)' },
  { name: 'tray@2x.png', width: 32, height: 32, desc: 'Retina tray icon (32x32)' },
  { name: 'trayTemplate.png', width: 16, height: 16, desc: 'macOS template icon for dark mode' },
  { name: 'trayTemplate@2x.png', width: 32, height: 32, desc: 'macOS template icon retina' },
]

// If source icon exists, copy it as the base
if (hasSourceIcon) {
  const sourceData = fs.readFileSync(sourceIcon)

  // Copy source as tray.png and tray@2x.png
  fs.writeFileSync(path.join(iconsDir, 'tray.png'), sourceData)
  console.log('Created tray.png (copied from source)')

  fs.writeFileSync(path.join(iconsDir, 'tray@2x.png'), sourceData)
  console.log('Created tray@2x.png (copied from source)')

  // For template icons, we need grayscale versions
  // For now, copy the same - in production, create proper template icons
  fs.writeFileSync(path.join(iconsDir, 'trayTemplate.png'), sourceData)
  console.log('Created trayTemplate.png (placeholder - use proper template icon for production)')

  fs.writeFileSync(path.join(iconsDir, 'trayTemplate@2x.png'), sourceData)
  console.log('Created trayTemplate@2x.png (placeholder - use proper template icon for production)')
} else {
  // Create placeholder icons
  for (const icon of icons) {
    const png = createMinimalPNG(icon.width, icon.height, 100, 100, 100, 255)
    fs.writeFileSync(path.join(iconsDir, icon.name), png)
    console.log(`Created ${icon.name} (${icon.desc}) - placeholder`)
  }
}

// Create a simple ICO file for Windows
// ICO format: ICONDIR + ICONDIRENTRY + PNG data
const createICO = (pngData) => {
  // ICONDIR
  const iconDir = Buffer.alloc(6)
  iconDir.writeUInt16LE(0, 0)    // Reserved
  iconDir.writeUInt16LE(1, 2)    // Type (1 = ICO)
  iconDir.writeUInt16LE(1, 4)    // Number of images

  // ICONDIRENTRY
  const iconDirEntry = Buffer.alloc(16)
  iconDirEntry.writeUInt8(16, 0)     // Width (0 = 256)
  iconDirEntry.writeUInt8(16, 1)     // Height (0 = 256)
  iconDirEntry.writeUInt8(0, 2)      // Color palette
  iconDirEntry.writeUInt8(0, 3)      // Reserved
  iconDirEntry.writeUInt16LE(1, 4)   // Color planes
  iconDirEntry.writeUInt16LE(32, 6)  // Bits per pixel
  iconDirEntry.writeUInt32LE(pngData.length, 8)  // Size of image data
  iconDirEntry.writeUInt32LE(22, 12) // Offset to image data (6 + 16 = 22)

  return Buffer.concat([iconDir, iconDirEntry, pngData])
}

// Create tray.ico for Windows
const trayPng = hasSourceIcon
  ? fs.readFileSync(sourceIcon)
  : createMinimalPNG(16, 16, 100, 100, 100, 255)

const ico = createICO(trayPng)
fs.writeFileSync(path.join(iconsDir, 'tray.ico'), ico)
console.log('Created tray.ico (Windows icon)')

console.log('\nTray icons generated successfully!')
console.log('\nNote: For production, replace placeholder icons with properly designed icons:')
console.log('- tray.png: 16x16 standard icon')
console.log('- tray@2x.png: 32x32 retina icon')
console.log('- trayTemplate.png: macOS template icon (black shape, transparent background)')
console.log('- trayTemplate@2x.png: macOS template icon retina')
console.log('- tray.ico: Windows icon (can contain multiple sizes)')
