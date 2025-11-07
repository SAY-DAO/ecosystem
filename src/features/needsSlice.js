/* eslint-disable no-param-reassign */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  // deliveredNeeds is an object now to hold list + pagination meta
  deliveredNeeds: {
    delivered: [],
    count: 0,
    page: 1,
    limit: 10,
  },
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchDeliveredNeeds = createAsyncThunk(
  'needs/fetchDeliveredNeeds',
  // accept object: { needType, page, limit }
  async ({ needType, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/api/dao/analytic/public/needs/delivered/${needType}?page=${page}&limit=${limit}`,
      );
      // Expect response shape: { delivered: [...], count: number }
      return {
        delivered: res.data.delivered ?? [],
        count: typeof res.data.count === 'number' ? res.data.count : 0,
        page,
        limit,
      };
    } catch (err) {
      // try to return a friendly message
      const message =
        err?.response?.data?.message || err?.message || 'Failed to load needs';
      return rejectWithValue(message);
    }
  },
);

const needsSlice = createSlice({
  name: 'needs',
  initialState,
  reducers: {
    clearNeeds(state) {
      state.deliveredNeeds = {
        delivered: [],
        count: 0,
        page: 1,
        limit: 10,
      };
      state.status = 'idle';
      state.error = null;
    },
    // optional: allow setting page from the UI without refetching
    setNeedsPage(state, action) {
      state.deliveredNeeds.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveredNeeds.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDeliveredNeeds.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.deliveredNeeds = {
          delivered: action.payload.delivered,
          count: action.payload.count,
          page: action.payload.page,
          limit: action.payload.limit,
        };
      })
      .addCase(fetchDeliveredNeeds.rejected, (state, action) => {
        state.status = 'failed';
        // if we used rejectWithValue, payload is available in action.payload
        state.error =
          action.payload || action.error?.message || 'Failed to load needs';
      });
  },
});

export const { clearNeeds, setNeedsPage } = needsSlice.actions;
export default needsSlice.reducer;
