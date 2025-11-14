// API functions for communicating with the backend
import { BASE_URL } from "./config";
import { Platform } from 'react-native';

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

  // For JSON requests - always stringify objects and set Content-Type
  let requestBody = options.body;
  console.log('authenticatedFetch: options.body type:', typeof options.body, 'value:', options.body);
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(options.body);
    console.log('authenticatedFetch: Stringified body:', requestBody);
  } else {
    console.log('authenticatedFetch: Body is NOT an object, skipping stringify. Type:', typeof options.body);
  }

  const { body: _ignoredBody, headers: optionsHeaders, ...restOptions } = options;
  // Merge headers: restOptions headers first, then our headers (our headers win)
  const mergedHeaders = {
    ...(optionsHeaders || {}),
    ...headers,
  };
  console.log('authenticatedFetch: Final headers:', mergedHeaders);
  console.log('authenticatedFetch: Final body type:', typeof requestBody, 'value:', requestBody);
  // Explicitly construct fetch options - only include what we need
  const fetchOptions = {
    method: options.method || 'GET',
    headers: mergedHeaders,
  };
  // Only add body for POST/PUT/PATCH requests
  if (requestBody && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
    fetchOptions.body = requestBody;
  }
  const response = await fetch(url, fetchOptions);

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
      console.error('authenticatedFetch: Error response data:', JSON.stringify(errorData, null, 2));
      if (errorData.detail) {
        // Handle both string and array of validation errors
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
          console.error('authenticatedFetch: Validation errors:', errorMessage);
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
      console.error('authenticatedFetch: Failed to parse error response:', e);
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

// Receipt scanning
export async function scanReceipt(imageBase64, language = 'en') {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please login again.');
  }
  
  // Send base64 as JSON for cross-platform compatibility
  const response = await fetch(`${BASE_URL}/receipts/scan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
      language: language
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to scan receipt' }));
    throw new Error(error.detail || 'Failed to scan receipt');
  }
  
  return await response.json();
}

// Export functions
export async function exportData(startDate, endDate, format) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please login again.');
  }
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  const url = `${BASE_URL}/export/${format}?start_date=${startDateStr}&end_date=${endDateStr}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Export failed' }));
    throw new Error(error.detail || 'Export failed');
  }
  
  // Get filename from Content-Disposition header or generate one
  const contentDisposition = response.headers.get('Content-Disposition');
  let filename = `export_${startDateStr}_to_${endDateStr}.${format}`;
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  // Handle download based on platform
  if (Platform.OS === 'web') {
    // Web: Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true, filename };
  } else {
    // Mobile: Save to device (would need expo-file-system or similar)
    // For now, return the blob data
    const blob = await response.blob();
    return { success: true, filename, blob };
  }
}
