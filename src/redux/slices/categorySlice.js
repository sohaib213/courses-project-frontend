import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { categoryService } from "../../services/categoryService";

// Async Thunks with request deduplication
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const data = await categoryService.getAllCategories();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories",
      );
    }
  },
  {
    // Prevent duplicate in-flight requests (e.g. React 18 StrictMode in dev)
    condition: (_, { getState }) => {
      const { categories } = getState();
      // Don't fetch if already loading
      return !categories.isLoading;
    },
  },
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await categoryService.getCategoryById(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch category",
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { categories } = getState();
      return !categories.isLoading;
    },
  },
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const data = await categoryService.createCategory(categoryData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create category",
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { categories } = getState();
      return !categories.isLoading;
    },
  },
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const data = await categoryService.updateCategory(id, categoryData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update category",
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { categories } = getState();
      return !categories.isLoading;
    },
  },
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      await categoryService.deleteCategory(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete category",
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { categories } = getState();
      return !categories.isLoading;
    },
  },
);

// Category icon and color mapping
const getCategoryMeta = (categoryName, index) => {
  const iconMap = {
    "Web Development": "💻",
    "Data Science": "📊",
    Design: "🎨",
    "UI/UX Design": "🎨",
    Business: "💼",
    Marketing: "📈",
    Mobile: "📱",
    "Mobile Development": "📱",
    Programming: "⌨️",
    Database: "🗄️",
    DevOps: "🔧",
    AI: "🤖",
    "Machine Learning": "🤖",
    Cloud: "☁️",
    Security: "🔒",
    Networking: "🌐",
  };

  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-teal-500 to-green-500",
    "from-cyan-500 to-blue-500",
    "from-red-500 to-pink-500",
  ];

  return {
    icon: iconMap[categoryName] || "📚",
    color: colors[index % colors.length],
  };
};

// Initial State
const initialState = {
  categories: [],
  currentCategory: null,
  isLoading: false,
  error: null,
  lastFetched: null, // Track when categories were last fetched
};

// Slice
const categorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    // Force refetch by clearing lastFetched
    invalidateCategories: (state) => {
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add meta data (icon, color) to each category
        state.categories = action.payload.map((category, index) => ({
          ...category,
          ...getCategoryMeta(category.name, index),
        }));
        state.lastFetched = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Category By ID
    builder
      .addCase(fetchCategoryById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Category
    builder
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.categories.length;
        state.categories.push({
          ...action.payload,
          ...getCategoryMeta(action.payload.name, index),
        });
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Category
    builder
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.categories.findIndex(
          (cat) => cat.id === action.payload.id,
        );
        if (index !== -1) {
          state.categories[index] = {
            ...action.payload,
            ...getCategoryMeta(action.payload.name, index),
          };
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Category
    builder
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = state.categories.filter(
          (cat) => cat.id !== action.payload,
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentCategory, invalidateCategories } =
  categorySlice.actions;

// Selectors
export const selectAllCategories = (state) => state.categories.categories;
export const selectCurrentCategory = (state) =>
  state.categories.currentCategory;
export const selectCategoriesLoading = (state) => state.categories.isLoading;
export const selectCategoriesError = (state) => state.categories.error;
export const selectCategoriesLastFetched = (state) =>
  state.categories.lastFetched;

// Helper selector to check if categories need refetching (optional, for cache invalidation)
export const selectShouldRefetchCategories = (state) => {
  const { categories, lastFetched } = state.categories;
  // Refetch if never fetched or if data is older than 5 minutes
  if (!lastFetched || categories.length === 0) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - lastFetched > fiveMinutes;
};

export default categorySlice.reducer;
