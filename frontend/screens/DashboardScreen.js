import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Pressable, Platform, Alert, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { 
  getCurrentMonthStats, getRecentExpenses, getMonthlyStats,
  getCurrentMonthIncomeStats, getRecentIncome, getIncomeByMonth,
  getNetIncome, exportData
} from '../api';
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

// Map English income category names to translation keys
const INCOME_CATEGORY_NAME_TO_KEY = {
  'Salary': 'category.salary',
  'Freelance': 'category.freelance',
  'Investment': 'category.investment',
  'Gift': 'category.gift',
  'Bonus': 'category.bonus',
  'Other': 'category.otherIncome'
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
  
  const translateIncomeCategory = (categoryName) => {
    if (!categoryName) return '';
    const translationKey = INCOME_CATEGORY_NAME_TO_KEY[categoryName];
    return translationKey ? t(translationKey) : categoryName;
  };
  
  const isFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'income', 'expenses'
  const [currentMonthStats, setCurrentMonthStats] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [currentMonthIncomeStats, setCurrentMonthIncomeStats] = useState(null);
  const [recentIncome, setRecentIncome] = useState([]);
  const [incomeByMonth, setIncomeByMonth] = useState([]);
  const [netIncome, setNetIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 12)));
  const [exportEndDate, setExportEndDate] = useState(new Date());
  const [exportFormats, setExportFormats] = useState({ csv: true, pdf: false });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Use useFocusEffect to ensure data refreshes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Only load data if authenticated and not loading auth
      if (isAuthenticated && !authLoading) {
        loadData();
      }
    }, [isAuthenticated, authLoading])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        currentMonth, recent, monthly,
        currentMonthIncome, recentIncomeData, incomeMonthly,
        netIncomeData
      ] = await Promise.all([
        getCurrentMonthStats(),
        getRecentExpenses(),
        getMonthlyStats(),
        getCurrentMonthIncomeStats(),
        getRecentIncome(),
        getIncomeByMonth(),
        getNetIncome()
      ]);

      setCurrentMonthStats(currentMonth);
      setRecentExpenses(recent);
      setMonthlyStats(monthly);
      setCurrentMonthIncomeStats(currentMonthIncome);
      setRecentIncome(recentIncomeData);
      setIncomeByMonth(incomeMonthly);
      setNetIncome(netIncomeData);
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

  const handleExport = async () => {
    if (exportStartDate > exportEndDate) {
      Alert.alert(t('export.error') || 'Error', t('export.invalidDateRange') || 'Start date must be before end date');
      return;
    }
    
    const selectedFormats = Object.entries(exportFormats).filter(([_, selected]) => selected).map(([format]) => format);
    if (selectedFormats.length === 0) {
      Alert.alert(t('export.error') || 'Error', t('export.selectFormat') || 'Please select at least one format');
      return;
    }
    
    setExporting(true);
    try {
      const results = [];
      for (const format of selectedFormats) {
        const result = await exportData(exportStartDate, exportEndDate, format);
        results.push(result.filename);
        // Small delay between downloads to avoid browser blocking
        if (selectedFormats.length > 1 && format !== selectedFormats[selectedFormats.length - 1]) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      Alert.alert(
        t('export.success') || 'Success',
        t('export.downloadStarted') || `Export started. Files: ${results.join(', ')}`
      );
      setShowExportModal(false);
    } catch (error) {
      Alert.alert(t('export.error') || 'Error', error.message || t('export.failed') || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('export.title') || 'Export Data'}</Text>
          
          {/* Date Range Selection */}
          <View style={styles.exportSection}>
            <Text style={styles.exportLabel}>{t('export.dateRange') || 'Date Range'}</Text>
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {t('export.startDate') || 'Start Date'}: {exportStartDate.toISOString().split('T')[0]}
              </Text>
            </TouchableOpacity>
            
            {showStartDatePicker && (
              <DateTimePicker
                value={exportStartDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) setExportStartDate(selectedDate);
                }}
              />
            )}
            
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {t('export.endDate') || 'End Date'}: {exportEndDate.toISOString().split('T')[0]}
              </Text>
            </TouchableOpacity>
            
            {showEndDatePicker && (
              <DateTimePicker
                value={exportEndDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) setExportEndDate(selectedDate);
                }}
              />
            )}
          </View>
          
          {/* Format Selection */}
          <View style={styles.exportSection}>
            <Text style={styles.exportLabel}>{t('export.format') || 'Format'} {t('export.selectMultiple') || '(Select one or both)'}</Text>
            <View style={styles.formatButtons}>
              <TouchableOpacity
                style={[styles.formatButton, exportFormats.csv && styles.formatButtonActive]}
                onPress={() => setExportFormats({ ...exportFormats, csv: !exportFormats.csv })}
              >
                <Text style={[styles.formatButtonText, exportFormats.csv && styles.formatButtonTextActive]}>
                  {exportFormats.csv ? '✓ ' : ''}CSV
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formatButton, exportFormats.pdf && styles.formatButtonActive]}
                onPress={() => setExportFormats({ ...exportFormats, pdf: !exportFormats.pdf })}
              >
                <Text style={[styles.formatButtonText, exportFormats.pdf && styles.formatButtonTextActive]}>
                  {exportFormats.pdf ? '✓ ' : ''}PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.modalButtonText}>{t('button.cancel') || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonExport, exporting && styles.disabledButton]}
              onPress={handleExport}
              disabled={exporting}
            >
              <Text style={styles.modalButtonText}>
                {exporting ? (t('export.exporting') || 'Exporting...') : (t('export.export') || 'Export')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOverviewTab = () => (
    <View>
      {/* Export Button */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => setShowExportModal(true)}
      >
        <Text style={styles.exportButtonText}>📥 {t('export.exportData') || 'Export Data'}</Text>
      </TouchableOpacity>
      
      {/* Net Income Card */}
      {netIncome && (
        <Pressable
          style={({ pressed }) => {
            const isPressed = Boolean(pressed);
            return [
              styles.netIncomeContainer,
              isPressed === true ? styles.netIncomeContainerPressed : null,
            ].filter(Boolean);
          }}
        >
          {({ pressed }) => {
            const isPressed = Boolean(pressed);
            const netValue = netIncome.net || 0;
            const isPositive = netValue >= 0;
            return (
              <>
                <Text style={styles.netIncomeLabel}>{t('dashboard.netIncome')}</Text>
                <Text style={[styles.netIncomeTotal, isPositive ? styles.netIncomePositive : styles.netIncomeNegative]}>
                  {formatCurrency(Math.abs(netValue))}
                </Text>
                <View style={styles.netIncomeBreakdown}>
                  <Text style={styles.netIncomeBreakdownText}>
                    {t('dashboard.totalIncome')}: {formatCurrency(netIncome.income || 0)}
                  </Text>
                  <Text style={styles.netIncomeBreakdownText}>
                    {t('dashboard.totalExpenses')}: {formatCurrency(netIncome.expenses || 0)}
                  </Text>
                </View>
                <Text style={styles.netIncomeDate}>{netIncome.month}</Text>
              </>
            );
          }}
        </Pressable>
      )}

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>{t('dashboard.totalIncome')}</Text>
          <Text style={[styles.quickStatValue, styles.quickStatIncome]}>
            {netIncome ? formatCurrency(netIncome.income || 0) : formatCurrency(0)}
          </Text>
        </View>
        <View style={styles.quickStatCard}>
          <Text style={styles.quickStatLabel}>{t('dashboard.totalExpenses')}</Text>
          <Text style={[styles.quickStatValue, styles.quickStatExpense]}>
            {netIncome ? formatCurrency(netIncome.expenses || 0) : formatCurrency(0)}
          </Text>
        </View>
      </View>

      {/* Income vs Expenses Chart - Last 6 Months */}
      {currentMonthIncomeStats && currentMonthIncomeStats.months && currentMonthStats && currentMonthStats.months && (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonTitle}>{t('dashboard.last6Months')}</Text>
          <MultiBarChart
            months={currentMonthIncomeStats.months.map((incomeMonth, index) => {
              const expenseMonth = currentMonthStats.months.find(m => m.month === incomeMonth.month);
              return {
                month: incomeMonth.month,
                total: incomeMonth.total - (expenseMonth?.total || 0), // Net income (income - expenses)
                isCurrent: incomeMonth.isCurrent
              };
            })}
            formatValue={formatCurrency}
            onBarPress={null}
          />
        </View>
      )}
    </View>
  );

  const renderIncomeTab = () => (
    <View>
      {/* Current Month Income Total */}
      {currentMonthIncomeStats && currentMonthIncomeStats.current && (
        <View style={styles.currentMonthContainer}>
          <Text style={styles.currentMonthLabel}>{t('dashboard.totalIncome')}</Text>
          <Text style={[styles.currentMonthTotal, styles.incomeTotal]}>
            {formatCurrency(currentMonthIncomeStats.current.total)}
          </Text>
          <Text style={styles.currentMonthDate}>
            {currentMonthIncomeStats.current.month}
          </Text>
        </View>
      )}

      {/* Last 6 Months Income Chart */}
      {currentMonthIncomeStats && currentMonthIncomeStats.months && (
        <View style={styles.comparisonContainer}>
          <Text style={styles.comparisonTitle}>{t('dashboard.last6Months')}</Text>
          <MultiBarChart
            months={currentMonthIncomeStats.months}
            formatValue={formatCurrency}
            onBarPress={null}
          />
        </View>
      )}

      {/* Add Income Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddIncome')}
      >
        <Text style={styles.addButtonText}>{t('button.addIncome')}</Text>
      </TouchableOpacity>

      {/* Recent Income */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.recentIncome')}</Text>
        {recentIncome.length === 0 ? (
          <Text style={styles.emptyText}>{t('dashboard.noIncome')}</Text>
        ) : (
          recentIncome.map((income) => (
            <TouchableOpacity
              key={income.id}
              style={styles.expenseItem}
              onPress={() => navigation.navigate('EditIncome', { incomeId: income.id, income })}
            >
              <View style={styles.expenseLeft}>
                <View style={styles.expenseTop}>
                  <Text style={[styles.expenseAmount, styles.incomeAmount]}>{formatCurrency(income.amount)}</Text>
                  {income.category && (
                    <Text style={[styles.expenseCategory, styles.incomeCategory]}>
                      {translateIncomeCategory(income.category)}
                    </Text>
                  )}
                </View>
                <Text style={styles.expenseDate}>{formatDate(income.date)}</Text>
              </View>
              {income.description && (
                <Text style={styles.expenseDescription}>{income.description}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );

  const renderExpensesTab = () => (
    <View>
      {/* Current Month Expenses Total */}
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

      {/* Last 6 Months Expenses Chart */}
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
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            {t('button.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.tabActive]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
            {t('button.income')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.tabActive]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>
            {t('button.expenses')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'income' && renderIncomeTab()}
          {activeTab === 'expenses' && renderExpensesTab()}
        </View>
      </ScrollView>
      
      {/* Export Modal */}
      {renderExportModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === 'web' && {
      paddingVertical: 24,
    }),
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...(Platform.OS === 'web' && {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: colors.background,
      },
    }),
  },
  tabActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.background,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    ...(Platform.OS === 'web' && {
      fontSize: 15,
    }),
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
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
  netIncomeContainer: {
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
    }),
  },
  netIncomeContainerPressed: {
    backgroundColor: colors.primaryLight + '15',
    borderColor: colors.primary,
    transform: [{ scale: 0.98 }],
  },
  netIncomeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  netIncomeTotal: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  netIncomePositive: {
    color: '#10B981', // Green for positive
  },
  netIncomeNegative: {
    color: '#EF4444', // Red for negative
  },
  netIncomeBreakdown: {
    width: '100%',
    marginBottom: 8,
  },
  netIncomeBreakdownText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  netIncomeDate: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    ...(Platform.OS === 'web' && {
      marginBottom: 24,
    }),
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickStatIncome: {
    color: '#10B981',
  },
  quickStatExpense: {
    color: colors.primary,
  },
  incomeTotal: {
    color: '#10B981',
  },
  incomeAmount: {
    color: '#10B981',
  },
  incomeCategory: {
    color: '#10B981',
  },
  exportButton: {
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
  },
  exportButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  exportSection: {
    marginBottom: 20,
  },
  exportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formatButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  formatButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  formatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  formatButtonTextActive: {
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonExport: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
