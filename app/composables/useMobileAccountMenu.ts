export function useMobileAccountMenu() {
  const open = useState('mobile-account-menu-open', () => false)

  function openMenu() {
    open.value = true
  }

  function closeMenu() {
    open.value = false
  }

  return { open, openMenu, closeMenu }
}
