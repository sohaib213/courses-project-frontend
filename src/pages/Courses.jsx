import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchCourses,
  setFilters,
  resetFilters,
  setPage,
} from "../redux/slices/courseSlice";
import {
  fetchCategories,
  selectAllCategories,
  selectCategoriesLoading,
} from "../redux/slices/categorySlice";
import CourseCard from "../components/courses/CourseCard";
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Grid3x3,
  List,
  Sparkles,
} from "lucide-react";
import { Range } from "react-range";

const Courses = () => {
  const dispatch = useAppDispatch();

  // Course state
  const { courses, isLoading, filters, pagination } = useAppSelector(
    (state) => state.courses,
  );

  // Category state from Redux
  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);

  const [localSearch, setLocalSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const STEP = 10;
  const MIN = 0;
  const MAX = 1000;

  const [values, setValues] = useState([0, 1000]);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(
        setFilters({
          min_price: values[0],
          max_price: values[1],
        }),
      );
      dispatch(setPage(1));
    }, 500);

    return () => clearTimeout(handler);
  }, [values, dispatch]);

  // Fetch categories on component mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(setFilters({ search: localSearch }));
      dispatch(setPage(1));
    }, 500); // wait 500ms after stop typing

    return () => {
      clearTimeout(handler); // cancel previous timeout if user types again
    };
  }, [localSearch, dispatch]);

  // Fetch courses when filters/pagination change
  useEffect(() => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
      ...(filters.search && { title_description_search: filters.search }),
      ...(filters.category_id && { category_id: filters.category_id }),
      ...(filters.teacher_id && { teacher_id: filters.teacher_id }),
      ...(filters.min_price !== undefined && { min_price: filters.min_price }),
      ...(filters.max_price !== undefined && { max_price: filters.max_price }),
    };

    dispatch(fetchCourses(params));
  }, [dispatch, filters, pagination.currentPage, pagination.limit]);

  const handleResetFilters = () => {
    setLocalSearch("");
    dispatch(resetFilters());
  };

  const handleCategoryFilter = (categoryId) => {
    dispatch(setFilters({ category_id: categoryId }));
    dispatch(setPage(1));
  };

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading && courses.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-dark-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading amazing courses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                {courses.length}+ Courses Available
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Explore Our Courses
            </h1>
            <p className="text-xl text-white/90 dark:text-white/80 max-w-2xl mx-auto">
              Discover world-class courses from expert instructors
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8 glass rounded-2xl shadow-xl p-6 -mt-8 relative z-10">
          <div className="space-y-4">
            {/* Main Search Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for courses, skills, or topics..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary flex items-center gap-2 ${showFilters ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" : ""}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>

                {(filters.search || filters.category_id) && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-secondary flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {(filters.search || filters.category_id) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                    <Search className="h-3 w-3 mr-1.5" />"{filters.search}"
                    <button
                      onClick={() => dispatch(setFilters({ search: "" }))}
                      className="ml-2 hover:text-primary-900 dark:hover:text-primary-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.category_id && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Filter className="h-3 w-3 mr-1.5" />
                    {categories.find((c) => c.id === filters.category_id)
                      ?.name || "Category"}
                    <button
                      onClick={() => dispatch(setFilters({ category_id: "" }))}
                      className="ml-2 hover:text-purple-900 dark:hover:text-purple-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Extended Filters Panel */}
            {showFilters && (
              <>
                <div className="pt-6 mt-6 border-t border-gray-200 dark:border-dark-700 animate-slide-down">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter by Category
                  </h3>

                  {categoriesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Loading categories...
                      </p>
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                      No categories available
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategoryFilter(category.id)}
                          className={`group relative overflow-hidden px-4 py-3 rounded-xl border-2 transition-all ${
                            filters.category_id === category.id
                              ? "border-primary-500 bg-gradient-to-br " +
                                category.color +
                                " text-white shadow-lg scale-105"
                              : "border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-600 hover:scale-105"
                          }`}
                        >
                          <div className="text-2xl mb-1">{category.icon}</div>
                          <div className="text-xs font-medium">
                            {category.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Filter by Price
                  </h3>

                  <div className="px-3">
                    <Range
                      step={STEP}
                      min={MIN}
                      max={MAX}
                      values={values}
                      onChange={(vals) => setValues(vals)}
                      renderTrack={({ props, children }) => (
                        <div
                          {...props}
                          className="h-2 w-full rounded bg-gray-200 dark:bg-dark-700"
                        >
                          {children}
                        </div>
                      )}
                      renderThumb={({ props }) => (
                        <div
                          {...props}
                          className="h-5 w-5 rounded-full bg-primary-600 shadow-lg focus:outline-none"
                        />
                      )}
                    />
                  </div>

                  <div className="flex justify-between mt-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>${values[0]}</span>
                    <span>${values[1]}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-gray-600 dark:text-gray-400">
            {courses.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {courses.length}
                </span>{" "}
                courses
              </>
            ) : (
              <span className="text-gray-500">No courses found</span>
            )}
          </p>

          {/* View Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              View:
            </span>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-800 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
          </div>
        )}

        {/* Courses Grid/List */}
        {!isLoading && courses.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="w-24 h-24 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search or filters
            </p>
            <button onClick={handleResetFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {courses.length > 0 && (
          <div className="mt-12 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
            >
              Previous
            </button>

            <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
              Page {pagination.currentPage}
            </span>

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={courses.length < pagination.limit}
              className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
