import { Link } from "react-router-dom";
import { Clock, Users, Star, BookOpen, TrendingUp, Award } from "lucide-react";
import defaultCoursePhoto from "../../../src/assets/default_course_photo.jpg";
import defaultUserPhoto from "../../../src/assets/default_user_photo.jpg";

const CourseCard = ({ course, viewMode = "grid" }) => {
  // Format difficulty level with colors
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

  const difficultyStyle = getDifficultyBadge(course.difficulty);

  // Format price
  const formatPrice = (price) => {
    if (!price || price === "0" || price === 0) return "Free";
    return `$${price}`;
  };

  const isFree = !course.price || course.price === "0" || course.price === 0;

  // Grid View (Default)
  if (viewMode === "grid") {
    return (
      <Link
        to={`/courses/${course.id}`}
        className="group card-hover flex flex-col h-full overflow-hidden"
      >
        {/* Course Thumbnail */}
        <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
          <img
            src={course.thumbnail_url || defaultCoursePhoto}
            alt={defaultCoursePhoto}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = defaultCoursePhoto;
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Difficulty Badge */}
          {course.difficulty && (
            <span
              className={`absolute top-3 left-3 text-xs px-3 py-1.5 rounded-full font-semibold border ${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border} backdrop-blur-sm`}
            >
              {course.difficulty}
            </span>
          )}

          {/* Price Badge */}
          <span
            className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full font-bold ${
              isFree
                ? "bg-green-500 text-white"
                : "bg-white/95 dark:bg-dark-900/95 text-gray-900 dark:text-white backdrop-blur-sm"
            }`}
          >
            {formatPrice(course.price)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col">
          {/* Title */}
          <h3 className="text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 flex-grow">
            {course.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-500 mb-4 pb-4 border-b border-gray-200 dark:border-dark-700">
            {course.lessons_number > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{course.lessons_number} lessons</span>
              </div>
            )}

            {course.estimated_duration > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{course.estimated_duration}h</span>
              </div>
            )}

            {course.enrolledCount !== undefined && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{course.enrolledCount}</span>
              </div>
            )}

            {course.rating && (
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {course.rating}
                </span>
              </div>
            )}
          </div>

          {/* Instructor */}
          {course.teacher && (
            <div className="flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {course.teacher.image ? (
                  <img
                    src={course.teacher.image}
                    alt={defaultUserPhoto}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultUserPhoto;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {course.teacher.username?.[0]?.toUpperCase() || "T"}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {course.teacher.username ||
                  course.teacher.email ||
                  "Instructor"}
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  // List View
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group card-hover flex flex-col md:flex-row gap-6 overflow-hidden"
    >
      {/* Thumbnail - Smaller in list view */}
      <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 overflow-hidden rounded-xl">
        <img
          src={course.thumbnail_url || defaultCoursePhoto}
          alt={defaultCoursePhoto}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.target.src = defaultCoursePhoto;
          }}
        />

        {/* Price Badge */}
        <span
          className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full font-bold ${
            isFree
              ? "bg-green-500 text-white"
              : "bg-white/95 dark:bg-dark-900/95 text-gray-900 dark:text-white backdrop-blur-sm"
          }`}
        >
          {formatPrice(course.price)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-grow flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-grow">
            {/* Title */}
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {course.title}
            </h3>

            {/* Difficulty */}
            {course.difficulty && (
              <span
                className={`inline-block text-xs px-3 py-1 rounded-full font-semibold border ${difficultyStyle.bg} ${difficultyStyle.text} ${difficultyStyle.border}`}
              >
                {course.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-500 mb-4">
          {course.lessons_number > 0 && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>{course.lessons_number} lessons</span>
            </div>
          )}

          {course.estimated_duration > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{course.estimated_duration} hours</span>
            </div>
          )}

          {course.enrolledCount !== undefined && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{course.enrolledCount} students</span>
            </div>
          )}

          {course.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {course.rating}
              </span>
            </div>
          )}
        </div>

        {/* Instructor */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-dark-700">
          {course.teacher && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {course.teacher.image ? (
                  <img
                    src={course.teacher.image}
                    alt={defaultUserPhoto}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = defaultUserPhoto;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {course.teacher.username?.[0]?.toUpperCase() ||
                        course.teacher.email?.[0]?.toUpperCase() ||
                        "T"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {course.teacher.username || "Instructor"}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {course.teacher.email}
                </div>
              </div>
            </div>
          )}

          <button className="btn-primary !py-2 !px-6">View Course</button>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
