export function useMobileSpaceMenu() {
  const open = useState('mobile-space-menu-open', () => false)

  function openMenu() {
    open.value = true
  }

  function closeMenu() {
    open.value = false
  }

  return { open, openMenu, closeMenu }
}
