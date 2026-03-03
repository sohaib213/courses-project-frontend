import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Pages
import Home from "../pages/Home";
import Courses from "../pages/Courses";
import Login from "../pages/Login";
import Register from "../pages/Register";
import TeacherDashboard from "../pages/teacher/Dashboard";
import NotFound from "../pages/NotFound";
import InstructorProfile from "../pages/InstructorProfile";
import VerifyEmail from "../pages/VerifyEmail";
import CompleteProfile from "../pages/CompleteProfile";
import GoogleCallback from "../pages/GoogleCallback";
import UserProfile from "../pages/UserProfile";
import MyCourses from "../pages/MyCourses";
import Cart from "../pages/Cart";
import Payment from "../pages/Payment";
import CourseEntryRoute from "./CourseEntryRoute";
import LessonManagement from "../pages/teacher/LessonManagement";
import QuizManagement from "../pages/teacher/QuizManagement";
import EditCourse from "../pages/teacher/EditCourse";
import AdminDashboard from "../pages/admin/AdminDashboard-Secure.jsx";
import AdminLogin from "../pages/admin/AdminLogin";
import ProtectedAdminRoute from "../pages/admin/components/ProtectedAdminRoute"; // Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseEntryRoute />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/instructor/:id" element={<InstructorProfile />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/my-courses" element={<MyCourses />} />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        }
      />
      {/* Protected Routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredUserType="Teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId/lessons"
        element={
          <ProtectedRoute requiredUserType="Teacher">
            <LessonManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId/lessons/:lessonId/questions"
        element={
          <ProtectedRoute requiredUserType="Teacher">
            <QuizManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId/edit"
        element={
          <ProtectedRoute requiredUserType="Teacher">
            <EditCourse />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
