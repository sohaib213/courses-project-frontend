import { useState, useEffect } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";

const CreateCourseModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    difficulty: "Beginner",
    estimated_duration: "",
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await api.get("/categories");
      const data = response.data.data || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
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
      setIsLoading(true);

      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("price", formData.price);
      submitData.append("category_id", formData.category_id);
      submitData.append("difficulty", formData.difficulty);

      if (formData.estimated_duration) {
        submitData.append("estimated_duration", formData.estimated_duration);
      }

      if (thumbnailFile) {
        submitData.append("thumbnailPic", thumbnailFile);
      }

      await api.post("/courses", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Course created successfully!");
      resetForm();
      onSuccess();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to create course";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      category_id: "",
      difficulty: "Beginner",
      estimated_duration: "",
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-900 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Course
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              rows={4}
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
                disabled={isLoadingCategories}
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
                  className="w-full h-48 object-cover rounded-xl"
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
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                <div className="flex flex-col items-center justify-center py-6">
                  <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Course</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
