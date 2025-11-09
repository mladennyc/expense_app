import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  AsyncStorage = {
    getItem: async () => null,
    setItem: async () => {},
  };
}

const CurrencyContext = createContext();

const STORAGE_KEY = '@app_currency';

const currencies = {
  RSD: { symbol: 'RSD', name: 'Serbian Dinar', position: 'after' },
  USD: { symbol: '$', name: 'US Dollar', position: 'before' },
  EUR: { symbol: '€', name: 'Euro', position: 'before' },
  GBP: { symbol: '£', name: 'British Pound', position: 'before' },
  JPY: { symbol: '¥', name: 'Japanese Yen', position: 'before' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', position: 'before' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
  AUD: { symbol: 'A$', name: 'Australian Dollar', position: 'before' },
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('RSD'); // Default to RSD
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedCurrency();
  }, []);

  const loadSavedCurrency = async () => {
    try {
      if (!AsyncStorage) {
        setIsLoading(false);
        return;
      }
      const savedCurrency = await AsyncStorage.getItem(STORAGE_KEY).catch(err => {
        console.error('Error reading currency:', err);
        return null;
      });
      if (savedCurrency && currencies[savedCurrency]) {
        setCurrency(savedCurrency);
      }
    } catch (error) {
      console.error('Error loading saved currency:', error);
      // Continue with default currency (RSD)
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrency = async (newCurrency) => {
    if (currencies[newCurrency]) {
      setCurrency(newCurrency);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, newCurrency);
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    try {
      const currencyInfo = currencies[currency] || currencies.RSD;
      const formattedAmount = Number(amount || 0).toFixed(2);
      
      if (currencyInfo.position === 'before') {
        return `${currencyInfo.symbol}${formattedAmount}`;
      } else {
        return `${formattedAmount} ${currencyInfo.symbol}`;
      }
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${Number(amount || 0).toFixed(2)} RSD`;
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatCurrency, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

