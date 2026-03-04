import api from "./api";
import { DEFAULT_PAGE_LIMIT } from "../constants/pagination";

export const courseService = {
  /**
   * Get all courses with optional filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 12)
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
    const response = await api.post(`/enrollments/course/${courseId}`);
    return response.data.data;
  },

  getMyCourses: async () => {
    const enrollmentsResponse = await api.get("/enrollments");

    return enrollmentsResponse.data.data;
  },

  // Additional helper methods for specific queries
  getCoursesByTeacher: async (
    teacherId,
    page = 1,
    limit = DEFAULT_PAGE_LIMIT,
  ) => {
    const response = await api.get("/courses", {
      params: { teacher_id: teacherId, page, limit },
    });
    return response.data.data;
  },

  getCoursesByCategory: async (
    categoryId,
    page = 1,
    limit = DEFAULT_PAGE_LIMIT,
  ) => {
    const response = await api.get("/courses", {
      params: { category_id: categoryId, page, limit },
    });
    return response.data.data;
  },

  searchCourses: async (
    searchTerm,
    page = 1,
    limit = DEFAULT_PAGE_LIMIT,
  ) => {
    const response = await api.get("/courses", {
      params: { title_description_search: searchTerm, page, limit },
    });
    return response.data.data;
  },
};
