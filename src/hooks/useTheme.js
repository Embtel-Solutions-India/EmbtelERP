import { useSelector, useDispatch } from 'react-redux'
import { toggleTheme, setTheme } from '../redux/slices/themeSlice'

export function useTheme() {
  const dispatch = useDispatch()
  const { isDark } = useSelector((s) => s.theme)

  return {
    isDark,
    toggleTheme: () => dispatch(toggleTheme()),
    setDark:     () => dispatch(setTheme('dark')),
    setLight:    () => dispatch(setTheme('light')),
  }
}
