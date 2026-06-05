import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { perspectiveService } from '../../services/perspectiveService'

export const fetchPerspectives = createAsyncThunk(
    'perspective/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getPerspectives()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const switchPerspective = createAsyncThunk(
    'perspective/switch',
    async ({ targetType, targetId }, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.switchTo(targetType, targetId)
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

export const fetchOrganizationTree = createAsyncThunk(
    'perspective/fetchOrgTree',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getOrganizationTree()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const fetchBusinessTree = createAsyncThunk(
    'perspective/fetchBusinessTree',
    async (businessId, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getBusinessTree(businessId)
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

export const fetchHierarchyTree = createAsyncThunk(
    'perspective/fetchHierarchyTree',
    async (_, { rejectWithValue }) => {
        try {
            const res = await perspectiveService.getHierarchyTree()
            return res.data
        } catch (err) {
            return rejectWithValue(err.message)
        }
    }
)

const initialState = {
    availablePerspectives: [],
    current: null,
    currentInfo: null,
    organizationTree: null,
    businessTree: null,
    hierarchyTree: [],
    loading: false,
    error: null,
}

const perspectiveSlice = createSlice({
    name: 'perspective',
    initialState,
    reducers: {
        clearPerspective(state) {
            state.current = null
            state.currentInfo = null
            state.availablePerspectives = []
            state.hierarchyTree = []
            state.error = null
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all perspectives
            .addCase(fetchPerspectives.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchPerspectives.fulfilled, (state, action) => {
                state.loading = false
                state.availablePerspectives = action.payload.availablePerspectives || []
                state.current = action.payload.currentPerspective || null
            })
            .addCase(fetchPerspectives.rejected, (state, action) => {
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
            .addCase(resetPerspective.fulfilled, (state) => {
                state.current = null
                state.currentInfo = null
            })
            // Fetch current perspective info
            .addCase(fetchCurrentPerspective.fulfilled, (state, action) => {
                state.currentInfo = action.payload
            })
            // Fetch organization tree
            .addCase(fetchOrganizationTree.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchOrganizationTree.fulfilled, (state, action) => {
                state.loading = false
                state.organizationTree = action.payload
            })
            .addCase(fetchOrganizationTree.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Fetch business tree
            .addCase(fetchBusinessTree.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchBusinessTree.fulfilled, (state, action) => {
                state.loading = false
                state.businessTree = action.payload
            })
            .addCase(fetchBusinessTree.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            // Fetch role hierarchy tree (reporting chain)
            .addCase(fetchHierarchyTree.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchHierarchyTree.fulfilled, (state, action) => {
                state.loading = false
                state.hierarchyTree = action.payload?.data || []
            })
            .addCase(fetchHierarchyTree.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    },
})

export const { clearPerspective } = perspectiveSlice.actions
export default perspectiveSlice.reducer
