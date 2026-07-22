<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'

const { state, t, getStats, getHeat, getEmotionHeat, getSeverityBreakdown, activeLayers, layerLabel, showToast } = useStore()

const firstEnabled = activeLayers.value[0]
const statLayerId = ref(firstEnabled?.id || 'incidents')
const daysRange = ref(7)

const stats = computed(() => getStats(statLayerId.value))
const heat = computed(() => getHeat(statLayerId.value))
const severity = computed(() => getSeverityBreakdown(statLayerId.value))
const emotionHeat = computed(() => {
  const l = state.layers[statLayerId.value]
  if (l?.type === 'emotional') return getEmotionHeat(statLayerId.value)
  return null
})

const layerName = computed(() => layerLabel(state.layers[statLayerId.value]))
const layerColor = computed(() => state.layers[statLayerId.value]?.color || '#6366f1')

const hasSeverity = computed(() => {
  const l = state.layers[statLayerId.value]
  return l && ['incidents', 'cyber', 'positive'].includes(l.type)
})

const today = new Date().toISOString().slice(0, 10)

const weekData = computed(() => {
  const l = state.layers[statLayerId.value]
  if (!l) return []
  const days = {}
  for (let i = daysRange.value - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    days[d] = 0
  }
  l.data.forEach(r => {
    const d = r.timestamp.slice(0, 10)
    if (days[d] !== undefined) days[d]++
  })
  return Object.entries(days).map(([date, count]) => ({ date: date.slice(5), count, fullDate: date }))
})

const maxWeek = Math.max(1, ...weekData.value.map(d => d.count))

const sortedHeat = computed(() => {
  return [...heat.value].sort((a, b) => b.count - a.count)
})

const diaLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const semaforo = computed(() => {
  const incidents = state.layers['incidents']?.data || []
  const positive = state.layers['positive']?.data || []
  const cutoff = new Date(Date.now() - daysRange.value * 86400000)
  const recentIncidents = incidents.filter(r => new Date(r.timestamp) >= cutoff).length
  const recentPositive = positive.filter(r => new Date(r.timestamp) >= cutoff).length
  const total = recentIncidents + recentPositive
  if (total === 0) return { color: 'bg-slate-400', text: t('heatEmpty'), pct: 50, positives: 0, incidents: 0 }
  const pct = Math.round(recentPositive / total * 100)
  if (pct >= 60) return { color: 'bg-green-500', text: `😊 ${pct}% ${t('positive')}`, pct, positives: recentPositive, incidents: recentIncidents }
  if (pct >= 40) return { color: 'bg-amber-500', text: `😐 ${pct}% ${t('positive')}`, pct, positives: recentPositive, incidents: recentIncidents }
  return { color: 'bg-red-500', text: `😟 ${pct}% ${t('positive')}`, pct, positives: recentPositive, incidents: recentIncidents }
})

const diaSemana = computed(() => {
  const days = [0, 0, 0, 0, 0, 0, 0]
  Object.values(state.layers).forEach(l => {
    l.data.forEach(r => {
      const d = new Date(r.timestamp)
      const idx = d.getDay()
      if (!isNaN(idx)) days[idx]++
    })
  })
  const max = Math.max(1, ...days)
  return days.map((count, i) => ({ label: diaLabels[i], count, pct: count / max * 100 }))
})

const busiestDay = computed(() => {
  const max = Math.max(...diaSemana.value.map(d => d.count))
  if (max === 0) return null
  return diaSemana.value.find(d => d.count === max)
})

const horas = computed(() => {
  const h = Array(24).fill(0)
  Object.values(state.layers).forEach(l => {
    l.data.forEach(r => {
      const hour = new Date(r.timestamp).getHours()
      if (!isNaN(hour)) h[hour]++
    })
  })
  const max = Math.max(1, ...h)
  return h.map((count, i) => ({ hour: i, count, pct: count / max * 100 }))
})

const parteHoy = computed(() => {
  const hoy = new Date().toISOString().slice(0, 10)
  const res = { total: 0, incidents: 0, positive: 0, emotions: 0, zones: new Set(), types: {} }
  Object.entries(state.layers).forEach(([id, l]) => {
    l.data.forEach(r => {
      if (r.timestamp.slice(0, 10) === hoy) {
        res.total++
        if (id === 'incidents') res.incidents++
        else if (id === 'positive') res.positive++
        else if (id === 'emotion' || l.type === 'emotional') res.emotions++
        if (r.zoneId) res.zones.add(r.zoneId)
        if (r.subtype) {
          if (!res.types[r.subtype]) res.types[r.subtype] = 0
          res.types[r.subtype]++
        }
      }
    })
  })
  return res
})

const totalPeriod = computed(() => {
  const cutoff = new Date(Date.now() - daysRange.value * 86400000)
  let count = 0
  Object.values(state.layers).forEach(l => {
    l.data.forEach(r => {
      if (new Date(r.timestamp) >= cutoff) count++
    })
  })
  return count
})

const lastRecordTimestamp = computed(() => {
  let latest = null
  Object.values(state.layers).forEach(l => {
    l.data.forEach(r => {
      if (!latest || r.timestamp > latest) latest = r.timestamp
    })
  })
  return latest
})

function getBarColor(val, max) {
  if (max === 0) return 'bg-slate-200 dark:bg-slate-700'
  const p = val / max
  if (p <= 0.25) return 'bg-green-400'
  if (p <= 0.5) return 'bg-yellow-400'
  if (p <= 0.75) return 'bg-orange-400'
  return 'bg-red-400'
}

const trendIcon = computed(() => {
  if (!stats.value) return ''
  if (stats.value.trend === 'up') return { icon: '↑', color: 'text-red-500', label: t('trendUp') }
  if (stats.value.trend === 'down') return { icon: '↓', color: 'text-green-500', label: t('trendDown') }
  return { icon: '→', color: 'text-slate-400', label: t('trendStable') }
})

function copySummary() {
  const lines = [`📊 ${state.projectName} — ${layerName.value}`]
  if (stats.value) {
    lines.push(`${t('total')}: ${stats.value.total} | ${t('topZone')}: ${stats.value.topZoneLabel} (${stats.value.byZone[stats.value.topZoneId]})`)
    lines.push(`${t('trend')}: ${trendIcon.value.icon} ${trendIcon.value.label}`)
  }
  lines.push(`${t('positiveRatio')}: ${semaforo.value.pct}%`)
  if (totalPeriod.value > 0) lines.push(`${t('period')} (${daysRange.value} ${t('days')}): ${totalPeriod.value} ${t('recordsTotal')}`)
  if (parteHoy.value.total > 0) lines.push(`${t('parteHoy')}: ${parteHoy.value.total} ${t('recordsTotal')}`)
  navigator.clipboard.writeText(lines.join('\n')).then(() => showToast(t('summaryCopied')))
}

const hasData = computed(() => {
  return Object.values(state.layers).some(l => l.data.length > 0)
})
</script>

<template>
  <div class="space-y-5">
    <!-- Header: layer pills + period -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex flex-wrap gap-1.5">
        <button v-for="l in activeLayers" :key="l.id"
          @click="statLayerId = l.id"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition min-h-[32px]"
          :class="statLayerId === l.id
            ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700'">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: state.layers[l.id]?.color }"></span>
          <span>{{ layerLabel(l) }}</span>
        </button>
      </div>
      <span class="w-px h-5 bg-[var(--color-border)]"></span>
      <div class="flex gap-1">
        <button v-for="d in [7, 14, 30]" :key="d"
          @click="daysRange = d"
          class="px-3 py-1.5 rounded-lg border text-xs font-medium transition min-h-[32px]"
          :class="daysRange === d
            ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]'
            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700'">
          {{ d }}{{ t('days') }}
        </button>
      </div>
      <button @click="copySummary"
        class="ml-auto px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700 transition">
        {{ t('copySummary') }}
      </button>
    </div>

    <template v-if="hasData">
      <!-- Semáforo -->
      <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex items-center gap-3 flex-shrink-0">
            <div :class="semaforo.color" class="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-lg">
              {{ semaforo.pct >= 60 ? '🟢' : semaforo.pct >= 40 ? '🟡' : '🔴' }}
            </div>
            <div>
              <p class="text-base font-bold">{{ semaforo.text }}</p>
              <p class="text-xs text-[var(--color-text-secondary)]">{{ daysRange }} {{ t('days') }} · {{ totalPeriod }} {{ t('recordsTotal') }}</p>
            </div>
          </div>
          <div class="flex-1 space-y-1.5">
            <div class="flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>⚠ {{ semaforo.incidents }} {{ t('incidents') }}</span>
              <span>👍 {{ semaforo.positives }} {{ t('positive') }}</span>
            </div>
            <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div :style="{ width: semaforo.pct + '%' }" class="bg-green-500 h-full transition-all duration-500 rounded-l-full"></div>
              <div :style="{ width: (100 - semaforo.pct) + '%' }" class="bg-red-400 h-full transition-all duration-500 rounded-r-full"></div>
            </div>
            <div class="flex justify-between text-[10px] text-[var(--color-text-secondary)]">
              <span>{{ t('positiveRatio') }}</span>
              <span>{{ semaforo.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-xs text-[var(--color-text-secondary)] mb-1">{{ t('total') }}</p>
          <p class="text-2xl font-bold font-heading" :style="{ color: layerColor }">{{ stats?.total || 0 }}</p>
          <p class="text-xs text-[var(--color-text-secondary)] mt-1">{{ layerName }}</p>
        </div>
        <div class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-xs text-[var(--color-text-secondary)] mb-1">{{ t('topZone') }}</p>
          <p class="text-lg font-bold font-heading truncate">{{ stats?.topZoneLabel || '—' }}</p>
          <p class="text-xs text-[var(--color-text-secondary)] mt-1">{{ stats?.byZone[stats?.topZoneId] || 0 }} {{ t('records') }}</p>
        </div>
        <div class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-xs text-[var(--color-text-secondary)] mb-1">{{ t('mostActiveDay') }}</p>
          <p class="text-lg font-bold font-heading">{{ busiestDay?.label || '—' }}</p>
          <p class="text-xs text-[var(--color-text-secondary)] mt-1">{{ busiestDay?.count || 0 }} {{ t('records') }}</p>
        </div>
        <div class="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-border)]">
          <p class="text-xs text-[var(--color-text-secondary)] mb-1">{{ t('trend') }}</p>
          <p class="text-lg font-bold font-heading" :class="trendIcon.color">{{ stats ? trendIcon.icon + ' ' + trendIcon.label : '—' }}</p>
          <p class="text-xs text-[var(--color-text-secondary)] mt-1">{{ stats?.freq.toFixed(1) || '0' }}/{{ t('days') }}</p>
        </div>
      </div>

      <!-- Severity breakdown -->
      <div v-if="hasSeverity && severity.some(s => s.count > 0)" class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <h3 class="font-heading font-bold mb-4">{{ t('severityBreakdown') }}</h3>
        <div class="space-y-2">
          <div v-for="s in severity" :key="s.level" class="flex items-center gap-3">
            <span class="text-xs w-16 font-medium">{{ t('sev' + s.level) }}</span>
            <div class="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <div :style="{ width: (s.count / Math.max(1, stats?.total) * 100) + '%' }"
                class="h-full rounded-lg transition-all duration-500 min-w-[4px]"
                :class="s.level >= 4 ? 'bg-red-400' : s.level >= 3 ? 'bg-orange-400' : 'bg-yellow-400'">
              </div>
            </div>
            <span class="text-sm font-medium w-8 text-right">{{ s.count }}</span>
          </div>
        </div>
      </div>

      <!-- Zone chart -->
      <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <h3 class="font-heading font-bold mb-4">{{ t('incidents') || t('records') }} {{ t('byZone') }}</h3>
        <div class="space-y-1.5">
          <div v-for="z in sortedHeat.slice(0, 10)" :key="z.id" class="flex items-center gap-3">
            <span class="text-xs w-24 sm:w-32 truncate flex-shrink-0 font-medium">{{ z.label }}</span>
            <div class="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <div :style="{ width: (z.count / Math.max(1, sortedHeat[0]?.count) * 100) + '%', background: layerColor }"
                class="h-full rounded-lg transition-all duration-500 min-w-[4px] opacity-70">
              </div>
            </div>
            <span class="text-sm font-bold w-8 text-right" :style="{ color: layerColor }">{{ z.count }}</span>
          </div>
          <div v-if="sortedHeat.length === 0" class="text-center py-4 text-xs text-[var(--color-text-secondary)]">
            {{ t('heatEmpty') }}
          </div>
        </div>
      </div>

      <!-- Emotion breakdown -->
      <div v-if="emotionHeat" class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <h3 class="font-heading font-bold mb-4">{{ t('emotionalClimate') }} {{ t('byZone') }}</h3>
        <div class="space-y-2">
          <div v-for="z in emotionHeat" :key="z.id" class="flex items-center gap-3">
            <span class="text-xs w-24 sm:w-32 truncate flex-shrink-0">{{ z.label }}</span>
            <div class="flex-1 flex gap-0.5 h-4 rounded overflow-hidden" v-if="z.total > 0">
              <div :style="{ width: (z.happy / z.total * 100) + '%' }" class="bg-green-400 transition-all" :title="t('happy')"></div>
              <div :style="{ width: (z.neutral / z.total * 100) + '%' }" class="bg-slate-400 transition-all" :title="t('neutral')"></div>
              <div :style="{ width: (z.sad / z.total * 100) + '%' }" class="bg-blue-400 transition-all" :title="t('sad')"></div>
              <div :style="{ width: (z.anxious / z.total * 100) + '%' }" class="bg-purple-400 transition-all" :title="t('anxious')"></div>
              <div :style="{ width: (z.angry / z.total * 100) + '%' }" class="bg-red-400 transition-all" :title="t('angry')"></div>
            </div>
            <span class="text-xs w-8 text-right text-[var(--color-text-secondary)]" v-if="z.total > 0">{{ z.total }}</span>
          </div>
        </div>
        <div class="flex gap-3 mt-3 text-xs text-[var(--color-text-secondary)]">
          <span>😊 {{ t('happy') }}</span><span>😐 {{ t('neutral') }}</span><span>😢 {{ t('sad') }}</span><span>😰 {{ t('anxious') }}</span><span>😡 {{ t('angry') }}</span>
        </div>
      </div>

      <!-- Evolution -->
      <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <h3 class="font-heading font-bold mb-4">{{ t('evolution') }} ({{ daysRange }} {{ t('days') }})</h3>
        <div class="flex items-end gap-2 h-28">
          <div v-for="d in weekData" :key="d.fullDate" class="flex-1 flex flex-col items-center gap-1">
            <span class="text-[10px] font-medium" v-if="d.count > 0" :style="{ color: layerColor }">{{ d.count }}</span>
            <div :style="{ height: (d.count / maxWeek * 100) + '%', background: d.count > 0 ? layerColor : '' }"
              class="w-full rounded-t-lg transition-all duration-500 min-h-[4px]"
              :class="d.count > 0 ? 'opacity-70' : 'bg-slate-200 dark:bg-slate-700'">
            </div>
            <span class="text-[10px] text-[var(--color-text-secondary)]" v-if="weekData.length <= 14 || parseInt(d.date.slice(3)) % 3 === 1">{{ d.date }}</span>
          </div>
        </div>
      </div>

      <!-- Parte de hoy -->
      <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading font-bold">{{ t('parteHoy') }}</h3>
          <span v-if="lastRecordTimestamp" class="text-[10px] text-[var(--color-text-secondary)]">
            {{ t('lastRecord') }}: {{ new Date(lastRecordTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
          </span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <p class="text-2xl font-bold">{{ parteHoy.total }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ t('total') }}</p>
          </div>
          <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ parteHoy.incidents }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ t('incidents') }}</p>
          </div>
          <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ parteHoy.positive }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ t('positive') }}</p>
          </div>
          <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ parteHoy.zones.size }}</p>
            <p class="text-xs text-[var(--color-text-secondary)]">{{ t('zones') }}</p>
          </div>
        </div>
      </div>

      <!-- Critical zones -->
      <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
        <h3 class="font-heading font-bold mb-4">{{ t('alerts') }}</h3>
        <div v-if="sortedHeat.filter(z => z.count >= 3).length > 0" class="space-y-2">
          <div v-for="z in sortedHeat.filter(z => z.count >= 3)" :key="z.id"
            class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div class="flex items-center gap-2">
              <span>🚨</span>
              <span class="text-sm font-medium">{{ z.label }}</span>
              <span class="text-xs text-[var(--color-text-secondary)]">{{ z.count }} {{ t('records') }}</span>
            </div>
            <span class="text-xs text-red-500 font-medium">{{ t('alerts') }}</span>
          </div>
        </div>
        <div v-else class="text-center py-4 text-sm text-[var(--color-text-secondary)]">
          ✅ {{ t('noAlerts') }}
        </div>
      </div>

      <!-- Day of week + Hour (only shown if data exists) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h3 class="font-heading font-bold mb-4 text-sm">{{ t('byDay') }}</h3>
          <div class="flex items-end gap-2 h-20">
            <div v-for="d in diaSemana" :key="d.label" class="flex-1 flex flex-col items-center gap-0.5">
              <div :style="{ height: d.pct + '%' }"
                class="w-full rounded-t transition-all duration-500 min-h-[3px]"
                :class="d.count > 0 ? 'bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'">
              </div>
              <span class="text-[9px] text-[var(--color-text-secondary)]">{{ d.label }}</span>
              <span class="text-[9px] font-medium" v-if="d.count > 0">{{ d.count }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[var(--color-card)] rounded-2xl p-5 border border-[var(--color-border)]">
          <h3 class="font-heading font-bold mb-4 text-sm">{{ t('byHour') }}</h3>
          <div class="flex items-end gap-0.5 h-20">
            <div v-for="h in horas" :key="h.hour" class="flex-1 flex flex-col items-center gap-0.5">
              <div :style="{ height: h.pct + '%' }"
                class="w-full rounded-t transition-all duration-500 min-h-[2px]"
                :class="h.count > 0 ? 'bg-purple-400' : 'bg-slate-200 dark:bg-slate-700'">
              </div>
              <span class="text-[7px] text-[var(--color-text-secondary)]" v-if="h.hour % 4 === 0">{{ h.hour }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-16 text-[var(--color-text-secondary)] bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
      <p class="text-lg mb-2">📊</p>
      <p class="text-sm">{{ t('heatEmpty') }}</p>
    </div>
  </div>
</template>