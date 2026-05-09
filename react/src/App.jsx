import { useState, useEffect, useCallback } from 'react'

const NOTES_KEY = 'calendar_notes'

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}
  } catch {
    return {}
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells = []

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ year: y, month: m, day: d, otherMonth: true })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, otherMonth: false })
  }

  const remaining = (7 - cells.length % 7) % 7
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ year: y, month: m, day: d, otherMonth: true })
  }

  return cells
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const today = new Date()
const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate())

export default function App() {
  const [notes, setNotes] = useState(loadNotes)
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [editingDate, setEditingDate] = useState(null)
  const [editText, setEditText] = useState('')

  const cells = getMonthData(year, month)

  const persistNotes = useCallback((fn) => {
    setNotes(prev => {
      const next = fn(prev)
      saveNotes(next)
      return next
    })
  }, [])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  const openEditor = (dateStr) => {
    setEditingDate(dateStr)
    setEditText((notes[dateStr] || []).join('\n'))
  }

  const saveEditor = () => {
    if (!editingDate) return
    const lines = editText.split('\n').map(l => l.trim()).filter(l => l)
    persistNotes(prev => {
      const next = { ...prev }
      if (lines.length) next[editingDate] = lines
      else delete next[editingDate]
      return next
    })
    setEditingDate(null)
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setEditingDate(null)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editingDate) {
        e.preventDefault()
        saveEditor()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button style={styles.navBtn} onClick={prevMonth}>◀</button>
            <h1 style={styles.title}>{year}年{month + 1}月</h1>
            <button style={styles.navBtn} onClick={nextMonth}>▶</button>
          </div>
          <button style={styles.todayBtn} onClick={goToday}>今天</button>
        </div>

        <div style={styles.weekdays}>
          {weekdays.map(d => <span key={d} style={styles.weekday}>{d}</span>)}
        </div>

        <div style={styles.grid}>
          {cells.map((c, i) => {
            const dateStr = toDateStr(c.year, c.month, c.day)
            const isToday = dateStr === todayStr
            const dayNotes = c.otherMonth ? [] : (notes[dateStr] || [])

            return (
              <div
                key={i}
                style={{
                  ...styles.dayCell,
                  ...(c.otherMonth ? styles.otherMonth : {}),
                  ...(isToday ? styles.today : {}),
                }}
                onClick={() => !c.otherMonth && openEditor(dateStr)}
              >
                <div style={{
                  ...styles.dayNumber,
                  ...(isToday ? styles.todayNumber : {}),
                }}>
                  {c.day}
                </div>
                {!c.otherMonth && dayNotes.slice(0, 3).map((n, j) => (
                  <div key={j} style={styles.noteText}>{n}</div>
                ))}
                {!c.otherMonth && dayNotes.length > 3 && (
                  <div style={styles.noteMore}>+{dayNotes.length - 3}</div>
                )}
                {!c.otherMonth && dayNotes.length === 0 && (
                  <div style={styles.emptyHint}>+</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {editingDate && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setEditingDate(null)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{editingDate} 记事</h2>
            <textarea
              style={styles.textarea}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="每行一条记事"
              autoFocus
            />
            <div style={styles.modalActions}>
              <button style={styles.btnCancel} onClick={() => setEditingDate(null)}>取消</button>
              <button style={styles.btnSave} onClick={saveEditor}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#f0e8e3',
    display: 'flex', justifyContent: 'center',
    padding: '40px 20px', minHeight: '100vh',
  },
  container: {
    width: '100%', maxWidth: 1000,
    background: '#fdf7f4', borderRadius: 12,
    boxShadow: '0 2px 12px rgba(118,108,101,0.1)',
    padding: 24, height: 'fit-content',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: 600, color: '#5a4e48', minWidth: 150, textAlign: 'center' },
  navBtn: {
    background: 'none', border: '1px solid #e5dfd9', borderRadius: 6,
    padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: '#766c65',
  },
  todayBtn: {
    background: '#c75b49', color: '#fff', border: 'none', borderRadius: 6,
    padding: '6px 16px', cursor: 'pointer', fontSize: 14,
  },
  weekdays: {
    display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
    textAlign: 'center', fontWeight: 600, color: '#8c7e76',
    fontSize: 13, padding: '8px 0', borderBottom: '1px solid #ede5df',
  },
  weekday: {},
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
  dayCell: {
    minHeight: 100, borderBottom: '1px solid #ede5df', borderRight: '1px solid #ede5df',
    padding: '4px 6px', cursor: 'pointer',
  },
  otherMonth: { background: '#faf5f1' },
  today: { background: '#f5e6e2' },
  dayNumber: { fontSize: 13, fontWeight: 500, color: '#5a4e48', marginBottom: 2 },
  todayNumber: {
    background: '#c75b49', color: '#fff', borderRadius: '50%',
    width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  noteText: {
    fontSize: 11, color: '#766c65', lineHeight: 1.4,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1,
  },
  noteMore: { fontSize: 10, color: '#b5a89e', marginTop: 1 },
  emptyHint: { color: '#d8cfca', fontSize: 12, textAlign: 'center', marginTop: 8 },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(118,108,101,0.35)',
    zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    background: '#fdf7f4', borderRadius: 10, padding: 24,
    width: 360, maxWidth: '90vw', boxShadow: '0 8px 30px rgba(118,108,101,0.15)',
  },
  modalTitle: { fontSize: 16, marginBottom: 12, color: '#5a4e48' },
  textarea: {
    width: '100%', height: 180, border: '1px solid #e5dfd9', borderRadius: 6,
    padding: 10, fontSize: 14, resize: 'vertical', fontFamily: 'inherit',
    lineHeight: 1.6, background: '#fff', boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  btnCancel: {
    padding: '6px 16px', borderRadius: 6, border: '1px solid #e5dfd9',
    cursor: 'pointer', fontSize: 13, background: '#fff', color: '#766c65',
  },
  btnSave: {
    padding: '6px 16px', borderRadius: 6, border: '1px solid #c75b49',
    cursor: 'pointer', fontSize: 13, background: '#c75b49', color: '#fff',
  },
}
