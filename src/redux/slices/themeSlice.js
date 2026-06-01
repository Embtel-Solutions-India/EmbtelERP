import { createSlice } from '@reduxjs/toolkit'

const saved = localStorage.getItem('crm_theme')
const initialState = { isDark: saved === 'dark' }

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.isDark = !state.isDark
      localStorage.setItem('crm_theme', state.isDark ? 'dark' : 'light')
    },
    setTheme(state, { payload }) {
      state.isDark = payload === 'dark'
      localStorage.setItem('crm_theme', payload)
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions
export default themeSlice.reducer
