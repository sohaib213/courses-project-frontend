import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Search,
  AlertCircle,
  BookOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CourseReviewModal from "./components/CourseReviewModal";
import defaultCoursePhoto from "../../assets/default_course_photo.jpg";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewingCourse, setReviewingCourse] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12); // Courses per page

  // Get API key from sessionStorage (set during login)
  const API_KEY = sessionStorage.getItem("admin_api_key");
  const adminUsername = sessionStorage.getItem("admin_username");

  useEffect(() => {
    if (!API_KEY) {
      toast.error("Please login to access admin panel");
      navigate("/admin/login");
      return;
    }
    fetchData();
  }, [activeTab, currentPage]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_api_key");
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_username");
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === "pending") {
        await fetchPendingCourses();
      } else {
        const totalCoursesCount = await fetchCoursesCount();
        await fetchAllCourses(totalCoursesCount);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);

      // If unauthorized, redirect to login
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        handleLogout();
        return;
      }

      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const resolveTotalPages = (responseData, itemsLength, fallbackTotalCount) => {
    const containers = [
      responseData,
      responseData?.data,
      responseData?.pagination,
      responseData?.meta,
      responseData?.data?.pagination,
      responseData?.data?.meta,
    ].filter(Boolean);

    for (const container of containers) {
      const directTotalPages = Number(
        container.totalPages ??
          container.total_pages ??
          container.pages ??
          container.pageCount,
      );
      if (Number.isFinite(directTotalPages) && directTotalPages > 0) {
        return directTotalPages;
      }
    }

    for (const container of containers) {
      const totalCount = Number(
        container.total ??
          container.totalItems ??
          container.total_items ??
          container.totalCount ??
          container.count,
      );
      if (Number.isFinite(totalCount) && totalCount >= 0) {
        return Math.max(1, Math.ceil(totalCount / pageSize));
      }
    }

    if (Number.isFinite(fallbackTotalCount) && fallbackTotalCount >= 0) {
      return Math.max(1, Math.ceil(fallbackTotalCount / pageSize));
    }

    return itemsLength === pageSize ? currentPage + 1 : currentPage;
  };

  const extractCoursesCount = (responseData) => {
    const payload = responseData?.data || responseData;
    const value =
      payload?.coursesNumber ??
      payload?.coursesnumber ??
      payload?.count ??
      payload;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const fetchCoursesCount = async () => {
    try {
      const response = await api.get("/courses/coursesNumber", {
        headers: { "x-api-key": API_KEY },
      });
      return extractCoursesCount(response.data);
    } catch {
      return null;
    }
  };

  const fetchPendingCourses = async () => {
    const response = await api.get("/courses/admin/ready", {
      headers: { "x-api-key": API_KEY },
      params: {
        page: currentPage,
        limit: pageSize,
      },
    });

    const data = response.data.data || response.data;
    const items = Array.isArray(data) ? data : [];
    setPendingCourses(items);
    setTotalPages(resolveTotalPages(response.data, items.length));
  };

  const fetchAllCourses = async (knownTotalCount = null) => {
    const response = await api.get("/courses/admin", {
      headers: { "x-api-key": API_KEY },
      params: {
        page: currentPage,
        limit: pageSize,
      },
    });

    const data = response.data.data || response.data;
    const items = Array.isArray(data) ? data : [];
    setCourses(items);
    setTotalPages(
      resolveTotalPages(response.data, items.length, knownTotalCount),
    );
  };

  const handleApprove = async (courseId) => {
    try {
      await api.patch(
        `/courses/${courseId}/status/Approved`,
        {},
        {
          headers: { "x-api-key": API_KEY },
        },
      );
      toast.success("Course approved successfully!");
      fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to approve course";
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleReject = async (courseId) => {
    try {
      await api.patch(
        `/courses/${courseId}/status/Rejected`,
        {},
        {
          headers: { "x-api-key": API_KEY },
        },
      );
      toast.success("Course rejected");
      fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to reject course";
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  const handleDelete = async (courseId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this course? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      await api.delete(`/courses/${courseId}`, {
        headers: { "x-api-key": API_KEY },
      });
      toast.success("Course deleted successfully");
      fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete course";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const getStatusBadge = (status) => {
    const badges = {
      Approved: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        icon: <Clock className="h-3 w-3" />,
      },
      Rejected: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        icon: <XCircle className="h-3 w-3" />,
      },
    };

    const badge = badges[status] || badges.Pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.icon}
        {status}
      </span>
    );
  };

  const displayCourses = activeTab === "pending" ? pendingCourses : courses;

  const filteredCourses = displayCourses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = {
    pending: pendingCourses.length,
    total: courses.length,
    approved: courses.filter((c) => c.status === "Approved").length,
    rejected: courses.filter((c) => c.status === "Rejected").length,
  };

  if (isLoading && displayCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 dark:from-red-900 dark:via-orange-900 dark:to-yellow-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Admin Panel</span>
                {adminUsername && (
                  <>
                    <span className="text-white/60">•</span>
                    <span className="text-sm">{adminUsername}</span>
                  </>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                Course Management
              </h1>
              <p className="text-xl text-white/90 dark:text-white/80">
                Review and manage courses across the platform
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10">
          {[
            {
              icon: <Clock className="h-6 w-6" />,
              label: "Pending Review",
              value: stats.pending,
              color: "from-yellow-500 to-orange-500",
            },
            {
              icon: <BookOpen className="h-6 w-6" />,
              label: "Total Courses",
              value: stats.total,
              color: "from-blue-500 to-cyan-500",
            },
            {
              icon: <CheckCircle className="h-6 w-6" />,
              label: "Approved",
              value: stats.approved,
              color: "from-green-500 to-emerald-500",
            },
            {
              icon: <XCircle className="h-6 w-6" />,
              label: "Rejected",
              value: stats.rejected,
              color: "from-red-500 to-pink-500",
            },
          ].map((stat, index) => (
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

        {/* Tabs */}
        <div className="glass rounded-2xl shadow-xl p-2 mb-6 flex gap-2">
          <button
            onClick={() => handleTabChange("pending")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "pending"
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-5 w-5" />
              <span>Pending Review</span>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs">
                  {stats.pending}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => handleTabChange("all")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "all"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-5 w-5" />
              <span>All Courses</span>
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Courses List */}
        {filteredCourses.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery
                ? "No Courses Found"
                : activeTab === "pending"
                  ? "No Pending Courses"
                  : "No Courses Yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery
                ? "Try adjusting your search query"
                : activeTab === "pending"
                  ? "All courses have been reviewed"
                  : "No courses have been created yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredCourses.map((course) => (
                <div key={course.id} className="card-hover group">
                  <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
                    <img
                      src={course.thumbnail_url || defaultCoursePhoto}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = defaultCoursePhoto;
                      }}
                    />

                    <div className="absolute top-3 right-3">
                      {getStatusBadge(course.status)}
                    </div>

                    {course.isReady && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        Ready
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description || "No description"}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-500 dark:text-gray-500">
                        {course.lessons_number || 0} lessons
                      </div>
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${course.price}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {course.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(course.id)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(course.id)}
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewingCourse(course)}
                        className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deletingCourseId === course.id}
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all disabled:opacity-50"
                        title="Delete course"
                      >
                        {deletingCourseId === course.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          currentPage === pageNum
                            ? "bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg"
                            : "bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white dark:bg-dark-900 border-2 border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-dark-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {reviewingCourse && (
        <CourseReviewModal
          course={reviewingCourse}
          onClose={() => setReviewingCourse(null)}
          onApprove={() => {
            handleApprove(reviewingCourse.id);
            setReviewingCourse(null);
          }}
          onReject={() => {
            handleReject(reviewingCourse.id);
            setReviewingCourse(null);
          }}
          apiKey={API_KEY}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
