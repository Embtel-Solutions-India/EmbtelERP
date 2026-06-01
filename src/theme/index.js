import { createTheme } from '@mui/material/styles';

const commonTypography = {
  fontFamily: '"Inter", "Plus Jakarta Sans", sans-serif',
  h1: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 800 },
  h2: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
  h3: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
  h4: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
  h5: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
  h6: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
  button: { textTransform: 'none', fontWeight: 600, fontFamily: '"Inter", sans-serif' },
};

const commonComponents = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '8px 20px',
        boxShadow: 'none',
        '&:hover': { boxShadow: 'none' },
      },
      containedPrimary: {
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        '&:hover': {
          background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: { fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 8, height: 8 },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: { fontWeight: 700 },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#fff' },
    secondary: { main: '#06b6d4', light: '#22d3ee', dark: '#0891b2' },
    success: { main: '#10b981', light: '#34d399', dark: '#059669' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    background: { default: '#f1f5f9', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  typography: commonTypography,
  components: {
    ...commonComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          ...commonComponents.MuiCard.styleOverrides.root,
          background: '#ffffff',
          border: '1px solid #f1f5f9',
        },
      },
    },
  },
  shape: { borderRadius: 12 },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1', contrastText: '#fff' },
    secondary: { main: '#22d3ee', light: '#67e8f9', dark: '#06b6d4' },
    success: { main: '#34d399', light: '#6ee7b7', dark: '#10b981' },
    warning: { main: '#fbbf24', light: '#fcd34d', dark: '#f59e0b' },
    error: { main: '#f87171', light: '#fca5a5', dark: '#ef4444' },
    info: { main: '#60a5fa', light: '#93c5fd', dark: '#3b82f6' },
    background: { default: '#0a0a1a', paper: '#111827' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    divider: '#1e293b',
  },
  typography: commonTypography,
  components: {
    ...commonComponents,
    MuiCard: {
      styleOverrides: {
        root: {
          ...commonComponents.MuiCard.styleOverrides.root,
          background: 'rgba(17, 24, 39, 0.8)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },
  },
  shape: { borderRadius: 12 },
});
