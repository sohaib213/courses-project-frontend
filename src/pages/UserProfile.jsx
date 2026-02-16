import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { updateProfile } from "../redux/slices/authSlice";
import { fetchMyCourses } from "../redux/slices/courseSlice";
import {
  User,
  Mail,
  Camera,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Calendar,
  Briefcase,
  Sparkles,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";

const UserProfile = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { myCourses } = useAppSelector((state) => state.courses);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    setIsCoursesLoading(true);
    dispatch(fetchMyCourses()).finally(() => {
      if (isMounted) {
        setIsCoursesLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [dispatch, user?.id]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      e.target.value = "";
      return;
    }

    setSelectedProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleConfirmImageUpload = async () => {
    if (!selectedProfileImage) return;
    try {
      setIsUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append("profilePicture", selectedProfileImage);

      await dispatch(updateProfile(uploadData)).unwrap();
      toast.success("Profile photo updated successfully!");
      setSelectedProfileImage(null);
      setImagePreview(null);
    } catch (error) {
      toast.error(error || "Failed to update profile photo");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCancelImageUpload = () => {
    setSelectedProfileImage(null);
    setImagePreview(null);
  };

  const stats = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: "Courses Enrolled",
      value: 0,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Certificates",
      value: user?.certificates || 8,
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Hours Learned",
      value: user?.hoursLearned || 156,
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Streak Days",
      value: user?.streakDays || 23,
      color: "from-green-500 to-emerald-500",
    },
  ];

  const rawMyCourses = Array.isArray(myCourses)
    ? myCourses
    : Array.isArray(myCourses?.courses)
      ? myCourses.courses
      : [];

  const normalizedMyCourses = rawMyCourses
    .map((item) => {
      const nestedCourse = item?.course || item?.courses;
      const course = nestedCourse || item;
      const enrollment = nestedCourse ? item : null;

      return {
        ...course,
        enrollment,
      };
    })
    .filter((course) => course?.id);

  stats[0].value = normalizedMyCourses.length;

  const recentCourses = [...normalizedMyCourses]
    .sort((a, b) => {
      const aDate = new Date(
        a.enrollment?.enrolledat || a.createdat || 0,
      ).getTime();
      const bDate = new Date(
        b.enrollment?.enrolledat || b.createdat || 0,
      ).getTime();
      return bDate - aDate;
    })
    .slice(0, 3);

  const getCourseProgress = (course) => {
    const currentLessonOrder =
      course.enrollment?.current_lesson_order || course.current_lesson_order;
    const totalLessons =
      course.lessons_number || course.lessonsNumber || course.totalLessons;

    if (!currentLessonOrder || !totalLessons) return null;
    return Math.min(100, Math.round((currentLessonOrder / totalLessons) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Not Logged In
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Hero Section with Cover & Avatar */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-56 sm:h-64 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl animate-float"></div>
            <div
              className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>

          {/* User Type Badge */}
          <div className="absolute top-6 right-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-full">
              {user.type === "Teacher" ? (
                <>
                  <Briefcase className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white">
                    Instructor
                  </span>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 text-white" />
                  <span className="text-sm font-semibold text-white">
                    Student
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info - Overlapping */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="-mt-12 sm:-mt-16 mb-8">
            <div className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-primary-600 to-purple-600 p-1 shadow-xl">
                    <div className="w-full h-full rounded-3xl bg-white dark:bg-dark-800 flex items-center justify-center overflow-hidden">
                      {imagePreview || user.image ? (
                        <img
                          src={imagePreview || user.image}
                          alt={user.username || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl font-bold text-primary-600 dark:text-primary-400">
                          {(user.username || user.email)?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <label
                    htmlFor="profile-photo-upload"
                    className={`absolute bottom-2 right-2 w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 group-hover:rotate-12 cursor-pointer ${isUploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </label>
                  <input
                    id="profile-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  {selectedProfileImage && (
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmImageUpload}
                        disabled={isUploadingImage}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg disabled:opacity-50"
                      >
                        {isUploadingImage ? "Uploading..." : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelImageUpload}
                        disabled={isUploadingImage}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      {user.username || "User"}
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400 justify-center sm:justify-start mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Joined{" "}
                        {new Date(
                          user.createdat || Date.now(),
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {user.isprofilecomplete
                          ? "Profile complete"
                          : "Profile incomplete"}
                      </span>
                    </div>
                  </div>

                  {user.isprofilecomplete ? (
                    <p className="text-gray-700 dark:text-gray-300 max-w-2xl">
                      Your profile is complete.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card-hover group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}
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

        {/* Activity Sections */}
        <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Courses */}
              <div className="lg:col-span-2 card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  Recent Courses
                </h2>
                {isCoursesLoading ? (
                  <div className="py-10 text-center text-gray-600 dark:text-gray-400">
                    Loading enrolled courses...
                  </div>
                ) : recentCourses.length === 0 ? (
                  <div className="py-10 text-center text-gray-600 dark:text-gray-400">
                    You are not enrolled in any courses yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentCourses.map((course) => {
                      const progress = getCourseProgress(course);

                      return (
                        <Link
                          key={course.id}
                          to={`/courses/${course.id}`}
                          className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        >
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt={course.title || "Course thumbnail"}
                              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex-shrink-0"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {course.title || "Untitled Course"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {progress !== null
                                ? `Progress: ${progress}%`
                                : "Progress data unavailable"}
                            </p>
                          </div>
                          <div className="w-16 h-16">
                            <svg
                              className="transform -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                className="text-gray-200 dark:text-dark-700"
                              />
                              <path
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeDasharray={`${progress || 0}, 100`}
                                className="text-primary-600 dark:text-primary-400"
                              />
                            </svg>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Achievements */}
              <div className="lg:col-span-1 card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  Achievements
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      title: "First Course",
                      icon: "🎯",
                      color: "from-blue-500 to-cyan-500",
                    },
                    {
                      title: "Week Streak",
                      icon: "🔥",
                      color: "from-orange-500 to-red-500",
                    },
                    {
                      title: "Top Performer",
                      icon: "⭐",
                      color: "from-yellow-500 to-orange-500",
                    },
                  ].map((achievement, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl"
                    >
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${achievement.color} rounded-xl flex items-center justify-center text-2xl`}
                      >
                        {achievement.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {achievement.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Earned recently
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
