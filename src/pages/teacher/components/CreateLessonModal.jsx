import { useState, useEffect, useRef } from "react";
import { X, FileVideo, Image as ImageIcon } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";

const CreateLessonModal = ({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  editingLesson,
}) => {
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const normalizeContentType = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "video") return "Video";
    if (normalized === "quiz") return "Quiz";
    if (normalized === "text") return "Text";
    if (normalized === "code") return "Code";
    return "Video";
  };

  const [formData, setFormData] = useState({
    title: "",
    content: "Video", // Video, Text, Code, Quiz
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (editingLesson) {
      setFormData({
        title: editingLesson.title || "",
        content: normalizeContentType(editingLesson.content_type),
      });
      if (editingLesson.video_url) {
        setVideoPreview(editingLesson.video_url);
      }
      if (editingLesson.video_thumbnail) {
        setThumbnailPreview(editingLesson.video_thumbnail);
      }
    } else {
      resetForm();
    }
  }, [editingLesson, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      // 500MB
      toast.error("Video size should be less than 500MB");
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
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

    if (formData.content === "Video" && !videoFile && !editingLesson) {
      toast.error("Please upload a video file");
      return;
    }

    try {
      setIsLoading(true);
      setUploadProgress(0);

      const submitData = new FormData();
      submitData.append("title", formData.title.trim());
      if (!editingLesson) {
        submitData.append("courseId", courseId);
        submitData.append("content", formData.content);
      }

      if (videoFile) {
        submitData.append("video", videoFile);
      }

      if (thumbnailFile) {
        submitData.append("thumbnailPic", thumbnailFile);
      }

      if (editingLesson) {
        // Update lesson
        await api.patch(`/lessons/${editingLesson.id}`, submitData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(progress);
          },
        });
        toast.success("Lesson updated successfully!");
      } else {
        // Create lesson
        await api.post("/lessons", submitData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(progress);
          },
        });
        toast.success("Lesson created successfully!");
      }

      resetForm();
      onSuccess();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to save lesson";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "Video",
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setVideoPreview(null);
    setThumbnailPreview(null);
    setUploadProgress(0);
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
            {editingLesson ? "Edit Lesson" : "Create New Lesson"}
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
              Lesson Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Introduction to React Hooks"
              className="input-field"
            />
          </div>

          {/* Lesson Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lesson Type *
            </label>
            <select
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              disabled={editingLesson} // Can't change type when editing
              className="input-field"
            >
              <option value="Video">Video</option>
              <option value="Quiz">Quiz</option>
            </select>
            {editingLesson && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Lesson type cannot be changed
              </p>
            )}
          </div>

          {/* Video Upload (only for Video type) */}
          {formData.content === "Video" && (
            <>
              {/* Video File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video File {!editingLesson && "*"}
                </label>

                {videoPreview ? (
                  <div className="relative">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-64 rounded-xl"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Replace
                      </button>
                    </div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-dark-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <div className="flex flex-col items-center justify-center py-6">
                      <FileVideo className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        MP4, MOV up to 500MB
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail (Optional)
                </label>

                {thumbnailPreview ? (
                  <div className="relative">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Replace
                      </button>
                    </div>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
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
            </>
          )}

          {/* Info for other types */}
          {formData.content === "Quiz" && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                After creating this quiz lesson, you'll be able to add questions
                from the lesson management page.
              </p>
            </div>
          )}

          {(formData.content === "Text" || formData.content === "Code") && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {formData.content === "Text"
                  ? "Text content editing will be available after creating the lesson."
                  : "Code content editing will be available after creating the lesson."}
              </p>
            </div>
          )}

          {/* Upload Progress */}
          {isLoading && uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-600 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

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
                  <span>
                    {uploadProgress > 0
                      ? `${uploadProgress}%`
                      : "Processing..."}
                  </span>
                </>
              ) : (
                <span>{editingLesson ? "Update Lesson" : "Create Lesson"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLessonModal;
