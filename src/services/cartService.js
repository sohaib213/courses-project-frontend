import api from "./api";

export const cartService = {
  getActiveCart: async () => {
    const response = await api.get("/carts/active");
    return response.data.data || response.data;
  },

  getActiveCartItems: async () => {
    const response = await api.get("/carts/active/items");
    return response.data.data || response.data;
  },

  addItem: async (courseId) => {
    const response = await api.post("/carts/item", { course_id: courseId });
    return response.data.data || response.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/carts/${itemId}`);
    return response.data.data || response.data;
  },

  pay: async () => {
    const response = await api.post("/carts/pay");
    return response.data.data || response.data;
  },

  getPayments: async () => {
    const response = await api.get("/carts/payments");
    return response.data.data || response.data;
  },

  getCartItemsByCartId: async (cartId) => {
    const response = await api.get(`/carts/${cartId}/items`);
    return response.data.data || response.data;
  },
};
