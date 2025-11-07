/* eslint-disable no-param-reassign */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  roles: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

export const fetchFamilyAnalytic = createAsyncThunk(
  'virtualFamily/fetchFamilyAnalytic',
  async (_, thunkAPI) => {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = await api.get(`/api/dao/analytic/public/family/scattered`, {
      signal: thunkAPI.signal,
      config,
    });
    return res.data;
  },
);

const virtualFamilySlice = createSlice({
  name: 'virtualFamily',
  initialState,
  reducers: {
    clearFamilyAnalytics(state) {
      state.roles = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFamilyAnalytic.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFamilyAnalytic.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // If your API returns { roles: {...} } change this to action.payload.roles
        state.roles = action.payload;
      })
      .addCase(fetchFamilyAnalytic.rejected, (state, action) => {
        state.status = 'failed';
        state.error =
          action.error?.message || 'Failed to load family analytics';
      });
  },
});

export const { clearFamilyAnalytics } = virtualFamilySlice.actions;
export default virtualFamilySlice.reducer;
