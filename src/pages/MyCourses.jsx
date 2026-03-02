import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
  Award,
  Search,
  Filter,
  Grid3x3,
  List,
  Sparkles,
  Calendar,
  ArrowRight,
  Target,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { fetchMyCourses } from "../redux/slices/courseSlice";
import defaultCoursePhoto from "../../src/assets/default_course_photo.jpg";

const MyCourses = () => {
  const dispatch = useAppDispatch();
  const { myCourses, isLoading } = useAppSelector((state) => state.courses);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, in-progress, completed, not-started
  const [viewMode, setViewMode] = useState("grid"); // grid, list

  useEffect(() => {
    dispatch(fetchMyCourses());
  }, [dispatch]);

  // Normalize courses data from backend
  // Backend returns: enrollments with nested 'courses' object
  const enrollments = Array.isArray(myCourses) ? myCourses : [];

  const normalizedCourses = enrollments
    .filter((enrollment) => enrollment?.courses) // Filter out invalid entries
    .map((enrollment) => {
      const course = enrollment.courses;
      return {
        ...course,
        enrollmentId: enrollment.id,
        enrolledDate: enrollment.enrolledat,
        currentLessonOrder: enrollment.current_lesson_order || 0,
        isCompleted: enrollment.completed || false,
        // Calculate total lessons from _count
        totalLessons: course._count?.lessons || course.lessons_number || 0,
      };
    });

  // Calculate progress based on current_lesson_order
  const getCourseProgress = (course) => {
    if (!course.totalLessons) return 0;
    return Math.min(
      100,
      Math.round((course.currentLessonOrder / course.totalLessons) * 100),
    );
  };

  const getCourseStatus = (course) => {
    if (course.isCompleted) return "completed";
    if (course.currentLessonOrder === 0) return "not-started";
    return "in-progress";
  };

  // Filter courses
  const filteredCourses = normalizedCourses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const status = getCourseStatus(course);
    const matchesFilter = filterStatus === "all" || status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      label: "Total Courses",
      value: normalizedCourses.length,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      label: "In Progress",
      value: normalizedCourses.filter(
        (c) => getCourseStatus(c) === "in-progress",
      ).length,
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <CheckCircle className="h-6 w-6" />,
      label: "Completed",
      value: normalizedCourses.filter((c) => c.isCompleted).length,
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Award className="h-6 w-6" />,
      label: "Certificates",
      value: normalizedCourses.filter((c) => c.isCompleted).length,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading your courses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Your Learning Journey</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Courses</h1>
            <p className="text-xl text-white/90 dark:text-white/80 max-w-2xl">
              Continue learning and track your progress across all enrolled
              courses
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}
              >
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="glass rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search your courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter and View */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="all">All Courses</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="not-started">Not Started</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-800 rounded-lg">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-all ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-dark-700 text-primary-600 dark:text-primary-400 shadow"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  title="Grid view"
                >
                  <Grid3x3 className="h-5 w-5" />
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
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {normalizedCourses.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Courses Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Start your learning journey today! Browse our course catalog and
              enroll in courses that interest you.
            </p>
            <Link
              to="/courses"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Target className="h-5 w-5" />
              Browse Courses
            </Link>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 card">
            <div className="w-24 h-24 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Courses Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your search or filter
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Courses Grid/List */
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredCourses.map((course) => {
              const progress = getCourseProgress(course);
              const status = getCourseStatus(course);

              return viewMode === "grid" ? (
                /* Grid View */
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="card-hover group"
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
                    <img
                      src={course.thumbnail_url || defaultCoursePhoto}
                      alt={defaultCoursePhoto}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = defaultCoursePhoto;
                      }}
                    />

                    {/* Status Badge */}
                    {status === "completed" && (
                      <div className="absolute top-3 right-3 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                        <Play className="h-8 w-8 text-primary-600 ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Course Info */}
                  <h3 className="text-lg font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        Lesson {course.currentLessonOrder} of{" "}
                        {course.totalLessons}
                      </span>
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          status === "completed"
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-primary-600 to-purple-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {course.enrolledDate
                          ? new Date(course.enrolledDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )
                          : "Recently"}
                      </span>
                    </div>
                    <span>{course.totalLessons} lessons</span>
                  </div>
                </Link>
              ) : (
                /* List View */
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="card-hover flex flex-col sm:flex-row gap-4 group"
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden rounded-xl w-full sm:w-48 h-32 flex-shrink-0">
                    <img
                      src={course.thumbnail_url || defaultCoursePhoto}
                      alt={defaultCoursePhoto}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = defaultCoursePhoto;
                      }}
                    />

                    {status === "completed" && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description || "No description available"}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Lesson {course.currentLessonOrder} of{" "}
                          {course.totalLessons}
                        </span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            status === "completed"
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gradient-to-r from-primary-600 to-purple-600"
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Enrolled{" "}
                          {course.enrolledDate
                            ? new Date(course.enrolledDate).toLocaleDateString()
                            : "recently"}
                        </span>
                      </div>
                      <span>{course.totalLessons} lessons</span>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <div className="flex items-center sm:items-start">
                    <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center">
                      {status === "completed" ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Review
                        </>
                      ) : status === "not-started" ? (
                        <>
                          <Play className="h-4 w-4" />
                          Start
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          Continue
                        </>
                      )}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
