import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Pressable, Platform, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getCurrentMonthStats, getRecentExpenses, getMonthlyStats } from '../api';
import { useCurrency } from '../src/CurrencyProvider';
import { useLanguage } from '../src/LanguageProvider';
import { useAuth } from '../src/AuthContext';
import MultiBarChart from '../src/MultiBarChart';
import { colors } from '../src/colors';

// Map English category names to translation keys
const CATEGORY_NAME_TO_KEY = {
  'Groceries': 'category.groceries',
  'Utilities': 'category.utilities',
  'Transportation': 'category.transportation',
  'Housing': 'category.housing',
  'Healthcare': 'category.healthcare',
  'Education': 'category.education',
  'Entertainment': 'category.entertainment',
  'Dining Out': 'category.diningOut',
  'Clothing': 'category.clothing',
  'Personal Care': 'category.personalCare',
  'Gifts & Donations': 'category.giftsDonations',
  'Travel': 'category.travel',
  'Loans & Debt Payments': 'category.loansDebt',
  'Bank Fees & Overdrafts': 'category.bankFees',
  'Insurance': 'category.insurance',
  'Taxes': 'category.taxes',
  'Other': 'category.other'
};

export default function DashboardScreen({ navigation }) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading: authLoading, deleteAccount, logout } = useAuth();
  
  const translateCategory = (categoryName) => {
    if (!categoryName) return '';
    const translationKey = CATEGORY_NAME_TO_KEY[categoryName];
    return translationKey ? t(translationKey) : categoryName;
  };
  const isFocused = useIsFocused();
  const [currentMonthStats, setCurrentMonthStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only load data if authenticated and not loading auth
    if (isFocused && isAuthenticated && !authLoading) {
      loadData();
    }
  }, [isFocused, isAuthenticated, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [currentMonth, recent, monthly] = await Promise.all([
        getCurrentMonthStats(),
        getRecentExpenses(),
        getMonthlyStats(),
      ]);

      console.log('Current month stats:', currentMonth);
      
      // Validate response structure
      if (currentMonth && !currentMonth.months) {
        console.warn('Unexpected API response format:', currentMonth);
      }

      setCurrentMonthStats(currentMonth);
      setRecentExpenses(recent);
      setMonthlyStats(monthly);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    // If it's already in YYYY-MM-DD format, display it exactly as stored in DB
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Just return it as-is - this is what's in the database
      return dateString;
    }
    // Fallback: try to parse and format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as-is if invalid
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Show loading if auth is still loading or data is loading
  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  // If not authenticated, don't show dashboard
  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('dashboard.error')}: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        {/* Current Month Total */}
        {currentMonthStats && currentMonthStats.current && (
          <Pressable
            style={({ pressed }) => {
              const isPressed = Boolean(pressed);
              return [
                styles.currentMonthContainer,
                isPressed === true ? styles.currentMonthContainerPressed : null,
              ].filter(Boolean);
            }}
            onPress={() => navigation.navigate('CategoryBreakdown', { month: currentMonthStats.current.month })}
          >
            {({ pressed }) => {
              const isPressed = Boolean(pressed);
              return (
              <>
                <Text style={styles.currentMonthLabel}>{t('dashboard.currentMonthTotal')}</Text>
                <Text style={styles.currentMonthTotal}>
                  {formatCurrency(currentMonthStats.current.total)}
                </Text>
                <Text style={styles.currentMonthDate}>
                  {currentMonthStats.current.month}
                </Text>
                <Text style={styles.tapHint}>{t('dashboard.tapForDetails')}</Text>
                {Platform.OS === 'web' && (
                  <View style={styles.clickIndicator}>
                    <Text style={styles.clickIndicatorText}>👆 Click to view breakdown</Text>
                  </View>
                )}
              </>
              );
            }}
          </Pressable>
        )}

        {/* Last 6 Months Chart */}
        {currentMonthStats && currentMonthStats.months && (
          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>{t('dashboard.last6Months')}</Text>
            <MultiBarChart
              months={currentMonthStats.months}
              formatValue={formatCurrency}
              onBarPress={(month) => navigation.navigate('CategoryBreakdown', { month })}
            />
          </View>
        )}

        {/* Add Expense Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>{t('button.addExpense')}</Text>
        </TouchableOpacity>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentExpenses')}</Text>
                  {recentExpenses.length === 0 ? (
                    <Text style={styles.emptyText}>{t('dashboard.noExpenses')}</Text>
                  ) : (
                    recentExpenses.map((expense) => (
                      <TouchableOpacity
                        key={expense.id}
                        style={styles.expenseItem}
                        onPress={() => navigation.navigate('EditExpense', { expenseId: expense.id, expense })}
                      >
                        <View style={styles.expenseLeft}>
                          <View style={styles.expenseTop}>
                            <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                            {expense.category && (
                              <Text style={styles.expenseCategory}>{translateCategory(expense.category)}</Text>
                            )}
                          </View>
                          <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                        </View>
                        {expense.description && (
                          <Text style={styles.expenseDescription}>{expense.description}</Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.monthlyTotals')}</Text>
          {monthlyStats.length === 0 ? (
            <Text style={styles.emptyText}>{t('dashboard.noMonthlyData')}</Text>
          ) : (
            monthlyStats.map((stat) => (
              <View key={stat.month} style={styles.monthlyItem}>
                <Text style={styles.monthlyMonth}>{stat.month}</Text>
                <Text style={styles.monthlyTotal}>{formatCurrency(stat.total)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === 'web' && {
      paddingVertical: 24,
    }),
  },
  content: {
    padding: 16,
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      marginHorizontal: 'auto',
      width: '100%',
      padding: 24,
    }),
  },
  currentMonthContainer: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'web' && {
      padding: 32,
      marginBottom: 24,
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  currentMonthContainerPressed: {
    backgroundColor: colors.primaryLight + '15', // 15% opacity
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  clickIndicator: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  clickIndicatorText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  currentMonthLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  currentMonthTotal: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  currentMonthDate: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  comparisonContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      padding: 14,
      maxWidth: 300,
      alignSelf: 'center',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      ':hover': {
        backgroundColor: colors.primaryDark,
        transform: 'translateY(-1px)',
      },
      ':active': {
        transform: 'scale(0.98)',
      },
    }),
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      padding: 20,
      marginBottom: 20,
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.textPrimary,
  },
  emptyText: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    padding: 16,
  },
  expenseItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  expenseLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    flex: 1,
  },
  expenseTop: {
    flex: 1,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  expenseDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  expenseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  monthlyItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyMonth: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  monthlyTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    padding: 16,
  },
});
