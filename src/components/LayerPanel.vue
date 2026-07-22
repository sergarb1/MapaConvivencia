<script setup>
import { ref } from 'vue'
import { useStore } from '../composables/useStore.js'
import { icons } from '../composables/icons.js'
import { presetLayerDefs } from '../config/layerTypes.js'

const { state, t, toggleLayer, toggleLayerVisible, addCustomLayer, removeLayer, persist } = useStore()

const showNew = ref(false)
const newName = ref('')
const newType = ref('numeric')

function createLayer() {
  if (!newName.value.trim()) return
  addCustomLayer(newName.value.trim(), newType.value)
  showNew.value = false
  newName.value = ''
}

function removeCustom(id) {
  removeLayer(id)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-2">
      <h3 class="font-heading font-bold text-lg">{{ t('layers') }}</h3>
      <button @click="showNew = true" class="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('newLayer') }}</button>
    </div>

    <div class="space-y-3">
      <!-- Preset layers -->
      <div v-for="l in presetLayerDefs" :key="l.id" class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span v-html="icons[l.icon]" class="icon-svg w-5 h-5 text-[var(--color-text)]"></span>
            <div>
              <p class="font-medium text-sm">{{ t(l.defaultNameKey) }}</p>
              <p class="text-xs text-[var(--color-text-secondary)]">{{ state.layers[l.id]?.data?.length || 0 }} {{ t('records') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-7 rounded-full relative transition-colors duration-200 cursor-pointer"
              :class="state.layers[l.id]?.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
              @click="toggleLayer(l.id)">
              <span class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
                :style="{ left: state.layers[l.id]?.enabled ? '24px' : '2px' }"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom layers -->
      <div v-for="l in Object.values(state.layers).filter(l => l.custom)" :key="l.id"
        class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ l.icon || '📌' }}</span>
            <div>
              <p class="font-medium text-sm">{{ l.name }}</p>
              <p class="text-xs text-[var(--color-text-secondary)]">{{ l.data?.length || 0 }} {{ t('records') }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-12 h-7 rounded-full relative transition-colors duration-200 cursor-pointer"
              :class="l.enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
              @click="toggleLayer(l.id)">
              <span class="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all duration-200"
                :style="{ left: l.enabled ? '24px' : '2px' }"></span>
            </div>
            <button @click="removeCustom(l.id)" class="text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg px-2 py-1 transition">{{ t('delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- New layer modal -->
    <div v-if="showNew" class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showNew = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-heading font-bold text-lg mb-4">{{ t('newLayer') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('layerName') }}</label>
            <input v-model="newName" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('layerType') }}</label>
            <select v-model="newType" class="w-full border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="numeric">{{ t('numeric') }}</option>
              <option value="emotional">{{ t('emotional') }}</option>
              <option value="text">{{ t('text') }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 mt-6">
          <button @click="createLayer" class="flex-1 bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition text-sm">{{ t('save') }}</button>
          <button @click="showNew = false" class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
