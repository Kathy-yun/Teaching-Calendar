import React from 'react'
import clsx from 'clsx'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  semester: string
  weekInfo: string
  onBack?: () => void
}

export function TitleBar({ semester, weekInfo, onBack }: TitleBarProps) {
  return (
    <div className={styles.titleBar}>
      <div className={styles.left}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack} title="返回">
            ←
          </button>
        )}
        <div className={styles.title}>
          <span className={styles.semester}>{semester}</span>
          {weekInfo && <span className={styles.weekBadge}>{weekInfo}</span>}
        </div>
      </div>
      <div className={styles.buttons}>
        <button className={styles.btn} onClick={() => window.widgetAPI?.minimize()} title="最小化">
          <span className={styles.minimizeIcon}>─</span>
        </button>
        <button className={styles.btn} onClick={() => window.widgetAPI?.close()} title="关闭">
          <span className={styles.closeIcon}>✕</span>
        </button>
      </div>
    </div>
  )
}
