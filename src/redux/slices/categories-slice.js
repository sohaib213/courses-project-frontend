import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { API_BASE_URL } from "../../utils/api-url.js";
import axios from "axios";

export const fetchCategories = createAsyncThunk(
  "categoriesSlice/fetchCategories",
  async () => {
    const res = await axios.get(`${API_BASE_URL}/categories`);

    if (res.status !== 200) {
      throw new Error("Failed to fetch categories");
    }
    const data = res.data;
    return data.data;
  },
);

const categoriesSlice = createSlice({
  initialState: [],
  name: "categoriesSlice",
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      return action.payload;
    });
  },
});

export const {} = categoriesSlice.actions;
export default categoriesSlice.reducer;
