import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { perspectiveService } from '../../services/perspectiveService'

export const fetchAvailablePerspectives = createAsyncThunk(
    'perspective/fetchAvailable',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getAvailable()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const switchPerspective = createAsyncThunk(
    'perspective/switch',
    async (targetUserId, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.switchTo(targetUserId)
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const resetPerspective = createAsyncThunk(
    'perspective/reset',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.reset()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const fetchCurrentPerspective = createAsyncThunk(
    'perspective/fetchCurrent',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getCurrent()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

const initialState = {
    available: [],
    current: null,
    loading: false,
    error: null,
}

const perspectiveSlice = createSlice({
    name: 'perspective',
    initialState,
    reducers: {
        clearPerspective(state) {
            state.current = null
            state.available = []
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch available perspectives
            .addCase(fetchAvailablePerspectives.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchAvailablePerspectives.fulfilled, (state, action) => {
                state.loading = false
                state.available = action.payload
            })
            .addCase(fetchAvailablePerspectives.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Switch perspective
            .addCase(switchPerspective.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(switchPerspective.fulfilled, (state, action) => {
                state.loading = false
                state.current = action.payload
            })
            .addCase(switchPerspective.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Reset perspective
            .addCase(resetPerspective.fulfilled, (state, action) => {
                state.current = action.payload
            })
            // Fetch current perspective
            .addCase(fetchCurrentPerspective.fulfilled, (state, action) => {
                state.current = action.payload
            })
    },
})

export const { clearPerspective } = perspectiveSlice.actions
export default perspectiveSlice.reducer