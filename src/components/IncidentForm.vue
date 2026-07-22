<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from '../composables/useStore.js'
import { icons } from '../composables/icons.js'
import { incidentTypes, cyberTypes, moodOptions, positiveOptions, severityLabels, platformOptions } from '../config/layerTypes.js'

const { state, t, showToast } = useStore()
const props = defineProps({ layerId: String, zoneId: String, record: Object })
const emit = defineEmits(['save', 'close'])

const isEditing = computed(() => !!props.record)
const layer = computed(() => state.layers[props.layerId])
const zone = computed(() => state.zones.find(z => z.id === props.zoneId))

const severity = ref(3)
const description = ref('')
const subType = ref('physical')
const platform = ref('whatsapp')
const mood = ref('neutral')
const level = ref(3)
const minutes = ref(5)
const positiveType = ref('help')
const involved = ref(2)

if (props.record) {
  const r = props.record
  severity.value = r.severity ?? 3
  description.value = r.description ?? ''
  subType.value = r.subType ?? r.type ?? 'physical'
  platform.value = r.platform ?? 'whatsapp'
  mood.value = r.mood ?? 'neutral'
  level.value = r.level ?? 3
  minutes.value = r.minutes ?? 5
  positiveType.value = r.positiveType ?? 'help'
  involved.value = r.involved ?? 2
}

const activeLayerId = computed(() => layer.value?.id)

function handleSave() {
  showToast('✅ ' + t(isEditing.value ? 'editRecord' : 'addRecord') + ' — ' + t('save'))
  const base = {
    zoneId: props.zoneId,
    timestamp: props.record?.timestamp || new Date().toISOString(),
    description: description.value,
  }
  if (!layer.value) return

  if (activeLayerId.value === 'incidents') {
    emit('save', { ...base, type: subType.value, severity: severity.value, involved: involved.value > 0 ? involved.value : undefined })
  } else if (activeLayerId.value === 'cyber') {
    emit('save', { ...base, type: subType.value, severity: severity.value, platform: platform.value })
  } else if (activeLayerId.value === 'emotion') {
    emit('save', { ...base, mood: mood.value })
  } else if (activeLayerId.value === 'positive') {
    emit('save', { ...base, positiveType: positiveType.value })
  } else if (activeLayerId.value === 'presence') {
    emit('save', { ...base, minutes: minutes.value })
  } else {
    emit('save', { ...base, level: level.value })
  }
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">{{ layer?.icon || '📝' }}</span>
        <div>
          <h3 class="font-heading font-bold text-lg">{{ isEditing ? '✏️ ' + t('editRecord') : t('addRecord') }}</h3>
          <p class="text-sm text-[var(--color-text-secondary)]">{{ zone?.label || '' }} — {{ layer?.name || layer?.id }}</p>
        </div>
      </div>

      <!-- Incidents -->
      <div v-if="activeLayerId === 'incidents'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('type') }}</label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="opt in incidentTypes" :key="opt.id"
              @click="subType = opt.id"
              class="toggle-btn"
              :class="subType === opt.id ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              <span v-html="icons[opt.icon]" class="icon-svg w-[16px] h-[16px] flex-shrink-0"></span>
              <span>{{ t(opt.labelKey) }}</span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('severity') }}</label>
          <div class="flex gap-1.5">
            <button v-for="s in 5" :key="s"
              @click="severity = s"
              class="toggle-btn flex-1 justify-center"
              :class="severity === s ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              {{ t(severityLabels[s-1]) }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">{{ 'Alumnos implicados' }}</label>
          <select v-model.number="involved" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>

      <!-- Cyber -->
      <div v-else-if="activeLayerId === 'cyber'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('type') }}</label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="opt in cyberTypes" :key="opt.id"
              @click="subType = opt.id"
              class="toggle-btn"
              :class="subType === opt.id ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              <span v-html="icons[opt.icon]" class="icon-svg w-[16px] h-[16px] flex-shrink-0"></span>
              <span>{{ t(opt.labelKey) }}</span>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('platform') }}</label>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="p in platformOptions" :key="p"
              @click="platform = p"
              class="toggle-btn"
              :class="platform === p ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              {{ t(p) }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">{{ t('severity') }}</label>
          <div class="flex gap-1.5">
            <button v-for="s in 5" :key="s"
              @click="severity = s"
              class="toggle-btn flex-1 justify-center"
              :class="severity === s ? 'toggle-btn-active' : 'toggle-btn-inactive'">
              {{ t(severityLabels[s-1]) }}
            </button>
          </div>
        </div>
      </div>

      <!-- Emotion -->
      <div v-else-if="activeLayerId === 'emotion'" class="space-y-4">
        <label class="block text-sm font-medium mb-2">{{ t('emotionCheck') }}</label>
        <div class="flex justify-center gap-3">
          <button v-for="m in moodOptions" :key="m.id"
            @click="mood = m.id"
            class="text-3xl p-3 rounded-xl border-2 transition-all duration-150 hover:scale-110"
            :class="mood === m.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-transparent hover:border-[var(--color-border)]'">
            {{ m.emoji }}
          </button>
        </div>
      </div>

      <!-- Positive behaviors -->
      <div v-else-if="activeLayerId === 'positive'" class="space-y-4">
        <label class="block text-sm font-medium mb-2">{{ t('positiveType') }}</label>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="p in positiveOptions" :key="p.id"
            @click="positiveType = p.id"
            class="toggle-btn"
            :class="positiveType === p.id ? 'toggle-btn-positive' : 'toggle-btn-inactive'">
            <span v-html="icons[p.icon]" class="icon-svg w-[16px] h-[16px] flex-shrink-0"></span>
            <span>{{ t(p.labelKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Presence -->
      <div v-else-if="activeLayerId === 'presence'" class="space-y-4">
        <label class="block text-sm font-medium mb-2">{{ t('teacherMin') }}: {{ minutes }}</label>
        <input type="range" min="1" max="30" v-model.number="minutes" class="w-full accent-indigo-600" />
        <div class="flex justify-between text-xs text-[var(--color-text-secondary)]"><span>1 {{ t('minutes') }}</span><span>30 {{ t('minutes') }}</span></div>
      </div>

      <!-- Generic numeric -->
      <div v-else class="space-y-4">
        <label class="block text-sm font-medium mb-2">{{ t('level') }}: {{ level }}</label>
        <input type="range" min="1" max="5" v-model.number="level" class="w-full accent-indigo-600" />
        <div class="flex justify-between text-xs text-[var(--color-text-secondary)]"><span>1</span><span>5</span></div>
      </div>

      <!-- Description (common) -->
      <div class="mt-4">
        <label class="block text-sm font-medium mb-2">{{ t('description') }}</label>
        <textarea v-model="description" rows="2"
          class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-vertical"
          :placeholder="t('description') + '...'"></textarea>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 mt-6">
        <button @click="handleSave" class="flex-1 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('save') }}</button>
        <button @click="emit('close')" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
      </div>
    </div>
  </div>
</template>
