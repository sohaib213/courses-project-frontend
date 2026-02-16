import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Get data from URL params (sent by backend)
    const requiresProfileCompletion =
      searchParams.get("requiresProfileCompletion") === "true";
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const accessToken = searchParams.get("accessToken");
    const error = searchParams.get("error");

    // Handle error
    if (error) {
      toast.error(error, { id: "google-auth-error" });
      navigate("/login", { replace: true });
      return;
    }

    // Profile completion required (first-time Google user)
    if (requiresProfileCompletion && userId && email) {
      navigate(
        `/complete-profile?userId=${userId}&email=${encodeURIComponent(email)}`,
        { replace: true },
      );
      return;
    }

    // Already has complete profile - store token and redirect
    if (accessToken) {
      localStorage.setItem("token", accessToken);
      toast.success("Welcome back! 🎉", { id: "google-auth-success" });
      navigate("/", { replace: true });
      return;
    }

    // Something went wrong
    toast.error("Authentication failed. Please try again.", {
      id: "google-auth-fallback-error",
    });
    navigate("/login", { replace: true });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl mb-6 shadow-2xl animate-pulse">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we set up your account
        </p>
        <div className="mt-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
