import { ref } from 'vue'

export function useModal() {
  const visible = ref(false)
  const data = ref(null)

  function open(payload = null) {
    data.value = payload
    visible.value = true
  }

  function close() {
    visible.value = false
    data.value = null
  }

  function toggle() {
    visible.value = !visible.value
  }

  return { visible, data, open, close, toggle }
}