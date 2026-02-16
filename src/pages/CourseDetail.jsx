import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  fetchCourseById,
  clearCurrentCourse,
  enrollInCourse,
} from "../redux/slices/courseSlice";
import {
  ArrowLeft,
  Clock,
  Users,
  Star,
  BookOpen,
  Play,
  FileText,
  Video,
  Code,
  CheckCircle2,
  Globe,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentCourse: course, isLoading } = useAppSelector(
    (state) => state.courses,
  );
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCourseById(id));
    }

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [id, dispatch]);

  // Get content type icon
  const getContentTypeIcon = (contentType) => {
    const icons = {
      video: <Video className="h-4 w-4" />,
      text: <FileText className="h-4 w-4" />,
      code: <Code className="h-4 w-4" />,
      quiz: <CheckCircle2 className="h-4 w-4" />,
    };
    return (
      icons[contentType?.toLowerCase()] || <FileText className="h-4 w-4" />
    );
  };

  // Get difficulty badge style
  const getDifficultyBadge = (difficulty) => {
    const badges = {
      Beginner: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        border: "border-green-200 dark:border-green-800",
      },
      Intermediate: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        border: "border-yellow-200 dark:border-yellow-800",
      },
      Advanced: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        border: "border-red-200 dark:border-red-800",
      },
    };
    return (
      badges[difficulty] || {
        bg: "bg-gray-100 dark:bg-gray-800",
        text: "text-gray-800 dark:text-gray-300",
        border: "border-gray-200 dark:border-gray-700",
      }
    );
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    try {
      setEnrolling(true);
      await dispatch(enrollInCourse(id)).unwrap();
      toast.success("Successfully enrolled in the course!");
      dispatch(fetchCourseById(id));
    } catch (error) {
      toast.error(error || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-dark-950">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">
            Loading course details...
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center card max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={() => navigate("/courses")} className="btn-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const difficultyStyle = getDifficultyBadge(course.difficulty);
  const isFree = !course.price || course.price === "0" || course.price === 0;
  const enrollmentCount = course._count?.enrollments || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Courses</span>
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Course Info */}
            <div className="lg:col-span-2 text-white">
              {/* Category Badge */}
              {course.category && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {course.category.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-xl text-white/90 dark:text-white/80 mb-6">
                {course.description}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 text-white/90">
                {course.difficulty && (
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>{course.difficulty}</span>
                  </div>
                )}
                {course.lessons_number > 0 && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span>{course.lessons_number} Lessons</span>
                  </div>
                )}
                {course.estimated_duration > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{course.estimated_duration}h Total</span>
                  </div>
                )}
                {enrollmentCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{enrollmentCount} Students</span>
                  </div>
                )}
                {course.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{course.rating}</span>
                  </div>
                )}
              </div>

              {/* Instructor - Clickable */}
              {course.teacher && (
                <Link
                  to={`/instructor/${course.teacher.id}`}
                  className="mt-6 flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl hover:bg-white/20 dark:hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center">
                      {course.teacher.image ? (
                        <img
                          src={course.teacher.image}
                          alt={course.teacher.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-lg font-bold">
                          {course.teacher.username?.[0]?.toUpperCase() ||
                            course.teacher.email?.[0]?.toUpperCase() ||
                            "T"}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white/70">Instructor</p>
                      <p className="font-semibold">
                        {course.teacher.username || course.teacher.email}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              )}
            </div>

            {/* Right: Enrollment Card */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                {/* Thumbnail */}
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img
                    src={
                      course.thumbnail_url ||
                      "https://via.placeholder.com/400x250/3b82f6/ffffff?text=Course"
                    }
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x250/3b82f6/ffffff?text=Course";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {isFree ? (
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      Free
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${course.price}
                    </div>
                  )}
                </div>

                {/* Enroll Button */}
                {course.isEnrolled ? (
                  <button className="btn-secondary w-full" disabled>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Already Enrolled
                  </button>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {enrolling ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Description */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                About This Course
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course Content / Lessons */}
            {course.lessons && course.lessons.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Course Content
                </h2>
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors group"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {lesson.title}
                          </h4>
                          {lesson.content_type && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {getContentTypeIcon(lesson.content_type)}
                              <span className="capitalize">
                                {lesson.content_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Course Stats Card */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Course Details
              </h3>
              <div className="space-y-4">
                {/* Difficulty */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Difficulty
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border ${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border}`}
                  >
                    {course.difficulty}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Duration
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {course.estimated_duration}h
                  </span>
                </div>

                {/* Lessons */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Lessons
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {course.lessons_number}
                  </span>
                </div>

                {/* Students */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    Students
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {enrollmentCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Category */}
            {course.category && (
              <div className="card">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Category
                </h3>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-lg">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">{course.category.name}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
