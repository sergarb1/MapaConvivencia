<script setup>
import { ref, computed, watch } from 'vue'
import { useStore } from '../composables/useStore.js'
import IncidentForm from './IncidentForm.vue'

const { state, t, getRecords, removeRecord, updateRecord, activeLayers, layerLabel, showToast } = useStore()

const showForm = ref(false)
const formZoneId = ref(null)
const editingRecord = ref(null)
const showDeleteConfirm = ref(false)
const pendingDeleteId = ref(null)

const filterLayerId = ref(activeLayers.value[0]?.id || 'incidents')
const filterZoneId = ref('')
const filterType = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const activeLayer = computed(() => state.layers[filterLayerId.value])

const records = computed(() => {
  return getRecords(filterLayerId.value, {
    zoneId: filterZoneId.value || undefined,
    type: filterType.value || undefined,
    dateFrom: dateFrom.value || undefined,
    dateTo: dateTo.value || undefined,
  })
})

function zoneLabel(zoneId) {
  return state.zones.find(z => z.id === zoneId)?.label || zoneId
}

function typeLabel(type) {
  const map = { physical: t('physical'), verbal: t('verbal'), social: t('social'), cyberType: t('cyberType'), micro: t('micro') }
  return map[type] || type
}

function moodEmoji(mood) {
  const map = { happy: '😊', neutral: '😐', sad: '😢', anxious: '😰', angry: '😡' }
  return map[mood] || '😐'
}

function confirmDelete(id) {
  pendingDeleteId.value = id
  showDeleteConfirm.value = true
}

function doDelete() {
  if (pendingDeleteId.value) {
    removeRecord(filterLayerId.value, pendingDeleteId.value)
    showToast('🗑 ' + t('delete') + ' — ' + t('confirm'))
  }
  showDeleteConfirm.value = false
  pendingDeleteId.value = null
}

function startEdit(r) {
  formZoneId.value = r.zoneId
  editingRecord.value = r
  showForm.value = true
}

function onEditSave(data) {
  if (editingRecord.value) {
    updateRecord(filterLayerId.value, editingRecord.value.id, data)
    showToast('✏️ ' + t('editRecord') + ' — ' + t('save'))
  }
  showForm.value = false
  editingRecord.value = null
  formZoneId.value = null
}

const uniqueZones = computed(() => [...new Set((activeLayer.value?.data || []).map(r => r.zoneId))])
const uniqueTypes = computed(() => [...new Set((activeLayer.value?.data || []).map(r => r.type).filter(Boolean))])

function clearFilters() {
  filterZoneId.value = ''
  filterType.value = ''
  dateFrom.value = ''
  dateTo.value = ''
}

// Ensure the selected layer is valid and reactive
watch(() => activeLayers.value, (layers) => {
  if (!state.layers[filterLayerId.value] || !state.layers[filterLayerId.value].enabled) {
    const first = layers[0]
    if (first) filterLayerId.value = first.id
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <!-- Layer selector -->
    <div class="flex items-center gap-3">
      <label class="text-sm font-medium text-[var(--color-text-secondary)]">{{ t('activeLayer') }}:</label>
      <select v-model="filterLayerId" class="border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
        <option v-for="l in activeLayers" :key="l.id" :value="l.id">{{ l.icon }} {{ layerLabel(l) }}</option>
      </select>
    </div>

    <!-- Filters -->
    <div class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs font-medium mb-1 text-[var(--color-text-secondary)]">{{ t('zone') }}</label>
          <select v-model="filterZoneId" class="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-transparent">
            <option value="">{{ t('all') }}</option>
            <option v-for="zId in uniqueZones" :key="zId" :value="zId">{{ zoneLabel(zId) }}</option>
          </select>
        </div>
        <div v-if="uniqueTypes.length">
          <label class="block text-xs font-medium mb-1 text-[var(--color-text-secondary)]">{{ t('type') }}</label>
          <select v-model="filterType" class="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-transparent">
            <option value="">{{ t('all') }}</option>
            <option v-for="tp in uniqueTypes" :key="tp" :value="tp">{{ typeLabel(tp) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-[var(--color-text-secondary)]">{{ t('fromDate') }}</label>
          <input type="date" v-model="dateFrom" class="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-transparent" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1 text-[var(--color-text-secondary)]">{{ t('toDate') }}</label>
          <input type="date" v-model="dateTo" class="border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-sm bg-transparent" />
        </div>
        <button @click="clearFilters" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1.5">{{ t('clearFilters') }}</button>
      </div>
    </div>

    <!-- Records count -->
    <p class="text-sm text-[var(--color-text-secondary)]">{{ records.length }} {{ t('records') }}</p>

    <!-- List -->
    <div v-if="records.length" class="space-y-2">
      <div v-for="r in records" :key="r.id" class="bg-[var(--color-card)] rounded-xl p-3 sm:p-4 border border-[var(--color-border)] flex items-start gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-medium bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-lg px-2 py-0.5">{{ zoneLabel(r.zoneId) }}</span>
            <span v-if="r.type" class="text-xs bg-slate-100 dark:bg-slate-700 rounded-lg px-2 py-0.5">{{ typeLabel(r.type) }}</span>
            <span v-if="r.mood" class="text-lg">{{ moodEmoji(r.mood) }}</span>
            <span v-if="r.severity" class="text-xs">⚠️ {{ r.severity }}/5</span>
            <span v-if="r.level" class="text-xs">📊 {{ r.level }}/5</span>
            <span v-if="r.minutes" class="text-xs">⏱ {{ r.minutes }}{{ t('minutes') }}</span>
            <span v-if="r.positiveType" class="text-xs">⭐ {{ t('positive'+r.positiveType.charAt(0).toUpperCase()+r.positiveType.slice(1)) }}</span>
            <span v-if="r.platform" class="text-xs">📱 {{ t(r.platform) }}</span>
          </div>
          <p v-if="r.description" class="text-sm mt-1 text-[var(--color-text-secondary)]">{{ r.description }}</p>
          <p class="text-xs text-[var(--color-text-secondary)] mt-1 opacity-60">{{ new Date(r.timestamp).toLocaleString() }}</p>
        </div>
        <div class="flex items-center gap-1 flex-shrink-0">
          <button @click="startEdit(r)" class="text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg px-2 py-1 transition text-sm">{{ t('edit') }}</button>
          <button @click="confirmDelete(r.id)" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2 py-1 transition text-sm">{{ t('delete') }}</button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12 text-[var(--color-text-secondary)]">
      {{ t('heatEmpty') }}
    </div>

    <!-- Delete confirm modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showDeleteConfirm = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">🗑</span>
          <h3 class="font-heading font-bold text-lg">{{ t('delete') }}</h3>
        </div>
        <p class="text-sm text-[var(--color-text-secondary)] mb-6">{{ t('confirmDeleteRecord') }}</p>
        <div class="flex gap-2">
          <button @click="doDelete" class="flex-1 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition text-sm">{{ t('confirm') }}</button>
          <button @click="showDeleteConfirm = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>

    <IncidentForm v-if="showForm" :layerId="filterLayerId" :zoneId="formZoneId" :record="editingRecord"
      @save="onEditSave" @close="showForm = false" />
  </div>
</template>
