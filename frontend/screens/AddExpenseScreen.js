import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createExpense } from '../api';
import { useLanguage } from '../src/LanguageProvider';
import { colors } from '../src/colors';

const CATEGORY_KEYS = [
  'category.groceries',
  'category.utilities',
  'category.transportation',
  'category.housing',
  'category.healthcare',
  'category.education',
  'category.entertainment',
  'category.diningOut',
  'category.clothing',
  'category.personalCare',
  'category.giftsDonations',
  'category.travel',
  'category.loansDebt',
  'category.bankFees',
  'category.insurance',
  'category.taxes',
  'category.other'
];

// Map translation keys to English category names for backend
const CATEGORY_KEY_TO_NAME = {
  'category.groceries': 'Groceries',
  'category.utilities': 'Utilities',
  'category.transportation': 'Transportation',
  'category.housing': 'Housing',
  'category.healthcare': 'Healthcare',
  'category.education': 'Education',
  'category.entertainment': 'Entertainment',
  'category.diningOut': 'Dining Out',
  'category.clothing': 'Clothing',
  'category.personalCare': 'Personal Care',
  'category.giftsDonations': 'Gifts & Donations',
  'category.travel': 'Travel',
  'category.loansDebt': 'Loans & Debt Payments',
  'category.bankFees': 'Bank Fees & Overdrafts',
  'category.insurance': 'Insurance',
  'category.taxes': 'Taxes',
  'category.other': 'Other'
};

// Reverse map: English category name to translation key
const CATEGORY_NAME_TO_KEY = {};
Object.keys(CATEGORY_KEY_TO_NAME).forEach(key => {
  CATEGORY_NAME_TO_KEY[CATEGORY_KEY_TO_NAME[key]] = key;
});

export { CATEGORY_KEY_TO_NAME, CATEGORY_NAME_TO_KEY };

export default function AddExpenseScreen({ navigation, route }) {
  const { t } = useLanguage();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Handle prefill data from receipt scanning
  const prefillData = route.params?.prefillData;
  
  const [amount, setAmount] = useState(prefillData?.amount || '');
  const [date, setDate] = useState(() => {
    if (prefillData?.date) {
      try {
        const [year, month, day] = prefillData.date.split('-').map(Number);
        const prefilledDate = new Date(year, month - 1, day);
        prefilledDate.setHours(0, 0, 0, 0);
        return prefilledDate;
      } catch {
        return today;
      }
    }
    return today;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState(prefillData?.category || '');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [description, setDescription] = useState(prefillData?.description || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  
  // Clear route params after using them
  useEffect(() => {
    if (prefillData && navigation) {
      navigation.setParams({ prefillData: undefined });
    }
  }, [prefillData, navigation]);

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      // Normalize to local midnight to avoid timezone issues
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      setDate(normalizedDate);
    }
  };

  const handleSubmit = async () => {
    // Validate amount
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: t('error.invalidAmount') });
      return;
    }

    // Validate category
    if (!category) {
      setMessage({ type: 'error', text: t('error.selectCategory') });
      return;
    }

    // Validate date
    if (!date) {
      setMessage({ type: 'error', text: t('error.selectDate') });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: null, text: '' });

      const dateString = formatDate(date);
      await createExpense({
        amount: amountNum,
        date: dateString,
        category: category && CATEGORY_KEY_TO_NAME[category] ? CATEGORY_KEY_TO_NAME[category] : null,
        description: description || null,
      });

      setMessage({ type: 'success', text: t('message.expenseAdded') });
      
      // Reset form
      setAmount('');
      const newToday = new Date();
      newToday.setHours(0, 0, 0, 0);
      setDate(newToday);
      setCategory('');
      setDescription('');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: null, text: '' });
      }, 3000);
    } catch (error) {
      let errorMessage = t('message.failedToCreate');
      if (error && error.message && typeof error.message === 'string') {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = `Cannot connect to backend at ${BASE_URL}. Make sure the backend is running.`;
        } else {
          errorMessage = error.message;
        }
      } else if (error && typeof error === 'string') {
        errorMessage = error;
      } else if (error) {
        errorMessage = String(error);
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('screen.addExpense')}</Text>

        {message.text ? (
          <View style={[styles.messageContainer, message.type === 'success' ? styles.successMessage : styles.errorMessage]}>
            <Text style={[styles.messageText, message.type === 'success' ? styles.successMessageText : styles.errorMessageText]}>
              {message.text}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ReceiptCamera')}
          disabled={Boolean(loading)}
        >
          <Text style={styles.scanButtonText}>📷 {Platform.OS === 'web' ? t('receipt.selectReceiptPhoto') : t('receipt.scanReceipt')}</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('label.amount')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('placeholder.amount')}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            editable={Boolean(!loading)}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('label.date')} *</Text>
          {Platform.OS === 'web' ? (
            <View style={{ width: '100%' }}>
              {React.createElement('input', {
                type: 'date',
                value: formatDate(date),
                onChange: (e) => {
                  const dateString = e.target.value;
                  if (dateString) {
                    const [year, month, day] = dateString.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day);
                    newDate.setHours(0, 0, 0, 0);
                    setDate(newDate);
                  }
                },
                style: styles.webDateInput,
                disabled: Boolean(loading),
              })}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={Boolean(loading)}
              >
                <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('label.category')} *</Text>
          {Platform.OS === 'web' ? (
            <View style={{ width: '100%' }}>
              {React.createElement('select', {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                style: styles.webSelect,
                disabled: Boolean(loading),
              },
                React.createElement('option', { value: '' }, t('button.selectCategory')),
                ...CATEGORY_KEYS.map((key) =>
                  React.createElement('option', { key, value: key }, t(key))
                )
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.categoryButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                disabled={Boolean(loading)}
              >
                <Text style={[styles.categoryButtonText, !category && styles.placeholderText]}>
                  {category ? t(category) : t('button.selectCategory')}
                </Text>
                <Text style={styles.arrow}>▼</Text>
              </TouchableOpacity>
              {showCategoryPicker && (
                <View style={styles.categoryList}>
                  {CATEGORY_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.categoryItem, category === key && styles.categoryItemSelected]}
                      onPress={() => {
                        setCategory(key);
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={[styles.categoryItemText, category === key && styles.categoryItemTextSelected]}>
                        {t(key)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('label.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t('placeholder.description')}
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={3}
            editable={Boolean(!loading)}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('button.submit')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton]}
            onPress={() => navigation.navigate('Dashboard')}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>{t('screen.dashboard')}</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === 'web' && {
      alignItems: 'center',
      paddingVertical: 40,
    }),
  },
  content: {
    padding: 16,
    ...(Platform.OS === 'web' && {
      width: '100%',
      maxWidth: 600,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
    ...(Platform.OS === 'web' && {
      fontSize: 32,
      marginBottom: 32,
      textAlign: 'center',
    }),
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      padding: 14,
    }),
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successMessage: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  messageText: {
    fontSize: 14,
  },
  successMessageText: {
    color: '#155724',
  },
  errorMessageText: {
    color: '#721c24',
  },
  inputContainer: {
    marginBottom: 20,
    ...(Platform.OS === 'web' && {
      marginBottom: 24,
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    ...(Platform.OS === 'web' && {
      fontSize: 14,
      marginBottom: 10,
      color: '#1E293B',
    }),
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    ...(Platform.OS === 'web' && {
      padding: 14,
      fontSize: 16,
      borderColor: '#E2E8F0',
      borderRadius: 8,
      transition: 'border-color 0.2s',
      ':focus': {
        borderColor: '#10B981',
        outline: 'none',
      },
    }),
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '1px solid #ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  categoryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  categoryList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  webSelect: {
    width: '100%',
    padding: 12,
    fontSize: 16,
    border: '1px solid #ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginTop: 24,
    ...(Platform.OS === 'web' && {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
      marginTop: 32,
    }),
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    ...(Platform.OS === 'web' && {
      minWidth: 140,
      padding: 14,
      marginTop: 0,
      marginBottom: 0,
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      ':hover': {
        backgroundColor: '#059669',
      },
      ':active': {
        transform: 'scale(0.98)',
      },
    }),
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    ...(Platform.OS === 'web' && {
      minWidth: 140,
      padding: 14,
      marginTop: 0,
      marginBottom: 0,
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      ':hover': {
        backgroundColor: colors.secondaryDark,
      },
      ':active': {
        transform: 'scale(0.98)',
      },
    }),
  },
  disabledButton: {
    opacity: 0.6,
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
      ':hover': {
        backgroundColor: '#10B981',
      },
    }),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    ...(Platform.OS === 'web' && {
      fontSize: 16,
    }),
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    ...(Platform.OS === 'web' && {
      fontSize: 16,
    }),
  },
});
