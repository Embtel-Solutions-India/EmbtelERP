import { createTheme } from '@mui/material/styles'

const baseTypography = {
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  h1: { fontWeight: 800 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600 },
}

const baseComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        textTransform: 'none',
        fontWeight: 600,
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
    },
  },
  MuiChip: {
    styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: { borderRadius: 8, fontSize: '0.75rem' },
    },
  },
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#ec4899' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#06b6d4' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1e293b', secondary: '#64748b' },
  },
  typography: baseTypography,
  components: baseComponents,
  shape: { borderRadius: 12 },
})

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1' },
    secondary: { main: '#f472b6' },
    success: { main: '#34d399' },
    warning: { main: '#fbbf24' },
    error: { main: '#f87171' },
    info: { main: '#22d3ee' },
    background: { default: '#030712', paper: '#111827' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
  typography: baseTypography,
  components: {
    ...baseComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#111827',
        },
      },
    },
  },
  shape: { borderRadius: 12 },
})
