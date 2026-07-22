<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useStore } from './composables/useStore.js'
import { useInstall } from './composables/useInstall.js'
import { icons } from './composables/icons.js'
import AppHeader from './components/AppHeader.vue'
import HeatMap from './components/HeatMap.vue'
import ZoneEditor from './components/ZoneEditor.vue'
import LayerPanel from './components/LayerPanel.vue'
import IncidentList from './components/IncidentList.vue'
import Dashboard from './components/Dashboard.vue'
import ExportPanel from './components/ExportPanel.vue'
import RegistroRapido from './components/RegistroRapido.vue'

const { state, t, toast, seedTestData } = useStore()
const { canInstall, install } = useInstall()
const showHelp = ref(false)
const showInstallBanner = ref(false)
const fabRef = ref(null)
const exportPanelRef = ref(null)

const baseUrl = import.meta.env.BASE_URL

onMounted(() => {
  if (!localStorage.getItem('mapaconvivencia_help')) {
    showHelp.value = true
    localStorage.setItem('mapaconvivencia_help', '1')
  }
  if (canInstall.value) {
    setTimeout(() => { showInstallBanner.value = true }, 3000)
  }
})

async function installPWA() {
  await install()
  showInstallBanner.value = false
}

const view = ref('map')
const views = [
  { id: 'map', label: 'map', icon: 'map' },
  { id: 'zones', label: 'zones', icon: 'zones' },
  { id: 'layers', label: 'tipos', icon: 'tipos' },
  { id: 'records', label: 'records', icon: 'records' },
  { id: 'stats', label: 'stats', icon: 'stats' },
  { id: 'data', label: 'data', icon: 'data' },
]

const helpContent = computed(() => {
  const es = {
    title: 'Bienvenido a MapaConvivencia',
    intro: 'MapaConvivencia es una herramienta gratuita para que centros educativos registren y visualicen datos de convivencia mediante mapas de calor. Todos los datos se almacenan únicamente en tu navegador — no hay servidor, no se envía nada a internet.',
    steps: [
      { icon: '🗺', label: 'Mapa', desc: 'Haz clic en cualquier zona del mapa para añadir un registro. Selecciona la capa activa arriba para cambiar el tipo de dato que registras (incidencias, emociones, ruido...).' },
      { icon: '🧱', label: 'Zonas', desc: 'Define la distribución de tu centro: filas de aula, patio, pasillos, comedor... Usa plantillas predefinidas o crea zonas a medida con nombres y colores.' },
      { icon: '🧅', label: 'Tipos', desc: 'Activa o desactiva los tipos de registro que necesites (incidencias, clima emocional, ciberacoso, conductas positivas...). También puedes crear tipos personalizados.' },
      { icon: '📋', label: 'Registros', desc: 'Revisa todos los registros introducidos. Puedes filtrarlos por zona, tipo y fecha, así como editarlos o eliminarlos.' },
      { icon: '📊', label: 'Estadísticas', desc: 'Resumen visual con semáforo de convivencia, gráfico por zonas, evolución semanal, desglose emocional y parte de hoy.' },
      { icon: '📤', label: 'Exportar / Importar', desc: 'Exporta todos tus datos como archivo JSON para copia de seguridad. También puedes importar datos previamente exportados o generar datos de prueba para explorar la app.' },
      { icon: '🖨', label: 'Imprimir', desc: 'Genera un informe imprimible con todos los registros del período seleccionado. Úsalo para reuniones de tutoría o informes de convivencia.' },
      { icon: '🔒', label: 'Privacidad', desc: 'Todos los datos se guardan solo en tu navegador (localStorage). No hay cuentas, no hay servidor, no hay cookies de seguimiento. Cumple con LOPDGDD y GDPR.' },
    ],
    license: 'Código abierto bajo licencia AGPL v3. Siempre gratuito.',
    close: '¡Empezar!',
    prev: '← Anterior',
    next: 'Siguiente →',
    step: 'Paso',
    of: 'de',
  }
  const en = {
    title: 'Welcome to MapaConvivencia',
    intro: 'MapaConvivencia is a free tool for schools to record and visualize coexistence data using heatmaps. All data is stored only in your browser — no server, nothing sent over the internet.',
    steps: [
      { icon: '🗺', label: 'Map', desc: 'Click any zone on the map to add a record. Select the active layer above to change what you are recording (incidents, emotions, noise...).' },
      { icon: '🧱', label: 'Zones', desc: 'Define your school layout: classroom rows, playground, hallways, cafeteria... Use predefined templates or create custom zones with names and colors.' },
      { icon: '🧅', label: 'Types', desc: 'Enable or disable the record types you need (incidents, emotional climate, cyberbullying, positive behaviors...). You can also create custom types.' },
      { icon: '📋', label: 'Records', desc: 'Review all recorded data. Filter by zone, type, and date. Edit or delete records as needed.' },
      { icon: '📊', label: 'Statistics', desc: 'Visual summary with coexistence traffic light, zone chart, weekly evolution, emotional breakdown, and today\'s report.' },
      { icon: '📤', label: 'Export / Import', desc: 'Export all data as JSON for backup. Import previously exported data or generate test data to explore the app.' },
      { icon: '🖨', label: 'Print', desc: 'Generate a printable report with all records for the selected period. Use it for parent-teacher meetings or coexistence reports.' },
      { icon: '🔒', label: 'Privacy', desc: 'All data is stored only in your browser (localStorage). No accounts, no server, no tracking cookies. Compliant with LOPDGDD and GDPR.' },
    ],
    license: 'Open source under AGPL v3. Always free.',
    close: 'Let\'s start!',
    prev: '← Previous',
    next: 'Next →',
    step: 'Step',
    of: 'of',
  }
  return state.lang === 'en' ? en : es
})

const helpStep = ref(0)

function onKey(e) {
  const digit = parseInt(e.key)
  if (digit >= 1 && digit <= 6 && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,select')) {
    view.value = views[digit - 1].id
  }
  if (e.key === 'Escape' && showHelp.value) showHelp.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
    <AppHeader @toggle-view="(v) => view = v" :currentView="view" @help="showHelp = true" />

    <main class="max-w-6xl mx-auto px-4 pb-8">
      <!-- Tabs -->
      <div class="flex gap-1 bg-[var(--color-card)] rounded-xl p-1.5 shadow-sm border border-[var(--color-border)] overflow-x-auto no-print mb-6">
        <button v-for="v in views" :key="v.id"
          @click="view = v.id"
          class="flex items-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-[38px] rounded-lg transition-all duration-200 flex-shrink-0 text-sm font-medium"
          :class="view === v.id ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]'">
          <span v-html="icons[v.icon]" class="icon-svg w-[18px] h-[18px]"></span>
          <span class="text-xs sm:text-sm">{{ t(v.label) }}</span>
        </button>
      </div>

      <!-- Views -->
      <div class="tab-fade-in">
        <HeatMap v-if="view === 'map'" />
        <ZoneEditor v-if="view === 'zones'" />
        <LayerPanel v-if="view === 'layers'" />
        <IncidentList v-if="view === 'records'" />
        <Dashboard v-if="view === 'stats'" />
        <ExportPanel ref="exportPanelRef" v-if="view === 'data'" @reset="showHelp = true; helpStep = 0" />
      </div>
    </main>

    <!-- Help / Tutorial modal (multi-step wizard) -->
    <div v-if="showHelp" class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" @click.self="showHelp = false">
      <div class="bg-[var(--color-card)] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-2xl bg-[var(--color-logo)] flex items-center justify-center text-white font-bold text-lg">Z</div>
          <div>
            <h2 class="font-heading font-bold text-lg">{{ helpContent.title }}</h2>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ helpContent.step }} {{ helpStep+1 }} {{ helpContent.of }} {{ helpContent.steps.length }}</p>
          </div>
        </div>

        <p class="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">{{ helpContent.intro }}</p>

        <div class="bg-[var(--color-bg)] rounded-2xl p-5 mb-4 min-h-[180px] flex flex-col items-center justify-center text-center">
          <span class="text-4xl mb-3">{{ helpContent.steps[helpStep].icon }}</span>
          <h3 class="font-heading font-bold text-base mb-2">{{ helpContent.steps[helpStep].label }}</h3>
          <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm">{{ helpContent.steps[helpStep].desc }}</p>
        </div>

        <!-- Step dots -->
        <div class="flex justify-center gap-1.5 mb-4">
          <button v-for="(s, i) in helpContent.steps" :key="i"
            @click="helpStep = i"
            class="w-2 h-2 rounded-full transition-all duration-200"
            :class="helpStep === i ? 'bg-[var(--color-accent)] w-5' : 'bg-[var(--color-border)] hover:bg-[var(--color-text-secondary)]'">
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex gap-2">
          <button v-if="helpStep > 0" @click="helpStep--"
            class="flex-1 bg-white dark:bg-slate-800 border border-[var(--color-border)] rounded-xl px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium">
            {{ helpContent.prev }}
          </button>
          <button v-if="helpStep < helpContent.steps.length - 1" @click="helpStep++"
            class="flex-1 bg-[var(--color-accent)] text-white font-bold px-4 py-2.5 rounded-xl hover:opacity-90 transition text-sm">
            {{ helpContent.next }}
          </button>
          <button v-if="helpStep === helpContent.steps.length - 1" @click="showHelp = false"
            class="flex-1 bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm">
            {{ helpContent.close }}
          </button>
        </div>

        <div class="flex gap-2 mb-3">
          <button @click="showHelp = false; view = 'data'; nextTick(() => exportPanelRef?.openSeedEditor())"
            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition text-sm">
            🧪 {{ state.lang === 'en' ? 'Generate test data' : 'Generar datos de prueba' }}
          </button>
        </div>

        <div class="text-center text-[10px] text-[var(--color-text-secondary)] mt-3 opacity-60">
          ⚖️ {{ helpContent.license }}
        </div>
      </div>
    </div>

    <!-- PWA install banner -->
    <div v-if="showInstallBanner && canInstall" class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 bg-[var(--color-card)] rounded-2xl p-4 shadow-2xl border border-[var(--color-border)] animate-slide-up">
      <div class="flex items-start gap-3">
        <img :src="baseUrl + 'logoCuadrado.png'" alt="" class="w-10 h-10 rounded-2xl flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-heading font-bold text-sm">{{ t('appTitle') }}</p>
          <p class="text-xs text-[var(--color-text-secondary)]">{{ 'Instala la app en tu dispositivo para usarla sin internet.' }}</p>
        </div>
        <button @click="showInstallBanner = false" class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition text-lg">✕</button>
      </div>
      <button @click="installPWA" class="mt-3 w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition text-sm flex items-center justify-center gap-2">
        📲 {{ 'Instalar App' }}
      </button>
    </div>

    <!-- Global FAB -->
    <RegistroRapido ref="fabRef" />

    <!-- Global toast -->
    <Teleport to="body">
      <div v-if="toast.visible"
        class="fixed bottom-24 right-6 z-50 bg-green-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl transition-all duration-300"
        :class="toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
        {{ toast.message }}
      </div>
    </Teleport>
  </div>
</template>
