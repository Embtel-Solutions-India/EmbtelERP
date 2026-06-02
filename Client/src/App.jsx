import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lightTheme, darkTheme } from './theme/muiTheme'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'

// Modular Routes Group Imports
import { salesRoutes } from './modules/sales/routes/salesRoutes'
import { marketingRoutes } from './modules/marketing/routes/marketingRoutes'

export default function App() {
  const { isDark } = useSelector((s) => s.theme)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          {/* Default entry redirect */}
          <Route index element={<Navigate to="/sales/dashboard" replace />} />
          
          {/* Sales Executive Routes Module */}
          {salesRoutes}

          {/* Marketing Executive Routes Module */}
          {marketingRoutes}
        </Route>
        {/* Wildcard fallback redirect */}
        <Route path="*" element={<Navigate to="/sales/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
