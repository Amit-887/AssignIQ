import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sectionReducer from './slices/sectionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sections: sectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;

