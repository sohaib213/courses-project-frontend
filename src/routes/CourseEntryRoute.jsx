import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CourseDetail from "../pages/CourseDetail";
import CourseLearning from "../pages/CourseLearning";

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "http://localhost:3000/api";
};

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

        if (!response.ok) {
          if (isMounted) setView("detail");
          return;
        }

        const body = await response.json();
        const enrollments = body?.data || body || [];
        const isEnrolled = Array.isArray(enrollments)
          ? enrollments.some(
              (enrollment) =>
                String(enrollment?.course_id) === String(id) ||
                String(enrollment?.courses?.id) === String(id),
            )
          : false;

        if (isMounted) {
          setView(isEnrolled ? "learning" : "detail");
        }
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
