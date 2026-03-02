import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, X, Save, Sparkles } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    difficulty: "Beginner",
    estimated_duration: "",
    isReady: false,
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCourse();
  }, [courseId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/courses/${courseId}`);
      const data = response.data.data || response.data;

      setFormData({
        title: data.title || "",
        description: data.description || "",
        price: data.price || "",
        category_id: data.category_id || "",
        difficulty: data.difficulty || "Beginner",
        estimated_duration: data.estimated_duration || "",
        isReady: data.isReady || false,
      });

      if (data.thumbnail_url) {
        setThumbnailPreview(data.thumbnail_url);
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
      toast.error("Failed to load course");
      navigate("/teacher/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    try {
      setIsSaving(true);

      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("price", formData.price);
      submitData.append("category_id", formData.category_id);
      submitData.append("difficulty", formData.difficulty);
      submitData.append("isReady", formData.isReady.toString());

      if (formData.estimated_duration) {
        submitData.append("estimated_duration", formData.estimated_duration);
      }

      if (thumbnailFile) {
        submitData.append("thumbnailPic", thumbnailFile);
      }

      await api.patch(`/courses/${courseId}`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Course updated successfully!");
      navigate("/teacher/dashboard");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update course";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 dark:from-primary-900 dark:via-purple-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            to="/teacher/dashboard"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Edit Course</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">Update Course Details</h1>
            <p className="text-xl text-white/90">
              Make changes to your course information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Complete React Masterclass"
              className="input-field"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Brief description of your course..."
              className="input-field resize-none"
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty *
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="49.99"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                name="estimated_duration"
                value={formData.estimated_duration}
                onChange={handleChange}
                min="1"
                placeholder="10"
                className="input-field"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Course Thumbnail
            </label>

            {thumbnailPreview ? (
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                <div className="flex flex-col items-center justify-center py-6">
                  <Upload className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Click to upload thumbnail
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Is Ready Toggle */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <input
              type="checkbox"
              name="isReady"
              id="isReady"
              checked={formData.isReady}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 rounded"
            />
            <label htmlFor="isReady" className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900 dark:text-white">
                Mark course as ready for review
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                When checked, this course will be submitted for admin approval
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate("/teacher/dashboard")}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCourse;
