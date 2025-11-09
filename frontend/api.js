// API functions for communicating with the backend
import { BASE_URL } from "./config";

// Helper function to get auth token from AsyncStorage
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = {
    getItem: async () => null,
    removeItem: async () => {},
  };
}

async function getAuthToken() {
  try {
    if (!AsyncStorage) {
      console.warn('getAuthToken: AsyncStorage not available');
      return null;
    }
    console.log('getAuthToken: Retrieving token from AsyncStorage...');
    const token = await AsyncStorage.getItem('@auth_token').catch(err => {
      console.error('getAuthToken: Error reading token:', err);
      return null;
    });
    if (!token) {
      console.warn('getAuthToken: No auth token found in AsyncStorage');
    } else {
      console.log('getAuthToken: Token found, length:', token.length);
      console.log('getAuthToken: Token (first 30 chars):', token.substring(0, 30) + '...');
    }
    return token;
  } catch (e) {
    console.error('getAuthToken: Error getting auth token:', e);
    return null;
  }
}

// Helper function to make authenticated requests
async function authenticatedFetch(url, options = {}) {
  console.log('authenticatedFetch: Making request to:', url);
  const token = await getAuthToken();
  const headers = {
    ...options.headers,
  };

  if (!token) {
    console.error('authenticatedFetch: No auth token found for request to:', url);
    throw new Error('Not authenticated. Please login again.');
  }
  
  // Remove any whitespace from token
  const cleanToken = token.trim();
  headers['Authorization'] = `Bearer ${cleanToken}`;
  console.log('authenticatedFetch: Authorization header set, token length:', cleanToken.length);

  // Handle FormData (for login)
  if (options.body instanceof FormData) {
    // Don't set Content-Type for FormData, browser will set it with boundary
    const response = await fetch(url, {
      ...options,
      headers,
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }
    return response;
  }

  // For JSON requests
  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    console.error('authenticatedFetch: Request failed with status:', response.status);
    // Try to get more detailed error message
    let errorMessage = `Request failed: ${response.statusText}`;
    if (response.status === 401) {
      errorMessage = 'Unauthorized - Please login again';
      console.error('authenticatedFetch: 401 Unauthorized - token may be invalid or expired');
      // Clear invalid token from storage (but don't auto-reload)
      try {
        await Promise.all([
          AsyncStorage.removeItem('@auth_token'),
          AsyncStorage.removeItem('@auth_user'),
        ]);
        console.log('Cleared invalid token from storage');
      } catch (e) {
        console.error('Error clearing token:', e);
      }
    }
    try {
      const errorData = await response.json();
      console.error('authenticatedFetch: Error response data:', errorData);
      if (errorData.detail) {
        // Handle both string and array of validation errors
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  console.log('authenticatedFetch: Request successful');

  return response;
}

// Helper to normalize booleans in API responses
function normalizeBooleans(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(normalizeBooleans);
  }
  if (typeof obj === 'object') {
    const normalized = {};
    for (const key in obj) {
      const value = obj[key];
      if (value === 'true' || value === true) {
        normalized[key] = true;
      } else if (value === 'false' || value === false) {
        normalized[key] = false;
      } else if (typeof value === 'object') {
        normalized[key] = normalizeBooleans(value);
      } else {
        normalized[key] = value;
      }
    }
    return normalized;
  }
  return obj;
}

export async function getCurrentMonthStats() {
  const response = await authenticatedFetch(`${BASE_URL}/stats/current-month`);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function getRecentExpenses() {
  const response = await authenticatedFetch(`${BASE_URL}/expenses/recent`);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function getMonthlyStats() {
  const response = await authenticatedFetch(`${BASE_URL}/stats/by-month`);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function getCurrentMonthByCategory() {
  const response = await authenticatedFetch(`${BASE_URL}/stats/current-month-by-category`);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function getMonthByCategory(month) {
  const url = month 
    ? `${BASE_URL}/stats/month-by-category?month=${month}`
    : `${BASE_URL}/stats/month-by-category`;
  const response = await authenticatedFetch(url);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function createExpense(data) {
  console.log('createExpense: Sending data:', JSON.stringify(data));
  const response = await authenticatedFetch(`${BASE_URL}/expenses`, {
    method: "POST",
    body: data,
  });
  try {
    const result = await response.json();
    return normalizeBooleans(result);
  } catch (error) {
    console.error('createExpense: Error parsing JSON response:', error);
    throw new Error(error && error.message ? error.message : 'Failed to create expense');
  }
}

export async function getExpense(expenseId) {
  const response = await authenticatedFetch(`${BASE_URL}/expenses/${expenseId}`);
  const data = await response.json();
  return normalizeBooleans(data);
}

export async function updateExpense(expenseId, data) {
  const response = await authenticatedFetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: "PUT",
    body: data,
  });
  const result = await response.json();
  return normalizeBooleans(result);
}

export async function deleteExpense(expenseId) {
  const response = await authenticatedFetch(`${BASE_URL}/expenses/${expenseId}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function changePassword(currentPassword, newPassword) {
  const response = await authenticatedFetch(`${BASE_URL}/me/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to change password");
  }
  
  return await response.json();
}

export async function deleteAccount() {
  const response = await authenticatedFetch(`${BASE_URL}/me`, {
    method: "DELETE",
  });
  return await response.json();
}

// Income API functions
export async function getCurrentMonthIncomeStats() {
  const response = await authenticatedFetch(`${BASE_URL}/stats/income/current-month`);
  if (!response.ok) {
    throw new Error("Failed to fetch income stats");
  }
  return normalizeBooleans(await response.json());
}

export async function getRecentIncome() {
  const response = await authenticatedFetch(`${BASE_URL}/income/recent`);
  if (!response.ok) {
    throw new Error("Failed to fetch recent income");
  }
  return normalizeBooleans(await response.json());
}

export async function getIncomeByMonth() {
  const response = await authenticatedFetch(`${BASE_URL}/stats/income/by-month`);
  if (!response.ok) {
    throw new Error("Failed to fetch income by month");
  }
  return normalizeBooleans(await response.json());
}

export async function createIncome(data) {
  console.log('createIncome: Sending data:', JSON.stringify(data));
  const response = await authenticatedFetch(`${BASE_URL}/income`, {
    method: "POST",
    body: data,
  });
  try {
    const result = await response.json();
    return normalizeBooleans(result);
  } catch (error) {
    console.error('createIncome: Error parsing JSON response:', error);
    throw new Error(error && error.message ? error.message : 'Failed to create income');
  }
}

export async function getIncome(incomeId) {
  const response = await authenticatedFetch(`${BASE_URL}/income/${incomeId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch income");
  }
  return normalizeBooleans(await response.json());
}

export async function updateIncome(incomeId, data) {
  const response = await authenticatedFetch(`${BASE_URL}/income/${incomeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update income");
  }
  return normalizeBooleans(await response.json());
}

export async function deleteIncome(incomeId) {
  const response = await authenticatedFetch(`${BASE_URL}/income/${incomeId}`, {
    method: "DELETE",
  });
  return await response.json();
}

export async function getNetIncome(month = null) {
  const url = month 
    ? `${BASE_URL}/stats/net-income?month=${month}`
    : `${BASE_URL}/stats/net-income`;
  const response = await authenticatedFetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch net income");
  }
  return normalizeBooleans(await response.json());
}
