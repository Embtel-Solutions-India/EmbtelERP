import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { documentService } from '../../services/documentService'

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await documentService.getAll(params)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const createDocumentAsync = createAsyncThunk(
  'documents/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await documentService.create(data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const updateDocumentAsync = createAsyncThunk(
  'documents/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await documentService.update(id, data)
      return res.data
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

export const deleteDocumentAsync = createAsyncThunk(
  'documents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await documentService.delete(id)
      return id
    } catch (err) {
      return rejectWithValue(err.message)
    }
  }
)

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    setLoading(state, { payload }) { state.loading = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload || []
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createDocumentAsync.fulfilled, (state, action) => {
        state.list.unshift(action.payload)
      })
      .addCase(updateDocumentAsync.fulfilled, (state, action) => {
        const idx = state.list.findIndex(d => d.id === action.payload.id)
        if (idx !== -1) {
          state.list[idx] = action.payload
        }
      })
      .addCase(deleteDocumentAsync.fulfilled, (state, action) => {
        state.list = state.list.filter(d => d.id !== action.payload)
      })
  }
})

export const { setLoading } = documentSlice.actions
export default documentSlice.reducer
