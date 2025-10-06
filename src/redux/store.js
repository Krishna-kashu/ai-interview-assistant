import { configureStore, createSlice } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';


// Candidate slice
const candidateSlice = createSlice({
  name: "candidates",
  initialState: {
    list: [],
        currentCandidate: null,
  },
  reducers: {
    addCandidate: (state, action) => {
      state.list.push(action.payload);
      state.currentCandidate = action.payload;
    },
    updateCandidate: (state, action) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;
      if (state.currentCandidate?.id === action.payload.id)
        state.currentCandidate = action.payload;
    },
    clearCurrent: (state) => {
      state.currentCandidate = null;
    },
    completeCandidate: (state, action) => {
      const idx = state.list.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        const candidate = { ...state.list[idx], completed: true };
        candidate.score = candidate.answers.reduce((acc, a) => acc + (a.score || 0), 0);
        state.list[idx] = candidate;
        if (state.currentCandidate?.id === candidate.id)
          state.currentCandidate = candidate;
      }
    },
    saveCurrentProgress: (state, action) => {
      const candidate = action.payload;
      const idx = state.list.findIndex((c) => c.id === candidate.id);
      if (idx !== -1) state.list[idx] = candidate;
      state.currentCandidate = candidate;
    },
  },
});

const rootReducer = combineReducers({
  candidates: candidateSlice.reducer,
});

const persistConfig = { key: "root", storage };
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export const {
  addCandidate,
  updateCandidate,
  clearCurrent,
  completeCandidate,
  saveCurrentProgress,
} = candidateSlice.actions;
