import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "../services/authService";
import { useAppDispatch } from "../redux/hooks";
import { checkAuth } from "../redux/slices/authSlice";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const userId = searchParams.get("userId");
  const email = searchParams.get("email");

  const [formData, setFormData] = useState({
    id: userId || "",
    username: "",
    type: "Student", // Student or Teacher
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we have the required parameters
    if (!userId || !email) {
      toast.error("Invalid profile completion link");
      navigate("/login");
    }
  }, [userId, email, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await authService.completeProfile(formData);
      await dispatch(checkAuth()).unwrap();
      toast.success("Profile completed successfully! Welcome aboard! 🎉");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-purple-600 rounded-3xl mb-6 shadow-2xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Welcome to LearnHub! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Let's complete your profile to get started
          </p>
          {email && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Signed in as:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {email}
              </span>
            </p>
          )}
        </div>

        {/* Profile Completion Form */}
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Google Sign-In
                </span>
              </div>
              <div className="w-12 h-1 bg-primary-600"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  Complete Profile
                </span>
              </div>
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                I want to join as a
              </label>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Student Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "Student" })}
                  className={`group relative overflow-hidden p-6 rounded-2xl border-3 transition-all ${
                    formData.type === "Student"
                      ? "border-primary-600 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-xl scale-105"
                      : "border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-102"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                        formData.type === "Student"
                          ? "bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg"
                          : "bg-gray-100 dark:bg-dark-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"
                      }`}
                    >
                      <GraduationCap
                        className={`h-8 w-8 ${
                          formData.type === "Student"
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        formData.type === "Student"
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Student
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn new skills and advance your career
                    </p>
                  </div>
                  {formData.type === "Student" && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </button>

                {/* Teacher Option */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "Teacher" })}
                  className={`group relative overflow-hidden p-6 rounded-2xl border-3 transition-all ${
                    formData.type === "Teacher"
                      ? "border-primary-600 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/30 dark:to-purple-900/30 shadow-xl scale-105"
                      : "border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-102"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                        formData.type === "Teacher"
                          ? "bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg"
                          : "bg-gray-100 dark:bg-dark-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"
                      }`}
                    >
                      <BookOpen
                        className={`h-8 w-8 ${
                          formData.type === "Teacher"
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-xl font-bold mb-2 ${
                        formData.type === "Teacher"
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Teacher
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your knowledge and inspire others
                    </p>
                  </div>
                  {formData.type === "Teacher" && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Choose a Username (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g., john_doe or leave empty for auto-generated"
                  className="input-field pl-12"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                💡 If you don't provide a username, we'll generate a unique one
                for you
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary !py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-2"></div>
                  Completing Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Complete Profile & Get Started
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Why do we need this?</strong>
              <br />
              This helps us personalize your experience and show you relevant
              content based on whether you're here to learn or teach.
            </p>
          </div>
        </div>

        {/* Security Note */}
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-500">
          🔒 Your information is secure and will never be shared with third
          parties
        </p>
      </div>
    </div>
  );
};

export default CompleteProfile;
