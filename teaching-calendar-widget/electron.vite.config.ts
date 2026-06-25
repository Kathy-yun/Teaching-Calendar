import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  main: {},
  preload: false,  // We handle preload manually as plain JS
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, '../src/shared')
      }
    }
  }
})
