import { ref, onMounted } from 'vue'

export function useInstall() {
  const deferredPrompt = ref(null)
  const canInstall = ref(false)

  onMounted(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault()
      deferredPrompt.value = e
      canInstall.value = true
    })
  })

  async function install() {
    if (!deferredPrompt.value) return
    deferredPrompt.value.prompt()
    const result = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    canInstall.value = false
    return result
  }

  return { canInstall, deferredPrompt, install }
}