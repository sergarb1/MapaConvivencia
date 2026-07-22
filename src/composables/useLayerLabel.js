export function useLayerLabel(t) {
  return function layerLabel(l) {
    if (!l) return ''
    if (l.name) return l.name
    const key = 'layer' + l.id.charAt(0).toUpperCase() + l.id.slice(1)
    return t(key) || l.id
  }
}