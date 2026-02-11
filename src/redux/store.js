import { configureStore } from "@reduxjs/toolkit";
import itemsSlice from "../redux/slices/items-slice";
import categorisSlice from "../redux/slices/categories-slice";

export const store = configureStore({
  reducer: {
    items: itemsSlice,
    categories: categorisSlice,
  },
});
