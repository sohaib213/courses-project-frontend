import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { courseService } from "../../services/courseService";

// Async Thunks
export const fetchCourses = createAsyncThunk(
  "courses/fetchCourses",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await courseService.getAllCourses(params);
      console.log("Fetched courses data:", data);
      return { data, params }; // Return params to track current filters
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses",
      );
    }
  },
  {
    // Prevent duplicate in-flight requests (e.g. React 18 StrictMode in dev).
    condition: (_, { getState }) => {
      const { courses } = getState();
      return !courses.isLoading;
    },
  },
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchCourseById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await courseService.getCourseById(id);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course",
      );
    }
  },
);

export const searchCourses = createAsyncThunk(
  "courses/searchCourses",
  async ({ searchTerm, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const data = await courseService.searchCourses(searchTerm, page, limit);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search courses",
      );
    }
  },
);

export const fetchCoursesByCategory = createAsyncThunk(
  "courses/fetchCoursesByCategory",
  async ({ categoryId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const data = await courseService.getCoursesByCategory(
        categoryId,
        page,
        limit,
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses by category",
      );
    }
  },
);

export const fetchCoursesByTeacher = createAsyncThunk(
  "courses/fetchCoursesByTeacher",
  async ({ teacherId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const data = await courseService.getCoursesByTeacher(
        teacherId,
        page,
        limit,
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses by teacher",
      );
    }
  },
);

export const createCourse = createAsyncThunk(
  "courses/createCourse",
  async (courseData, { rejectWithValue }) => {
    try {
      const data = await courseService.createCourse(courseData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create course",
      );
    }
  },
);

export const updateCourse = createAsyncThunk(
  "courses/updateCourse",
  async ({ id, courseData }, { rejectWithValue }) => {
    try {
      const data = await courseService.updateCourse(id, courseData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course",
      );
    }
  },
);

export const deleteCourse = createAsyncThunk(
  "courses/deleteCourse",
  async (id, { rejectWithValue }) => {
    try {
      await courseService.deleteCourse(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete course",
      );
    }
  },
);

export const enrollInCourse = createAsyncThunk(
  "courses/enrollInCourse",
  async (courseId, { rejectWithValue }) => {
    try {
      const data = await courseService.enrollInCourse(courseId);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to enroll in course",
      );
    }
  },
);

export const fetchMyCourses = createAsyncThunk(
  "courses/fetchMyCourses",
  async (_, { rejectWithValue }) => {
    try {
      const data = await courseService.getMyCourses();
      console.log(data);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch enrolled courses",
      );
    }
  },
);

// Initial State
const initialState = {
  courses: [],
  currentCourse: null,
  myCourses: [],
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    limit: 10,
  },
  filters: {
    search: "",
    category_id: "",
    teacher_id: "",
  },
};

// Slice
const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = Array.isArray(action.payload.data)
          ? action.payload.data
          : action.payload.data.courses || [];

        // Update pagination if backend returns it
        if (action.payload.data.pagination) {
          state.pagination = {
            ...state.pagination,
            ...action.payload.data.pagination,
          };
        }
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Search Courses
    builder
      .addCase(searchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(searchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Courses By Category
    builder
      .addCase(fetchCoursesByCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Courses By Teacher
    builder
      .addCase(fetchCoursesByTeacher.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCoursesByTeacher.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCoursesByTeacher.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch Course By ID
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCourse = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Create Course
    builder
      .addCase(createCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses.unshift(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Course
    builder
      .addCase(updateCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.courses.findIndex(
          (course) => course.id === action.payload.id,
        );
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
        if (state.currentCourse?.id === action.payload.id) {
          state.currentCourse = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Course
    builder
      .addCase(deleteCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = state.courses.filter(
          (course) => course.id !== action.payload,
        );
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Enroll in Course
    builder
      .addCase(enrollInCourse.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enrollInCourse.fulfilled, (state) => {
        state.isLoading = false;
        if (state.currentCourse) {
          state.currentCourse.isEnrolled = true;
        }
      })
      .addCase(enrollInCourse.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Fetch My Courses
    builder
      .addCase(fetchMyCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myCourses = action.payload;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearCurrentCourse,
  setFilters,
  resetFilters,
  setPage,
  setLimit,
} = courseSlice.actions;

export default courseSlice.reducer;
