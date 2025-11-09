import React, { createContext, useContext, useState, useEffect } from 'react';
import { BASE_URL } from '../config';

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}

const AuthContext = createContext();

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@auth_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      console.log('Loading stored auth...');
      if (!AsyncStorage) {
        console.warn('AsyncStorage not available');
        setIsLoading(false);
        return;
      }
      
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY).catch(err => {
          console.error('Error reading token:', err);
          return null;
        }),
        AsyncStorage.getItem(USER_KEY).catch(err => {
          console.error('Error reading user:', err);
          return null;
        }),
      ]);
      
      console.log('Stored token found:', !!storedToken);
      console.log('Stored user found:', !!storedUser);
      
      if (storedToken && storedUser) {
        console.log('Restoring authentication...');
        try {
          const parsedUser = JSON.parse(storedUser);
          // Set token and user immediately so app can render
          setToken(storedToken);
          setUser(parsedUser);
          console.log('Authentication restored successfully');
        } catch (parseError) {
          console.error('Error parsing stored user data, clearing auth:', parseError);
          // Clear corrupted data
          try {
            await Promise.all([
              AsyncStorage.removeItem(TOKEN_KEY).catch(() => {}),
              AsyncStorage.removeItem(USER_KEY).catch(() => {}),
            ]);
          } catch (clearError) {
            console.error('Error clearing corrupted data:', clearError);
          }
        }
      } else {
        console.log('No stored auth found');
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
      console.log('Auth loading complete');
    }
  };

  const login = async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email); // OAuth2 uses 'username' field
      formData.append('password', password);

      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || 'Login failed';
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || 'Login failed';
          if (response.status === 401) {
            errorMessage = 'Incorrect email/username or password';
          } else if (response.status === 502 || response.status === 503) {
            errorMessage = 'Backend is starting up. Please wait a moment and try again.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received from server');
      }
      
      console.log('Storing token:', data.access_token.substring(0, 20) + '...');
      
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, data.access_token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      setToken(data.access_token);
      setUser(data.user);
      
      // Verify token was stored
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        console.error('Token was not stored correctly!');
      }
      
      return data;
    } catch (error) {
      // Improve error message for network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${BASE_URL}. Make sure the backend is running.`);
      }
      throw error;
    }
  };

  const signup = async (email, password, name, username = null) => {
    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name, username: username || null }),
      });

      if (!response.ok) {
        let errorMessage = 'Signup failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || 'Signup failed';
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || 'Signup failed';
          if (response.status === 400) {
            errorMessage = 'Invalid signup data. Please check your information.';
          } else if (response.status === 409) {
            errorMessage = 'Email already registered';
          } else if (response.status === 502 || response.status === 503) {
            errorMessage = 'Backend is starting up. Please wait a moment and try again.';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received from server');
      }
      
      console.log('Storing token:', data.access_token.substring(0, 20) + '...');
      
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, data.access_token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      setToken(data.access_token);
      setUser(data.user);
      
      // Verify token was stored
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        console.error('Token was not stored correctly!');
      }
      
      return data;
    } catch (error) {
      // Improve error message for network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error(`Cannot connect to backend at ${BASE_URL}. Make sure the backend is running.`);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      // Import here to avoid circular dependency
      const { deleteAccount: deleteAccountAPI } = await import('../api');
      await deleteAccountAPI();
      
      // Clear auth data
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const getAuthToken = () => token;

          return (
            <AuthContext.Provider
              value={{
                token,
                user,
                isLoading,
                login,
                signup,
                logout,
                deleteAccount,
                getAuthToken,
                isAuthenticated: !!token,
              }}
            >
              {children}
            </AuthContext.Provider>
          );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

