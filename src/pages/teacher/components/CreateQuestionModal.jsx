import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import api from "../../../services/api";
import toast from "react-hot-toast";

const CreateQuestionModal = ({
  isOpen,
  onClose,
  onSuccess,
  lessonId,
  editingQuestion,
}) => {
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "MultipleChoice",
    question_grade: "",
    model_answer: "",
  });
  const [options, setOptions] = useState([
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question_text: editingQuestion.question_text || "",
        question_type: editingQuestion.question_type || "MultipleChoice",
        question_grade: editingQuestion.question_grade || "",
        model_answer: editingQuestion.model_answer || "",
      });
      if (editingQuestion.options && editingQuestion.options.length > 0) {
        setOptions(
          editingQuestion.options.map((opt) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
          })),
        );
      }
    } else {
      resetForm();
    }
  }, [editingQuestion, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Reset options when changing question type
    if (name === "question_type") {
      if (value === "TrueFalse") {
        setOptions([
          { option_text: "True", is_correct: false },
          { option_text: "False", is_correct: false },
        ]);
      } else if (value === "MultipleChoice") {
        setOptions([
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ]);
      }
    }
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options];
    newOptions[index][field] = value;

    // For MultipleChoice and TrueFalse, only one can be correct
    if (field === "is_correct" && value === true) {
      newOptions.forEach((opt, idx) => {
        if (idx !== index) opt.is_correct = false;
      });
    }

    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length >= 6) {
      toast.error("Maximum 6 options allowed");
      return;
    }
    setOptions([...options, { option_text: "", is_correct: false }]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }
    const newOptions = options.filter((_, idx) => idx !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (!formData.question_grade || parseFloat(formData.question_grade) < 1) {
      toast.error("Question grade must be at least 1");
      return;
    }

    // Validate Essay type
    if (formData.question_type === "Essay") {
      if (!formData.model_answer.trim()) {
        toast.error("Model answer is required for essay questions");
        return;
      }
    }

    // Validate MCQ and True/False
    if (formData.question_type !== "Essay") {
      const filledOptions = options.filter((opt) => opt.option_text.trim());
      if (filledOptions.length < 2) {
        toast.error("At least 2 options are required");
        return;
      }

      const correctOptions = filledOptions.filter((opt) => opt.is_correct);
      if (correctOptions.length === 0) {
        toast.error("Please mark one option as correct");
        return;
      }
      if (correctOptions.length > 1) {
        toast.error("Only one option can be marked as correct");
        return;
      }
    }

    // Validate True/False
    if (formData.question_type === "TrueFalse") {
      if (options.length !== 2) {
        toast.error("True/False questions must have exactly 2 options");
        return;
      }
    }

    try {
      setIsLoading(true);

      const submitData = {
        lesson_id: lessonId,
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        question_grade: parseFloat(formData.question_grade),
      };

      if (formData.question_type === "Essay") {
        submitData.model_answer = formData.model_answer.trim();
      } else {
        submitData.options = options
          .filter((opt) => opt.option_text.trim())
          .map((opt) => ({
            option_text: opt.option_text.trim(),
            is_correct: opt.is_correct,
          }));
      }

      if (editingQuestion) {
        // Update question
        await api.patch(`/questions/${editingQuestion.id}`, {
          question_text: submitData.question_text,
          question_grade: submitData.question_grade,
          ...(formData.question_type === "Essay" && {
            model_answer: submitData.model_answer,
          }),
        });
        toast.success("Question updated successfully!");
      } else {
        // Create question
        await api.post("/questions", submitData);
        toast.success("Question created successfully!");
      }

      resetForm();
      onSuccess();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to save question";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: "",
      question_type: "MultipleChoice",
      question_grade: "",
      model_answer: "",
    });
    setOptions([
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-900 z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingQuestion ? "Edit Question" : "Create New Question"}
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
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question Type *
            </label>
            <select
              name="question_type"
              value={formData.question_type}
              onChange={handleChange}
              required
              disabled={editingQuestion}
              className="input-field"
            >
              <option value="MultipleChoice">Multiple Choice</option>
              <option value="TrueFalse">True/False</option>
              <option value="Essay">Essay</option>
            </select>
            {editingQuestion && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Question type cannot be changed
              </p>
            )}
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Question *
            </label>
            <textarea
              name="question_text"
              value={formData.question_text}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Enter your question here..."
              className="input-field resize-none"
            />
          </div>

          {/* Question Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Points *
            </label>
            <input
              type="number"
              name="question_grade"
              value={formData.question_grade}
              onChange={handleChange}
              required
              min="1"
              placeholder="10"
              className="input-field"
            />
          </div>

          {/* Options (for MCQ and True/False) */}
          {formData.question_type !== "Essay" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Options *
                </label>
                {formData.question_type === "MultipleChoice" && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={option.is_correct}
                      onChange={(e) =>
                        handleOptionChange(
                          index,
                          "is_correct",
                          e.target.checked,
                        )
                      }
                      className="flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={option.option_text}
                      onChange={(e) =>
                        handleOptionChange(index, "option_text", e.target.value)
                      }
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      disabled={formData.question_type === "TrueFalse"}
                      className="input-field flex-1"
                    />
                    {formData.question_type === "MultipleChoice" &&
                      options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Select the radio button to mark the correct answer
              </p>
            </div>
          )}

          {/* Model Answer (for Essay) */}
          {formData.question_type === "Essay" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model Answer * (for AI grading)
              </label>
              <textarea
                name="model_answer"
                value={formData.model_answer}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Enter the ideal answer that will be used for AI grading..."
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                This will be used as a reference for AI to grade student answers
              </p>
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {editingQuestion ? "Update Question" : "Create Question"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestionModal;
