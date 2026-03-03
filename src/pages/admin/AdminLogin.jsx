import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Key, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    try {
      setIsLoading(true);

      // Validate API key by making a test request to backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/courses/admin/ready`,
        {
          method: "GET",
          headers: {
            "x-api-key": apiKey.trim(),
          },
        },
      );

      if (response.ok) {
        // API key is valid!
        sessionStorage.setItem("admin_api_key", apiKey.trim());
        sessionStorage.setItem("admin_authenticated", "true");

        toast.success("Login successful!");
        navigate("/admin/dashboard");
      } else if (response.status === 401 || response.status === 403) {
        toast.error("Invalid API key");
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-orange-600 to-yellow-600 dark:from-red-900 dark:via-orange-900 dark:to-yellow-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white/80">Enter your API key to continue</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin API Key
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your admin API key"
                  className="w-full pl-12 pr-12 py-3 bg-white dark:bg-dark-800 border-2 border-gray-200 dark:border-dark-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showApiKey ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Your API key will be validated against the backend
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Access Admin Panel</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">
              🔒 Secure Authentication
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Your API key is validated against the backend and stored securely
              in your browser session. It will be cleared when you close the
              browser.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/60 text-sm">
            Protected by x-api-key authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
