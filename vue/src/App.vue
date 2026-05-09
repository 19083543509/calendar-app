<script setup>
import { ref, reactive, computed } from 'vue'

const NOTES_KEY = 'calendar_notes'

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY)) || {}
  } catch { return {} }
}

function saveNotes(n) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(n))
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

const notes = reactive(loadNotes())
const year = ref(today.getFullYear())
const month = ref(today.getMonth())
const editingDate = ref(null)
const editText = ref('')

const cells = computed(() => getMonthData(year.value, month.value))

function persistNotes(fn) {
  const next = fn({ ...notes })
  Object.keys(notes).forEach(k => delete notes[k])
  Object.assign(notes, next)
  saveNotes(next)
}

function prevMonth() {
  if (month.value === 0) { year.value--; month.value = 11 }
  else month.value--
}

function nextMonth() {
  if (month.value === 11) { year.value++; month.value = 0 }
  else month.value++
}

function goToday() {
  year.value = today.getFullYear()
  month.value = today.getMonth()
}

function openEditor(dateStr) {
  editingDate.value = dateStr
  editText.value = (notes[dateStr] || []).join('\n')
}

function closeEditor() {
  editingDate.value = null
}

function saveEditor() {
  if (!editingDate.value) return
  const lines = editText.value.split('\n').map(l => l.trim()).filter(l => l)
  persistNotes(prev => {
    const next = { ...prev }
    if (lines.length) next[editingDate.value] = lines
    else delete next[editingDate.value]
    return next
  })
  editingDate.value = null
}

function getNotes(dateStr) {
  return notes[dateStr] || []
}
</script>

<template>
  <div class="app">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button class="nav-btn" @click="prevMonth">◀</button>
          <h1 class="title">{{ year }}年{{ month + 1 }}月</h1>
          <button class="nav-btn" @click="nextMonth">▶</button>
        </div>
        <button class="today-btn" @click="goToday">今天</button>
      </div>

      <div class="weekdays">
        <span v-for="d in ['一','二','三','四','五','六','日']" :key="d">{{ d }}</span>
      </div>

      <div class="grid">
        <div
          v-for="(c, i) in cells"
          :key="i"
          class="day-cell"
          :class="{ 'other-month': c.otherMonth, today: toDateStr(c.year, c.month, c.day) === todayStr }"
          @click="!c.otherMonth && openEditor(toDateStr(c.year, c.month, c.day))"
        >
          <div class="day-number" :class="{ 'today-number': toDateStr(c.year, c.month, c.day) === todayStr }">
            {{ c.day }}
          </div>
          <template v-if="!c.otherMonth">
            <div v-for="(n, j) in getNotes(toDateStr(c.year, c.month, c.day)).slice(0, 3)" :key="j" class="note-text">{{ n }}</div>
            <div v-if="getNotes(toDateStr(c.year, c.month, c.day)).length > 3" class="note-more">+{{ getNotes(toDateStr(c.year, c.month, c.day)).length - 3 }}</div>
            <div v-if="getNotes(toDateStr(c.year, c.month, c.day)).length === 0" class="empty-hint">+</div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="editingDate" class="overlay" @click.self="closeEditor">
      <div class="modal">
        <h2 class="modal-title">{{ editingDate }} 记事</h2>
        <textarea class="textarea" v-model="editText" placeholder="每行一条记事" @keydown.esc="closeEditor" @keydown.ctrl.enter="saveEditor" @keydown.meta.enter="saveEditor"></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeEditor">取消</button>
          <button class="btn-save" @click="saveEditor">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
.app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  background: #f0e8e3;
  display: flex; justify-content: center;
  padding: 40px 20px; min-height: 100vh;
}
.container {
  width: 100%; max-width: 1000px;
  background: #fdf7f4; border-radius: 12px;
  box-shadow: 0 2px 12px rgba(118,108,101,0.1);
  padding: 24px; height: fit-content;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.title { font-size: 22px; font-weight: 600; color: #5a4e48; min-width: 150px; text-align: center; }
.nav-btn {
  background: none; border: 1px solid #e5dfd9; border-radius: 6px;
  padding: 6px 12px; cursor: pointer; font-size: 16px; color: #766c65;
}
.nav-btn:hover { background: #f0e6df; border-color: #d8cfca; }
.today-btn {
  background: #c75b49; color: #fff; border: none; border-radius: 6px;
  padding: 6px 16px; cursor: pointer; font-size: 14px;
}
.today-btn:hover { background: #b04a3a; }
.weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; font-weight: 600; color: #8c7e76;
  font-size: 13px; padding: 8px 0; border-bottom: 1px solid #ede5df;
}
.grid { display: grid; grid-template-columns: repeat(7, 1fr); }
.day-cell {
  min-height: 100px; border-bottom: 1px solid #ede5df; border-right: 1px solid #ede5df;
  padding: 4px 6px; cursor: pointer;
}
.day-cell:nth-child(7n) { border-right: none; }
.day-cell:hover { background: #f6eee8; }
.day-cell.other-month { background: #faf5f1; }
.day-cell.today { background: #f5e6e2; }
.day-number { font-size: 13px; font-weight: 500; color: #5a4e48; margin-bottom: 2px; }
.day-number.today-number {
  background: #c75b49; color: #fff; border-radius: 50%;
  width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
}
.note-text { font-size: 11px; color: #766c65; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 1px; }
.note-more { font-size: 10px; color: #b5a89e; margin-top: 1px; }
.empty-hint { color: #d8cfca; font-size: 12px; text-align: center; margin-top: 8px; }
.overlay {
  position: fixed; inset: 0; background: rgba(118,108,101,0.35);
  z-index: 100; display: flex; justify-content: center; align-items: center;
}
.modal {
  background: #fdf7f4; border-radius: 10px; padding: 24px;
  width: 360px; max-width: 90vw; box-shadow: 0 8px 30px rgba(118,108,101,0.15);
}
.modal-title { font-size: 16px; margin-bottom: 12px; color: #5a4e48; }
.textarea {
  width: 100%; height: 180px; border: 1px solid #e5dfd9; border-radius: 6px;
  padding: 10px; font-size: 14px; resize: vertical; font-family: inherit; line-height: 1.6; background: #fff;
}
.textarea:focus { outline: none; border-color: #c75b49; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.modal-actions button {
  padding: 6px 16px; border-radius: 6px; border: 1px solid #e5dfd9;
  cursor: pointer; font-size: 13px;
}
.btn-cancel { background: #fff; color: #766c65; }
.btn-cancel:hover { background: #f6eee8; }
.btn-save { background: #c75b49; color: #fff; border-color: #c75b49 !important; }
.btn-save:hover { background: #b04a3a; }
</style>
