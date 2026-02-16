import api from "./api";

export const courseService = {
  /**
   * Get all courses with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.teacher_id - Filter by teacher ID
   * @param {string} params.category_id - Filter by category ID
   * @param {string} params.title_description_search - Search in title and description
   * @returns {Promise} Course list
   */
  getAllCourses: async (params = {}) => {
    const response = await api.get("/courses", { params });
    return response.data.data;
  },

  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post("/courses", courseData);
    return response.data.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await api.patch(`/courses/${id}`, courseData);
    return response.data.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data.data;
  },

  enrollInCourse: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data.data;
  },

  getMyCourses: async () => {
    const enrollmentsResponse = await api.get("/enrollments");
    const enrollments = Array.isArray(enrollmentsResponse.data?.data)
      ? enrollmentsResponse.data.data
      : [];

    const courses = await Promise.all(
      enrollments
        .filter((enrollment) => enrollment?.course_id)
        .map(async (enrollment) => {
          const courseResponse = await api.get(`/courses/${enrollment.course_id}`);
          const course = courseResponse.data?.data;

          return {
            ...course,
            enrollment,
          };
        }),
    );

    return courses.filter((course) => course?.id);
  },

  // Additional helper methods for specific queries
  getCoursesByTeacher: async (teacherId, page = 1, limit = 10) => {
    const response = await api.get("/courses", {
      params: { teacher_id: teacherId, page, limit },
    });
    return response.data.data;
  },

  getCoursesByCategory: async (categoryId, page = 1, limit = 10) => {
    const response = await api.get("/courses", {
      params: { category_id: categoryId, page, limit },
    });
    return response.data.data;
  },

  searchCourses: async (searchTerm, page = 1, limit = 10) => {
    const response = await api.get("/courses", {
      params: { title_description_search: searchTerm, page, limit },
    });
    return response.data.data;
  },
};
