<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'
import { icons } from '../composables/icons.js'

const { state, t, addRecord, activeLayers, layerLabel } = useStore()

const showModal = ref(false)
const zoneId = ref('')
const layerId = ref('')
const severity = ref(1)
const description = ref('')

const activeLayerList = computed(() => activeLayers.value)

const zones = computed(() => state.zones)

function open() {
  zoneId.value = zones.value[0]?.id || ''
  layerId.value = activeLayerList.value[0]?.id || ''
  severity.value = 1
  description.value = ''
  showModal.value = true
}

function save() {
  if (!zoneId.value || !layerId.value) return
  const layer = state.layers[layerId.value]
  const record = {
    zoneId: zoneId.value,
    timestamp: new Date().toISOString(),
    description: description.value,
  }
  if (layer.type === 'incidents' || layer.id === 'incidents') {
    record.type = 'verbal'
    record.severity = severity.value
  } else if (layer.type === 'emotional' || layer.id === 'emotion') {
    record.mood = severity.value <= 2 ? 'sad' : severity.value >= 4 ? 'happy' : 'neutral'
  } else {
    record.level = severity.value
  }
  addRecord(layerId.value, record)
  showModal.value = false
}

defineExpose({ open })
</script>

<template>
  <!-- FAB -->
  <button @click="open"
    class="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center"
    :title="t('addRecord')">
    <span v-html="icons.plus" class="icon-svg w-7 h-7"></span>
  </button>

  <!-- Modal -->
  <div v-if="showModal" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showModal = false">
    <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
      <div class="flex items-center gap-3 mb-4">
        <span v-html="icons.zap" class="icon-svg w-6 h-6 text-[var(--color-accent)]"></span>
        <h3 class="font-heading font-bold text-lg">{{ t('addRecord') }}</h3>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">{{ t('zone') }}</label>
          <select v-model="zoneId" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.label }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('type') }}</label>
          <select v-model="layerId" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option v-for="l in activeLayerList" :key="l.id" :value="l.id">{{ l.icon }} {{ layerLabel(l) }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">{{ t('severity') }}:</label>
          <div class="flex gap-1.5">
            <button v-for="s in 5" :key="s"
              @click="severity = s"
              class="toggle-btn flex-1 justify-center"
              :class="severity === s ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              {{ ['Mín','Baja','Media','Alta','Máx'][s-1] }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">{{ t('description') }}</label>
          <textarea v-model="description" rows="2" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" :placeholder="t('description') + '...'"></textarea>
        </div>
      </div>

      <div class="flex gap-2 mt-6">
        <button @click="save" class="flex-1 bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('save') }}</button>
        <button @click="showModal = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
      </div>
    </div>
  </div>
</template>
