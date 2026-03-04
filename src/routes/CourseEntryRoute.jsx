import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CourseDetail from "../pages/CourseDetail";
import CourseLearning from "../pages/CourseLearning";

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:3000/api";
};
const unwrapResponse = (payload) => payload?.data || payload;
const getUserId = (user) => user?.id || user?._id || user?.user_id || null;

const CourseEntryRoute = () => {
  const { id } = useParams();
  const [view, setView] = useState("loading");
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    let isMounted = true;

    const decideView = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) setView("detail");
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/enrollments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        let isEnrolled = false;
        if (response.ok) {
          const body = await response.json();
          const enrollments = unwrapResponse(body) || [];
          isEnrolled = Array.isArray(enrollments)
            ? enrollments.some(
                (enrollment) =>
                  String(enrollment?.course_id) === String(id) ||
                  String(enrollment?.courses?.id) === String(id),
              )
            : false;
        }

        if (isEnrolled) {
          if (isMounted) setView("learning");
          return;
        }

        const [courseResponse, userResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/courses/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${apiBaseUrl}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!courseResponse.ok || !userResponse.ok) {
          if (isMounted) setView("detail");
          return;
        }

        const courseBody = await courseResponse.json();
        const userBody = await userResponse.json();
        const course = unwrapResponse(courseBody) || {};
        const user = unwrapResponse(userBody) || {};
        const courseTeacher = course?.teacher || course?.instructor || {};
        const courseTeacherId = getUserId(courseTeacher);
        const currentUserId = getUserId(user);
        const isCourseTeacher =
          Boolean(courseTeacherId) &&
          Boolean(currentUserId) &&
          String(courseTeacherId) === String(currentUserId);

        if (isMounted) setView(isCourseTeacher ? "learning" : "detail");
      } catch {
        if (isMounted) setView("detail");
      }
    };

    decideView();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, id]);

  if (view === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent" />
      </div>
    );
  }

  return view === "learning" ? (
    <CourseLearning />
  ) : (
    <CourseDetail onEnrolled={() => setView("learning")} />
  );
};

export default CourseEntryRoute;
