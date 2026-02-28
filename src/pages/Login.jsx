import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { login } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import { Eye, EyeOff, Mail, Lock, Sparkles, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [isResetCodeSent, setIsResetCodeSent] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      await dispatch(login(formData)).unwrap();
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      const errorMessage =
        typeof error === "string" ? error : error?.message || "";

      // Check if it's email verification error
      if (
        errorMessage.includes("Verify Email") ||
        errorMessage.includes("verify")
      ) {
        toast.error("Please verify your email first");
        navigate("/verify-email", { state: { email: formData.email } });
      } else if (errorMessage.includes("google")) {
        toast.error("This account uses Google Sign-In");
      } else {
        toast.error(errorMessage || "Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
  };

  const handleResetPasswordRequest = async (e) => {
    e.preventDefault();

    const emailToUse = forgotPasswordEmail || formData.email;
    if (!emailToUse) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsResetLoading(true);
      console.log("email: ", emailToUse);
      await authService.resetPasswordRequest(emailToUse);
      toast.success("Reset code sent. Please check your email.");
      setForgotPasswordEmail(emailToUse);
      setIsResetCodeSent(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset code");
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (
      !forgotPasswordEmail ||
      !resetCode ||
      !newResetPassword ||
      !confirmResetPassword
    ) {
      toast.error("Please fill all reset fields");
      return;
    }

    if (newResetPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsResetLoading(true);
      await authService.checkPasswordResetCode(forgotPasswordEmail, resetCode);
      await authService.resetPassword({
        email: forgotPasswordEmail,
        code: resetCode,
        new_password: newResetPassword,
        confirm_password: confirmResetPassword,
      });

      toast.success("Password reset successful. Please sign in.");
      setShowForgotPassword(false);
      setIsResetCodeSent(false);
      setResetCode("");
      setNewResetPassword("");
      setConfirmResetPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsResetLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary-200/30 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to continue learning
          </p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="input-field pl-12"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(!showForgotPassword);
                    if (!forgotPasswordEmail && formData.email) {
                      setForgotPasswordEmail(formData.email);
                    }
                    if (showForgotPassword) {
                      setIsResetCodeSent(false);
                      setResetCode("");
                      setNewResetPassword("");
                      setConfirmResetPassword("");
                    }
                  }}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="input-field pl-12 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Section */}
            {showForgotPassword && (
              <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
                {!isResetCodeSent ? (
                  <>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      Enter your email and we will send you a reset code.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="input-field"
                      />
                      <button
                        type="button"
                        disabled={isResetLoading}
                        onClick={handleResetPasswordRequest}
                        className="btn-primary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResetLoading ? "Sending..." : "Send Reset Code"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Enter the code sent to{" "}
                      <span className="font-semibold">
                        {forgotPasswordEmail}
                      </span>{" "}
                      and set your new password.
                    </p>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Reset code"
                      className="input-field"
                    />
                    <input
                      type="password"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="New password"
                      className="input-field"
                    />
                    <input
                      type="password"
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="input-field"
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        disabled={isResetLoading}
                        onClick={handleResetPassword}
                        className="btn-primary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResetLoading ? "Resetting..." : "Reset Password"}
                      </button>
                      <button
                        type="button"
                        disabled={isResetLoading}
                        onClick={handleResetPasswordRequest}
                        className="btn-secondary !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary !py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </>
              )}
            </button>
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-dark-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-dark-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-dark-800 border-2 border-gray-300 dark:border-dark-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-all"
            >
              <FcGoogle className="h-5 w-5" />
              Sign in with Google
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
