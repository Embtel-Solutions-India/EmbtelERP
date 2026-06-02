import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dashboardReducer from './slices/dashboardSlice'
import leadReducer from './slices/leadSlice'
import meetingReducer from './slices/meetingSlice'
import taskReducer from './slices/taskSlice'
import notificationReducer from './slices/notificationSlice'
import themeReducer from './slices/themeSlice'
import perspectiveReducer from './slices/perspectiveSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    leads: leadReducer,
    meetings: meetingReducer,
    tasks: taskReducer,
    notifications: notificationReducer,
    theme: themeReducer,
    perspective: perspectiveReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})
