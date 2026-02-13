import { createSlice } from "@reduxjs/toolkit";

// Check localStorage and system preference
const getInitialDarkMode = () => {
  const saved = localStorage.getItem("darkMode");
  if (saved !== null) {
    return JSON.parse(saved);
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const initialState = {
  darkMode: getInitialDarkMode(),
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      // Update localStorage
      localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
      // Update document class
      if (state.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem("darkMode", JSON.stringify(state.darkMode));
      if (state.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    initializeDarkMode: (state) => {
      // Apply the current dark mode state to the document
      if (state.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
  },
});

export const { toggleDarkMode, setDarkMode, initializeDarkMode } =
  uiSlice.actions;
export default uiSlice.reducer;
