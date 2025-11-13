import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getIncome, updateIncome, deleteIncome } from '../api';
import { useLanguage } from '../src/LanguageProvider';

const INCOME_CATEGORY_KEYS = [
  'category.salary',
  'category.freelance',
  'category.investment',
  'category.gift',
  'category.bonus',
  'category.otherIncome'
];

// Map translation keys to English category names for backend
const INCOME_CATEGORY_KEY_TO_NAME = {
  'category.salary': 'Salary',
  'category.freelance': 'Freelance',
  'category.investment': 'Investment',
  'category.gift': 'Gift',
  'category.bonus': 'Bonus',
  'category.otherIncome': 'Other'
};

// Map English category names to translation keys
const INCOME_CATEGORY_NAME_TO_KEY = {
  'Salary': 'category.salary',
  'Freelance': 'category.freelance',
  'Investment': 'category.investment',
  'Gift': 'category.gift',
  'Bonus': 'category.bonus',
  'Other': 'category.otherIncome'
};

export default function EditIncomeScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { incomeId, income: initialIncome } = route.params || {};
  
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const normalizedDate = new Date(selectedDate);
      normalizedDate.setHours(0, 0, 0, 0);
      setDate(normalizedDate);
    }
  };

  useEffect(() => {
    if (incomeId) {
      if (initialIncome) {
        setAmount(String(initialIncome.amount || ''));
        if (initialIncome.date) {
          setDate(parseDate(initialIncome.date));
        }
        const categoryKey = INCOME_CATEGORY_NAME_TO_KEY[initialIncome.category] || '';
        setCategory(categoryKey);
        setDescription(initialIncome.description || '');
      } else {
        fetchIncome();
      }
    }
  }, [incomeId]);

  const fetchIncome = async () => {
    if (!incomeId) return;

    try {
      setFetching(true);
      const incomeData = await getIncome(incomeId);
      
      setAmount(String(incomeData.amount || ''));
      if (incomeData.date) {
        setDate(parseDate(incomeData.date));
      }
      const categoryKey = INCOME_CATEGORY_NAME_TO_KEY[incomeData.category] || '';
      setCategory(categoryKey);
      setDescription(incomeData.description || '');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || t('message.failedToLoadIncome') });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: t('error.invalidAmount') });
      return;
    }

    if (!category) {
      setMessage({ type: 'error', text: t('error.selectCategory') });
      return;
    }

    if (!date) {
      setMessage({ type: 'error', text: t('error.selectDate') });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: null, text: '' });

      const dateString = formatDate(date);
      await updateIncome(incomeId, {
        amount: amountNum,
        date: dateString,
        category: category ? INCOME_CATEGORY_KEY_TO_NAME[category] : null,
        description: description || null,
      });

      setMessage({ type: 'success', text: t('message.incomeUpdated') });
      
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      let errorMessage = t('message.failedToUpdateIncome');
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `Cannot connect to backend. Make sure the backend is running.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const deleteIncomeHandler = async () => {
    setShowDeleteModal(false);
    try {
      setLoading(true);
      setMessage({ type: 'info', text: t('message.deletingIncome') });
      await deleteIncome(incomeId);
      setMessage({ type: 'success', text: t('message.incomeDeleted') });
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (error) {
      let errorMessage = t('message.failedToDeleteIncome');
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `Cannot connect to backend. Make sure the backend is running.`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t('message.loadingIncome')}</Text>
      </View>
    );
  }

  return (
    <>
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('button.deleteIncome')}</Text>
            <Text style={styles.modalMessage}>{t('message.confirmDeleteIncome')}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>{t('button.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={deleteIncomeHandler}
                disabled={loading}
              >
                <Text style={styles.modalDeleteButtonText}>{t('button.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('screen.editIncome')}</Text>

        {message.text ? (
          <View style={[
            styles.messageContainer, 
            message.type === 'success' ? styles.successMessage : 
            message.type === 'error' ? styles.errorMessage :
            message.type === 'info' ? styles.infoMessage : styles.messageContainer
          ]}>
            <Text style={[
              styles.messageText, 
              message.type === 'success' ? styles.successMessageText : 
              message.type === 'error' ? styles.errorMessageText :
              message.type === 'info' ? styles.infoMessageText : styles.messageText
            ]}>
              {message.text}
            </Text>
          </View>
        ) : null}

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
                ...INCOME_CATEGORY_KEYS.map((key) =>
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
                  {INCOME_CATEGORY_KEYS.map((key) => (
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
              <Text style={styles.submitButtonText}>{t('button.saveChanges')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.disabledButton]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>{t('button.deleteIncome')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  infoMessage: {
    backgroundColor: '#d1ecf1',
    borderWidth: 1,
    borderColor: '#bee5eb',
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
  infoMessageText: {
    color: '#0c5460',
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
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    ...(Platform.OS === 'web' && {
      justifyContent: 'flex-end',
      marginTop: 32,
    }),
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    ...(Platform.OS === 'web' && {
      minWidth: 140,
      padding: 14,
      flex: 0,
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
  deleteButton: {
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    ...(Platform.OS === 'web' && {
      minWidth: 140,
      padding: 14,
      flex: 0,
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.1s',
      ':hover': {
        backgroundColor: '#DC2626',
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
        backgroundColor: Platform.OS === 'web' ? '#10B981' : undefined,
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
  deleteButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    ...(Platform.OS === 'web' && {
      fontSize: 16,
    }),
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
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalDeleteButton: {
    backgroundColor: '#EF4444',
  },
  modalCancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


