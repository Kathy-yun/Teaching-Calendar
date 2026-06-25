/// <reference types="vite/client" />

declare global {
  interface Window {
    widgetAPI: WidgetAPI
  }

  namespace WidgetAPI {
    interface WindowControls {
      close: () => Promise<void>
      minimize: () => Promise<void>
      getPosition: () => Promise<{ x: number; y: number }>
      setPosition: (pos: { x: number; y: number }) => Promise<void>
      getSize: () => Promise<{ width: number; height: number }>
      setSize: (size: { width: number; height: number }) => Promise<void>
      openFile: () => Promise<string | null>
      readFile: (filePath: string) => Promise<{ fileName: string; buffer: number[] } | null>
      onFileDropped: (callback: (data: { fileName: string; buffer: number[] }) => void) => () => void
    }
  }
}

export {}
