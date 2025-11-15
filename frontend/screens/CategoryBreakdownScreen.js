import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getCurrentMonthByCategory, getMonthByCategory } from '../api';
import { useCurrency } from '../src/CurrencyProvider';
import { useLanguage } from '../src/LanguageProvider';
import PieChart from '../src/PieChart';
import { colors } from '../src/colors';

// Map English category names to translation keys
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

export default function CategoryBreakdownScreen({ route }) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const month = route?.params?.month; // Get month from route params

  useEffect(() => {
    loadData();
  }, [month]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = month 
        ? await getMonthByCategory(month)
        : await getCurrentMonthByCategory();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const translateCategory = (categoryName) => {
    if (!categoryName) return '';
    const translationKey = CATEGORY_NAME_TO_KEY[categoryName];
    return translationKey ? t(translationKey) : categoryName;
  };

  if (loading) {
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

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t('dashboard.noExpenses')}</Text>
      </View>
    );
  }

  // Color palette matching PieChart
  const CATEGORY_COLORS = [
    '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
    '#6366F1', '#F43F5E', '#0EA5E9', '#A855F7', '#22C55E', '#EAB308',
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.monthLabel}>{data.month}</Text>
          <Text style={styles.totalLabel}>{t('dashboard.currentMonthTotal')}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(data.total)}</Text>
        </View>

        {/* Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>{t('dashboard.categoryBreakdown')}</Text>
          <PieChart
            data={data.categories}
            total={data.total}
            formatValue={formatCurrency}
            size={250}
          />
        </View>

        {/* Category Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>{t('dashboard.categoryDetails')}</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.tableCol1]}>
                {t('label.category')}
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCol2]}>
                {t('label.amount')}
              </Text>
              <Text style={[styles.tableHeaderText, styles.tableCol3]}>
                %
              </Text>
            </View>

            {/* Table Rows */}
            {data.categories.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCol1, styles.categoryCell]}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] },
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {translateCategory(item.category)}
                  </Text>
                </View>
                <Text style={[styles.tableCol2, styles.amountText]}>
                  {formatCurrency(item.amount)}
                </Text>
                <Text style={[styles.tableCol3, styles.percentageText]}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
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
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  monthLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    alignItems: 'center',
  },
  tableCol1: {
    flex: 2,
  },
  tableCol2: {
    flex: 1.5,
    textAlign: 'right',
  },
  tableCol3: {
    flex: 1,
    textAlign: 'right',
  },
  categoryCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
    padding: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

