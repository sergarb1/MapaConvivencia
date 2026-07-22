import { reactive, computed } from 'vue'
import { i18n } from '../config/i18n.js'
import { TEMPLATES } from '../config/templates.js'

const STORAGE_KEY = 'mapaconvivencia'

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function defaultLayers() {
  return {
    incidents:    { id: 'incidents',    enabled: true,  visible: true, type: 'incidents',   color: '#ef4444', icon: '⚠', data: [] },
    participation:{ id: 'participation',enabled: false, visible: true, type: 'numeric',     color: '#22c55e', icon: '📢', data: [] },
    emotion:      { id: 'emotion',      enabled: false, visible: true, type: 'emotional',   color: '#a855f7', icon: '😊', data: [] },
    presence:     { id: 'presence',     enabled: false, visible: true, type: 'numeric',     color: '#3b82f6', icon: '👤', data: [] },
    noise:        { id: 'noise',        enabled: false, visible: true, type: 'numeric',     color: '#f59e0b', icon: '🔊', data: [] },
    positive:     { id: 'positive',     enabled: false, visible: true, type: 'positive',    color: '#10b981', icon: '⭐', data: [] },
    resources:    { id: 'resources',    enabled: false, visible: true, type: 'numeric',     color: '#06b6d4', icon: '💻', data: [] },
    cyber:        { id: 'cyber',        enabled: false, visible: true, type: 'cyber',       color: '#ec4899', icon: '📱', data: [] },
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    projectName: state.projectName,
    template: state.template,
    cols: state.cols,
    rows: state.rows,
    zones: state.zones,
    layers: state.layers,
    lang: state.lang,
  }))
}

const saved = load()

const state = reactive(saved || {
  version: 1,
  projectName: 'Mi mapa',
  template: 'centro_escolar',
  cols: 8,
  rows: 6,
  zones: JSON.parse(JSON.stringify(TEMPLATES.centro_escolar.zones)),
  layers: defaultLayers(),
  lang: 'es',
})

function persist() { save(state) }

export function useStore() {
  function t(key) { return (i18n[state.lang] || i18n.es)[key] || key }

  function addRecord(layerId, record) {
    const layer = state.layers[layerId]
    if (!layer) return
    layer.data.push({ ...record, id: makeId(), timestamp: record.timestamp || new Date().toISOString() })
    persist()
  }

  function removeRecord(layerId, recordId) {
    const layer = state.layers[layerId]
    if (!layer) return
    layer.data = layer.data.filter(r => r.id !== recordId)
    persist()
  }

  function updateRecord(layerId, recordId, updates) {
    const layer = state.layers[layerId]
    if (!layer) return
    const idx = layer.data.findIndex(r => r.id === recordId)
    if (idx === -1) return
    layer.data[idx] = { ...layer.data[idx], ...updates }
    persist()
  }

  function getRecords(layerId, filters = {}) {
    const layer = state.layers[layerId]
    if (!layer) return []
    let data = [...layer.data]
    if (filters.zoneId) data = data.filter(r => r.zoneId === filters.zoneId)
    if (filters.type) data = data.filter(r => r.type === filters.type)
    if (filters.dateFrom) data = data.filter(r => r.timestamp >= filters.dateFrom)
    if (filters.dateTo) data = data.filter(r => r.timestamp <= filters.dateTo + 'T23:59:59')
    return data.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  function getHeat(layerId) {
    const layer = state.layers[layerId]
    if (!layer || !layer.enabled) return state.zones.map(z => ({ ...z, count: 0, intensity: 0 }))
    const zoneCounts = {}
    state.zones.forEach(z => zoneCounts[z.id] = 0)
    layer.data.forEach(r => { if (zoneCounts[r.zoneId] !== undefined) zoneCounts[r.zoneId]++ })
    const values = Object.values(zoneCounts)
    const max = Math.max(1, ...values)
    return state.zones.map(z => ({
      ...z,
      count: zoneCounts[z.id] || 0,
      intensity: max > 0 ? (zoneCounts[z.id] || 0) / max : 0,
    }))
  }

  function getEmotionHeat(layerId) {
    const layer = state.layers[layerId]
    if (!layer || !layer.enabled) return state.zones.map(z => ({ ...z, happy:0, neutral:0, sad:0, anxious:0, angry:0, total:0 }))
    const agg = {}
    state.zones.forEach(z => agg[z.id] = { happy:0, neutral:0, sad:0, anxious:0, angry:0, total:0 })
    layer.data.forEach(r => {
      if (agg[r.zoneId]) {
        if (agg[r.zoneId][r.mood] !== undefined) agg[r.zoneId][r.mood]++
        agg[r.zoneId].total++
      }
    })
    return state.zones.map(z => ({ ...z, ...agg[z.id] }))
  }

  function setLang(lang) { state.lang = lang; persist() }
  function setProjectName(n) { state.projectName = n; persist() }

  function loadTemplate(templateId) {
    const tmpl = TEMPLATES[templateId]
    if (!tmpl) return
    state.template = templateId
    state.cols = tmpl.cols
    state.rows = tmpl.rows
    state.zones = JSON.parse(JSON.stringify(tmpl.zones))
    persist()
  }

  function setZones(zones, cols, rows) {
    state.zones = zones
    state.cols = cols || state.cols
    state.rows = rows || state.rows
    persist()
  }

  function toggleLayer(layerId) {
    const l = state.layers[layerId]
    if (l) l.enabled = !l.enabled
    persist()
  }

  function toggleLayerVisible(layerId) {
    const l = state.layers[layerId]
    if (l) l.visible = !l.visible
    persist()
  }

  function addCustomLayer(name, type) {
    const id = 'custom_' + makeId()
    state.layers[id] = {
      id, enabled: true, visible: true, type,
      color: '#6366f1', icon: '📌', name, data: [],
      custom: true
    }
    persist()
    return id
  }

  function removeLayer(layerId) {
    if (state.layers[layerId] && !state.layers[layerId].custom) return
    delete state.layers[layerId]
    persist()
  }

  const gridCols = computed(() => state.cols)
  const gridRows = computed(() => state.rows)

  function exportJSON() {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      projectName: state.projectName,
      template: state.template,
      cols: state.cols,
      rows: state.rows,
      zones: state.zones,
      layers: Object.fromEntries(
        Object.entries(state.layers).map(([k, v]) => [k, { ...v, data: v.data }])
      ),
    }, null, 2)
  }

  function importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr)
      if (!data.zones || !data.layers) return false
      state.projectName = data.projectName || 'Importado'
      state.template = data.template || 'custom'
      state.cols = data.cols || 4
      state.rows = data.rows || 3
      state.zones = data.zones
      state.layers = Object.fromEntries(
        Object.entries(data.layers).map(([k, v]) => {
          const isCustom = k.startsWith('custom_') || v.custom
          return [k, { ...v, custom: isCustom }]
        })
      )
      persist()
      return true
    } catch { return false }
  }

  function resetAll() {
    state.projectName = 'Mi mapa'
    state.template = 'centro_escolar'
    state.cols = 8
    state.rows = 6
    state.zones = JSON.parse(JSON.stringify(TEMPLATES.centro_escolar.zones))
    state.layers = defaultLayers()
    persist()
  }

  function seedTestData(opts = {}) {
    const zoneIds = state.zones.map(z => z.id)
    if (!zoneIds.length) return
    const randZone = () => zoneIds[Math.floor(Math.random() * zoneIds.length)]
    const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)]
    const daysAgo = (n) => new Date(Date.now() - n * 86400000 + Math.random() * 86400000).toISOString()
    const randInvolved = () => Math.random() > 0.5 ? 2 + Math.floor(Math.random() * 3) : undefined

    const opt = {
      incidents: opts.incidents ?? 20, emotion: opts.emotion ?? 12,
      positive: opts.positive ?? 10, cyber: opts.cyber ?? 6,
      presence: opts.presence ?? 6, noise: opts.noise ?? 5,
      days: opts.days ?? 21,
    }

    const incidentTypes = ['physical', 'verbal', 'social', 'bullying', 'disruption', 'defiance', 'vandalism', 'discrimination', 'micro']
    const moods = ['happy', 'neutral', 'sad', 'anxious', 'angry']
    const platforms = ['whatsapp', 'instagram', 'tiktok', 'other']
    const posTypes = ['help', 'include', 'share', 'encourage']
    const incidentDescs = [
      'Empujón en la fila', 'Insultos entre compañeros', 'Exclusión en el juego',
      'Comentarios despectivos', 'Discusión acalorada', 'Se burlan de un compañero',
      'Amenazas verbales', 'Rompen material de otro', 'Esconden la mochila',
      'Pelea en el recreo', 'No le dejan sentarse', 'Apodos molestos',
      'Interrupción constante', 'Miradas intimidatorias', 'Gestos ofensivos',
      'Acoso reiterado a un compañero', 'Intimidación en grupo',
      'Ruido excesivo en clase', 'Interrumpe la explicación',
      'Desafía al profesor en público', 'Se niega a hacer la tarea',
      'Pinta la mesa del aula', 'Rompe una silla', 'Tira papeles al suelo',
      'Comentarios racistas', 'Burlas por su origen', 'Exclusión por discapacidad',
      'Se mete con él por su forma de vestir',
    ]
    const emotionDescs = [
      'Jugando contento', 'Relajado en el banco', 'Hablando con amigos',
      'Preocupado por el examen', 'Triste después del conflicto', 'Enojado por la injusticia',
      'Nervioso antes de clase', 'Feliz por la nota', 'Tranquilo leyendo',
      'Ansioso por la exposición', 'Aburrido en el recreo', 'Emocionado por el partido',
      'Contento tras ayudar a otro', 'Tranquilo escuchando música', 'Estresado por la entrega',
      'Alegre por el trabajo en grupo', 'Nervioso por la tutoría',
    ]
    const cyberDescs = [
      'Comentario ofensivo en Instagram', 'Difunden rumor por WhatsApp',
      'Excluido del grupo de TikTok', 'Se hacen pasar por él/ella',
      'Foto comprometida compartida sin permiso', 'Burlas en grupo de WhatsApp',
      'Vídeo vejatorio grabado en clase', 'Suplantación de identidad',
      'Difunden su número de teléfono', 'Montaje fotográfico humillante',
    ]
    const positiveDescs = [
      'Ayudó a un compañero caído', 'Compartió su merienda',
      'Invitó a jugar a alguien solo', 'Animó a un amigo triste',
      'Defendió a un compañero', 'Recogió material caído',
      'Ayudó con la tarea', 'Dio ánimos antes del examen',
      'Acogió al nuevo alumno', 'Organizó un juego inclusivo',
      'Medió en un conflicto', 'Cedió su turno voluntariamente',
      'Agradeció la ayuda recibida', 'Felicitó a un compañero por su trabajo',
      'Ayudó al profesor a recoger la clase', 'Compartió apuntes con quien faltó',
    ]

    const records = { incidents: [], emotion: [], presence: [], positive: [], cyber: [], noise: [] }

    for (let i = 0; i < opt.incidents; i++) {
      records.incidents.push({
        zoneId: randZone(), type: randEl(incidentTypes),
        severity: Math.ceil(Math.random() * 5),
        description: randEl(incidentDescs),
        involved: randInvolved(),
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    for (let i = 0; i < opt.emotion; i++) {
      records.emotion.push({
        zoneId: randZone(), mood: randEl(moods),
        description: randEl(emotionDescs),
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    for (let i = 0; i < opt.presence; i++) {
      records.presence.push({
        zoneId: randZone(), minutes: 5 + Math.floor(Math.random() * 26),
        description: 'Supervisión: ' + ['guardia de pasillo', 'recreo', 'entrada', 'salida', 'cambio de clase', 'comedor'][Math.floor(Math.random()*6)],
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    for (let i = 0; i < opt.positive; i++) {
      records.positive.push({
        zoneId: randZone(), positiveType: randEl(posTypes),
        description: randEl(positiveDescs),
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    for (let i = 0; i < opt.cyber; i++) {
      records.cyber.push({
        zoneId: randZone(), platform: randEl(platforms),
        severity: Math.ceil(Math.random() * 5),
        description: randEl(cyberDescs),
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    for (let i = 0; i < opt.noise; i++) {
      records.noise.push({
        zoneId: randZone(), level: Math.ceil(Math.random() * 5),
        description: ['Ruido bajo constante', 'Murmullos que distraen', 'Alboroto general', 'Gritos en el aula', 'Ensordecimiento insoportable'][Math.floor(Math.random()*5)],
        timestamp: daysAgo(Math.floor(Math.random() * opt.days))
      })
    }

    Object.entries(records).forEach(([layerId, items]) => {
      const layer = state.layers[layerId]
      if (!layer) return
      items.forEach(r => {
        layer.data.push({ ...r, id: makeId() })
      })
    })
    Object.keys(records).forEach(id => {
      if (state.layers[id] && state.layers[id].data.length > 0) {
        state.layers[id].enabled = true
      }
    })
    persist()
  }

  function getStats(layerId) {
    const layer = state.layers[layerId]
    if (!layer) return null
    const data = layer.data
    if (!data.length) return null
    const total = data.length
    const byZone = {}
    data.forEach(r => {
      if (!byZone[r.zoneId]) byZone[r.zoneId] = 0
      byZone[r.zoneId]++
    })
    const zoneIds = Object.keys(byZone)
    const topZoneId = zoneIds.reduce((a, b) => byZone[a] > byZone[b] ? a : b)
    const topZone = state.zones.find(z => z.id === topZoneId)
    const dates = data.map(r => r.timestamp.slice(0, 10))
    const uniqueDates = [...new Set(dates)]
    const freq = total / Math.max(1, uniqueDates.length)
    const recent = data.filter(r => {
      const d = new Date(r.timestamp)
      const w = new Date()
      w.setDate(w.getDate() - 7)
      return d >= w
    }).length
    const trend = recent > total * 0.3 ? 'up' : recent < total * 0.1 ? 'down' : 'stable'
    return { total, byZone, topZoneId, topZoneLabel: topZone ? topZone.label : topZoneId, freq, trend }
  }

  const activeLayers = computed(() =>
    Object.values(state.layers).filter(l => l.enabled)
  )

  function layerLabel(l) {
    if (!l) return ''
    if (l.name) return l.name
    const key = 'layer' + l.id.charAt(0).toUpperCase() + l.id.slice(1)
    return t(key) || l.id
  }

  const toast = reactive({ message: '', visible: false, type: 'success' })
  let toastTimer = null
  function showToast(message, type = 'success') {
    toast.message = message
    toast.type = type
    toast.visible = true
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.visible = false }, 3000)
  }

  function getCriticalZones(layerId, threshold = 5) {
    const heat = getHeat(layerId)
    return heat.filter(z => z.count >= threshold).map(z => z.id)
  }

  function getSeverityBreakdown(layerId) {
    const layer = state.layers[layerId]
    if (!layer) return []
    const sev = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    layer.data.forEach(r => {
      if (r.severity && sev[r.severity] !== undefined) sev[r.severity]++
    })
    return Object.entries(sev).map(([level, count]) => ({ level: parseInt(level), count }))
  }

  return {
    state, t, i18n, TEMPLATES,
    addRecord, removeRecord, updateRecord, getRecords, getHeat, getEmotionHeat,
    setLang, setProjectName, loadTemplate, setZones,
    toggleLayer, toggleLayerVisible, addCustomLayer, removeLayer,
    exportJSON, importJSON, resetAll, seedTestData, getStats,
    gridCols, gridRows, activeLayers, layerLabel, persist,
    toast, showToast, getCriticalZones, getSeverityBreakdown,
  }
}