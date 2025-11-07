/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
} from '@reduxjs/toolkit';
import api from '../api/axios';

const DEFAULT_ENDPOINT = '/api/dao/analytic/public/children/network';

const adapter = createEntityAdapter({
  selectId: (network) => network.id,
});

const initialState = adapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
});

/**
 * fetchChildrenNetworks
 * - supports an optional endpoint override via payload:
 *     dispatch(fetchChildrenNetworks())  // uses DEFAULT_ENDPOINT
 *     dispatch(fetchChildrenNetworks('/my/endpoint')) // override
 */
export const fetchChildrenNetworks = createAsyncThunk(
  'childrenNetwork/fetchChildrenNetworks',
  async (endpoint = DEFAULT_ENDPOINT, thunkAPI) => {
    // axios supports AbortController signal in recent versions:
    const res = await api.get(endpoint, { signal: thunkAPI.signal });
    return res.data;
  },
);

const childrenNetworkSlice = createSlice({
  name: 'childrenNetwork',
  initialState,
  reducers: {
    clearChildrenNetwork(state) {
      adapter.removeAll(state);
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChildrenNetworks.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchChildrenNetworks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // If API returns array of networks, adapter.setAll is appropriate.
        // If your API wraps the array (e.g. { networks: [...] }) adapt accordingly.
        const { payload } = action;
        if (Array.isArray(payload)) {
          adapter.setAll(state, payload);
        } else if (payload && Array.isArray(payload.networks)) {
          adapter.setAll(state, payload.networks);
        } else {
          // fallback: put the whole payload as a single entity if shape unexpected
          // (you can change this behavior to match your API)
          try {
            adapter.setAll(state, Array.isArray(payload) ? payload : [payload]);
          } catch (err) {
            console.log(err);
            state.error = 'Unexpected payload shape';
          }
        }
      })
      .addCase(fetchChildrenNetworks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load children networks';
      });
  },
});

export const { clearChildrenNetwork } = childrenNetworkSlice.actions;

// selectors
export const childrenNetworkSelectors = adapter.getSelectors(
  (state) => state.childrenNetwork,
);

export default childrenNetworkSlice.reducer;
