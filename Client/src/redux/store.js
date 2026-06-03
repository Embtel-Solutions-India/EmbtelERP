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

// Marketing Reducers
import marketingDashboardReducer from '../modules/marketing/redux/marketingDashboardSlice'
import marketingTaskReducer      from '../modules/marketing/redux/marketingTaskSlice'
import marketingEmailReducer     from '../modules/marketing/redux/marketingEmailSlice'

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
    
    // Marketing slices
    marketingDashboard: marketingDashboardReducer,
    marketingTasks:     marketingTaskReducer,
    marketingEmails:    marketingEmailReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})
