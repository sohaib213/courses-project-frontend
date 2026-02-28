import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Lock,
  BookOpen,
  PlayCircle,
  FileText,
  Code,
  HelpCircle,
  Award,
  Download,
  Menu,
  X,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const CourseLearning = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizQuestionsByLessonId, setQuizQuestionsByLessonId] = useState({});
  const [isLoadingQuizQuestions, setIsLoadingQuizQuestions] = useState(false);
  const [quizSubmissionByLessonId, setQuizSubmissionByLessonId] = useState({});
  const [isLoadingQuizSubmission, setIsLoadingQuizSubmission] = useState(false);

  const getCompletedLessonsCount = (enrollmentData = enrollment) =>
    Number(enrollmentData?.current_lesson_order || 0);

  const normalizedLessons = useMemo(() => {
    return [...lessons]
      .map((lesson, index) => {
        const rawOrder = Number(lesson?.order ?? lesson?.order_number);
        const normalizedOrder = Number.isFinite(rawOrder)
          ? rawOrder
          : index + 1;

        return {
          ...lesson,
          _order: normalizedOrder,
        };
      })
      .sort((a, b) => a._order - b._order);
  }, [lessons]);

  const isLikelyHtml = (value) => {
    if (typeof value !== "string") return false;
    return /<\/?[a-z][\s\S]*>/i.test(value);
  };

  const getQuizQuestions = (lesson) => {
    if (!lesson) return [];

    const directQuestions = lesson.questions || lesson.quiz_questions;
    if (Array.isArray(directQuestions)) {
      return directQuestions;
    }

    if (typeof lesson.content === "string") {
      const trimmed = lesson.content.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
          if (Array.isArray(parsed?.questions)) return parsed.questions;
        } catch {
          return [];
        }
      }
    }

    return [];
  };

  const isQuizLesson = currentLesson?.content_type?.toLowerCase() === "quiz";
  const fetchedQuizQuestions = currentLesson?.id
    ? quizQuestionsByLessonId[currentLesson.id]
    : undefined;
  const fallbackQuizQuestions = useMemo(
    () => (isQuizLesson ? getQuizQuestions(currentLesson) : []),
    [isQuizLesson, currentLesson],
  );
  const quizQuestions = useMemo(
    () =>
      isQuizLesson
        ? Array.isArray(fetchedQuizQuestions)
          ? fetchedQuizQuestions
          : fallbackQuizQuestions
        : [],
    [isQuizLesson, fetchedQuizQuestions, fallbackQuizQuestions],
  );
  const currentQuizSubmission = currentLesson?.id
    ? quizSubmissionByLessonId[currentLesson.id]
    : null;
  const currentLessonSubmissionState = currentLesson?.id
    ? quizSubmissionByLessonId[currentLesson.id]
    : undefined;
  const hasSubmittedCurrentQuiz = Boolean(currentQuizSubmission?.submission);
  const submittedAnswersByQuestionId = useMemo(() => {
    const answers = currentQuizSubmission?.submission?.answers || [];
    return answers.reduce((acc, answer) => {
      if (answer?.question_id) {
        acc[answer.question_id] = answer;
      }
      return acc;
    }, {});
  }, [currentQuizSubmission]);
  const areAllQuizQuestionsAnswered =
    !isQuizLesson ||
    (quizQuestions.length > 0 &&
      quizQuestions.every((question, index) => {
        const questionKey = question?.id || index;
        const answer = quizAnswers[questionKey];
        return answer !== undefined && String(answer).trim() !== "";
      }));

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    setQuizAnswers({});
  }, [currentLesson?.id]);

  useEffect(() => {
    if (!currentLesson?.id || !isQuizLesson) return;

    const fetchLessonQuestions = async () => {
      try {
        setIsLoadingQuizQuestions(true);
        const response = await api.get(`/questions/lesson/${currentLesson.id}`);
        const responseData = response.data.data || response.data;

        const questions = Array.isArray(responseData)
          ? responseData
          : responseData?.questions || [];

        setQuizQuestionsByLessonId((prev) => ({
          ...prev,
          [currentLesson.id]: questions,
        }));
      } catch (error) {
        console.error("Failed to fetch lesson questions:", error);
        toast.error("Failed to load quiz questions");
        setQuizQuestionsByLessonId((prev) => ({
          ...prev,
          [currentLesson.id]: [],
        }));
      } finally {
        setIsLoadingQuizQuestions(false);
      }
    };

    fetchLessonQuestions();
  }, [currentLesson?.id, isQuizLesson]);

  useEffect(() => {
    if (!currentLesson?.id || !isQuizLesson) return;
    if (currentLessonSubmissionState !== undefined) return;

    const fetchLessonSubmission = async () => {
      try {
        setIsLoadingQuizSubmission(true);
        const response = await api.get(
          `/submissions/lesson/${currentLesson.id}`,
        );
        const responseData = response.data.data || response.data;
        const submissions = responseData?.submisions || [];
        const submission = submissions[0] || null;

        setQuizSubmissionByLessonId((prev) => ({
          ...prev,
          [currentLesson.id]: {
            submission,
            quizGrade: responseData?.quize_grade ?? null,
          },
        }));
      } catch (error) {
        if (error?.response?.status === 404) {
          setQuizSubmissionByLessonId((prev) => ({
            ...prev,
            [currentLesson.id]: null,
          }));
        } else {
          console.error("Failed to fetch quiz submission:", error);
        }
      } finally {
        setIsLoadingQuizSubmission(false);
      }
    };

    fetchLessonSubmission();
  }, [currentLesson?.id, isQuizLesson, currentLessonSubmissionState]);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);

      // Fetch course details
      const courseResponse = await api.get(`/courses/${courseId}`);
      const courseData = courseResponse.data.data || courseResponse.data;
      setCourse(courseData);

      // Fetch user's enrollment
      const enrollmentResponse = await api.get(`/enrollments`);
      const enrollments =
        enrollmentResponse.data.data || enrollmentResponse.data;
      const userEnrollment = enrollments.find(
        (e) =>
          String(e.course_id) === String(courseId) ||
          String(e.courses?.id) === String(courseId),
      );

      if (!userEnrollment) {
        toast.error("You are not enrolled in this course");
        navigate(`/courses/${courseId}`);
        return;
      }

      setEnrollment(userEnrollment);

      // Fetch lessons
      const lessonsResponse = await api.get(`/lessons/course/${courseId}`);
      const lessonsData = lessonsResponse.data.data || lessonsResponse.data;
      const lessonsArray = Array.isArray(lessonsData)
        ? lessonsData
        : lessonsData?.lessons || [];
      setLessons(lessonsArray);

      // Set current lesson based on progress
      const completedLessons = getCompletedLessonsCount(userEnrollment);
      const orderedLessons = [...lessonsArray]
        .map((lesson, index) => {
          const rawOrder = Number(lesson?.order ?? lesson?.order_number);
          const normalizedOrder = Number.isFinite(rawOrder)
            ? rawOrder
            : index + 1;

          return {
            ...lesson,
            _order: normalizedOrder,
          };
        })
        .sort((a, b) => a._order - b._order);

      const currentIndex = Math.min(
        completedLessons,
        Math.max(orderedLessons.length - 1, 0),
      );
      const nextLesson = orderedLessons[currentIndex] || null;
      setCurrentLesson(nextLesson);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast.error("Failed to load course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!enrollment?.id) return;

    try {
      setIsCompletingLesson(true);
      await api.patch(`/enrollments/${enrollment.id}`);

      toast.success("Lesson completed! 🎉");

      // Refresh enrollment data
      await fetchCourseData();
    } catch {
      toast.error("Failed to mark lesson as complete");
    } finally {
      setIsCompletingLesson(false);
    }
  };

  const handleQuizSubmit = async () => {
    if (hasSubmittedCurrentQuiz) {
      toast.error("You have already submitted this quiz");
      return;
    }

    if (!areAllQuizQuestionsAnswered) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    if (!currentLesson?.id) {
      toast.error("Invalid lesson");
      return;
    }

    try {
      setIsCompletingLesson(true);
      const submittedLesson = currentLesson;

      const answers = quizQuestions.map((question, index) => {
        const questionKey = question?.id || index;
        const answerValue = quizAnswers[questionKey];
        const questionId = question?.id;
        const questionType = String(
          question?.question_type || "",
        ).toLowerCase();

        if (!questionId) {
          throw new Error("Question id is missing");
        }

        if (questionType === "essay") {
          return {
            question_id: questionId,
            essay_answer: {
              answer_text: String(answerValue || "").trim(),
            },
          };
        }

        const options = Array.isArray(question?.options)
          ? question.options
          : [];
        const matchedOption = options.find((option) => {
          if (typeof option === "string") return false;
          return (
            option?.id === answerValue ||
            option?.option_text === answerValue ||
            option?.value === answerValue ||
            option?.text === answerValue
          );
        });

        const selectedOptionId = matchedOption?.id;

        if (!selectedOptionId) {
          throw new Error(
            "Please select a valid option for all MCQ/TF questions",
          );
        }

        return {
          question_id: questionId,
          mcq_tf_answer: {
            selected_option_id: selectedOptionId,
          },
        };
      });

      await api.post("/submissions", {
        lesson_id: currentLesson.id,
        answers,
      });

      const submissionResponse = await api.get(
        `/submissions/lesson/${currentLesson.id}`,
      );
      const submissionData =
        submissionResponse.data.data || submissionResponse.data;
      const fetchedSubmission = (submissionData?.submisions || [])[0] || null;
      setQuizSubmissionByLessonId((prev) => ({
        ...prev,
        [currentLesson.id]: {
          submission: fetchedSubmission,
          quizGrade: submissionData?.quize_grade ?? null,
        },
      }));

      toast.success("Quiz submitted successfully");
      await handleCompleteLesson();
      setCurrentLesson(submittedLesson);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit quiz";
      toast.error(Array.isArray(message) ? message[0] : message);
      setIsCompletingLesson(false);
    }
  };

  const getLessonIcon = (contentType) => {
    const icons = {
      video: <PlayCircle className="h-4 w-4" />,
      text: <FileText className="h-4 w-4" />,
      code: <Code className="h-4 w-4" />,
      quiz: <HelpCircle className="h-4 w-4" />,
    };
    return (
      icons[contentType?.toLowerCase()] || <BookOpen className="h-4 w-4" />
    );
  };

  const isLessonUnlocked = (lessonOrder) => {
    const completedLessons = getCompletedLessonsCount();
    return lessonOrder <= completedLessons + 1;
  };

  const isLessonCompleted = (lessonOrder) => {
    const completedLessons = getCompletedLessonsCount();
    return lessonOrder <= completedLessons;
  };

  const calculateProgress = () => {
    if (!enrollment || !course) return 0;
    const current = getCompletedLessonsCount();
    const total = course.lessons_number || lessons.length || 1;
    return Math.min(100, Math.round((current / total) * 100));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex flex-col">
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              to="/my-courses"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to My Courses</span>
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 truncate">
              {course?.title}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-dark-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                {progress}%
              </span>
            </div>
          </div>

          {enrollment?.completed && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Completed
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Lessons List */}
        <div
          className={`${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-80 bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 flex flex-col transition-transform duration-300 ease-in-out`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900 dark:text-white">
                Course Content
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-dark-800 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {lessons.length} lessons • {getCompletedLessonsCount()} completed
            </p>
          </div>

          {/* Lessons List */}
          <div className="flex-1 overflow-y-auto">
            {normalizedLessons.map((lesson) => {
              const lessonOrder = lesson._order;
              const isUnlocked = isLessonUnlocked(lessonOrder);
              const isCompleted = isLessonCompleted(lessonOrder);
              const isCurrent = currentLesson?.id === lesson.id;

              return (
                <button
                  key={lesson.id}
                  onClick={() => isUnlocked && setCurrentLesson(lesson)}
                  disabled={!isUnlocked}
                  className={`w-full text-left p-4 border-b border-gray-200 dark:border-dark-700 transition-all ${
                    isCurrent
                      ? "bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-600"
                      : isCompleted
                        ? "bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20"
                        : isUnlocked
                          ? "hover:bg-gray-50 dark:hover:bg-dark-800"
                          : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : isUnlocked ? (
                        <Circle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Lock className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-500">
                          Lesson {lessonOrder}
                        </span>
                        {getLessonIcon(lesson.content_type)}
                      </div>
                      <h3
                        className={`font-medium mb-1 ${
                          isCurrent
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {lesson.title}
                      </h3>
                      {lesson.duration && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {lesson.duration} min
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentLesson ? (
            <>
              {/* Lesson Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                  {/* Lesson Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {getLessonIcon(currentLesson.content_type)}
                      <span className="capitalize">
                        {currentLesson.content_type || "Lesson"}
                      </span>
                      <span>•</span>
                      <span>Lesson {currentLesson._order || 1}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>

                  {/* Lesson Content */}
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {currentLesson.content_type?.toLowerCase() === "video" &&
                    currentLesson.video_url ? (
                      <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
                        <video
                          controls
                          className="w-full h-full"
                          src={currentLesson.video_url}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : null}

                    {isQuizLesson && (
                      <div className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm mb-6 not-prose">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                          Quiz Questions
                        </h3>

                        {currentQuizSubmission?.submission && (
                          <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                              Your grade:{" "}
                              {currentQuizSubmission.submission.grade ?? 0}
                              {currentQuizSubmission.quizGrade !== null
                                ? ` / ${currentQuizSubmission.quizGrade}`
                                : ""}
                            </p>
                          </div>
                        )}

                        {isLoadingQuizQuestions || isLoadingQuizSubmission ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Loading quiz data...
                          </div>
                        ) : null}

                        {!isLoadingQuizQuestions &&
                        !isLoadingQuizSubmission &&
                        quizQuestions.length === 0 ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            No quiz questions were found for this lesson.
                          </p>
                        ) : !isLoadingQuizQuestions &&
                          !isLoadingQuizSubmission ? (
                          <div className="space-y-6">
                            {quizQuestions.map((question, questionIndex) => {
                              const questionKey = question?.id || questionIndex;
                              const questionType = String(
                                question?.question_type || "",
                              ).toLowerCase();
                              const isEssayQuestion = questionType === "essay";
                              const submittedAnswer = question?.id
                                ? submittedAnswersByQuestionId[question.id]
                                : null;
                              const selectedOptionId =
                                submittedAnswer?.mcq_tf_answers
                                  ?.selected_option_id;
                              const selectedOption = Array.isArray(
                                question?.options,
                              )
                                ? question.options.find(
                                    (option) =>
                                      typeof option !== "string" &&
                                      option?.id === selectedOptionId,
                                  )
                                : null;
                              const correctOption = Array.isArray(
                                question?.options,
                              )
                                ? question.options.find(
                                    (option) =>
                                      typeof option !== "string" &&
                                      option?.is_correct,
                                  )
                                : null;
                              const questionText =
                                question?.question_text ||
                                question?.question ||
                                question?.title ||
                                question?.text ||
                                `Question ${questionIndex + 1}`;
                              const options = Array.isArray(question?.options)
                                ? question.options
                                : [];

                              return (
                                <div
                                  key={question?.id || questionIndex}
                                  className="p-4 rounded-lg border border-gray-200 dark:border-dark-700"
                                >
                                  <p className="font-medium text-gray-900 dark:text-white mb-3">
                                    {questionIndex + 1}. {questionText}
                                  </p>

                                  {!isEssayQuestion && options.length > 0 ? (
                                    <div className="space-y-2">
                                      {options.map((option, optionIndex) => {
                                        const optionValue =
                                          typeof option === "string"
                                            ? option
                                            : option?.id ||
                                              option?.value ||
                                              option?.option_value ||
                                              option?.option_text ||
                                              option?.text ||
                                              option?.label ||
                                              `Option ${optionIndex + 1}`;
                                        const optionLabel =
                                          typeof option === "string"
                                            ? option
                                            : option?.option_text ||
                                              option?.text ||
                                              option?.label ||
                                              option?.value ||
                                              option?.option_value ||
                                              `Option ${optionIndex + 1}`;

                                        return (
                                          <label
                                            key={`${questionKey}-${optionIndex}`}
                                            className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
                                          >
                                            <input
                                              type="radio"
                                              name={`quiz-question-${questionKey}`}
                                              checked={
                                                hasSubmittedCurrentQuiz
                                                  ? optionValue ===
                                                    selectedOptionId
                                                  : quizAnswers[questionKey] ===
                                                    optionValue
                                              }
                                              disabled={hasSubmittedCurrentQuiz}
                                              onChange={() =>
                                                setQuizAnswers((prev) => ({
                                                  ...prev,
                                                  [questionKey]: optionValue,
                                                }))
                                              }
                                            />
                                            <span>{optionLabel}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <textarea
                                      value={
                                        hasSubmittedCurrentQuiz
                                          ? submittedAnswer?.essay_answers
                                              ?.answer_text || ""
                                          : quizAnswers[questionKey] || ""
                                      }
                                      disabled={hasSubmittedCurrentQuiz}
                                      onChange={(e) =>
                                        setQuizAnswers((prev) => ({
                                          ...prev,
                                          [questionKey]: e.target.value,
                                        }))
                                      }
                                      rows={3}
                                      placeholder="Type your answer"
                                      className="w-full p-3 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100"
                                    />
                                  )}

                                  {hasSubmittedCurrentQuiz && (
                                    <div className="mt-3 text-sm">
                                      {submittedAnswer?.mcq_tf_answers && (
                                        <p
                                          className={`font-medium ${
                                            submittedAnswer.mcq_tf_answers
                                              ?.isCorrect
                                              ? "text-green-700 dark:text-green-300"
                                              : "text-red-700 dark:text-red-300"
                                          }`}
                                        >
                                          {submittedAnswer.mcq_tf_answers
                                            ?.isCorrect
                                            ? "Correct"
                                            : "Incorrect"}
                                          {selectedOption?.option_text
                                            ? ` • Your answer: ${selectedOption.option_text}`
                                            : ""}
                                          {correctOption?.option_text
                                            ? ` • Correct answer: ${correctOption.option_text}`
                                            : ""}
                                        </p>
                                      )}

                                      {submittedAnswer?.essay_answers && (
                                        <p className="text-gray-700 dark:text-gray-300">
                                          Score:{" "}
                                          {submittedAnswer.essay_answers
                                            .ai_score ?? 0}
                                          {question?.question_grade
                                            ? ` / ${question.question_grade}`
                                            : ""}
                                          {submittedAnswer.essay_answers
                                            .ai_feedback
                                            ? ` • Feedback: ${submittedAnswer.essay_answers.ai_feedback}`
                                            : ""}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {currentLesson.content &&
                      (!isQuizLesson ||
                        isLikelyHtml(currentLesson.content)) && (
                        <div
                          className="bg-white dark:bg-dark-900 rounded-xl p-6 shadow-sm"
                          dangerouslySetInnerHTML={{
                            __html: currentLesson.content,
                          }}
                        />
                      )}

                    {/* Resources */}
                    {currentLesson.resources &&
                      currentLesson.resources.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-xl">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Resources
                          </h3>
                          <ul className="space-y-2">
                            {currentLesson.resources.map((resource, index) => (
                              <li key={index}>
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                  {resource.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="bg-white dark:bg-dark-900 border-t border-gray-200 dark:border-dark-700 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                  {/* Previous Button */}
                  <button
                    onClick={() => {
                      const currentIndex = normalizedLessons.findIndex(
                        (l) => l.id === currentLesson.id,
                      );
                      const prevLesson = normalizedLessons[currentIndex - 1];
                      if (prevLesson && isLessonUnlocked(prevLesson._order)) {
                        setCurrentLesson(prevLesson);
                      }
                    }}
                    disabled={
                      normalizedLessons.findIndex(
                        (l) => l.id === currentLesson.id,
                      ) <= 0
                    }
                    className="px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Complete Button */}
                  {!isLessonCompleted(currentLesson._order || 1) && (
                    <button
                      onClick={
                        isQuizLesson ? handleQuizSubmit : handleCompleteLesson
                      }
                      disabled={
                        isCompletingLesson ||
                        (isQuizLesson &&
                          (isLoadingQuizQuestions ||
                            isLoadingQuizSubmission ||
                            hasSubmittedCurrentQuiz ||
                            !areAllQuizQuestionsAnswered))
                      }
                      className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {isCompletingLesson ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Completing...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>
                            {isQuizLesson
                              ? "Submit Quiz & Continue"
                              : "Complete & Continue"}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() => {
                      const currentIndex = normalizedLessons.findIndex(
                        (l) => l.id === currentLesson.id,
                      );
                      const nextLesson = normalizedLessons[currentIndex + 1];
                      if (nextLesson && isLessonUnlocked(nextLesson._order)) {
                        setCurrentLesson(nextLesson);
                      }
                    }}
                    disabled={(() => {
                      const currentIndex = normalizedLessons.findIndex(
                        (l) => l.id === currentLesson.id,
                      );
                      const nextLesson = normalizedLessons[currentIndex + 1];
                      return (
                        !nextLesson || !isLessonUnlocked(nextLesson._order)
                      );
                    })()}
                    className="px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Lesson Selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a lesson from the sidebar to begin learning
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default CourseLearning;
