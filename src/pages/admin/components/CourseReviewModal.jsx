import { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  PlayCircle,
  BookOpen,
  User,
  DollarSign,
  Clock,
  Award,
  FileText,
} from "lucide-react";
import api from "../../../services/api";

const CourseReviewModal = ({ course, onClose, onApprove, onReject }) => {
  const [lessons, setLessons] = useState([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  useEffect(() => {
    if (course?.id) {
      fetchLessons();
    }
  }, [course?.id]);

  const fetchLessons = async () => {
    try {
      setIsLoadingLessons(true);
      const response = await api.get(`/lessons/titles/course/${course.id}`);
      const data = response.data.data || response.data;
      setLessons(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const getLessonIcon = (contentType) => {
    const icons = {
      Video: <PlayCircle className="h-4 w-4" />,
      Text: <FileText className="h-4 w-4" />,
      Code: <BookOpen className="h-4 w-4" />,
      Quiz: <Award className="h-4 w-4" />,
    };
    return icons[contentType] || <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Course Review
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          <div className="aspect-video rounded-xl overflow-hidden">
            <img
              src={
                course.thumbnail_url ||
                "https://via.placeholder.com/800x450/3b82f6/ffffff?text=Course"
              }
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/800x450/3b82f6/ffffff?text=Course";
              }}
            />
          </div>

          {/* Course Details */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {course.title}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <DollarSign className="h-5 w-5" />
                <div>
                  <div className="text-xs">Price</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    ${course.price}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <PlayCircle className="h-5 w-5" />
                <div>
                  <div className="text-xs">Lessons</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {course.lessons_number || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="h-5 w-5" />
                <div>
                  <div className="text-xs">Duration</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {course.estimated_duration || 0}h
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Award className="h-5 w-5" />
                <div>
                  <div className="text-xs">Difficulty</div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {course.difficulty}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {course.description || "No description provided"}
              </p>
            </div>

            {/* Teacher Info */}
            {course.teacher && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Instructor
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {course.teacher.username?.charAt(0).toUpperCase() || "T"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {course.teacher.username || "Teacher"}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {course.teacher.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Category */}
            {course.category && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </h4>
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-sm font-medium">
                  {course.category.name}
                </span>
              </div>
            )}

            {/* Lessons List */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Course Content ({lessons.length} lessons)
              </h4>

              {isLoadingLessons ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto"></div>
                </div>
              ) : lessons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  No lessons added yet
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lessons.map((lesson, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        {getLessonIcon(lesson.content_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {lesson.content_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Review Status: {course.status}
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  {course.isReady
                    ? "This course is marked as ready and awaiting your review."
                    : "This course is still in draft mode."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {course.status === "Pending" && (
          <div className="sticky bottom-0 bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 p-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onReject}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                Reject Course
              </button>
              <button
                onClick={onApprove}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Approve Course
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseReviewModal;
