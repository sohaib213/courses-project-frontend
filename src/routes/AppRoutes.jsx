import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Pages
import Home from "../pages/Home";
import Courses from "../pages/Courses";
import CourseDetail from "../pages/CourseDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import InstructorProfile from "../pages/InstructorProfile";
import VerifyEmail from "../pages/VerifyEmail";
import CompleteProfile from "../pages/CompleteProfile";
import GoogleCallback from "../pages/GoogleCallback";
import UserProfile from "../pages/UserProfile";
import MyCourses from "../pages/MyCourses";
import CourseLearning from "../pages/CourseLearning";
import Cart from "../pages/Cart";
import Payment from "../pages/Payment";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/instructor/:id" element={<InstructorProfile />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/my-courses" element={<MyCourses />} />
      <Route path="/courses/:courseId/learn" element={<CourseLearning />} />
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
        path="/dashboard"
        element={
          <ProtectedRoute requiredUserType="Teacher">
            <Dashboard />
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

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
