<script setup>
import { ref } from 'vue'
import { useStore } from '../composables/useStore.js'
import { useInstall } from '../composables/useInstall.js'
import { icons } from '../composables/icons.js'

const baseUrl = import.meta.env.BASE_URL
const { state, t, setLang } = useStore()
const { canInstall, install } = useInstall()
const emit = defineEmits(['toggleView', 'help'])

const isDark = ref(localStorage.getItem('mapaconvivencia_dark') === 'true')
if (isDark.value) document.documentElement.classList.add('dark')

function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('mapaconvivencia_dark', isDark.value)
}
</script>

<template>
<header class="bg-[var(--color-card)] border-b border-[var(--color-border)] sticky top-0 z-40 no-print">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img :src="baseUrl + 'logo.png'" alt="Logo" class="h-16 w-auto m-0 p-0 rounded-2xl flex-shrink-0" />
      </div>

      <div class="flex items-center gap-1.5 sm:gap-2">
        <button v-if="canInstall" @click="install"
          class="min-w-[44px] sm:min-w-auto sm:px-3 min-h-[44px] sm:min-h-[36px] flex items-center justify-center gap-1 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-all duration-150 text-sm font-medium"
          :title="'Instalar App'">
          <img :src="baseUrl + 'logoCuadrado.png'" alt="" class="w-[22px] h-[22px] rounded-2xl flex-shrink-0" />
          <span class="hidden sm:inline">{{ 'App' }}</span>
        </button>

        <select v-model="state.lang" @change="setLang(state.lang)"
          class="min-h-[44px] sm:min-h-[36px] px-2 py-1 rounded-lg border border-[var(--color-border)] text-sm bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          :title="t('lang')">
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <button @click="$emit('help')"
          class="min-w-[44px] sm:min-w-[44px] min-h-[44px] sm:min-h-[44px] flex flex-col items-center justify-center gap-0 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-accent-light)] transition-all duration-150 px-1.5"
          :title="'Ayuda'">
          <span v-html="icons.help" class="icon-svg w-[18px] h-[18px] text-[var(--color-text-secondary)]"></span>
          <span class="text-[9px] text-[var(--color-text-secondary)] leading-none mt-0.5">{{ 'Ayuda' }}</span>
        </button>

        <button @click="toggleDark"
          class="min-w-[44px] sm:min-w-[44px] min-h-[44px] sm:min-h-[44px] flex flex-col items-center justify-center gap-0 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-accent-light)] transition-all duration-150 px-1.5">
          <span v-html="isDark ? icons.moon : icons.sun" class="icon-svg w-[18px] h-[18px] text-[var(--color-text-secondary)]"></span>
          <span class="text-[9px] text-[var(--color-text-secondary)] leading-none mt-0.5">{{ isDark ? t('darkMode') : t('lightMode') }}</span>
        </button>
      </div>
    </div>
  </header>
</template>