import { useCallback, useState, useEffect } from 'react'
import clsx from 'clsx'
import { parseFile } from '../parsers'
import styles from './UploadPanel.module.css'

interface UploadPanelProps {
  onFile: (file: File) => Promise<void>
  isLoading: boolean
}

export function UploadPanel({ onFile, isLoading }: UploadPanelProps) {
  const [dragOver, setDragOver] = useState(false)

  // Listen for files dropped on the Electron window
  useEffect(() => {
    const api = (window as any).widgetAPI
    if (!api?.onFileDropped) return

    const cleanup = api.onFileDropped(async (data: { fileName: string; buffer: number[] }) => {
      const blob = new Blob([new Uint8Array(data.buffer)])
      const file = new File([blob], data.fileName, { type: 'application/octet-stream' })
      await onFile(file)
    })

    return cleanup
  }, [onFile])

  // Handle window-level drag events
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      setDragOver(true)
    }
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setDragOver(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      if (e.target === document.documentElement || e.target === document.body) {
        setDragOver(false)
      }
    }
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer?.files[0]
      if (file) {
        await onFile(file)
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [onFile])

  // Use native file input for click-to-upload
  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await onFile(file)
    e.target.value = ''
  }, [onFile])

  return (
    <div className={clsx(styles.dropZone, dragOver && styles.dragOver)}>
      <input
        id="file-input"
        type="file"
        accept=".xls,.xlsx,.csv,.pdf,.png,.jpg,.jpeg,.ics,.doc,.docx"
        onChange={handleInputChange}
        className={styles.input}
      />

      {isLoading ? (
        <div className={styles.loading}>解析中...</div>
      ) : (
        <>
          <div className={styles.icon}>📅</div>
          <p className={styles.text}>点击上传或拖拽文件</p>
          <p className={styles.hint}>支持 .xls / .xlsx 教学日历</p>
        </>
      )}
    </div>
  )
}
