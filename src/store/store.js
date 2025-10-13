// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import reportReducer from '../features/reportSlice';
import frequencyReducer from '../features/frequencySlice';
import needsReducer from '../features/needsSlice';
import virtualFamilySlice from '../features/virtualFamilySlice';

const store = configureStore({
  reducer: {
    report: reportReducer,
    frequency: frequencyReducer,
    needs: needsReducer,
    virtualFamily: virtualFamilySlice,
  },
});

// export both named and default (helps avoid import mistakes)
export { store };
export default store;
