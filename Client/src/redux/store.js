import { configureStore, combineReducers } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dashboardReducer from './slices/dashboardSlice'
import leadReducer from './slices/leadSlice'
import meetingReducer from './slices/meetingSlice'
import taskReducer from './slices/taskSlice'
import notificationReducer from './slices/notificationSlice'
import themeReducer        from './slices/themeSlice'
import teamReducer         from './slices/teamSlice'
import perspectiveReducer  from './slices/perspectiveSlice'
import workspaceReducer    from './slices/workspaceSlice'
import employeeReducer     from './slices/employeeSlice'
import documentReducer     from './slices/documentSlice'
import calendarReducer     from './slices/calendarSlice'

// Marketing Reducers
import marketingDashboardReducer from '../modules/marketing/redux/marketingDashboardSlice'
import marketingTaskReducer      from '../modules/marketing/redux/marketingTaskSlice'
import marketingEmailReducer     from '../modules/marketing/redux/marketingEmailSlice'

// HR Reducer
import hrReducer from '../modules/hr/redux/hrSlice'

// Immigration Reducer
import immigrationReducer from '../modules/immigration/redux/immigrationSlice'

const appReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  leads: leadReducer,
  meetings: meetingReducer,
  tasks: taskReducer,
  notifications: notificationReducer,
  theme:         themeReducer,
  team:          teamReducer,
  perspective:   perspectiveReducer,
  workspace:     workspaceReducer,
  employees:     employeeReducer,
  documents:     documentReducer,
  calendar:      calendarReducer,

  // Marketing slices
  marketingDashboard: marketingDashboardReducer,
  marketingTasks:     marketingTaskReducer,
  marketingEmails:    marketingEmailReducer,

  // HR slice
  hr: hrReducer,

  // Immigration slice
  immigration: immigrationReducer,
})

// Reset all per-user state on logout or on a fresh login so one member can never
// see another member's cached data (calendar, perspective, immigration, etc.).
// The theme (dark-mode) preference is UI-only and is preserved across sessions.
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout' || action.type === 'auth/login/fulfilled') {
    state = state ? { theme: state.theme } : undefined
  }
  return appReducer(state, action)
}

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

