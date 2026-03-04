import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Award,
  TrendingUp,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  CheckCircle2,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import api from "../services/api";
import defaultCoursePhoto from "../../src/assets/default_course_photo.jpg";
import {
  fetchCategories,
  selectAllCategories,
  selectCategoriesError,
  selectCategoriesLoading,
  selectShouldRefetchCategories,
} from "../redux/slices/categorySlice";
import { fetchCourses } from "../redux/slices/courseSlice";
import { DEFAULT_PAGE_LIMIT } from "../constants/pagination";

const Home = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const categoriesError = useAppSelector(selectCategoriesError);
  const shouldRefetchCategories = useAppSelector(selectShouldRefetchCategories);
  const {
    courses,
    isLoading: coursesLoading,
    error: coursesError,
    pagination,
  } = useAppSelector((state) => state.courses);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [liveCounts, setLiveCounts] = useState({
    students: null,
    teachers: null,
    courses: null,
  });
  const coursesSliderRef = useRef(null);

  useEffect(() => {
    if (shouldRefetchCategories) {
      dispatch(fetchCategories());
    }
  }, [dispatch, shouldRefetchCategories]);

  useEffect(() => {
    if (courses.length === 0) {
      dispatch(fetchCourses({ page: 1, limit: DEFAULT_PAGE_LIMIT }));
    }
  }, [dispatch, courses.length]);

  useEffect(() => {
    let active = true;

    const toCount = (responseData, primaryKey) => {
      const payload = responseData?.data || responseData;
      const value =
        payload?.[primaryKey] ??
        payload?.[primaryKey?.toLowerCase?.()] ??
        payload?.count ??
        payload;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const loadCounts = async () => {
      const [studentsResult, teachersResult, coursesResult] =
        await Promise.allSettled([
          api.get("/users/studentsNumber"),
          api.get("/users/teachersNumber"),
          api.get("/courses/coursesNumber"),
        ]);

      if (!active) return;

      console.log("courses count = ", coursesResult);
      setLiveCounts((prev) => ({
        students:
          studentsResult.status === "fulfilled"
            ? toCount(studentsResult.value?.data, "studentsNumber")
            : prev.students,
        teachers:
          teachersResult.status === "fulfilled"
            ? toCount(teachersResult.value?.data, "teachersNumber")
            : prev.teachers,
        courses:
          coursesResult.status === "fulfilled"
            ? toCount(coursesResult.value?.data, "coursesNumber")
            : prev.courses,
      }));
    };

    loadCounts();

    return () => {
      active = false;
    };
  }, []);

  const formatCompactNumber = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return "0";

    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  };

  const totalCoursesCount =
    Number(
      pagination?.total ??
        pagination?.totalItems ??
        pagination?.total_count ??
        pagination?.count,
    ) || courses.length;

  const totalStudentsCount =
    Number(
      pagination?.students_total ??
        pagination?.totalStudents ??
        pagination?.studentsCount,
    ) ||
    courses.reduce((sum, course) => {
      const enrolled =
        Number(
          course?._count?.enrollments ??
            course?.enrollments_count ??
            course?.students_count,
        ) || 0;
      return sum + enrolled;
    }, 0);

  const displayedStudentsCount = formatCompactNumber(
    liveCounts.students ?? totalStudentsCount,
  );
  const displayedCoursesCount = formatCompactNumber(
    liveCounts.courses ?? totalCoursesCount,
  );
  const displayedTeachersCount = formatCompactNumber(liveCounts.teachers ?? 0);

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Learn at Your Pace",
      description:
        "Self-paced courses that fit your schedule. Learn anytime, anywhere.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Instructors",
      description:
        "Learn from industry professionals with years of real-world experience.",
      color: "from-blue-400 to-purple-500",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Verified Certificates",
      description:
        "Earn recognized certificates to showcase your achievements.",
      color: "from-green-400 to-teal-500",
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Project-Based Learning",
      description: "Build real projects and add them to your portfolio.",
      color: "from-pink-400 to-red-500",
    },
  ];

  const stats = [
    {
      number: displayedStudentsCount,
      label: "Active Students",
      icon: <Users className="h-6 w-6" />,
    },
    {
      number: displayedCoursesCount,
      label: "Courses",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      number: displayedTeachersCount,
      label: "Expert Instructors",
      icon: <Award className="h-6 w-6" />,
    },
    {
      number: "98%",
      label: "Success Rate",
      icon: <TrendingUp className="h-6 w-6" />,
    },
  ];

  const featuredCourses = courses.slice(0, 10);

  const scrollCourses = (direction) => {
    if (!coursesSliderRef.current) return;
    coursesSliderRef.current.scrollBy({
      left: direction * 360,
      behavior: "smooth",
    });
  };

  const formatPrice = (price) => {
    if (!price || price === "0" || price === 0) return "Free";
    return `$${price}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern Gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="container-custom relative z-10 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-white space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">
                  🎉 New courses added weekly
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Master New Skills
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">
                  Transform Your Future
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 dark:text-white/80">
                Join thousands of learners worldwide. Access expert-led courses,
                earn certificates, and accelerate your career.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/courses"
                  className="group px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 shadow-2xl"
                >
                  Explore Courses
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-primary-600 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Watch Demo
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold">
                    {displayedStudentsCount}
                  </div>
                  <div className="text-white/80 dark:text-white/70">
                    Students
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {displayedCoursesCount}
                  </div>
                  <div className="text-white/80 dark:text-white/70">
                    Courses
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9★</div>
                  <div className="text-white/80 dark:text-white/70">Rating</div>
                </div>
              </div>
            </div>

            {/* Right Content - Image/Graphic */}
            <div className="relative animate-fade-in">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=600&fit=crop"
                  alt="Students learning"
                  className="rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
                />
                {/* Floating Card */}
                <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-gray-100">
                        {displayedStudentsCount} Students
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Active learners
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses Slider */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-2 text-gray-900 dark:text-white">
                Featured <span className="gradient-text">Courses</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Explore popular courses selected for you
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCourses(-1)}
                className="p-2 rounded-full border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-800 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollCourses(1)}
                className="p-2 rounded-full border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-dark-800 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {coursesLoading && featuredCourses.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              Loading courses...
            </div>
          )}

          {!coursesLoading && coursesError && featuredCourses.length === 0 && (
            <div className="text-center text-red-600 dark:text-red-400">
              {coursesError}
            </div>
          )}

          {!coursesLoading && !coursesError && featuredCourses.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-400">
              No courses available yet.
            </div>
          )}

          {featuredCourses.length > 0 && (
            <div
              ref={coursesSliderRef}
              className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory"
            >
              {featuredCourses.map((course) => {
                const courseId = course.id || course._id;

                return (
                  <Link
                    key={courseId}
                    to={`/courses/${courseId}`}
                    className="min-w-[280px] md:min-w-[320px] max-w-[320px] card-hover snap-start group"
                  >
                    <div className="relative overflow-hidden rounded-xl mb-4 aspect-video">
                      <img
                        src={course.thumbnail_url || defaultCoursePhoto}
                        alt={defaultCoursePhoto}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = defaultCoursePhoto;
                        }}
                      />
                      <span className="absolute top-3 right-3 text-xs px-3 py-1.5 rounded-full font-semibold bg-white/95 dark:bg-dark-900/95 text-gray-900 dark:text-white">
                        {formatPrice(course.price)}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                      {course.description || "No description available."}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <span>{course.category?.name || "General"}</span>
                      <span>{course.teacher?.username || "Instructor"}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/courses" className="btn-outline">
              Browse All Courses
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Choose <span className="gradient-text">Our Platform</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to succeed in your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`card-hover group ${hoveredFeature === index ? "scale-105" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="section bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Explore by <span className="gradient-text">Category</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Choose from our most popular categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categoriesLoading && categories.length === 0 && (
              <div className="col-span-full text-center text-gray-600 dark:text-gray-400">
                Loading categories...
              </div>
            )}

            {!categoriesLoading && categoriesError && (
              <div className="col-span-full text-center text-red-600 dark:text-red-400">
                {categoriesError}
              </div>
            )}

            {!categoriesLoading &&
              !categoriesError &&
              categories.length === 0 && (
                <div className="col-span-full text-center text-gray-600 dark:text-gray-400">
                  No categories available yet.
                </div>
              )}

            {categories.slice(0, 6).map((category, index) => {
              const categoryId = category.id || category._id;

              return (
                <Link
                  key={
                    category.id || category._id || `${category.name}-${index}`
                  }
                  to={
                    categoryId
                      ? `/courses?category_id=${encodeURIComponent(categoryId)}`
                      : "/courses"
                  }
                  className="card-hover text-center p-6 group"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${category.color || "from-blue-500 to-cyan-500"} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {category.icon || "📚"}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                    {category.name}
                  </h3>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link to="/courses" className="btn-outline">
              View All Categories
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-900 dark:to-purple-900">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-white/10 rounded-2xl mb-4">
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-lg text-white/90 dark:text-white/80">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-white dark:bg-dark-950">
        <div className="container-custom">
          <div className="glass rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-purple-600/10 dark:from-primary-900/20 dark:to-purple-900/20"></div>

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Join thousands of students already learning on our platform.
                Start for free today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-lg">
                  Get Started Free
                  <ArrowRight className="inline-block ml-2 h-5 w-5" />
                </Link>
                <Link to="/courses" className="btn-outline text-lg">
                  Browse Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
