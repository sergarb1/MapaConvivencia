<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'
import IncidentForm from './IncidentForm.vue'

const { state, t, getHeat, getEmotionHeat, addRecord, activeLayers, layerLabel, showToast, getCriticalZones } = useStore()

const activeLayerId = ref('incidents')
const showForm = ref(false)
const selectedZoneId = ref(null)

const activeLayer = computed(() => state.layers[activeLayerId.value])

const heatZones = computed(() => {
  if (!activeLayer.value || !activeLayer.value.enabled) return state.zones.map(z => ({ ...z, count: 0, intensity: 0 }))
  if (activeLayer.value.type === 'emotional') {
    return getEmotionHeat(activeLayerId.value)
  }
  return getHeat(activeLayerId.value)
})

function hexToRgb(hex) {
  const h = hex.replace('#','')
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) }
}

function heatColor(intensity) {
  if (intensity === 0) return null
  const c = activeLayer.value?.color
  if (c) {
    const { r, g, b } = hexToRgb(c)
    const alpha = 0.15 + intensity * 0.35
    return `rgba(${r},${g},${b},${alpha})`
  }
  if (intensity <= 0.25) return 'rgba(34,197,94,0.2)'
  if (intensity <= 0.5) return 'rgba(250,204,21,0.3)'
  if (intensity <= 0.75) return 'rgba(251,146,60,0.4)'
  return 'rgba(239,68,68,0.5)'
}

function heatBorder(intensity) {
  if (intensity === 0) return null
  const c = activeLayer.value?.color
  if (c) {
    const { r, g, b } = hexToRgb(c)
    return `rgba(${r},${g},${b},${0.4 + intensity * 0.6})`
  }
  if (intensity <= 0.25) return '#22c55e'
  if (intensity <= 0.5) return '#eab308'
  if (intensity <= 0.75) return '#f97316'
  return '#ef4444'
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
  gridTemplateRows: `repeat(${state.rows}, 1fr)`,
  gap: '8px',
}))

function zoneStyle(z) {
  const heat = heatColor(z.intensity)
  const border = heatBorder(z.intensity)
  const baseColor = z.color || 'var(--color-card)'
  const hasHeat = z.intensity > 0
  return {
    gridColumn: `${z.x + 1} / span ${z.w}`,
    gridRow: `${z.y + 1} / span ${z.h}`,
    background: hasHeat
      ? `linear-gradient(135deg, ${baseColor} 0%, ${baseColor} 50%, ${heat} 100%)`
      : baseColor,
    borderColor: hasHeat ? border : 'var(--color-border)',
    borderWidth: hasHeat ? '2px' : '1px',
    boxShadow: hasHeat ? `0 0 0 1px ${border}` : 'none',
  }
}

function openForm(zoneId) {
  selectedZoneId.value = zoneId
  showForm.value = true
}

const criticalZones = computed(() => {
  if (!activeLayer.value?.enabled) return []
  return getCriticalZones(activeLayerId.value, 5)
})

function onSave(record) {
  addRecord(activeLayerId.value, { ...record, zoneId: selectedZoneId.value })
  showForm.value = false
  selectedZoneId.value = null
  showToast('✅ ' + t('addRecord'))
}

const totalRecords = computed(() => {
  if (!activeLayer.value) return 0
  return activeLayer.value.data.length
})

const selectedLayerData = computed(() => {
  const l = activeLayer.value
  if (!l) return null
  return { id: l.id, color: l.color, icon: l.icon }
})
</script>

<template>
  <div>
    <!-- Active layer selector -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <label class="text-sm font-medium text-[var(--color-text-secondary)]">{{ t('activeLayer') }}:</label>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="l in activeLayers" :key="l.id"
          @click="activeLayerId = l.id"
          :disabled="!l.enabled"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-30 disabled:cursor-not-allowed min-h-[32px]"
          :class="activeLayerId === l.id
            ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700'">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: state.layers[l.id]?.color }"></span>
          <span>{{ layerLabel(l) }}</span>
        </button>
      </div>
      <span class="text-xs text-[var(--color-text-secondary)]">
        {{ totalRecords }} {{ t('recordsIn').toLowerCase() }}
      </span>
    </div>

    <!-- Grid -->
    <div v-if="activeLayer" class="bg-[var(--color-card)] rounded-2xl p-4 sm:p-6 border border-[var(--color-border)]">
      <div :style="gridStyle" class="min-h-[300px] sm:min-h-[400px]">
        <button v-for="z in heatZones" :key="z.id"
          @click="openForm(z.id)"
          :style="zoneStyle(z)"
          class="relative rounded-xl border p-2 sm:p-3 flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:scale-[1.03] active:scale-[0.97] cursor-pointer min-h-[80px] group">
          <span class="text-xs font-medium leading-tight opacity-70 group-hover:opacity-100 transition-opacity">{{ z.label }}</span>
          <span v-if="z.count > 0" class="text-lg font-bold mt-0.5" :style="{ color: activeLayer?.color }">{{ z.count }}</span>
          <template v-if="z.count === 0">
            <span class="text-lg mt-0.5 opacity-30 group-hover:opacity-60 transition-opacity">+</span>
          </template>
          <div v-if="z.happy !== undefined && z.total > 0" class="flex gap-0.5 mt-1 text-[10px]">
            <span>😊{{ z.happy }}</span>
            <span>😐{{ z.neutral }}</span>
            <span>😢{{ z.sad }}</span>
            <span>😰{{ z.anxious }}</span>
            <span>😡{{ z.angry }}</span>
          </div>
          <span v-if="criticalZones.includes(z.id)"
            class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-lg animate-pulse"
            title="Zona crítica">🚨</span>
          <span class="absolute -bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/10 dark:bg-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs text-[var(--color-text-secondary)]">+</span>
        </button>
      </div>

      <!-- Legend -->
      <div class="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
        <span>{{ t('heatmap') }}:</span>
        <div class="flex items-center gap-1">
          <span>0</span>
          <div v-for="i in 4" :key="i"
            class="w-5 h-3 rounded border"
            :style="{
              background: heatColor((i+1)*0.25) || 'var(--color-card)',
              borderColor: heatBorder((i+1)*0.25) || 'var(--color-border)',
            }"></div>
          <span>máx</span>
        </div>
        <span v-if="selectedLayerData" class="flex items-center gap-1 ml-2">
          <span class="w-2.5 h-2.5 rounded-full inline-block" :style="{background: selectedLayerData.color}"></span>
          <span>{{ layerLabel({ id: selectedLayerData.id }) }}</span>
        </span>
        <span class="ml-auto">{{ t('clickToAdd') || 'Click para añadir' }}</span>
      </div>
    </div>

    <div v-else class="bg-[var(--color-card)] rounded-2xl p-8 border border-[var(--color-border)] text-center text-[var(--color-text-secondary)]">
      {{ t('noLayer') }}
    </div>

    <!-- Modal -->
    <IncidentForm v-if="showForm" :layerId="activeLayerId" :zoneId="selectedZoneId"
      @save="onSave" @close="showForm = false" />
  </div>
</template>