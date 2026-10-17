const TOAST_DURATION_MS = 2600
let hideTimer: ReturnType<typeof setTimeout> | undefined

export function useToast() {
  const toast = useState('toast', () => ({ message: '', visible: false }))

  const showToast = (message: string) => {
    toast.value = { message, visible: true }
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => (toast.value = { ...toast.value, visible: false }), TOAST_DURATION_MS)
  }

  return { toast, showToast }
}
