import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  FileText,
  Code,
  HelpCircle,
  GripVertical,
  Sparkles,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CreateLessonModal from "./components/CreateLessonModal";

const LessonManagement = () => {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLessonId, setDeletingLessonId] = useState(null);
  const [togglingReadyLessonId, setTogglingReadyLessonId] = useState(null);

  useEffect(() => {
    fetchCourse();
    fetchLessons();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      const data = response.data.data || response.data;
      setCourse(data);
    } catch (error) {
      console.error("Failed to fetch course:", error);
      toast.error("Failed to load course");
    }
  };

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/lessons/course/${courseId}`);
      const data = response.data.data || response.data;
      const sortedLessons = (Array.isArray(data) ? data : []).sort(
        (a, b) =>
          (a.order_number || a.order || 0) - (b.order_number || b.order || 0),
      );
      setLessons(sortedLessons);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
      toast.error("Failed to load lessons");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this lesson? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingLessonId(lessonId);
      await api.delete(`/lessons/${lessonId}`);
      toast.success("Lesson deleted successfully");
      fetchLessons();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete lesson";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleToggleLessonReady = async (lesson) => {
    try {
      setTogglingReadyLessonId(lesson.id);
      await api.patch(`/lessons/${lesson.id}`, {
        isReady: !lesson.isReady,
      });

      toast.success(
        !lesson.isReady
          ? "Lesson marked as ready"
          : "Lesson marked as draft",
      );
      fetchLessons();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update lesson status";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setTogglingReadyLessonId(null);
    }
  };

  const getLessonIcon = (contentType) => {
    const icons = {
      Video: <PlayCircle className="h-5 w-5" />,
      Text: <FileText className="h-5 w-5" />,
      Code: <Code className="h-5 w-5" />,
      Quiz: <HelpCircle className="h-5 w-5" />,
    };
    return icons[contentType] || <FileText className="h-5 w-5" />;
  };

  const getContentTypeBadge = (contentType) => {
    const badges = {
      Video: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-800 dark:text-purple-300",
      },
      Text: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
      },
      Code: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
      },
      Quiz: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-800 dark:text-orange-300",
      },
    };
    const badge = badges[contentType] || badges.Text;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {getLessonIcon(contentType)}
        {contentType}
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
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            to="/teacher/dashboard"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Course Management</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {course?.title || "Course Lessons"}
            </h1>
            <p className="text-xl text-white/90">
              Manage lessons and course content
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 -mt-8 relative z-10">
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {lessons.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Lessons
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {lessons.filter((l) => l.isReady).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Published
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {lessons.filter((l) => l.content_type === "Quiz").length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Quizzes
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lessons
            </h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Lesson</span>
            </button>
          </div>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Lessons Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start building your course by adding your first lesson
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add First Lesson
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="card-hover flex items-center gap-4"
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 text-gray-400 dark:text-gray-600 cursor-move">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order Number */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {lesson.order_number || index + 1}
                    </span>
                  </div>
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {lesson.title}
                    </h3>
                    {getContentTypeBadge(lesson.content_type)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    {lesson.duration && <span>{lesson.duration} min</span>}
                    {lesson.isReady ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Published
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-gray-400">
                        <XCircle className="h-4 w-4" />
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleLessonReady(lesson)}
                    disabled={togglingReadyLessonId === lesson.id}
                    className={`px-4 py-2 rounded-xl transition-all disabled:opacity-50 ${
                      lesson.isReady
                        ? "bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300"
                        : "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300"
                    }`}
                    title={lesson.isReady ? "Mark as draft" : "Mark as ready"}
                  >
                    {togglingReadyLessonId === lesson.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    ) : lesson.isReady ? (
                      <span className="inline-flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Mark Draft</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Mark Ready</span>
                      </span>
                    )}
                  </button>

                  {lesson.content_type === "Quiz" && (
                    <Link
                      to={`/teacher/courses/${courseId}/lessons/${lesson.id}/questions`}
                      className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl transition-all flex items-center gap-2"
                      title="Manage questions"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Questions</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setEditingLesson(lesson);
                      setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-xl transition-all"
                    title="Edit lesson"
                  >
                    <Edit className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    disabled={deletingLessonId === lesson.id}
                    className="px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all disabled:opacity-50"
                    title="Delete lesson"
                  >
                    {deletingLessonId === lesson.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Lesson Modal */}
      <CreateLessonModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingLesson(null);
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingLesson(null);
          fetchLessons();
          fetchCourse();
        }}
        courseId={courseId}
        editingLesson={editingLesson}
      />
    </div>
  );
};

export default LessonManagement;
