import { configureStore } from '@reduxjs/toolkit'
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

export const store = configureStore({
  reducer: {
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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

