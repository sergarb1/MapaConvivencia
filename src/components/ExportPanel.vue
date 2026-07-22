<script setup>
import { ref } from 'vue'
import { useStore } from '../composables/useStore.js'

const { state, t, exportJSON, importJSON, resetAll, seedTestData, activeLayers, layerLabel } = useStore()
const emit = defineEmits(['reset'])

const reportDays = ref(30)

const importMessage = ref('')
const importError = ref(false)
const showSeedEditor = ref(false)
const showResetConfirm = ref(false)

const seedOpts = ref({
  incidents: 20, emotion: 12, positive: 10,
  cyber: 6, presence: 6, noise: 5, days: 21
})

function openSeedEditor() { showSeedEditor.value = true }

defineExpose({ openSeedEditor })

function doExport() {
  const json = exportJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `MapaConvivencia_${state.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function doPrint() {
  window.print()
}

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const ok = importJSON(ev.target.result)
    if (ok) {
      importMessage.value = '✅ ' + t('importSuccess')
      importError.value = false
    } else {
      importMessage.value = '❌ ' + t('importError')
      importError.value = true
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

function copyJSON() {
  navigator.clipboard.writeText(exportJSON()).then(() => {
    importMessage.value = '✅ ' + t('copied')
    importError.value = false
  })
}

function generateReport() {
  const cutoff = new Date(Date.now() - reportDays.value * 86400000)
  const allRecords = []
  activeLayers.value.forEach(l => {
    l.data.forEach(r => {
      if (new Date(r.timestamp) >= cutoff) {
        allRecords.push({ ...r, layerId: l.id, layerName: layerLabel(l), layerIcon: l.icon })
      }
    })
  })
  allRecords.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const zoneMap = {}
  state.zones.forEach(z => zoneMap[z.id] = z.label)

  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html>
<html lang="${state.lang}">
<head><meta charset="UTF-8"><title>${t('appTitle')} — ${t('data')}</title>
<style>
  @page { margin: 1.5cm }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.5; font-size: 12px }
  h1 { font-size: 20px; margin: 0 }
  h2 { font-size: 14px; margin: 24px 0 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px }
  .sub { color: #64748b; font-size: 11px }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0 }
  .stat-card { background: #f1f5f9; border-radius: 8px; padding: 10px; text-align: center }
  .stat-card .n { font-size: 22px; font-weight: 700 }
  .stat-card .l { font-size: 10px; color: #64748b }
  table { width: 100%; border-collapse: collapse; margin-top: 8px }
  th { background: #6366f1; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 600 }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top }
  tr:nth-child(even) td { background: #f8fafc }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: #e2e8f0 }
  .sev1 { background: #dcfce7; color: #166534 }
  .sev2 { background: #fef9c3; color: #854d0e }
  .sev3 { background: #fed7aa; color: #9a3412 }
  .sev4 { background: #fecaca; color: #991b1b }
  .sev5 { background: #fca5a5; color: #7f1d1d }
  .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact } }
</style></head>
<body>
<div class="header">
  <div>
    <h1>${t('appTitle')}</h1>
    <p class="sub">${state.projectName}</p>
  </div>
  <div class="sub">${new Date().toLocaleDateString(state.lang === 'en' ? 'en-US' : 'es-ES')}</div>
</div>
<p class="sub">${t('evolution')}: ${reportDays.value} ${t('days')} · ${allRecords.length} ${t('recordsTotal')}</p>
<div class="stats">
  <div class="stat-card"><div class="n">${allRecords.length}</div><div class="l">${t('total')}</div></div>
  <div class="stat-card"><div class="n">${activeLayers.value.length}</div><div class="l">${t('tipos')}</div></div>
  <div class="stat-card"><div class="n">${state.zones.length}</div><div class="l">${t('zones')}</div></div>
  <div class="stat-card"><div class="n">${[...new Set(allRecords.map(r => r.timestamp.slice(0, 10)))].length}</div><div class="l">${t('days')}</div></div>
</div>
<h2>${t('records')} (${allRecords.length})</h2>
<table>
<thead><tr>
  <th>${t('date')}</th>
  <th>${t('zone')}</th>
  <th>${t('type')}</th>
  <th>${t('severity')}</th>
  <th>${t('description')}</th>
</tr></thead>
<tbody>
${allRecords.map(r => {
  const sev = r.severity ? `<span class="badge sev${r.severity}">${t('sev' + r.severity)}</span>` : '<span class="badge">—</span>'
  return `<tr>
    <td>${r.timestamp.slice(0, 10)}</td>
    <td>${zoneMap[r.zoneId] || r.zoneId}</td>
    <td>${r.layerIcon} ${r.layerName}</td>
    <td>${sev}</td>
    <td>${r.description || ''}</td>
  </tr>`
}).join('\n')}
</tbody>
</table>
<div class="footer">
  ${t('appTitle')} — ${t('legalLocal')} · ${t('legalLicense')}
</div>
<script>window.print()<\\/script>
</body></html>`)
  w.document.close()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Import (first, most important) -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border-2 border-indigo-200 dark:border-indigo-800">
      <h3 class="font-heading font-bold text-lg mb-2">{{ t('importJSON') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ t('importDesc') }}</p>
      <label class="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm cursor-pointer">
        📂 {{ t('import') }} JSON
        <input type="file" accept=".json" @change="handleImport" class="hidden" />
      </label>
      <p v-if="importMessage" class="mt-3 text-sm" :class="importError ? 'text-red-500' : 'text-green-600'">{{ importMessage }}</p>
    </div>

    <!-- Export -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h3 class="font-heading font-bold text-lg mb-2">{{ t('exportJSON') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ t('exportDesc') }}</p>
      <div class="flex flex-wrap gap-3">
        <button @click="doExport" class="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm flex items-center gap-2">
          ⬇ {{ t('download') }} JSON
        </button>
        <button @click="copyJSON" class="bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm flex items-center gap-2">
          📋 {{ t('copyJSON') }}
        </button>
      </div>
    </div>

    <!-- Report -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h3 class="font-heading font-bold text-lg mb-2">📋 {{ t('data') }} — {{ t('print') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ 'Genera un informe detallado con todos los registros en formato imprimible.' }}</p>
      <div class="flex flex-wrap items-center gap-3">
        <select v-model="reportDays" class="border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
          <option :value="7">7 {{ t('days') }}</option>
          <option :value="14">14 {{ t('days') }}</option>
          <option :value="30">30 {{ t('days') }}</option>
          <option :value="365">365 {{ t('days') }}</option>
        </select>
        <button @click="generateReport" class="bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm flex items-center gap-2">
          📄 {{ t('data') }}
        </button>
      </div>
    </div>

    <!-- Print -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h3 class="font-heading font-bold text-lg mb-2">{{ t('print') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ t('printDesc') }}</p>
      <button @click="doPrint" class="bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm flex items-center gap-2">
        🖨 {{ t('printMap') }}
      </button>
    </div>

    <!-- Seed data -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
      <h3 class="font-heading font-bold text-lg mb-2">{{ t('seedData') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ t('seedDataDesc') }}</p>
      <button @click="showSeedEditor = true" class="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm">
        🧪 {{ t('seedData') }}
      </button>
    </div>

    <!-- Reset -->
    <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-red-200 dark:border-red-900/40">
      <h3 class="font-heading font-bold text-lg mb-2 text-red-600 dark:text-red-400">{{ t('resetData') }}</h3>
      <p class="text-sm text-[var(--color-text-secondary)] mb-4">{{ t('resetDesc') }}</p>
      <button @click="showResetConfirm = true" class="bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 transition text-sm">{{ t('resetData') }}</button>
    </div>

    <!-- Seed editor -->
    <div v-if="showSeedEditor" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showSeedEditor = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">🧪</span>
          <div>
            <h3 class="font-heading font-bold text-lg">{{ t('seedData') }}</h3>
            <p class="text-sm text-[var(--color-text-secondary)])">{{ 'Configura los datos de ejemplo antes de generarlos.' }}</p>
          </div>
        </div>
        <div class="space-y-4">
          <div v-for="s in [{key:'incidents',icon:'⚠',label:t('layerIncidents')},{key:'emotion',icon:'😊',label:t('layerEmotion')},{key:'positive',icon:'⭐',label:t('layerPositive')},{key:'cyber',icon:'📱',label:t('layerCyber')},{key:'presence',icon:'👤',label:t('layerPresence')},{key:'noise',icon:'🔊',label:t('layerNoise')}]" :key="s.key" class="flex items-center gap-3">
            <span class="text-base w-6">{{ s.icon }}</span>
            <div class="flex-1">
              <div class="flex justify-between text-xs">
                <span>{{ s.label }}</span>
                <span class="font-medium">{{ seedOpts[s.key] }}</span>
              </div>
              <input type="range" :min="0" :max="50" v-model.number="seedOpts[s.key]" class="w-full accent-emerald-600" />
            </div>
          </div>
          <div class="pt-2 border-t border-[var(--color-border)]">
            <div class="flex justify-between text-xs mb-1">
              <span>{{ t('evolution') }} ({{ t('days') }})</span>
              <span class="font-medium">{{ seedOpts.days }}</span>
            </div>
            <input type="range" min="3" max="60" v-model.number="seedOpts.days" class="w-full accent-emerald-600" />
            <div class="flex justify-between text-[10px] text-[var(--color-text-secondary)]"><span>3 {{ t('days') }}</span><span>60 {{ t('days') }}</span></div>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button @click="seedTestData(seedOpts); showSeedEditor = false" class="flex-1 bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition text-sm">{{ t('generate') || 'Generar' }}</button>
          <button @click="showSeedEditor = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- Reset confirm -->
    <div v-if="showResetConfirm" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showResetConfirm = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">⚠️</span>
          <h3 class="font-heading font-bold text-lg">{{ t('resetData') }}</h3>
        </div>
        <p class="text-sm text-[var(--color-text-secondary)] mb-6">{{ t('confirmReset') }}</p>
        <div class="flex gap-2">
          <button @click="resetAll(); emit('reset'); showResetConfirm = false" class="flex-1 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition text-sm">{{ t('confirm') }}</button>
          <button @click="showResetConfirm = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- Project info -->
    <div class="text-center text-xs text-[var(--color-text-secondary)] pt-4 border-t border-[var(--color-border)]">
      <p>MapaConvivencia v1.0 — {{ state.zones.length }} {{ t('zones').toLowerCase() }}, {{ Object.values(state.layers).reduce((s, l) => s + (l.data?.length || 0), 0) }} {{ t('recordsTotal') }}</p>
    </div>

    <!-- Legal footer -->
    <div class="text-center text-[10px] text-[var(--color-text-secondary)] opacity-60 space-y-0.5">
      <p>🔒 {{ t('legalLocal') }}</p>
      <p>⚖️ {{ t('legalLicense') }}</p>
    </div>
  </div>
</template>
