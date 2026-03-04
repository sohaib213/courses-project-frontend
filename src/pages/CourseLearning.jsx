import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../redux/hooks";
import { checkAuth } from "../redux/slices/authSlice";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  BookOpen,
  PlayCircle,
  FileText,
  Code,
  HelpCircle,
  Award,
  Download,
  X,
  MessageSquare,
  Send,
  Trash2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "../services/api";
import toast from "react-hot-toast";
import defaultCoursePhoto from "../../src/assets/default_course_photo.jpg";
import defaultUserPhoto from "../../src/assets/default_user_photo.jpg";

const CHAT_EVENTS = {
  JOIN_COURSE: "join-course",
  LEAVE_COURSE: "leave-course",
  COURSE_MESSAGE: "course-message",
  NEW_MESSAGE: "new-message",
  UPDATE_MESSAGE: "update-message",
  MESSAGE_UPDATED: "message-updated",
  MESSAGE_DELETED: "message-deleted",
  ERROR: "chat-error",
  JOINED_COURSE: "joined-course",
};

const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const formatChatTime = (rawValue) => {
  const formatTime = (date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!rawValue) return formatTime(new Date());
  const date = new Date(rawValue);
  if (!Number.isNaN(date.getTime())) return formatTime(date);

  const rawText = String(rawValue).trim();
  const withAmPm = rawText.match(/^(\d{1,2}:\d{2})(?::\d{2})?\s*([AaPp][Mm])$/);
  if (withAmPm) {
    return `${withAmPm[1]} ${withAmPm[2].toUpperCase()}`;
  }

  const hourMinuteOnly = rawText.match(/^(\d{1,2}:\d{2})(?::\d{2})?$/);
  if (hourMinuteOnly) return hourMinuteOnly[1];

  return rawText;
};

const getQuizDraftStorageKey = (courseId, lessonId) =>
  `course-learning-quiz-draft:${courseId}:${lessonId}`;

const CourseLearning = () => {
  const dispatch = useAppDispatch();
  const authUser = useSelector((state) => state.auth?.user);
  const currentUserId = authUser?.id || "";
  const currentUsername = String(
    authUser?.username || authUser?.name || authUser?.email || "",
  ).trim();

  const { courseId: routeCourseId, id: routeId } = useParams();
  const courseId = routeCourseId || routeId;
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompletingLesson, setIsCompletingLesson] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizQuestionsByLessonId, setQuizQuestionsByLessonId] = useState({});
  const [isLoadingQuizQuestions, setIsLoadingQuizQuestions] = useState(false);
  const [quizSubmissionByLessonId, setQuizSubmissionByLessonId] = useState({});
  const [isLoadingQuizSubmission, setIsLoadingQuizSubmission] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [isChatConnecting, setIsChatConnecting] = useState(false);
  const [chatConnectionError, setChatConnectionError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageContent, setEditingMessageContent] = useState("");
  const [updatingMessageId, setUpdatingMessageId] = useState(null);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const socketRef = useRef(null);
  const chatMessagesContainerRef = useRef(null);
  const chatInputRef = useRef(null);
  const socketBaseUrl = useMemo(() => getSocketBaseUrl(), []);
  const teacher = course?.teacher || course?.instructor || null;
  const teacherId = teacher?.id || teacher?._id || null;
  const isCourseTeacher =
    Boolean(teacherId) &&
    Boolean(currentUserId) &&
    String(teacherId) === String(currentUserId);

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
    if (!currentLesson?.id || !isQuizLesson) {
      setQuizAnswers({});
      return;
    }

    const storageKey = getQuizDraftStorageKey(courseId, currentLesson.id);
    const storedDraft = localStorage.getItem(storageKey);

    if (!storedDraft) {
      setQuizAnswers({});
      return;
    }

    try {
      const parsedDraft = JSON.parse(storedDraft);
      setQuizAnswers(
        parsedDraft && typeof parsedDraft === "object" ? parsedDraft : {},
      );
    } catch {
      setQuizAnswers({});
    }
  }, [courseId, currentLesson?.id, isQuizLesson]);

  useEffect(() => {
    if (!currentLesson?.id || !isQuizLesson) return;
    if (hasSubmittedCurrentQuiz) return;

    const storageKey = getQuizDraftStorageKey(courseId, currentLesson.id);
    localStorage.setItem(storageKey, JSON.stringify(quizAnswers));
  }, [
    courseId,
    currentLesson?.id,
    isQuizLesson,
    quizAnswers,
    hasSubmittedCurrentQuiz,
  ]);

  useEffect(() => {
    if (!currentLesson?.id || !isQuizLesson || !hasSubmittedCurrentQuiz) return;
    const storageKey = getQuizDraftStorageKey(courseId, currentLesson.id);
    localStorage.removeItem(storageKey);
  }, [courseId, currentLesson?.id, isQuizLesson, hasSubmittedCurrentQuiz]);

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

  const fetchCourseData = useCallback(
    async (options = {}) => {
      const { selectCurrentLesson = false } = options;

      try {
        setIsLoading(true);

        const courseResponse = await api.get(`/courses/${courseId}`);
        const courseData = courseResponse.data.data || courseResponse.data;
        setCourse(courseData);
        console.log("teacher = ", courseData.teacher);
        const courseTeacher = courseData?.teacher;
        const courseTeacherId = courseTeacher?.id;
        const canAccessAsTeacher =
          Boolean(courseTeacherId) &&
          Boolean(currentUserId) &&
          String(courseTeacherId) === String(currentUserId);

        console.log("can access = ", canAccessAsTeacher);
        let enrollments = [];
        try {
          const enrollmentResponse = await api.get(`/enrollments`);
          enrollments =
            enrollmentResponse.data.data || enrollmentResponse.data || [];
        } catch (error) {
          if (!canAccessAsTeacher) {
            throw error;
          }
        }
        const userEnrollment = (
          Array.isArray(enrollments) ? enrollments : []
        ).find(
          (e) =>
            String(e.course_id) === String(courseId) ||
            String(e.courses?.id) === String(courseId),
        );

        if (!userEnrollment && !canAccessAsTeacher) {
          toast.error("You are not enrolled in this course");
          navigate(`/courses/${courseId}`);
          return;
        }

        setEnrollment(userEnrollment || null);

        const lessonsResponse = await api.get(`/lessons/course/${courseId}`);
        const lessonsData = lessonsResponse.data.data || lessonsResponse.data;
        const lessonsArray = Array.isArray(lessonsData)
          ? lessonsData
          : lessonsData?.lessons || [];
        setLessons(lessonsArray);

        const completedLessons = Number(
          userEnrollment?.current_lesson_order || 0,
        );
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
        if (selectCurrentLesson) {
          setCurrentLesson(nextLesson);
        } else {
          setCurrentLesson((previousLesson) => {
            if (!previousLesson?.id) return null;
            return (
              orderedLessons.find(
                (lesson) => String(lesson.id) === String(previousLesson.id),
              ) || null
            );
          });
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast.error("Failed to load course");
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, navigate, currentUserId],
  );

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  useEffect(() => {
    if (!courseId || (!enrollment?.id && !isCourseTeacher)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setChatConnectionError("Please login to use course chat.");
      return;
    }

    setIsChatConnecting(true);
    setChatConnectionError("");
    setChatMessages([]);

    const socket = io(socketBaseUrl, {
      transports: ["websocket", "polling"],
      auth: {
        token,
        bearerToken: `Bearer ${token}`,
      },
      query: {
        token,
        bearerToken: `Bearer ${token}`,
      },
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setIsChatConnected(true);
      setIsChatConnecting(false);
      socket.emit(CHAT_EVENTS.JOIN_COURSE, { courseId: String(courseId) });
    };

    const handleDisconnect = () => {
      setIsChatConnected(false);
    };

    const handleJoinedCourse = (payload) => {
      const previousMessages = Array.isArray(payload?.previousMessages)
        ? payload.previousMessages
        : [];

      const mappedMessages = previousMessages.map((message) => {
        const username = String(message?.username || "Student");
        const senderId = message?.sender_id || "";
        return {
          id: message?.id || `history-${Date.now()}-${Math.random()}`,
          content: String(message?.content || ""),
          senderId,
          username,
          time: formatChatTime(message?.time),
          isOwn: senderId === currentUserId,
        };
      });

      setChatMessages(mappedMessages);
    };

    const handleNewMessage = (payload) => {
      const message = payload?.message || {};
      const username = String(
        payload?.username || message?.username || "Student",
      );
      const senderId = message?.sender_id || "";
      const normalizedMessage = {
        id:
          message?.id ||
          `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        content: String(message?.content || ""),
        senderId,
        username,
        time: formatChatTime(message?.createdat || message?.createdAt),
        isOwn: senderId === currentUserId,
      };

      if (!normalizedMessage.content.trim()) return;
      setChatMessages((prev) => [...prev, normalizedMessage]);
    };

    const handleMessageDeleted = (payload) => {
      const { messageId } = payload;
      setChatMessages((prev) =>
        prev.filter((msg) => String(msg.id) !== String(messageId)),
      );
      setEditingMessageId((prev) =>
        String(prev) === String(messageId) ? null : prev,
      );
      setUpdatingMessageId((prev) =>
        String(prev) === String(messageId) ? null : prev,
      );
    };

    const handleMessageUpdated = (payload) => {
      const messageId = payload?.messageId;
      const content = String(payload?.content || "");
      if (!messageId || !content.trim()) return;

      setChatMessages((prev) =>
        prev.map((msg) =>
          String(msg.id) === String(messageId)
            ? {
                ...msg,
                content,
                isEdited: true,
              }
            : msg,
        ),
      );
      setEditingMessageId((prev) =>
        String(prev) === String(messageId) ? null : prev,
      );
      setUpdatingMessageId((prev) =>
        String(prev) === String(messageId) ? null : prev,
      );
      setEditingMessageContent("");
    };

    const handleChatError = (message) => {
      const errorMessage =
        typeof message === "string" ? message : "Chat connection failed";
      setChatConnectionError(errorMessage);
      setIsChatConnecting(false);
      setUpdatingMessageId(null);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(CHAT_EVENTS.JOINED_COURSE, handleJoinedCourse);
    socket.on(CHAT_EVENTS.NEW_MESSAGE, handleNewMessage);
    socket.on(CHAT_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
    socket.on(CHAT_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(CHAT_EVENTS.ERROR, handleChatError);

    return () => {
      socket.emit(CHAT_EVENTS.LEAVE_COURSE, { courseId: String(courseId) });
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(CHAT_EVENTS.JOINED_COURSE, handleJoinedCourse);
      socket.off(CHAT_EVENTS.NEW_MESSAGE, handleNewMessage);
      socket.off(CHAT_EVENTS.MESSAGE_UPDATED, handleMessageUpdated);
      socket.off(CHAT_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(CHAT_EVENTS.ERROR, handleChatError);
      socket.disconnect();
      socketRef.current = null;
      setIsChatConnected(false);
      setIsChatConnecting(false);
    };
  }, [courseId, currentUserId, enrollment?.id, isCourseTeacher, socketBaseUrl]);

  useEffect(() => {
    if (!isChatOpen) return;
    const container = chatMessagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages, isChatOpen]);

  const handleCompleteLesson = async ({ returnToOverview = true } = {}) => {
    if (!enrollment?.id) return;

    try {
      setIsCompletingLesson(true);
      await api.patch(`/enrollments/${enrollment.id}`);

      toast.success("Lesson completed! 🎉");

      if (returnToOverview) {
        setCurrentLesson(null);
      }
      await fetchCourseData({ selectCurrentLesson: false });
      dispatch(checkAuth());
    } catch (error) {
      toast.error("Failed to mark lesson as complete");
      console.log(error);
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
      const storageKey = getQuizDraftStorageKey(courseId, currentLesson.id);
      localStorage.setItem(storageKey, JSON.stringify(quizAnswers));

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
      localStorage.removeItem(storageKey);

      toast.success("Quiz submitted successfully");
      await handleCompleteLesson({ returnToOverview: false });
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

  const handleDeleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId);
      const socket = socketRef.current;
      if (socket && isChatConnected) {
        socket.emit(CHAT_EVENTS.MESSAGE_DELETED, {
          courseId: String(courseId),
          messageId,
        });
      } else {
        // Fallback for disconnected chat sessions.
        await api.delete(`/messages/${messageId}`);
        setChatMessages((prev) =>
          prev.filter((msg) => String(msg.id) !== String(messageId)),
        );
        setEditingMessageId((prev) =>
          String(prev) === String(messageId) ? null : prev,
        );
        setUpdatingMessageId((prev) =>
          String(prev) === String(messageId) ? null : prev,
        );
      }

      toast.success("Message deleted");
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessageId(null);
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

  const handleSendMessage = () => {
    const content = chatInput.trim();
    if (!content) return;

    const socket = socketRef.current;
    if (!socket || !isChatConnected) {
      toast.error("Chat is not connected yet");
      return;
    }

    socket.emit(CHAT_EVENTS.COURSE_MESSAGE, {
      courseId: String(courseId),
      content,
    });
    setChatInput("");

    if (chatInputRef.current) {
      chatInputRef.current.style.height = "42px";
    }
  };

  const handleStartEditMessage = (message) => {
    if (!message?.isOwn) return;
    setEditingMessageId(message.id);
    setEditingMessageContent(String(message.content || ""));
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageContent("");
    setUpdatingMessageId(null);
  };

  const handleUpdateMessage = () => {
    const messageId = editingMessageId;
    const content = editingMessageContent.trim();
    if (!messageId) return;
    if (!content) {
      toast.error("Message cannot be empty");
      return;
    }

    const socket = socketRef.current;
    if (!socket || !isChatConnected) {
      toast.error("Chat is not connected yet");
      return;
    }

    setUpdatingMessageId(messageId);
    socket.emit(CHAT_EVENTS.UPDATE_MESSAGE, {
      courseId: String(courseId),
      messageId,
      content,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 dark:border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  const progress = calculateProgress();
  const totalLessons = normalizedLessons.length;
  const completedLessons = getCompletedLessonsCount();
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);
  const currentLessonNumber = currentLesson?._order || 1;
  const isTeacherViewOnly = isCourseTeacher && !enrollment;
  const courseThumbnail = course?.thumbnail_url || defaultCoursePhoto;
  const teacherName =
    teacher?.username || teacher?.name || teacher?.email || "Instructor";
  const teacherImage =
    teacher?.image || teacher?.avatar || teacher?.photo_url || "";
  const teacherInitial = String(teacherName).charAt(0).toUpperCase() || "I";

  return (
    <div
      className={`min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-dark-950 flex flex-col ${
        isChatOpen ? "lg:pr-[24rem]" : ""
      }`}
    >
      {/* Top Header */}
      <div className="bg-white dark:bg-dark-900 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-20">
        <div className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="flex items-center gap-4 order-1">
            <Link
              to="/my-courses"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to My Courses</span>
            </Link>
          </div>

          <div className="order-3 sm:order-2 w-full sm:w-auto flex-1 min-w-0 sm:max-w-xl sm:mx-4">
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

          <div className="order-2 sm:order-3 ml-auto flex items-center gap-2 flex-shrink-0">
            {teacher && (
              <Link
                to={teacherId ? `/instructor/${teacherId}` : "#"}
                onClick={(event) => {
                  if (!teacherId) event.preventDefault();
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border max-w-[180px] sm:max-w-[220px] transition-colors ${
                  teacherId
                    ? "border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/70 hover:bg-gray-100 dark:hover:bg-dark-700/70"
                    : "border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/70 cursor-default"
                }`}
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  {teacherImage ? (
                    <img
                      src={teacherImage}
                      alt={`${teacherName} avatar`}
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = defaultUserPhoto;
                      }}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {teacherInitial}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] leading-none text-gray-500 dark:text-gray-400">
                    Instructor
                  </p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {teacherName}
                  </p>
                </div>
              </Link>
            )}

            <button
              onClick={() => setIsChatOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              aria-label={isChatOpen ? "Close chat" : "Open chat"}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {isChatOpen ? "Close Chat" : "Chat"}
              </span>
            </button>

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
      </div>

      {!isTeacherViewOnly && (
        <div className="px-4 py-3 bg-white/80 dark:bg-dark-900/80 border-b border-gray-200 dark:border-dark-700 backdrop-blur-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Current lesson
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentLessonNumber} / {Math.max(totalLessons, 1)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                {completedLessons} lessons
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Remaining
              </p>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {remainingLessons} lessons
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isTeacherViewOnly ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 p-6 md:p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Instructor View
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Lesson content is hidden when you enter as the course
                    instructor. Use chat to communicate with students or open
                    your dashboard to manage lessons.
                  </p>
                  <Link
                    to={`/teacher/courses/${courseId}/lessons`}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
                  >
                    Manage Lessons
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : currentLesson ? (
            <>
              {/* Lesson Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 break-words">
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
                              Total mark:{" "}
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
                              const questionText =
                                question?.question_text ||
                                question?.question ||
                                question?.title ||
                                question?.text ||
                                `Question ${questionIndex + 1}`;
                              const submittedQuestion =
                                submittedAnswer?.questions;
                              const options = Array.isArray(question?.options)
                                ? question.options
                                : Array.isArray(submittedQuestion?.options)
                                  ? submittedQuestion.options
                                  : [];
                              const normalizeValue = (value) =>
                                String(value ?? "")
                                  .trim()
                                  .toLowerCase();
                              const correctCandidates = [
                                question?.correct_option_id,
                                question?.correctOptionId,
                                question?.correct_option,
                                question?.correctOption,
                                question?.correct_answer,
                                question?.correctAnswer,
                                question?.answer,
                                question?.right_answer,
                                question?.rightAnswer,
                                submittedQuestion?.correct_option_id,
                                submittedQuestion?.correctOptionId,
                                submittedQuestion?.correct_option,
                                submittedQuestion?.correctOption,
                                submittedQuestion?.correct_answer,
                                submittedQuestion?.correctAnswer,
                                submittedQuestion?.answer,
                                submittedQuestion?.right_answer,
                                submittedQuestion?.rightAnswer,
                                submittedAnswer?.mcq_tf_answers
                                  ?.correct_option_id,
                                submittedAnswer?.mcq_tf_answers
                                  ?.correctOptionId,
                                submittedAnswer?.mcq_tf_answers
                                  ?.correct_option_text,
                                submittedAnswer?.mcq_tf_answers
                                  ?.correctOptionText,
                                submittedAnswer?.mcq_tf_answers?.correct_answer,
                                submittedAnswer?.mcq_tf_answers?.correctAnswer,
                              ]
                                .map((value) => normalizeValue(value))
                                .filter(Boolean);
                              const configuredQuestionGrade = Number(
                                question?.question_grade ?? 1,
                              );
                              const questionMaxGrade =
                                Number.isFinite(configuredQuestionGrade) &&
                                configuredQuestionGrade > 0
                                  ? configuredQuestionGrade
                                  : 1;
                              const isCorrectMcqTf = Boolean(
                                submittedAnswer?.mcq_tf_answers?.isCorrect,
                              );
                              const essayScoreValue = Number(
                                submittedAnswer?.essay_answers?.ai_score ?? 0,
                              );
                              const questionScore = hasSubmittedCurrentQuiz
                                ? isEssayQuestion
                                  ? Number.isFinite(essayScoreValue)
                                    ? essayScoreValue
                                    : 0
                                  : isCorrectMcqTf
                                    ? questionMaxGrade
                                    : 0
                                : null;

                              return (
                                <div
                                  key={question?.id || questionIndex}
                                  className="p-4 rounded-lg border border-gray-200 dark:border-dark-700"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3">
                                    <p className="font-medium text-gray-900 dark:text-white break-words">
                                      {questionIndex + 1}. {questionText}
                                    </p>
                                    {hasSubmittedCurrentQuiz && (
                                      <span className="w-fit px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                        {questionScore ?? 0} /{" "}
                                        {questionMaxGrade}
                                      </span>
                                    )}
                                  </div>

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
                                        const optionId =
                                          typeof option === "string"
                                            ? option
                                            : option?.id || optionValue;
                                        const optionMatchKeys = [
                                          normalizeValue(optionId),
                                          normalizeValue(optionValue),
                                          normalizeValue(optionLabel),
                                          normalizeValue(optionIndex),
                                          normalizeValue(optionIndex + 1),
                                          normalizeValue(option?.value),
                                          normalizeValue(option?.option_value),
                                          normalizeValue(option?.option_text),
                                          normalizeValue(option?.text),
                                          normalizeValue(option?.label),
                                        ].filter(Boolean);
                                        const isOptionCorrect = Boolean(
                                          (typeof option !== "string" &&
                                            (option?.is_correct ||
                                              option?.isCorrect ||
                                              option?.correct)) ||
                                          correctCandidates.some((candidate) =>
                                            optionMatchKeys.includes(candidate),
                                          ),
                                        );
                                        const normalizedSelectedOption =
                                          normalizeValue(selectedOptionId);
                                        const isSubmittedSelectedOption =
                                          hasSubmittedCurrentQuiz &&
                                          optionMatchKeys.includes(
                                            normalizedSelectedOption,
                                          );
                                        const isSelectedWrongOption =
                                          isSubmittedSelectedOption &&
                                          !isOptionCorrect;
                                        const isCorrectOptionToShow =
                                          hasSubmittedCurrentQuiz &&
                                          isOptionCorrect;

                                        return (
                                          <label
                                            key={`${questionKey}-${optionIndex}`}
                                            className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors min-w-0 ${
                                              isCorrectOptionToShow
                                                ? "bg-green-50 dark:bg-green-900/20"
                                                : isSelectedWrongOption
                                                  ? "bg-red-50 dark:bg-red-900/20"
                                                  : ""
                                            } ${hasSubmittedCurrentQuiz ? "cursor-default" : "cursor-pointer"} text-gray-700 dark:text-gray-300`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <input
                                                type="radio"
                                                name={`quiz-question-${questionKey}`}
                                                checked={
                                                  hasSubmittedCurrentQuiz
                                                    ? optionId ===
                                                      selectedOptionId
                                                    : quizAnswers[
                                                        questionKey
                                                      ] === optionValue
                                                }
                                                disabled={
                                                  hasSubmittedCurrentQuiz
                                                }
                                                onChange={() =>
                                                  setQuizAnswers((prev) => ({
                                                    ...prev,
                                                    [questionKey]: optionValue,
                                                  }))
                                                }
                                              />
                                              <span className="break-words">
                                                {optionLabel}
                                              </span>
                                            </div>
                                            {hasSubmittedCurrentQuiz &&
                                              (isCorrectOptionToShow ||
                                                isSubmittedSelectedOption) && (
                                                <span
                                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    isCorrectOptionToShow
                                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                                  }`}
                                                >
                                                  {isCorrectOptionToShow
                                                    ? "Correct Answer"
                                                    : "Your Answer"}
                                                </span>
                                              )}
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
                                            : "Wrong"}
                                        </p>
                                      )}

                                      {submittedAnswer?.essay_answers && (
                                        <p className="text-gray-700 dark:text-gray-300 break-words">
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
                <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
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
                    className="px-4 sm:px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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
                      className="px-4 sm:px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium disabled:opacity-50 transition-all flex items-center gap-2"
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
                              ? "Submit Quiz"
                              : "Complete & Continue"}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {isQuizLesson && hasSubmittedCurrentQuiz && (
                    <button
                      onClick={() => {
                        setCurrentLesson(null);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="px-4 sm:px-6 py-3 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                    >
                      Course Page
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
                    className="px-4 sm:px-6 py-3 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-5xl mx-auto">
                <div className="rounded-2xl overflow-hidden bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 shadow-sm mb-6">
                  <div className="relative h-52 md:h-64">
                    <img
                      src={courseThumbnail}
                      alt={defaultCoursePhoto}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = defaultCoursePhoto;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
                      <p className="text-xs md:text-sm font-medium text-white/80 mb-2">
                        Ready to learn
                      </p>
                      <h2 className="text-2xl md:text-3xl font-bold line-clamp-2">
                        {course?.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-2xl p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                      Pick a lesson to start
                    </h3>
                    <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                      {totalLessons} total lessons
                    </span>
                  </div>

                  {normalizedLessons.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      No lessons are available in this course yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {normalizedLessons.map((lesson) => {
                        const lessonOrder = lesson._order;
                        const isUnlocked = isLessonUnlocked(lessonOrder);
                        const isCompleted = isLessonCompleted(lessonOrder);

                        return (
                          <div
                            key={lesson.id}
                            className={`rounded-xl border p-4 ${
                              isUnlocked
                                ? "border-gray-200 dark:border-dark-700"
                                : "border-gray-100 dark:border-dark-800 opacity-60"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Lesson {lessonOrder}
                                </p>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {lesson.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                  {getLessonIcon(lesson.content_type)}
                                  <span className="capitalize">
                                    {lesson.content_type || "lesson"}
                                  </span>
                                  {lesson.duration ? (
                                    <span>• {lesson.duration} min</span>
                                  ) : null}
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  isUnlocked && setCurrentLesson(lesson)
                                }
                                disabled={!isUnlocked}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                                  isUnlocked
                                    ? "bg-primary-600 text-white hover:bg-primary-700"
                                    : "bg-gray-100 dark:bg-dark-800 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                {isCompleted ? "Review Lesson" : "Start Lesson"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Improved Chat Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-dark-900 border-l border-gray-200 dark:border-dark-700 shadow-2xl transition-transform duration-300 ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-700 bg-gradient-to-r from-primary-600 to-purple-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <MessageSquare className="h-6 w-6 text-white" />
                  {isChatConnected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">Course Chat</h3>
                  <p className="text-xs text-white/80">
                    {isChatConnecting
                      ? "Connecting..."
                      : isChatConnected
                        ? `${chatMessages.length} messages`
                        : "Disconnected"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Connection Error */}
          {chatConnectionError ? (
            <div className="m-4 p-3 text-sm rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{chatConnectionError}</span>
            </div>
          ) : null}

          {/* Messages */}
          <div
            ref={chatMessagesContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50 dark:bg-dark-950"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-[200px]">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                    No messages yet
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Start the conversation with your classmates
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((message, index) => {
                const showAvatar =
                  index === 0 ||
                  chatMessages[index - 1].username !== message.username;
                const isTeacherMessage =
                  Boolean(teacherId) &&
                  Boolean(message?.senderId) &&
                  String(message.senderId) === String(teacherId);
                const canEditMessage = message.isOwn;
                const canDeleteMessage = message.isOwn || isCourseTeacher;
                const isEditingThisMessage =
                  String(editingMessageId) === String(message.id);
                const isUpdatingThisMessage =
                  String(updatingMessageId) === String(message.id);

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.isOwn ? "justify-end" : "justify-start"} group`}
                  >
                    {/* Avatar (for others' messages) */}
                    {!message.isOwn && (
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                              isTeacherMessage
                                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                : "bg-gradient-to-br from-gray-400 to-gray-600"
                            }`}
                          >
                            {message.username?.charAt(0).toUpperCase() || "?"}
                          </div>
                        ) : (
                          <div className="w-8"></div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] ${message.isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      {/* Username (show for others or when avatar shows) */}
                      {(!message.isOwn || showAvatar) && (
                        <div
                          className={`text-xs font-semibold px-1 ${
                            message.isOwn
                              ? "text-primary-700 dark:text-primary-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span>{message.isOwn ? "You" : message.username}</span>
                          {isTeacherMessage && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                              Teacher
                            </span>
                          )}
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="relative group/message">
                        <div
                          className={`rounded-2xl px-4 py-2 shadow-sm ${
                            message.isOwn
                              ? "bg-gradient-to-br from-primary-600 to-purple-600 text-white rounded-tr-sm"
                              : "bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-dark-700 rounded-tl-sm"
                          }`}
                        >
                          {canEditMessage && isEditingThisMessage ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingMessageContent}
                                onChange={(event) =>
                                  setEditingMessageContent(event.target.value)
                                }
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-white/90 text-gray-900 text-sm border border-white/60 focus:outline-none"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={handleCancelEditMessage}
                                  disabled={isUpdatingThisMessage}
                                  className="px-2.5 py-1 text-xs rounded-md bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleUpdateMessage}
                                  disabled={
                                    isUpdatingThisMessage ||
                                    !editingMessageContent.trim()
                                  }
                                  className="px-2.5 py-1 text-xs rounded-md bg-white text-primary-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                  {isUpdatingThisMessage ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                          )}
                          <p
                            className={`text-[10px] mt-1 ${
                              message.isOwn
                                ? "text-white/70"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {message.time}
                            {message.isEdited ? " • edited" : ""}
                          </p>
                        </div>

                        {/* Message Actions (only for own messages) */}
                        {(canEditMessage || canDeleteMessage) &&
                          !isEditingThisMessage && (
                          <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                            {canEditMessage && (
                              <button
                                onClick={() => handleStartEditMessage(message)}
                                className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                title="Edit message"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {canDeleteMessage && (
                              <button
                                onClick={() => setShowDeleteConfirm(message.id)}
                                className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                                title="Delete message"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Avatar (for own messages) */}
                    {message.isOwn && (
                      <div className="flex-shrink-0">
                        {showAvatar ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            {currentUsername?.charAt(0).toUpperCase() || "Y"}
                          </div>
                        ) : (
                          <div className="w-8"></div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  style={{
                    minHeight: "42px",
                    maxHeight: "120px",
                  }}
                  disabled={!isChatConnected}
                  onInput={(e) => {
                    e.target.style.height = "42px";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 px-1">
                  {isChatConnected
                    ? "Press Enter to send, Shift+Enter for new line"
                    : "Connecting..."}
                </p>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!isChatConnected || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none flex items-center gap-2"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  Send
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Delete Message?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingMessageId}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(showDeleteConfirm)}
                disabled={deletingMessageId}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingMessageId === showDeleteConfirm ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isChatOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default CourseLearning;
