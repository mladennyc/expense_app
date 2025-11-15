import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from './colors';
import { useLanguage } from './LanguageProvider';

// Color palette for categories (distinct colors)
const CATEGORY_COLORS = [
  '#10B981', // Emerald green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#0EA5E9', // Sky blue
  '#A855F7', // Violet
  '#22C55E', // Green
  '#EAB308', // Yellow
];

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

export default function PieChart({ data, total, formatValue, size = 200 }) {
  const { t } = useLanguage();
  
  if (!data || data.length === 0 || total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.emptyText}>{t('dashboard.noData')}</Text>
      </View>
    );
  }

  const translateCategory = (categoryName) => {
    if (!categoryName) return '';
    const translationKey = CATEGORY_NAME_TO_KEY[categoryName];
    return translationKey ? t(translationKey) : categoryName;
  };

  // Map data to segments with colors and translated category names
  const segments = data.map((item, index) => ({
    ...item,
    category: translateCategory(item.category),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  // Use horizontal bar chart - reliable across all platforms
  return (
    <View style={styles.container}>
      {/* Total display */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>{t('dashboard.total')}</Text>
        <Text style={styles.totalAmount}>{formatValue(total)}</Text>
      </View>
      
      {/* Horizontal bar chart */}
      <View style={styles.barChart}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.barRow}>
            <View style={styles.barLabel}>
              <View style={[styles.barDot, { backgroundColor: segment.color }]} />
              <Text style={styles.barText} numberOfLines={1}>
                {segment.category}
              </Text>
            </View>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color,
                  },
                ]}
              />
              <Text style={styles.barValue}>{segment.percentage}%</Text>
            </View>
            <Text style={styles.barAmount}>{formatValue(segment.amount)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 16,
    textAlign: 'center',
  },
  totalContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  barChart: {
    width: '100%',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  barLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    marginRight: 10,
  },
  barDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  barText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 28,
    backgroundColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    marginRight: 10,
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 14,
  },
  barValue: {
    position: 'absolute',
    left: 10,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
    zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  barAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 70,
    textAlign: 'right',
  },
});

