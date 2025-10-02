// redux/store.js
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";

// Candidate slice
const candidateSlice = createSlice({
  name: "candidates",
  initialState: {
    list: [], // all candidates
    currentCandidate: null, // candidate in progress
  },
  reducers: {
    // Add new candidate after resume upload
    addCandidate: (state, action) => {
      state.list.push(action.payload);
      state.currentCandidate = action.payload;
    },

    // Update candidate answers or info
    updateCandidate: (state, action) => {
      const idx = state.list.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) state.list[idx] = action.payload;

      if (state.currentCandidate?.id === action.payload.id)
        state.currentCandidate = action.payload;
    },

    // Remove current candidate (after interview completed or reset)
    clearCurrent: (state) => {
      state.currentCandidate = null;
    },

    // Optional: mark candidate interview completed and calculate score
    completeCandidate: (state, action) => {
      const idx = state.list.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        const candidate = { ...state.list[idx], completed: true };
        candidate.score = candidate.answers.length * 10; // simple scoring
        state.list[idx] = candidate;

        if (state.currentCandidate?.id === candidate.id)
          state.currentCandidate = candidate;
      }
    },

    // Persist partially completed candidate immediately
    saveCurrentProgress: (state, action) => {
      const candidate = action.payload;
      const idx = state.list.findIndex(c => c.id === candidate.id);
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

export const store = configureStore({ reducer: persistedReducer });
export const persistor = persistStore(store);

export const { addCandidate, updateCandidate, clearCurrent, completeCandidate, saveCurrentProgress } =
  candidateSlice.actions;
