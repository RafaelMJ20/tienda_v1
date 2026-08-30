export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Autenticación
export const authService = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }

    return data;
  },
};

// Categorías
export const categoryService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error("Error fetching categories");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`);
    if (!response.ok) throw new Error("Error fetching category");
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error creating category");
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Error updating category");
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting category");
    return response.json();
  },
};

// Productos
export const productService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.search) params.append("search", filters.search);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.order) params.append("order", filters.order);

    const response = await fetch(
      `${API_BASE_URL}/products?${params.toString()}`
    );
    if (!response.ok) throw new Error("Error fetching products");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error("Error fetching product");
    return response.json();
  },

  getLowStock: async () => {
    const response = await fetch(`${API_BASE_URL}/products/low-stock`);
    if (!response.ok) throw new Error("Error fetching low stock products");
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error creating product");
    }
    return response.json();
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error updating product");
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting product");
    return response.json();
  },
};

// Ventas
export const saleService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await fetch(
      `${API_BASE_URL}/sales?${params.toString()}`
    );
    if (!response.ok) throw new Error("Error fetching sales");
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`);
    if (!response.ok) throw new Error("Error fetching sale");
    return response.json();
  },

  getByDateRange: async (startDate, endDate) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });
    const response = await fetch(`${API_BASE_URL}/sales/range?${params.toString()}`);
    if (!response.ok) throw new Error("Error fetching sales by date range");
    return response.json();
  },

  getByPeriod: async (period, date) => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);

    const response = await fetch(
      `${API_BASE_URL}/sales/period/${period}?${params.toString()}`
    );
    if (!response.ok) throw new Error("Error fetching sales by period");
    return response.json();
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creating sale");
    }
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Error deleting sale");
    return response.json();
  },
};

// Créditos
export const creditService = {
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/credits`);
    if (!response.ok) throw new Error("Error fetching credit summary");
    return response.json();
  },

  getByCustomer: async (customerName) => {
    const response = await fetch(
      `${API_BASE_URL}/credits/${encodeURIComponent(customerName)}`
    );
    if (!response.ok) throw new Error("Error fetching credit details");
    return response.json();
  },

  createPayment: async (data) => {
    const response = await fetch(`${API_BASE_URL}/credits/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creating credit payment");
    }
    return response.json();
  },
};

// Reportes
export const reportService = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/dashboard`);
    if (!response.ok) throw new Error("Error fetching dashboard");
    return response.json();
  },

  getSalesReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/sales`);
    if (!response.ok) throw new Error("Error fetching sales report");
    return response.json();
  },

  getGainsReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/gains`);
    if (!response.ok) throw new Error("Error fetching gains report");
    return response.json();
  },

  getProductsReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/products`);
    if (!response.ok) throw new Error("Error fetching products report");
    return response.json();
  },

  getInventoryReport: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/inventory`);
    if (!response.ok) throw new Error("Error fetching inventory report");
    return response.json();
  },

  getDailyTrend: async (days = 30) => {
    const response = await fetch(`${API_BASE_URL}/reports/daily-trend?days=${days}`);
    if (!response.ok) throw new Error("Error fetching daily trend");
    return response.json();
  },

  getMonthlyTrend: async (months = 12) => {
    const response = await fetch(`${API_BASE_URL}/reports/monthly-trend?months=${months}`);
    if (!response.ok) throw new Error("Error fetching monthly trend");
    return response.json();
  },

  getProductSalesStats: async (period = "month", startDate = null, endDate = null, groupByDay = false) => {
    let url = `${API_BASE_URL}/reports/product-sales-stats?period=${period}`;
    if (startDate && endDate) {
      url += `&startDate=${startDate}&endDate=${endDate}`;
    }
    if (groupByDay) {
      url += `&groupByDay=true`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error fetching product sales stats");
    return response.json();
  },
};
