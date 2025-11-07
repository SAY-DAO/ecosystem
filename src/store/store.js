// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import reportReducer from '../features/reportSlice';
import needsReducer from '../features/needsSlice';
import virtualFamilySlice from '../features/virtualFamilySlice';
import childrenNetworkReducer from '../features/childrenSlice';

const store = configureStore({
  reducer: {
    report: reportReducer,
    needs: needsReducer,
    virtualFamily: virtualFamilySlice,
    childrenNetwork: childrenNetworkReducer,
  },
});

// export both named and default (helps avoid import mistakes)
export { store };
export default store;
