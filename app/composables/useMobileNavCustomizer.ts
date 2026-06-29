export function useMobileNavCustomizer() {
  const open = useState('mobile-nav-customizer-open', () => false)

  function openCustomizer() {
    open.value = true
  }

  function closeCustomizer() {
    open.value = false
  }

  return { open, openCustomizer, closeCustomizer }
}
