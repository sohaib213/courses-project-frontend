import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  HelpCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Award,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import CreateQuestionModal from "./components/CreateQuestionModal";

const QuizManagement = () => {
  const { courseId, lessonId } = useParams();

  const [lesson, setLesson] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState(null);

  useEffect(() => {
    fetchLesson();
    fetchQuestions();
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const response = await api.get(`/lessons/${lessonId}`);
      const data = response.data.data || response.data;
      setLesson(data);
    } catch (error) {
      console.error("Failed to fetch lesson:", error);
      toast.error("Failed to load lesson");
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/questions/lesson/${lessonId}`);
      const data = response.data.data || response.data;
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this question? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingQuestionId(questionId);
      await api.delete(`/questions/${questionId}`);
      toast.success("Question deleted successfully");
      fetchQuestions();
      fetchLesson(); // Refresh to update quiz grade
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete question";
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const getQuestionTypeBadge = (type) => {
    const badges = {
      MultipleChoice: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        label: "Multiple Choice",
      },
      TrueFalse: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-800 dark:text-purple-300",
        label: "True/False",
      },
      Essay: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        label: "Essay",
      },
    };
    const badge = badges[type] || badges.MultipleChoice;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const totalGrade = questions.reduce(
    (sum, q) => sum + (q.question_grade || 0),
    0,
  );

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
      <div className="bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 dark:from-orange-900 dark:via-red-900 dark:to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <Link
            to={`/teacher/courses/${courseId}/lessons`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Lessons</span>
          </Link>

          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Quiz Management</span>
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {lesson?.title || "Quiz Questions"}
            </h1>
            <p className="text-xl text-white/90">
              Create and manage quiz questions
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 -mt-8 relative z-10">
          <div className="glass rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-3">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {questions.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Questions
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white mb-3">
              <Award className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {totalGrade}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Points
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-3">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {questions.filter((q) => q.question_type !== "Essay").length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Auto-Graded
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Questions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Quiz Grade: {lesson?.quiz_grade || totalGrade} points
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Questions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start building your quiz by adding your first question
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="card-hover">
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Q{index + 1}.
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                        {question.question_text}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 ml-8">
                      {getQuestionTypeBadge(question.question_type)}
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {question.question_grade}{" "}
                        {question.question_grade === 1 ? "point" : "points"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setIsCreateModalOpen(true);
                      }}
                      className="px-3 py-2 bg-gray-100 dark:bg-dark-800 hover:bg-gray-200 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg transition-all"
                      title="Edit question"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      disabled={deletingQuestionId === question.id}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all disabled:opacity-50"
                      title="Delete question"
                    >
                      {deletingQuestionId === question.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Options (for MCQ and True/False) */}
                {question.question_type !== "Essay" && question.options && (
                  <div className="ml-8 space-y-2">
                    {question.options.map((option, optIdx) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          option.is_correct
                            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                            : "bg-gray-50 dark:bg-dark-800"
                        }`}
                      >
                        {option.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span
                          className={`flex-1 ${
                            option.is_correct
                              ? "font-semibold text-green-900 dark:text-green-100"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}.{" "}
                          {option.option_text}
                        </span>
                        {option.is_correct && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Model Answer (for Essay) */}
                {question.question_type === "Essay" &&
                  question.model_answer && (
                    <div className="ml-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Model Answer (for AI grading):
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {question.model_answer}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Question Modal */}
      <CreateQuestionModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingQuestion(null);
        }}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setEditingQuestion(null);
          fetchQuestions();
          fetchLesson();
        }}
        lessonId={lessonId}
        editingQuestion={editingQuestion}
      />
    </div>
  );
};

export default QuizManagement;
