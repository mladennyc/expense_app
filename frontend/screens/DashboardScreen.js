import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { getCurrentMonthStats, getRecentExpenses, getMonthlyStats } from '../api';

export default function DashboardScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [currentMonthStats, setCurrentMonthStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [currentMonth, recent, monthly] = await Promise.all([
        getCurrentMonthStats(),
        getRecentExpenses(),
        getMonthlyStats(),
      ]);

      setCurrentMonthStats(currentMonth);
      setRecentExpenses(recent);
      setMonthlyStats(monthly);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Current Month Total */}
        <View style={styles.currentMonthContainer}>
          <Text style={styles.currentMonthLabel}>Current Month Total</Text>
          <Text style={styles.currentMonthTotal}>
            {currentMonthStats ? formatCurrency(currentMonthStats.total) : '$0.00'}
          </Text>
          <Text style={styles.currentMonthDate}>
            {currentMonthStats ? currentMonthStats.month : ''}
          </Text>
        </View>

        {/* Add Expense Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {recentExpenses.length === 0 ? (
            <Text style={styles.emptyText}>No expenses yet</Text>
          ) : (
            recentExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                {expense.description && (
                  <Text style={styles.expenseDescription}>{expense.description}</Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Totals</Text>
          {monthlyStats.length === 0 ? (
            <Text style={styles.emptyText}>No monthly data yet</Text>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  currentMonthContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentMonthLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentMonthTotal: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentMonthDate: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
  },
  expenseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  monthlyItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  monthlyMonth: {
    fontSize: 16,
    color: '#333',
  },
  monthlyTotal: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    padding: 16,
  },
});
