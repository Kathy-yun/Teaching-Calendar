const fs = require('fs')
const path = require('path')

const srcPreload = path.join(process.cwd(), 'src', 'preload', 'preload.js')
const outPreload = path.join(process.cwd(), 'out', 'preload', 'preload.js')

if (fs.existsSync(srcPreload)) {
  const outDir = path.dirname(outPreload)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  fs.copyFileSync(srcPreload, outPreload)
  console.log('Copied preload script to out/preload/preload.js')
} else {
  console.warn('Preload source not found:', srcPreload)
}
