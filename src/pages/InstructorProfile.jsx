import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Mail, Sparkles, User, Users } from "lucide-react";
import api from "../services/api";
import { courseService } from "../services/courseService";
import CourseCard from "../components/courses/CourseCard";
import { DEFAULT_PAGE_LIMIT } from "../constants/pagination";
import defaultUserPhoto from "../../src/assets/default_user_photo.jpg";

const extractPayload = (response) => response?.data?.data ?? response?.data;

const normalizeCoursesPayload = (payload) => {
  const data = payload?.data ?? payload;

  if (Array.isArray(data)) {
    return { courses: data, count: data.length };
  }

  if (Array.isArray(data?.courses)) {
    const parsedCount = Number(data.count);
    return {
      courses: data.courses,
      count: Number.isFinite(parsedCount) ? parsedCount : data.courses.length,
    };
  }

  return { courses: [], count: 0 };
};

const normalizeTeacherPayload = (payload) => {
  if (!payload || typeof payload !== "object") return null;
  return payload.teacher || payload.user || payload.data || payload;
};

const fetchTeacherProfile = async (teacherId) => {
  const endpoint = `/users?id=${teacherId}`;
  try {
    const response = await api.get(endpoint);
    const payload = extractPayload(response);
    const teacher = normalizeTeacherPayload(payload);
    if (teacher && (teacher.id || teacher._id)) {
      return teacher;
    }
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    // Try next endpoint.
  }

  return null;
};

const InstructorProfile = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Instructor id is missing");
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadInstructor = async () => {
      try {
        setIsLoading(true);
        setError("");

        const teacherResult = await fetchTeacherProfile(id);

        if (!mounted) return;

        console.log("Fetched teacher profile:", teacherResult);
        setTeacher(teacherResult || null);
      } catch {
        if (!mounted) return;
        setTeacher(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadInstructor();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError("");

        const coursesPayload = await courseService.getCoursesByTeacher(
          id,
          currentPage,
          DEFAULT_PAGE_LIMIT,
        );
        const normalized = normalizeCoursesPayload(coursesPayload);
        const teacherFromCourses = normalized.courses.find(Boolean)?.teacher;

        if (!mounted) return;

        setCourses(normalized.courses);
        setTotalCoursesCount(normalized.count);
        if (teacherFromCourses) {
          setTeacher((prev) => {
            if (!prev) return teacherFromCourses;
            return {
              ...teacherFromCourses,
              ...prev,
              image: prev.image || teacherFromCourses.image,
            };
          });
        }
      } catch {
        if (!mounted) return;
        setError("Failed to load instructor profile");
        setCourses([]);
        setTotalCoursesCount(0);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadCourses();

    return () => {
      mounted = false;
    };
  }, [id, currentPage]);

  const stats = useMemo(() => {
    const totalCourses = totalCoursesCount || courses.length;
    const totalStudents = courses.reduce(
      (sum, course) => sum + Number(course?._count?.enrollments || 0),
      0,
    );

    return { totalCourses, totalStudents };
  }, [courses, totalCoursesCount]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCoursesCount / DEFAULT_PAGE_LIMIT),
  );
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary-600 dark:text-primary-400 animate-pulse" />
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400">
            Loading instructor profile...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center px-4">
        <div className="card text-center max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We could not load this instructor profile right now.
          </p>
          <Link to="/courses" className="btn-primary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link
            to="/courses"
            className="inline-flex items-center text-white/90 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>

          <div className="flex flex-col md:flex-row md:items-center gap-6 text-white">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm p-1">
              {teacher?.image ? (
                <img
                  src={teacher.image}
                  className="w-full h-full rounded-xl object-cover"
                  onError={(event) => {
                    event.currentTarget.src = defaultUserPhoto;
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-white/10 flex items-center justify-center">
                  <span className="text-3xl font-bold">
                    {teacher?.username?.[0]?.toUpperCase() ||
                      teacher?.email?.[0]?.toUpperCase() ||
                      "T"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {teacher?.username || "Instructor"}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/90">
                <span className="inline-flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Instructor
                </span>
                {teacher?.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {teacher.email}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[140px]">
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <div className="text-sm text-white/80 inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  Courses
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[140px]">
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <div className="text-sm text-white/80 inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Students
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Courses by {teacher?.username || "this instructor"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Showing {courses.length} of {totalCoursesCount || courses.length}{" "}
          courses
        </p>

        {courses.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              No published courses available for this instructor yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>

            <div className="mt-10 flex justify-center items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={!canGoPrev}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!canGoNext}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary-500 transition-all font-medium"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorProfile;
