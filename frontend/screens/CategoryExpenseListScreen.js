import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getExpensesByCategory } from '../api';
import { useCurrency } from '../src/CurrencyProvider';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';

const CATEGORY_NAME_TO_KEY = {
  'Groceries': 'category.groceries',
  'Utilities': 'category.utilities',
  'Transportation': 'category.transportation',
  'Housing': 'category.housing',
  'Home Maintenance': 'category.homeMaintenance',
  'Healthcare': 'category.healthcare',
  'Education': 'category.education',
  'Childcare': 'category.childcare',
  'Entertainment': 'category.entertainment',
  'Subscriptions': 'category.subscriptions',
  'Dining Out': 'category.diningOut',
  'Clothing': 'category.clothing',
  'Personal Care': 'category.personalCare',
  'Fitness & Sports': 'category.fitnessSports',
  'Household Supplies': 'category.householdSupplies',
  'Pet Care': 'category.petCare',
  'Gifts & Donations': 'category.giftsDonations',
  'Travel': 'category.travel',
  'Loans & Debt Payments': 'category.loansDebt',
  'Bank Fees & Overdrafts': 'category.bankFees',
  'Insurance': 'category.insurance',
  'Taxes': 'category.taxes',
  'Other': 'category.other',
  'Uncategorized': 'category.other',
};

function formatDate(dateString) {
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch (e) {
    return String(dateString);
  }
}

export default function CategoryExpenseListScreen({ route, navigation }) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const month = route?.params?.month;
  const category = route?.params?.category;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isActive = () => true) => {
    if (!month || !category) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getExpensesByCategory(month, category);
      if (isActive()) setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isActive()) {
        setError(err.message);
        setExpenses([]);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [month, category]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      loadData(() => isActive);
      return () => { isActive = false; };
    }, [loadData])
  );

  React.useEffect(() => {
    const categoryLabel = CATEGORY_NAME_TO_KEY[category]
      ? t(CATEGORY_NAME_TO_KEY[category])
      : category;
    navigation.setOptions({
      title: `${categoryLabel} — ${month}`,
    });
  }, [navigation, category, month, t]);

  if (!month || !category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('dashboard.error')}: missing month or category</Text>
      </View>
    );
  }

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('dashboard.error')}: {error}</Text>
      </View>
    );
  }

  const translateCategory = (name) => {
    if (!name) return '';
    const key = CATEGORY_NAME_TO_KEY[name];
    return key ? t(key) : name;
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>{t('dashboard.noExpenses')}</Text>
      ) : (
        <>
          {expenses.map((expense) => (
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
              {expense.description ? (
                <Text style={styles.expenseDescription}>{expense.description}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
          <View style={styles.subtotalRow}>
            <Text style={styles.subtotalLabel}>{t('dashboard.currentMonthTotal')}</Text>
            <Text style={styles.subtotalAmount}>{formatCurrency(total)}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
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
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtotalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
  },
});
