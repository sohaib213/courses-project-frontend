import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

const ProtectedAdminRoute = ({ children }) => {
  const isAuthenticated =
    sessionStorage.getItem("admin_authenticated") === "true";
  const apiKey = sessionStorage.getItem("admin_api_key");

  if (!isAuthenticated || !apiKey) {
    toast.error("Please login to access admin panel");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
