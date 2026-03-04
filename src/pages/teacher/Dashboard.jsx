import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  PlayCircle,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CreateCourseModal from "./components/CreateCourseModal";
import { DEFAULT_PAGE_LIMIT } from "../../constants/pagination";

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, approved, pending
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/courses/teacher", {
        params: {
          page: currentPage,
          limit: DEFAULT_PAGE_LIMIT,
        },
      });
      const data = response.data.data || response.data;
      const items = Array.isArray(data) ? data : data?.courses || [];
      const parsedCount = Number(data?.count);
      setCourses(Array.isArray(items) ? items : []);
      setTotalCoursesCount(
        Number.isFinite(parsedCount)
          ? parsedCount
          : Array.isArray(items)
            ? items.length
            : 0,
      );
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentPage]);

  const handleDeleteCourse = async (courseId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this course? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingCourseId(courseId);
      await api.delete(`/courses/${courseId}`);
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeletingCourseId(null);
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "approved" && course.status === "Approved") ||
      (filterStatus === "pending" && course.status === "Pending");

    return matchesSearch && matchesFilter;
  });
  const totalFilteredCourses = filteredCourses.length;
  const canGoNextPage =
    currentPage * DEFAULT_PAGE_LIMIT < totalCoursesCount;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const stats = {
    total: totalCoursesCount,
    approved: courses.filter((c) => c.status === "Approved").length,
    pending: courses.filter((c) => c.status === "Pending").length,
    students: courses.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0),
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Teaching Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Dashboard</h1>
            <p className="text-xl text-white/90 dark:text-white/80">
              Manage your courses, lessons, and track student progress
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10">
          {[
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
              icon: <Clock className="h-6 w-6" />,
              label: "Pending",
              value: stats.pending,
              color: "from-yellow-500 to-orange-500",
            },
            {
              icon: <Users className="h-6 w-6" />,
              label: "Students",
              value: stats.students,
              color: "from-purple-500 to-pink-500",
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

        {/* Toolbar */}
        <div className="glass rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Courses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>

            {/* Create Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2 justify-center"
            >
              <Plus className="h-5 w-5" />
              <span>Create Course</span>
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        {totalFilteredCourses === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery || filterStatus !== "all"
                ? "No Courses Found"
                : "No Courses Yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter"
                : "Create your first course and start teaching!"}
            </p>
            {!searchQuery && filterStatus === "all" && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Your First Course
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="card-hover group">
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
                    <img
                      src={
                        course.thumbnail_url ||
                        "https://via.placeholder.com/400x250/3b82f6/ffffff?text=Course"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x250/3b82f6/ffffff?text=Course";
                      }}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {getStatusBadge(course.status)}
                    </div>

                    {/* Ready Badge */}
                    {!course.isReady && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                        Draft
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {course.description || "No description"}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-gray-500 dark:text-gray-500">
                        <div className="flex items-center gap-1">
                          <PlayCircle className="h-4 w-4" />
                          <span>{course.lessons_number || 0} lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{course._count?.enrollments || 0}</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        ${course.price}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      to={`/teacher/courses/${course.id}/lessons`}
                      className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Manage</span>
                    </Link>
                    <Link
                      to={`/teacher/courses/${course.id}/edit`}
                      className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all"
                      title="Edit course"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
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
              ))}
            </div>

            <div className="mt-12 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                Page {currentPage}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!canGoNextPage}
                className="px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchCourses();
        }}
      />
    </div>
  );
};

export default TeacherDashboard;
