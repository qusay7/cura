import sharp from 'sharp'
import { mkdirSync } from 'fs'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

mkdirSync('./public/icons', { recursive: true })

for (const size of sizes) {
  await sharp('./src/assets/logo.png')
    .resize(size, size, { fit: 'contain', background: { r: 91, g: 140, b: 143, alpha: 1 } })
    .toFile(`./public/icons/icon-${size}x${size}.png`)
  console.log(`✅ Generated ${size}x${size}`)
}

console.log('🎉 All icons generated!')