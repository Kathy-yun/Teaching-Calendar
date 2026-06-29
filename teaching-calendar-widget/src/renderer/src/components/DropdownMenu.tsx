import { useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'
import styles from './DropdownMenu.module.css'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  onClose: () => void
  triggerRef: React.RefObject<HTMLElement | null>
}

export function DropdownMenu({ items, onClose, triggerRef }: DropdownMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Node
    if (ref.current && !ref.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)) {
      onClose()
    }
  }, [onClose, triggerRef])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  return (
    <div className={styles.dropdown} ref={ref}>
      {items.map((item, i) => (
        <button
          key={i}
          className={clsx(styles.item, item.danger && styles.danger)}
          onClick={() => {
            item.onClick()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
