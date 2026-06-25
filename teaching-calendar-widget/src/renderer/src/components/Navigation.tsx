import clsx from 'clsx'
import styles from './Navigation.module.css'

interface NavigationProps {
  currentWeek: number
  totalWeeks: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function Navigation({ currentWeek, totalWeeks, onPrev, onNext, onToday }: NavigationProps) {
  return (
    <div className={styles.nav}>
      <button
        className={clsx(styles.btn, currentWeek === 0 && styles.disabled)}
        onClick={onPrev}
        disabled={currentWeek === 0}
      >
        ‹
      </button>

      <span className={styles.weekNum}>
        第 <strong>{currentWeek + 1}</strong> 周
      </span>

      <button
        className={clsx(styles.btn, currentWeek === totalWeeks - 1 && styles.disabled)}
        onClick={onNext}
        disabled={currentWeek === totalWeeks - 1}
      >
        ›
      </button>

      <button className={styles.todayBtn} onClick={onToday}>
        今天
      </button>
    </div>
  )
}
