import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Routes, Route, Navigate } from 'react-router-dom'
import { lightTheme, darkTheme } from './theme/muiTheme'
import MainLayout   from './layouts/MainLayout'
import Dashboard    from './pages/Dashboard'
import Leads        from './pages/Leads'
import FollowUps    from './pages/FollowUps'
import Meetings     from './pages/Meetings'
import Customers    from './pages/Customers'
import Opportunities from './pages/Opportunities'
import Tasks        from './pages/Tasks'
import Performance  from './pages/Performance'
import Reports      from './pages/Reports'
import Profile      from './pages/Profile'
import Settings     from './pages/Settings'
import Login        from './pages/Login'

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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />}     />
          <Route path="leads"         element={<Leads />}         />
          <Route path="follow-ups"    element={<FollowUps />}     />
          <Route path="meetings"      element={<Meetings />}      />
          <Route path="customers"     element={<Customers />}     />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="tasks"         element={<Tasks />}         />
          <Route path="performance"   element={<Performance />}   />
          <Route path="reports"       element={<Reports />}       />
          <Route path="profile"       element={<Profile />}       />
          <Route path="settings"      element={<Settings />}      />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
