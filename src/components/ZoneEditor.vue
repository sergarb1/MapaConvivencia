<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'

const { state, t, TEMPLATES, loadTemplate, setZones, persist } = useStore()

const editing = ref(false)
const editName = ref('')
const editColor = ref('#e0f2fe')
const editX = ref(0)
const editY = ref(0)
const editW = ref(1)
const editH = ref(1)
const editingId = ref(null)

const availableTemplates = computed(() =>
  Object.entries(TEMPLATES).map(([id, tmpl]) => ({ id, ...tmpl }))
)

function useTemplate(id) {
  loadTemplate(id)
}

function startAdd() {
  editing.value = true
  editingId.value = null
  editName.value = ''
  editColor.value = '#e0f2fe'
  editX.value = 0
  editY.value = state.rows
  editW.value = 1
  editH.value = 1
}

function startEdit(z) {
  editing.value = true
  editingId.value = z.id
  editName.value = z.label
  editColor.value = z.color || '#e0f2fe'
  editX.value = z.x
  editY.value = z.y
  editW.value = z.w
  editH.value = z.h
}

function saveZone() {
  if (!editName.value.trim()) return
  if (editingId.value) {
    const z = state.zones.find(z => z.id === editingId.value)
    if (z) { z.label = editName.value; z.color = editColor.value; z.x = editX.value; z.y = editY.value; z.w = editW.value; z.h = editH.value }
  } else {
    state.zones.push({ id: 'z' + Date.now().toString(36), label: editName.value, x: editX.value, y: editY.value, w: editW.value, h: editH.value, color: editColor.value })
  }
  persist()
  editing.value = false
}

function removeZone(id) {
  state.zones = state.zones.filter(z => z.id !== id)
  persist()
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
  gridTemplateRows: `repeat(${state.rows}, 1fr)`,
  gap: '4px',
}))

function updateGrid(cols, rows) {
  state.cols = Math.max(2, Math.min(8, parseInt(cols) || 4))
  state.rows = Math.max(1, Math.min(8, parseInt(rows) || 3))
  persist()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Templates -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h3 class="font-heading font-bold mb-3">{{ t('useTemplate') }}</h3>
      <div class="flex flex-wrap gap-2">
        <button v-for="tmpl in availableTemplates" :key="tmpl.id"
          @click="useTemplate(tmpl.id)"
          class="px-4 py-2 rounded-xl border text-sm font-medium transition"
          :class="state.template === tmpl.id ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'border-[var(--color-border)] hover:bg-slate-50 dark:hover:bg-slate-700'">
          {{ tmpl.name }}
           <span class="text-xs opacity-60 ml-1">({{ tmpl.cols }}×{{ tmpl.rows }}, {{ tmpl.zones.length }} {{ t('zones').toLowerCase() }})</span>
        </button>
      </div>
    </div>

    <!-- Grid size -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <div class="flex items-center gap-4 flex-wrap">
        <label class="text-sm font-medium">{{ t('gridCols') }}:</label>
        <input type="number" :value="state.cols" @input="updateGrid($event.target.value, state.rows)" min="2" max="8" class="w-16 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm bg-transparent" />
        <label class="text-sm font-medium">{{ t('gridRows') }}:</label>
        <input type="number" :value="state.rows" @input="updateGrid(state.cols, $event.target.value)" min="1" max="8" class="w-16 border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm bg-transparent" />
        <button @click="startAdd" class="ml-auto bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('addZone') }}</button>
      </div>
    </div>

    <!-- Grid preview -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <div :style="gridStyle" class="min-h-[200px]">
        <div v-for="z in state.zones" :key="z.id"
          :style="{ gridColumn: `${z.x+1} / span ${z.w}`, gridRow: `${z.y+1} / span ${z.h}`, background: z.color || 'var(--color-card)' }"
          class="rounded-lg border border-[var(--color-border)] p-2 flex flex-col items-center justify-center text-center relative group cursor-pointer hover:shadow-md transition"
          @click="startEdit(z)">
          <span class="text-xs font-medium">{{ z.label }}</span>
          <span class="text-[10px] text-[var(--color-text-secondary)]">({{z.x}},{{z.y}} {{z.w}}×{{z.h}})</span>
          <button @click.stop="removeZone(z.id)"
            class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">×</button>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
    <div v-if="editing" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="editing = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-heading font-bold text-lg mb-4">{{ editingId ? t('editZone') : t('addZone') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('name') }}</label>
            <input v-model="editName" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('color') }}</label>
            <input type="color" v-model="editColor" class="w-full h-10 rounded-lg cursor-pointer" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-xs font-medium mb-1">{{ t('w') }}</label><input type="number" v-model.number="editW" min="1" class="w-full border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm bg-transparent" /></div>
            <div><label class="block text-xs font-medium mb-1">{{ t('h') }}</label><input type="number" v-model.number="editH" min="1" class="w-full border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm bg-transparent" /></div>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button @click="saveZone" class="flex-1 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('save') }}</button>
          <button @click="editing = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
