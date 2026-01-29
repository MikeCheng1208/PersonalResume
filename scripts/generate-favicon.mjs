/**
 * Favicon 生成腳本
 * 將 SVG 轉換為多種尺寸的 PNG 和 ICO 格式
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

// SVG 內容
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="32" height="32" rx="6" ry="6" fill="url(#grad)"/>
  <path d="M10 8 L10 24 L14 24 L14 18 L18 18 C22 18 24 15.5 24 13 C24 10.5 22 8 18 8 Z M14 11 L17.5 11 C19.5 11 20.5 11.8 20.5 13 C20.5 14.2 19.5 15 17.5 15 L14 15 Z" fill="white"/>
</svg>`

// ICO 檔案格式的 header 和 directory entry
function createIcoBuffer(pngBuffers) {
  const numImages = pngBuffers.length

  // ICO Header: 6 bytes
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // Reserved
  header.writeUInt16LE(1, 2)      // Type: 1 = ICO
  header.writeUInt16LE(numImages, 4)  // Number of images

  // Calculate offsets
  const directorySize = 16 * numImages
  let currentOffset = 6 + directorySize

  // Create directory entries and collect image data
  const directories = []
  const imageData = []

  for (const { buffer, size } of pngBuffers) {
    // Directory entry: 16 bytes each
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size === 256 ? 0 : size, 0)  // Width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1)  // Height (0 = 256)
    entry.writeUInt8(0, 2)                          // Color palette
    entry.writeUInt8(0, 3)                          // Reserved
    entry.writeUInt16LE(1, 4)                       // Color planes
    entry.writeUInt16LE(32, 6)                      // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8)           // Image size
    entry.writeUInt32LE(currentOffset, 12)          // Image offset

    directories.push(entry)
    imageData.push(buffer)
    currentOffset += buffer.length
  }

  return Buffer.concat([header, ...directories, ...imageData])
}

async function generateFavicon() {
  console.log('🎨 開始生成 Favicon...')

  const svgBuffer = Buffer.from(svgContent)

  // 生成不同尺寸的 PNG
  const sizes = [16, 32, 48]
  const pngBuffers = []

  for (const size of sizes) {
    const pngBuffer = await sharp(svgBuffer, { density: 300 })
      .resize(size, size)
      .png()
      .toBuffer()

    pngBuffers.push({ buffer: pngBuffer, size })
    console.log(`  ✓ 生成 ${size}x${size} PNG`)
  }

  // 創建 ICO 檔案
  const icoBuffer = createIcoBuffer(pngBuffers)
  writeFileSync(join(publicDir, 'favicon.ico'), icoBuffer)
  console.log('  ✓ 生成 favicon.ico')

  // 生成 apple-touch-icon (180x180)
  const appleTouchIcon = await sharp(svgBuffer, { density: 300 })
    .resize(180, 180)
    .png()
    .toBuffer()
  writeFileSync(join(publicDir, 'apple-touch-icon.png'), appleTouchIcon)
  console.log('  ✓ 生成 apple-touch-icon.png (180x180)')

  // 生成 favicon-32x32.png
  const favicon32 = await sharp(svgBuffer, { density: 300 })
    .resize(32, 32)
    .png()
    .toBuffer()
  writeFileSync(join(publicDir, 'favicon-32x32.png'), favicon32)
  console.log('  ✓ 生成 favicon-32x32.png')

  // 生成 favicon-16x16.png
  const favicon16 = await sharp(svgBuffer, { density: 300 })
    .resize(16, 16)
    .png()
    .toBuffer()
  writeFileSync(join(publicDir, 'favicon-16x16.png'), favicon16)
  console.log('  ✓ 生成 favicon-16x16.png')

  console.log('\n✅ Favicon 生成完成！')
  console.log('\n📁 生成的檔案：')
  console.log('   - public/favicon.ico')
  console.log('   - public/favicon.svg')
  console.log('   - public/favicon-16x16.png')
  console.log('   - public/favicon-32x32.png')
  console.log('   - public/apple-touch-icon.png')
}

generateFavicon().catch(console.error)
