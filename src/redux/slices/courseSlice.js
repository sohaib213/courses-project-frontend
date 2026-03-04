import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { courseService } from "../../services/courseService";
import { DEFAULT_PAGE_LIMIT } from "../../constants/pagination";

const COURSES_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_COURSES_CACHE_ENTRIES = 20;

const normalizeCoursesQueryParams = (params = {}) => {
  const internalKeys = new Set(["forceRefresh"]);
  return Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (internalKeys.has(key)) return acc;
      const value = params[key];
      if (value === undefined || value === null || value === "") return acc;
      acc[key] = value;
      return acc;
    }, {});
};

const buildCoursesCacheKey = (params = {}) => {
  const normalized = normalizeCoursesQueryParams(params);
  return JSON.stringify(normalized);
};

const normalizeCoursesPayload = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return {
      courses: data,
      count: data.length,
      pagination: null,
    };
  }

  if (data && Array.isArray(data.courses)) {
    const parsedCount = Number(data.count);
    return {
      courses: data.courses,
      count: Number.isFinite(parsedCount) ? parsedCount : data.courses.length,
      pagination: data.pagination || null,
    };
  }

  return {
    courses: [],
    count: 0,
    pagination: data?.pagination || null,
  };
};

// Async Thunks
export const fetchCourses = createAsyncThunk(
  "courses/fetchCourses",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const normalizedParams = normalizeCoursesQueryParams(params);
      const cacheKey = buildCoursesCacheKey(normalizedParams);
      const cacheEntry = getState().courses?.coursesCache?.[cacheKey];
      const isCacheValid =
        Boolean(cacheEntry) &&
        Date.now() - cacheEntry.timestamp < COURSES_CACHE_TTL_MS;

      if (isCacheValid && !params.forceRefresh) {
        return {
          data: cacheEntry.data,
          params: normalizedParams,
          cacheKey,
          fetchedAt: cacheEntry.timestamp,
          fromCache: true,
        };
      }

      const data = await courseService.getAllCourses(normalizedParams);
      return {
        data,
        params: normalizedParams,
        cacheKey,
        fetchedAt: Date.now(),
        fromCache: false,
      };
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
  async (
    { searchTerm, page = 1, limit = DEFAULT_PAGE_LIMIT },
    { rejectWithValue },
  ) => {
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
  async (
    { categoryId, page = 1, limit = DEFAULT_PAGE_LIMIT },
    { rejectWithValue },
  ) => {
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
  async (
    { teacherId, page = 1, limit = DEFAULT_PAGE_LIMIT },
    { rejectWithValue },
  ) => {
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
  coursesCache: {},
  lastCoursesQueryKey: "",
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    limit: DEFAULT_PAGE_LIMIT,
    total_count: 0,
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
      const entries = Object.entries(action.payload || {});
      let hasChanges = false;

      entries.forEach(([key, value]) => {
        if (state.filters[key] !== value) {
          state.filters[key] = value;
          hasChanges = true;
        }
      });

      if (!hasChanges) return;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
    setPage: (state, action) => {
      if (state.pagination.currentPage === action.payload) return;
      state.pagination.currentPage = action.payload;
    },
    setLimit: (state, action) => {
      if (state.pagination.limit === action.payload) return;
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
        const normalized = normalizeCoursesPayload(action.payload.data);
        state.courses = normalized.courses;
        state.pagination.total_count = normalized.count;
        state.lastCoursesQueryKey = action.payload.cacheKey || "";

        if (normalized.pagination) {
          state.pagination = {
            ...state.pagination,
            ...normalized.pagination,
            total_count: normalized.count,
          };
        }

        const cacheKey = action.payload.cacheKey;
        if (cacheKey) {
          state.coursesCache[cacheKey] = {
            data: action.payload.data,
            timestamp: action.payload.fetchedAt || Date.now(),
          };

          const keys = Object.keys(state.coursesCache);
          if (keys.length > MAX_COURSES_CACHE_ENTRIES) {
            const oldestKey = keys.reduce((oldest, key) =>
              state.coursesCache[key].timestamp <
              state.coursesCache[oldest].timestamp
                ? key
                : oldest,
            );
            delete state.coursesCache[oldestKey];
          }
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
        const normalized = normalizeCoursesPayload(action.payload);
        state.courses = normalized.courses;
        state.pagination.total_count = normalized.count;
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
        const normalized = normalizeCoursesPayload(action.payload);
        state.courses = normalized.courses;
        state.pagination.total_count = normalized.count;
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
        const normalized = normalizeCoursesPayload(action.payload);
        state.courses = normalized.courses;
        state.pagination.total_count = normalized.count;
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
        state.coursesCache = {};
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
        state.coursesCache = {};
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
        state.coursesCache = {};
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
