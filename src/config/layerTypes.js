export const incidentTypes = [
  { id:'physical', icon:'fist', labelKey:'physical' },
  { id:'verbal', icon:'messageCircle', labelKey:'verbal' },
  { id:'social', icon:'shield', labelKey:'social' },
  { id:'bullying', icon:'users', labelKey:'bullying' },
  { id:'disruption', icon:'volumeX', labelKey:'disruption' },
  { id:'defiance', icon:'zap', labelKey:'defiance' },
  { id:'vandalism', icon:'trash2', labelKey:'vandalism' },
  { id:'discrimination', icon:'flag', labelKey:'discrimination' },
  { id:'micro', icon:'eye', labelKey:'micro' },
]

export const cyberTypes = [
  { id:'cyberType', icon:'smartPhone', labelKey:'cyberType' },
  { id:'micro', icon:'eye', labelKey:'micro' },
]

export const moodOptions = [
  { id:'happy', emoji:'😊', labelKey:'happy' },
  { id:'neutral', emoji:'😐', labelKey:'neutral' },
  { id:'sad', emoji:'😢', labelKey:'sad' },
  { id:'anxious', emoji:'😰', labelKey:'anxious' },
  { id:'angry', emoji:'😡', labelKey:'angry' },
]

export const positiveOptions = [
  { id:'help', icon:'thumbsUp', labelKey:'positiveHelp' },
  { id:'include', icon:'users', labelKey:'positiveInclude' },
  { id:'share', icon:'gift', labelKey:'positiveShare' },
  { id:'encourage', icon:'zap', labelKey:'positiveEncourage' },
]

export const severityLabels = ['sev1', 'sev2', 'sev3', 'sev4', 'sev5']

export const presetLayerDefs = [
  { id: 'incidents', icon: 'alertTriangle', defaultNameKey: 'layerIncidents' },
  { id: 'participation', icon: 'messageSquare', defaultNameKey: 'layerParticipation' },
  { id: 'emotion', icon: 'smile', defaultNameKey: 'layerEmotion' },
  { id: 'presence', icon: 'user', defaultNameKey: 'layerPresence' },
  { id: 'noise', icon: 'volume2', defaultNameKey: 'layerNoise' },
  { id: 'positive', icon: 'star', defaultNameKey: 'layerPositive' },
  { id: 'resources', icon: 'monitor', defaultNameKey: 'layerResources' },
  { id: 'cyber', icon: 'smartPhone', defaultNameKey: 'layerCyber' },
]

export const platformOptions = ['whatsapp', 'instagram', 'tiktok', 'other']